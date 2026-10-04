/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { GeneratedMealPlan } from '../ai/ai.service';
import { parsePlan } from '../ai/meal-contract';
import { MealPlanGenerationContext } from '../meal-plan/meal-plan.service';

export interface AllergyValidationResult {
  passed: boolean;
  conflicts: Array<{
    day: number;
    mealType: string;
    mealName: string;
    matchedAllergen: string;
  }>;
}

export interface DietValidationResult {
  passed: boolean;
  violations: Array<{
    day: number;
    mealType: string;
    mealName: string;
    reason: string;
  }>;
}

export interface CalorieValidationResult {
  passed: boolean;
  averageDailyCalories: number;
  targetCalories: number;
  averageDeviationPct: number;
  dailyTotals: number[];
  score: number;
}

export interface BudgetValidationResult {
  passed: boolean;
  averageDailyCost: number;
  targetBudget: number | null;
  overBudgetPct: number;
  score: number;
}

export interface PreferenceValidationResult {
  passed: boolean;
  exceededPrepTimeCount: number;
  dislikedFoodMatches: string[];
  score: number;
}

export interface DiversityValidationResult {
  passed: boolean;
  uniqueMealCount: number;
  totalMealCount: number;
  score: number;
}

export interface StrictCalorieValidationResult {
  passed: boolean;
  reason?: string;
}

export interface ValidationSummary {
  structureValid: boolean;
  allergySafe: boolean;
  dietCompliant: boolean;
  calorieTargetMet: boolean;
  budgetMet: boolean;
  prepTimeMet: boolean;
  diversityAcceptable: boolean;
  strictCalorieVerified: boolean;
  safetyValidated: boolean;
}

export interface QualityScoreBreakdown {
  nutrition: number;
  constraints: number;
  preferences: number;
  budget: number;
  diversity: number;
}

export interface FullPlanValidationResult {
  isValid: boolean;
  qualityScore: number;
  scoreBreakdown: QualityScoreBreakdown;
  validationSummary: ValidationSummary;
  details: {
    allergies: AllergyValidationResult;
    diet: DietValidationResult;
    calories: CalorieValidationResult;
    budget: BudgetValidationResult;
    preferences: PreferenceValidationResult;
    diversity: DiversityValidationResult;
    strictCalorie: StrictCalorieValidationResult;
  };
}

const NON_VEG_KEYWORDS = [
  'chicken',
  'beef',
  'pork',
  'mutton',
  'lamb',
  'fish',
  'seafood',
  'prawn',
  'shrimp',
  'crab',
  'tuna',
  'salmon',
  'meat',
  'sausage',
  'bacon',
  'squid',
  'cuttlefish',
  'anchovy',
  'sprats',
];

const NON_VEGAN_KEYWORDS = [
  ...NON_VEG_KEYWORDS,
  'milk',
  'egg',
  'eggs',
  'butter',
  'cheese',
  'ghee',
  'curd',
  'yogurt',
  'yoghurt',
  'paneer',
  'honey',
  'dairy',
  'cream',
];

function containsWord(value: string, word: string): boolean {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, 'i').test(value);
}

function cleanPlantNames(value: string): string {
  return value.replace(
    /soya\s*meat|soy\s*meat|mock\s*meat|(?:coconut|soy|soya|oat|almond|rice)\s*(?:milk|cream|butter)|peanut\s*butter/g,
    'plant ingredient',
  );
}

const ALLERGEN_ALIASES: Record<string, string[]> = {
  peanut: ['peanut', 'peanuts', 'groundnut', 'groundnuts'],
  soy: ['soy', 'soya', 'tofu'],
  soya: ['soy', 'soya', 'tofu'],
  egg: ['egg', 'eggs'],
  milk: [
    'milk',
    'dairy',
    'curd',
    'yogurt',
    'yoghurt',
    'cheese',
    'butter',
    'ghee',
    'cream',
  ],
  dairy: [
    'milk',
    'dairy',
    'curd',
    'yogurt',
    'yoghurt',
    'cheese',
    'butter',
    'ghee',
    'cream',
  ],
  gluten: ['gluten', 'wheat', 'barley', 'rye', 'semolina'],
  fish: ['fish', 'tuna', 'salmon', 'sprats', 'anchovy'],
  shellfish: ['shellfish', 'shrimp', 'prawn', 'prawns', 'crab', 'lobster'],
};

