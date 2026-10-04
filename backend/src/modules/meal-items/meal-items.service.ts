import {
  Injectable,
  UnprocessableEntityException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GeneratedMealPlan, Meal as ProposedMeal } from '../ai/ai.service';
import { canonicalMeal, canonicalPlan, parseMeal } from '../ai/meal-contract';
import { MealPlanGenerationContext } from '../meal-plan/meal-plan.service';
import { MealPlanValidationService } from '../validation/meal-plan-validation.service';
import { GroceryListService } from '../grocery-list/grocery-list.service';
import { MealItem } from './entities/meal-item.entity';
import { MealPlan } from '../meal-plan/entities/meal-plan.entity';
import { Meal } from '../meal/entities/meal.entity';
import { UserProfile } from '../profile/entities/profile.entity';
import { UserPreference } from '../user-preferences/entities/user-preference.entity';
import { Allergy } from '../allergy/entities/allergy.entity';
import { Feedback } from '../feedback/entities/feedback.entity';
import { AiService } from '../ai/ai.service';
import { preferenceMemory } from '../feedback/preference-memory';
import { ReplaceMealItemDto } from './dto/replace-meal-item.dto';

@Injectable()
export class MealItemsService {
  constructor(
    @InjectRepository(MealItem)
    private readonly mealItemsRepo: Repository<MealItem>,
    @InjectRepository(MealPlan)
    private readonly mealPlansRepo: Repository<MealPlan>,
    @InjectRepository(Meal)
    private readonly mealsRepo: Repository<Meal>,
    @InjectRepository(UserProfile)
    private readonly profilesRepo: Repository<UserProfile>,
    @InjectRepository(UserPreference)
    private readonly preferencesRepo: Repository<UserPreference>,
    @InjectRepository(Allergy)
    private readonly allergiesRepo: Repository<Allergy>,
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
    private readonly aiService: AiService,
    private readonly validationService: MealPlanValidationService,
    private readonly groceryListService: GroceryListService,
    private readonly dataSource: DataSource,
  ) {}

  async toggleStatus(userId: string, mealItemId: string) {
    return this.setMealStatus(userId, mealItemId);
  }

  async updateStatus(
    userId: string,
    mealItemId: string,
    status: string,
    consumedServings?: number,
  ) {
    if (!['scheduled', 'completed', 'skipped'].includes(status))
      throw new UnprocessableEntityException('Invalid meal status');
    if (
      consumedServings !== undefined &&
      (typeof consumedServings !== 'number' ||
        !Number.isFinite(consumedServings) ||
        consumedServings <= 0 ||
        consumedServings > 20)
    )
      throw new UnprocessableEntityException(
        'Consumed servings must be a number greater than zero and at most 20',
      );
    return this.setMealStatus(userId, mealItemId, status, consumedServings);
  }