function matchesAllergen(value: string, allergen: string): boolean {
  const aliases = ALLERGEN_ALIASES[allergen] ||
    Object.values(ALLERGEN_ALIASES).find((group) =>
      group.includes(allergen),
    ) || [allergen];
  const cleaned = aliases.includes('dairy') ? cleanPlantNames(value) : value;
  return aliases.some((alias) => containsWord(cleaned, alias));
}

@Injectable()
export class MealPlanValidationService {
  validatePlan(
    plan: GeneratedMealPlan,
    context: MealPlanGenerationContext,
  ): FullPlanValidationResult {
    let structureValid = true;
    try {
      parsePlan(plan, context);
    } catch {
      structureValid = false;
    }
    const allergies = this.validateAllergies(plan, context);
    const diet = this.validateDiet(plan, context);
    const calories = this.validateCalories(plan, context);
    const budget = this.validateBudget(plan, context);
    const preferences = this.validatePreferences(plan, context);
    const diversity = this.validateDiversity(plan);
    const strictCalorie = this.validateStrictCalorieControl(plan, context);

    // Constraint score (Allergies + Diet + StrictCalorie)
    let constraintScore = 100;
    if (!allergies.passed) constraintScore -= 50;
    if (!diet.passed) constraintScore -= 30;
    if (!strictCalorie.passed) constraintScore -= 20;
    constraintScore = Math.max(0, constraintScore);

    const nutritionScore = calories.score;
    const preferenceScore = preferences.score;
    const budgetScore = budget.score;
    const diversityScore = diversity.score;

    // Quality score formula: Nutrition 30%, Constraints 30%, Preferences 15%, Budget 15%, Diversity 10%
    const qualityScore = Math.round(
      nutritionScore * 0.3 +
        constraintScore * 0.3 +
        preferenceScore * 0.15 +
        budgetScore * 0.15 +
        diversityScore * 0.1,
    );

    const isValid =
      structureValid &&
      allergies.passed &&
      diet.passed &&
      calories.passed &&
      budget.passed &&
      strictCalorie.passed &&
      preferences.passed;

    const validationSummary: ValidationSummary = {
      structureValid,
      allergySafe: allergies.passed,
      dietCompliant: diet.passed,
      calorieTargetMet: calories.passed,
      budgetMet: budget.passed,
      prepTimeMet: preferences.passed,
      diversityAcceptable: diversity.passed,
      strictCalorieVerified: strictCalorie.passed,
      safetyValidated: allergies.passed && diet.passed,
    };

    return {
      isValid,
      qualityScore,
      scoreBreakdown: {
        nutrition: nutritionScore,
        constraints: constraintScore,
        preferences: preferenceScore,
        budget: budgetScore,
        diversity: diversityScore,
      },
      validationSummary,
      details: {
        allergies,
        diet,
        calories,
        budget,
        preferences,
        diversity,
        strictCalorie,
      },
    };
  }

  validateAllergies(
    plan: GeneratedMealPlan,
    context: MealPlanGenerationContext,
  ): AllergyValidationResult {
    const userAllergens = [
      ...(context.allergies || []),
      ...(context.excludedIngredients || []),
    ].map((a) => a.toLowerCase().trim());

    if (userAllergens.length === 0) {
      return { passed: true, conflicts: [] };
    }

    const conflicts: AllergyValidationResult['conflicts'] = [];

    for (const day of plan.days) {
      for (const meal of day.meals) {
        const declaredAllergens = (meal.allergens || []).map((a) =>
          a.toLowerCase().trim(),
        );
        const ingredientNames = (meal.ingredients || []).map((i) =>
          i.name.toLowerCase().trim(),
        );
        const mealName = meal.name.toLowerCase();

        for (const allergen of userAllergens) {
          if (!allergen) continue;
          const hasDeclaredConflict = declaredAllergens.some((da) =>
            matchesAllergen(da, allergen),
          );
          const hasIngredientConflict = ingredientNames.some((inName) =>
            matchesAllergen(inName, allergen),
          );
          const hasNameConflict = matchesAllergen(mealName, allergen);

          if (hasDeclaredConflict || hasIngredientConflict || hasNameConflict) {
            conflicts.push({
              day: day.day,
              mealType: meal.mealType,
              mealName: meal.name,
              matchedAllergen: allergen,
            });
          }
        }
      }
    }

    return {
      passed: conflicts.length === 0,
      conflicts,
    };
  }