  private async setMealStatus(
    userId: string,
    mealItemId: string,
    status?: string,
    consumedServings?: number,
  ) {
    const original = await this.findOne(userId, mealItemId);
    return this.dataSource.transaction(async (manager) => {
      const plans = manager.getRepository(MealPlan);
      const items = manager.getRepository(MealItem);
      const plan = await plans.findOne({
        where: { id: original.mealPlanId, userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!plan) throw new NotFoundException('Meal plan not found');
      const item = await items.findOne({
        where: { id: mealItemId, mealPlanId: plan.id },
      });
      if (!item || item.status === 'replaced')
        throw new ConflictException('Replaced meals cannot be changed');
      item.status =
        status || (item.status === 'completed' ? 'scheduled' : 'completed');
      item.consumedServings =
        item.status === 'completed'
          ? (consumedServings ?? Number(item.servings))
          : null;
      return items.save(item);
    });
  }

  async findOne(userId: string, mealItemId: string) {
    const item = await this.mealItemsRepo.findOne({
      where: { id: mealItemId },
      relations: ['mealPlan', 'meal'],
    });

    if (!item) {
      throw new NotFoundException('Meal item not found');
    }

    if (item.mealPlan?.userId !== userId) {
      throw new ForbiddenException('You do not have access to this meal item');
    }

    return item;
  }

  /**
   * Generates tailored AI replacement alternatives for a specific meal item using user profile, preferences & past feedbacks
   */
  async getAlternatives(userId: string, mealItemId: string) {
    const currentItem = await this.mealItemsRepo.findOne({
      where: { id: mealItemId },
      relations: ['mealPlan', 'meal'],
    });

    if (!currentItem) {
      throw new NotFoundException('Meal item not found');
    }

    if (currentItem.mealPlan?.userId !== userId) {
      throw new ForbiddenException('You do not have access to this meal item');
    }

    const [userProfile, userPref, allergies, recentFeedbacks] =
      await Promise.all([
        this.profilesRepo.findOne({ where: { userId } }),
        this.preferencesRepo.findOne({ where: { userId } }),
        this.allergiesRepo.find({ where: { userId } }),
        this.feedbackRepo.find({
          where: { userId },
          order: { createdAt: 'DESC' },
          take: 10,
        }),
      ]);

    const currentSnapshot: any =
      currentItem.generatedMealSnapshot || currentItem.meal || {};

    if (currentItem.status === 'replaced')
      throw new ConflictException('This meal has already been replaced');
    const context = await this.validationContext(userId, currentItem.mealPlan);
    const items = await this.mealItemsRepo.find({
      where: { mealPlanId: currentItem.mealPlanId },
      relations: ['meal'],
    });
    const otherMeals = items.filter(
      (item) =>
        item.status !== 'replaced' &&
        item.day === currentItem.day &&
        item.id !== currentItem.id,
    );
    const otherCalories = otherMeals.reduce(
      (sum, item) =>
        sum + Number(item.caloriesSnapshot) * Number(item.servings),
      0,
    );
    const otherCost = otherMeals.reduce(
      (sum, item) =>
        sum + Number(item.estimatedCostSnapshot) * Number(item.servings),
      0,
    );
    const servings = Number(currentItem.servings);
    const aiResult = await this.aiService.generateMealAlternatives({
      userFeedback: context.userFeedback,
      replacementConstraints: {
        minimumCalories: Math.max(
          1,
          (context.dailyCalorieTarget * 0.9 - otherCalories) / servings,
        ),
        maximumCalories:
          (context.dailyCalorieTarget * 1.1 - otherCalories) / servings,
        maximumCostLkr:
          context.dailyBudget == null
            ? null
            : (context.dailyBudget - otherCost) / servings,
      },
      currentMeal: {
        name: currentSnapshot.name || 'Current Meal',
        mealType: currentItem.mealType,
        calories: Math.round(Number(currentItem.caloriesSnapshot || 500)),
        protein: Math.round(Number(currentItem.proteinSnapshot || 25)),
        carbs: Math.round(Number(currentItem.carbsSnapshot || 50)),
        fat: Math.round(Number(currentItem.fatSnapshot || 15)),
        estimatedCostLkr: currentItem.estimatedCostSnapshot
          ? Number(currentItem.estimatedCostSnapshot)
          : undefined,
      },
      userProfile: {
        age: userProfile?.dateOfBirth
          ? this.calculateAge(userProfile.dateOfBirth)
          : undefined,
        biologicalSex: userProfile?.biologicalSex,
        goal: userProfile?.goal,
        activityLevel: userProfile?.activityLevel,
        dailyCalorieTarget: userPref?.dailyCalorieTarget
          ? Number(userPref.dailyCalorieTarget)
          : undefined,
      },
      userPreferences: {
        dietType: userPref?.dietType,
        preferredCuisines: userPref?.preferredCuisines || [],
        excludedIngredients: userPref?.excludedIngredients || [],
        dislikedFoods: userPref?.dislikedFoods || [],
        dailyBudget:
          userPref?.dailyBudget != null
            ? Number(userPref.dailyBudget)
            : undefined,
        maximumPrepMinutes: userPref?.maximumPrepMinutes,
      },
      allergies: allergies.map((a) => a.allergen),
      recentFeedbacks: recentFeedbacks.map((f) => ({
        mealName: f.mealName || undefined,
        liked: f.liked != null ? f.liked : undefined,
        rating: f.rating != null ? f.rating : undefined,
        reasonTags: f.reasonTags || [],
        comment: f.comment || undefined,
      })),
    });

    const alternatives = aiResult.alternatives.filter((alternative) => {
      try {
        const proposed = this.replacementMeal(alternative, currentItem);
        const plan = this.planWithReplacement(
          items,
          currentItem,
          proposed,
          context,
        );
        return this.validationService.validatePlan(plan, context).isValid;
      } catch {
        return false;
      }
    });
    if (!alternatives.length)
      throw new UnprocessableEntityException(
        'No replacement met your plan constraints. Please try again or generate a new plan.',
      );

    return {
      currentMeal: {
        id: currentItem.id,
        name: currentSnapshot.name || 'Current Meal',
        type:
          currentItem.mealType.charAt(0).toUpperCase() +
          currentItem.mealType.slice(1),
        calories: Math.round(Number(currentItem.caloriesSnapshot || 520)),
        protein: Math.round(Number(currentItem.proteinSnapshot || 30)),
        carbs: Math.round(Number(currentItem.carbsSnapshot || 50)),
        fat: Math.round(Number(currentItem.fatSnapshot || 15)),
        estimatedCost: currentItem.estimatedCostSnapshot
          ? Number(currentItem.estimatedCostSnapshot)
          : null,
        reason:
          'Choose a replacement that fits your daily plan and preferences.',
      },
      alternatives: alternatives.map((a, index) => ({
        ...a,
        bestMatch: index === 0,
      })),
      modelUsed: aiResult.model,
      provider: aiResult.provider,
    };
  }

  /**
   * Replaces a meal item with a chosen alternative, updating plan statistics and DB
   */
  async replaceMealItem(
    userId: string,
    mealItemId: string,
    dto: ReplaceMealItemDto,
  ) {
    const originalItem = await this.mealItemsRepo.findOne({
      where: { id: mealItemId },
      relations: ['mealPlan'],
    });

    if (!originalItem) {
      throw new NotFoundException('Meal item not found');
    }

    if (originalItem.mealPlan?.userId !== userId) {
      throw new ForbiddenException('You do not have access to this meal item');
    }

    return this.dataSource.transaction(async (manager) => {
      const plans = manager.getRepository(MealPlan);
      const items = manager.getRepository(MealItem);
      // Serialize swaps in one plan so concurrent replacements cannot corrupt totals.
      const lockedPlan = await plans.findOne({
        where: { id: originalItem.mealPlanId, userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedPlan) throw new NotFoundException('Meal plan not found');
      const allItems = await items.find({
        where: { mealPlanId: lockedPlan.id },
        relations: ['meal'],
      });
      const current = allItems.find((i) => i.id === mealItemId);
      if (!current || current.status === 'replaced')
        throw new ConflictException('This meal has already been replaced');
      const context = await this.validationContext(userId, lockedPlan);
      let replacement: ProposedMeal;
      let candidatePlan: GeneratedMealPlan;
      try {
        replacement = canonicalMeal(
          this.replacementMeal(dto, current),
          context.verifiedMeals || [],
        );
        candidatePlan = this.planWithReplacement(
          allItems,
          current,
          replacement,
          context,
        );
      } catch (error) {
        throw new UnprocessableEntityException(
          error instanceof Error ? error.message : 'Invalid replacement meal',
        );
      }
      const validation = this.validationService.validatePlan(
        candidatePlan,
        context,
      );
      if (!validation.isValid)
        throw new UnprocessableEntityException({
          message: 'The replacement violates your plan constraints',
          validation: validation.validationSummary,
        });
      current.status = 'replaced';
      await items.save(current);
      const verified = Boolean(replacement.mealId);
      const newItem = await items.save(
        items.create({
          mealPlanId: lockedPlan.id,
          day: current.day,
          mealType: current.mealType,
          mealId: replacement.mealId,
          replacesMealItemId: current.id,
          status: 'scheduled',
          servings: replacement.servings,
          caloriesSnapshot: replacement.calories,
          proteinSnapshot: replacement.protein,
          carbsSnapshot: replacement.carbs,
          fatSnapshot: replacement.fat,
          estimatedCostSnapshot: replacement.estimatedCostLkr,
          nutritionVerificationStatus: verified ? 'verified' : 'unverified',
          nutritionSource: verified ? 'database' : null,
          generatedMealSnapshot: replacement,
          selectionExplanation: {
            reason: replacement.reason,
            allergens: replacement.allergens,
            dietTags: replacement.dietTags,
            previousMealId: current.id,
          },
        }),
      );
      const meals = candidatePlan.days.flatMap((d) => d.meals);
      const total = (field: keyof ProposedMeal) =>
        meals.reduce((sum, m) => sum + Number(m[field]) * m.servings, 0);
      lockedPlan.totalCalories = total('calories');
      lockedPlan.totalProtein = total('protein');
      lockedPlan.totalCarbs = total('carbs');
      lockedPlan.totalFat = total('fat');
      lockedPlan.estimatedCostLkr = total('estimatedCostLkr');
      lockedPlan.validationSummary = validation.validationSummary;
      lockedPlan.qualityScore = validation.qualityScore;
      lockedPlan.scoreBreakdown = validation.scoreBreakdown;
      lockedPlan.scoreVersion = 'v2';
      lockedPlan.status = 'validated';
      await plans.save(lockedPlan);
      await this.groceryListService.generateForPlan(
        lockedPlan.id,
        meals,
        manager,
      );
      return {
        success: true,
        message: 'Meal replaced successfully',
        replacedItemId: current.id,
        newItem,
        validation: validation.validationSummary,
      };
    });
  }

  private replacementMeal(
    value: ReplaceMealItemDto | any,
    item: MealItem,
  ): ProposedMeal {
    return parseMeal({
      ...value,
      mealType: item.mealType,
      servings: Number(item.servings),
      estimatedCostLkr: value.budgetLkr,
      dietTags: value.tags,
    });
  }

  private planWithReplacement(
    items: MealItem[],
    current: MealItem,
    replacement: ProposedMeal,
    context: MealPlanGenerationContext,
  ): GeneratedMealPlan {
    const days = Array.from({ length: context.durationDays }, (_, index) => ({
      day: index + 1,
      meals: [] as ProposedMeal[],
    }));
    for (const item of items.filter((i) => i.status !== 'replaced')) {
      if (!days[item.day - 1]) throw new Error('Invalid stored meal day');
      const snapshot: any = item.generatedMealSnapshot || item.meal || {};
      const explanation: any = item.selectionExplanation || {};
      const meal =
        item.id === current.id
          ? replacement
          : parseMeal({
              ...snapshot,
              mealId: item.mealId,
              mealType: item.mealType,
              servings: Number(item.servings),
              calories: Number(item.caloriesSnapshot),
              protein:
                item.proteinSnapshot == null
                  ? undefined
                  : Number(item.proteinSnapshot),
              carbs:
                item.carbsSnapshot == null
                  ? undefined
                  : Number(item.carbsSnapshot),
              fat:
                item.fatSnapshot == null ? undefined : Number(item.fatSnapshot),
              estimatedCostLkr:
                item.estimatedCostSnapshot == null
                  ? undefined
                  : Number(item.estimatedCostSnapshot),
              instructions:
                snapshot.instructions ||
                snapshot.recipe?.split(/\r?\n/).filter(Boolean),
              allergens: snapshot.allergens || explanation.allergens,
              dietTags: snapshot.dietTags || explanation.dietTags,
            });
      days[item.day - 1].meals.push(meal);
    }
    return canonicalPlan({ days }, context);
  }

  private async validationContext(
    userId: string,
    plan: MealPlan,
  ): Promise<MealPlanGenerationContext> {
    const [profile, preferences, allergies, catalogue, requestPlan, feedbacks] =
      await Promise.all([
        this.profilesRepo.findOne({ where: { userId } }),
        this.preferencesRepo.findOne({ where: { userId } }),
        this.allergiesRepo.find({ where: { userId } }),
        this.mealsRepo.find({
          where: { isActive: true, nutritionVerificationStatus: 'verified' },
        }),
        this.mealPlansRepo.findOne({
          where: { id: plan.id, userId },
          relations: ['request'],
        }),
        this.feedbackRepo.find({
          where: { userId },
          order: { updatedAt: 'DESC' },
        }),
      ]);
    if (!profile || !preferences)
      throw new NotFoundException(
        'Complete your profile and preferences first',
      );
    const snapshot: any = requestPlan?.request?.inputSnapshot || {};
    const duration =
      Math.round(
        (Date.parse(plan.endDate) - Date.parse(plan.startDate)) / 86400000,
      ) + 1;
    return {
      ...snapshot,
      age: this.calculateAge(profile.dateOfBirth),
      biologicalSex: profile.biologicalSex,
      heightCm: Number(profile.heightCm),
      weightKg: Number(profile.weightKg),
      goal: profile.goal,
      activityLevel: profile.activityLevel,
      dailyCalorieTarget: Number(preferences.dailyCalorieTarget),
      dietType: preferences.dietType,
      appetiteLevel: preferences.appetiteLevel,
      mealsPerDay: preferences.mealsPerDay,
      dailyBudget:
        preferences.dailyBudget == null
          ? null
          : Number(preferences.dailyBudget),
      preferredCuisines: preferences.preferredCuisines,
      excludedIngredients: preferences.excludedIngredients,
      dislikedFoods: preferences.dislikedFoods,
      maximumPrepMinutes: preferences.maximumPrepMinutes,
      cookingSkill: preferences.cookingSkill,
      servings: preferences.servings,
      allergies: allergies.map((a) => a.allergen),
      startDate: plan.startDate,
      durationDays: duration,
      strictCalorieControl: snapshot.strictCalorieControl === true,
      userFeedback: preferenceMemory(feedbacks),
      verifiedMeals: catalogue
        .filter((m) => m.nutritionSource && m.nutritionSourceReference)
        .map((m) => ({
          id: m.id,
          name: m.name,
          mealType: m.mealType,
          calories: Number(m.calories),
          protein: Number(m.protein),
          carbs: Number(m.carbs),
          fat: Number(m.fat),
          estimatedCostLkr:
            m.estimatedCostLkr == null ? null : Number(m.estimatedCostLkr),
          prepTimeMinutes: m.prepTimeMinutes,
          allergens: m.allergens,
          dietTags: m.dietTags,
          ingredients: m.ingredients,
          description: m.description,
          recipe: m.recipe,
        })),
    };
  }

  private calculateAge(dateOfBirth: string): number {
    const birth = new Date(`${dateOfBirth}T00:00:00Z`);
    const today = new Date();
    let age = today.getUTCFullYear() - birth.getUTCFullYear();
    if (
      today.getUTCMonth() < birth.getUTCMonth() ||
      (today.getUTCMonth() === birth.getUTCMonth() &&
        today.getUTCDate() < birth.getUTCDate())
    ) {
      age--;
    }
    return age;
  }
}