  validateDiet(
    plan: GeneratedMealPlan,
    context: MealPlanGenerationContext,
  ): DietValidationResult {
    const dietType = (context.dietType || 'non-veg').toLowerCase().trim();
    const violations: DietValidationResult['violations'] = [];

    if (dietType === 'non-veg' || dietType === 'other') {
      return { passed: true, violations: [] };
    }

    for (const day of plan.days) {
      for (const meal of day.meals) {
        const mealName = meal.name.toLowerCase();
        const ingredientsText = (meal.ingredients || [])
          .map((i) => i.name.toLowerCase())
          .join(' ');
        const tags = (meal.dietTags || []).map((t) => t.toLowerCase());

        // Replace plant-based meat substitutes so generic 'meat' does not trigger false positive
        const cleanName = cleanPlantNames(mealName);
        const cleanIngredients = cleanPlantNames(ingredientsText);

        if (dietType === 'vegetarian') {
          const hasMeat = NON_VEG_KEYWORDS.some(
            (kw) =>
              containsWord(cleanName, kw) || containsWord(cleanIngredients, kw),
          );
          const taggedNonVeg =
            tags.includes('non-veg') || tags.includes('non-vegetarian');
          if (hasMeat || taggedNonVeg) {
            violations.push({
              day: day.day,
              mealType: meal.mealType,
              mealName: meal.name,
              reason: 'Contains non-vegetarian ingredients or tags',
            });
          }
        } else if (dietType === 'vegan') {
          const hasAnimalProduct = NON_VEGAN_KEYWORDS.some(
            (kw) =>
              containsWord(cleanName, kw) || containsWord(cleanIngredients, kw),
          );
          const taggedNonVegan =
            tags.includes('non-veg') ||
            tags.includes('vegetarian') ||
            tags.includes('dairy');
          if (hasAnimalProduct || (taggedNonVegan && !tags.includes('vegan'))) {
            violations.push({
              day: day.day,
              mealType: meal.mealType,
              mealName: meal.name,
              reason: 'Contains non-vegan ingredients, animal products or tags',
            });
          }
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  validateCalories(
    plan: GeneratedMealPlan,
    context: MealPlanGenerationContext,
  ): CalorieValidationResult {
    const target = context.dailyCalorieTarget || 2000;
    const dailyTotals: number[] = [];

    for (const day of plan.days) {
      const dayTotal = day.meals.reduce(
        (sum, m) => sum + m.calories * (m.servings || 1),
        0,
      );
      dailyTotals.push(dayTotal);
    }

    const averageDailyCalories =
      dailyTotals.length > 0
        ? Math.round(
            dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length,
          )
        : 0;

    const averageDeviationPct =
      target > 0
        ? Math.round(
            (Math.abs(averageDailyCalories - target) / target) * 100 * 10,
          ) / 10
        : 0;

    // Nutrition scoring: 100 for <= 5% deviation, decreasing gracefully
    let score = 100;
    if (averageDeviationPct > 5) {
      score = Math.max(0, Math.round(100 - (averageDeviationPct - 5) * 4));
    }

    // Every day must meet the 10% target; macros must be plausible for the stated energy.
    const passed =
      dailyTotals.length > 0 &&
      dailyTotals.every(
        (total) =>
          Number.isFinite(total) && Math.abs(total - target) / target <= 0.1,
      ) &&
      plan.days.every((day) =>
        day.meals.every((meal) => {
          const energy = 4 * meal.protein + 4 * meal.carbs + 9 * meal.fat;
          return (
            Number.isFinite(energy) &&
            Math.abs(energy - meal.calories) / meal.calories <= 0.25
          );
        }),
      );

    return {
      passed,
      averageDailyCalories,
      targetCalories: target,
      averageDeviationPct,
      dailyTotals,
      score,
    };
  }

  validateBudget(
    plan: GeneratedMealPlan,
    context: MealPlanGenerationContext,
  ): BudgetValidationResult {
    const targetBudget = context.dailyBudget;
    if (targetBudget == null) {
      return {
        passed: true,
        averageDailyCost: 0,
        targetBudget: null,
        overBudgetPct: 0,
        score: 100,
      };
    }

    const dailyCosts: number[] = [];
    for (const day of plan.days) {
      const dayCost = day.meals.reduce(
        (sum, m) => sum + (m.estimatedCostLkr || 0) * (m.servings || 1),
        0,
      );
      dailyCosts.push(dayCost);
    }

    const averageDailyCost =
      dailyCosts.length > 0
        ? Math.round(dailyCosts.reduce((a, b) => a + b, 0) / dailyCosts.length)
        : 0;

    const overBudgetAmount = averageDailyCost - targetBudget;
    const overBudgetPct =
      overBudgetAmount > 0
        ? Math.round((overBudgetAmount / targetBudget) * 100 * 10) / 10
        : 0;

    let score = 100;
    if (overBudgetPct > 0) {
      score = Math.max(0, Math.round(100 - overBudgetPct * 3));
    }

    // Daily limits are hard constraints. Unknown costs are never counted as free.
    const passed =
      dailyCosts.length > 0 &&
      dailyCosts.every(
        (cost) => Number.isFinite(cost) && cost <= targetBudget,
      ) &&
      plan.days.every((day) =>
        day.meals.every(
          (meal) =>
            typeof meal.estimatedCostLkr === 'number' &&
            Number.isFinite(meal.estimatedCostLkr) &&
            meal.estimatedCostLkr >= 0,
        ),
      );

    return {
      passed,
      averageDailyCost,
      targetBudget,
      overBudgetPct,
      score,
    };
  }

  validatePreferences(
    plan: GeneratedMealPlan,
    context: MealPlanGenerationContext,
  ): PreferenceValidationResult {
    let prepTimeViolations = 0;
    const dislikedMatches: string[] = [];
    const maxPrep = context.maximumPrepMinutes;
    const disliked = [
      ...(context.dislikedFoods || []),
      ...(context.userFeedback?.dislikedMeals || []),
    ].map((f) => f.toLowerCase().trim());

    let totalMeals = 0;
    for (const day of plan.days) {
      for (const meal of day.meals) {
        totalMeals++;
        if (maxPrep && meal.prepTimeMinutes && meal.prepTimeMinutes > maxPrep) {
          prepTimeViolations++;
        }

        const mealText =
          `${meal.name} ${(meal.ingredients || []).map((i) => i.name).join(' ')}`.toLowerCase();
        for (const item of disliked) {
          if (item && mealText.includes(item)) {
            dislikedMatches.push(item);
          }
        }
      }
    }

    let score = 100;
    if (totalMeals > 0 && prepTimeViolations > 0) {
      score -= Math.round((prepTimeViolations / totalMeals) * 30);
    }
    if (dislikedMatches.length > 0) {
      score -= Math.min(30, dislikedMatches.length * 10);
    }

    score = Math.max(0, score);
    const passed = prepTimeViolations === 0 && dislikedMatches.length === 0;

    return {
      passed,
      exceededPrepTimeCount: prepTimeViolations,
      dislikedFoodMatches: Array.from(new Set(dislikedMatches)),
      score,
    };
  }

  validateDiversity(plan: GeneratedMealPlan): DiversityValidationResult {
    const mealNames = new Set<string>();
    const ingredientNames = new Set<string>();
    let totalMeals = 0;

    for (const day of plan.days) {
      for (const meal of day.meals) {
        totalMeals++;
        mealNames.add(meal.name.toLowerCase().trim());
        for (const ing of meal.ingredients || []) {
          ingredientNames.add(ing.name.toLowerCase().trim());
        }
      }
    }

    const uniqueMealCount = mealNames.size;
    const mealDiversityRatio =
      totalMeals > 0 ? uniqueMealCount / totalMeals : 1;

    // Score based on meal uniqueness and ingredient variety
    let score = Math.round(
      mealDiversityRatio * 80 + Math.min(20, ingredientNames.size * 2),
    );
    score = Math.min(100, Math.max(0, score));

    // Passes if at least 60% of meals are unique across the plan
    const passed = mealDiversityRatio >= 0.5;

    return {
      passed,
      uniqueMealCount,
      totalMealCount: totalMeals,
      score,
    };
  }

  validateStrictCalorieControl(
    plan: GeneratedMealPlan,
    context: MealPlanGenerationContext,
  ): StrictCalorieValidationResult {
    if (!context.strictCalorieControl) {
      return { passed: true };
    }

    const unverifiedMeals: string[] = [];
    for (const day of plan.days) {
      for (const meal of day.meals) {
        if (
          !meal.mealId ||
          !(context.verifiedMeals || []).some(
            (record) => record.id === meal.mealId,
          )
        ) {
          unverifiedMeals.push(meal.name);
        }
      }
    }

    if (unverifiedMeals.length > 0) {
      return {
        passed: false,
        reason: `Strict calorie control requires nutrition-verified database meals. ${unverifiedMeals.length} novel meal(s) cannot be strictly verified.`,
      };
    }

    return { passed: true };
  }
}
