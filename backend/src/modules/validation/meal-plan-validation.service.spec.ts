import { MealPlanValidationService } from './meal-plan-validation.service';
import { GeneratedMealPlan } from '../ai/ai.service';
import { testContext, testPlan, testMeal } from '../ai/meal-test.fixture';
import { MealPlanGenerationContext } from '../meal-plan/meal-plan.service';

describe('MealPlanValidationService', () => {
  let service: MealPlanValidationService;

  beforeEach(() => {
    service = new MealPlanValidationService();
  });

  const baseContext: MealPlanGenerationContext = {
    age: 28,
    biologicalSex: 'male',
    heightCm: 175,
    weightKg: 72,
    goal: 'maintain',
    activityLevel: 'moderately_active',
    dailyCalorieTarget: 2100,
    dietType: 'non-veg',
    appetiteLevel: 'medium',
    mealsPerDay: 3,
    dailyBudget: 1500,
    preferredCuisines: ['Sri Lankan'],
    excludedIngredients: [],
    dislikedFoods: [],
    maximumPrepMinutes: 30,
    cookingSkill: 'intermediate',
    servings: 1,
    allergies: [],
    startDate: '2026-09-01',
    durationDays: 3,
    strictCalorieControl: false,
  };

  const sampleVegetarianPlan: GeneratedMealPlan = {
    days: [
      {
        day: 1,
        meals: [
          {
            mealType: 'breakfast',
            name: 'String Hoppers with Dhal & Pol Sambol',
            description: 'Traditional Sri Lankan breakfast',
            servings: 1,
            calories: 450,
            protein: 14,
            carbs: 70,
            fat: 12,
            estimatedCostLkr: 250,
            prepTimeMinutes: 20,
            allergens: ['coconut'],
            dietTags: ['vegetarian'],
            reason: 'High energy breakfast',
            ingredients: [
              { name: 'Red rice string hoppers', quantity: 5, unit: 'pieces' },
              { name: 'Dhal curry', quantity: 120, unit: 'g' },
              { name: 'Pol sambol', quantity: 40, unit: 'g' },
            ],
          },
          {
            mealType: 'lunch',
            name: 'Red Rice with Soya Meat and Gotukola Sambol',
            description: 'High protein plant-based lunch',
            servings: 1,
            calories: 750,
            protein: 32,
            carbs: 110,
            fat: 18,
            estimatedCostLkr: 400,
            prepTimeMinutes: 25,
            allergens: ['soya'],
            dietTags: ['vegetarian', 'high-protein'],
            reason: 'Balanced midday fuel',
            ingredients: [
              { name: 'Red rice', quantity: 180, unit: 'g' },
              { name: 'Soya meat curry', quantity: 150, unit: 'g' },
              { name: 'Gotukola sambol', quantity: 50, unit: 'g' },
            ],
          },
          {
            mealType: 'dinner',
            name: 'Pittu with Kiri Hodi and Boiled Egg',
            description: 'Light satisfying dinner',
            servings: 1,
            calories: 600,
            protein: 22,
            carbs: 85,
            fat: 16,
            estimatedCostLkr: 300,
            prepTimeMinutes: 20,
            allergens: ['egg', 'coconut'],
            dietTags: ['vegetarian'],
            reason: 'Easy to digest dinner',
            ingredients: [
              { name: 'Kurakkan pittu', quantity: 150, unit: 'g' },
              { name: 'Kiri hodi', quantity: 100, unit: 'ml' },
              { name: 'Boiled egg', quantity: 1, unit: 'egg' },
            ],
          },
        ],
      },
    ],
  };

  const sampleNonVegPlan: GeneratedMealPlan = {
    days: [
      {
        day: 1,
        meals: [
          {
            mealType: 'breakfast',
            name: 'Egg Roti with Katta Sambol',
            description: 'Warm flatbread with spiced egg',
            servings: 1,
            calories: 500,
            protein: 20,
            carbs: 60,
            fat: 18,
            estimatedCostLkr: 300,
            prepTimeMinutes: 15,
            allergens: ['egg'],
            dietTags: ['non-veg'],
            reason: 'Quick breakfast',
            ingredients: [
              { name: 'Wheat roti', quantity: 2, unit: 'pieces' },
              { name: 'Egg', quantity: 2, unit: 'eggs' },
            ],
          },
          {
            mealType: 'lunch',
            name: 'Red Rice with Chicken Curry and Beans',
            description: 'Savory Sri Lankan chicken curry lunch',
            servings: 1,
            calories: 800,
            protein: 45,
            carbs: 95,
            fat: 22,
            estimatedCostLkr: 600,
            prepTimeMinutes: 30,
            allergens: [],
            dietTags: ['non-veg'],
            reason: 'High protein lunch',
            ingredients: [
              { name: 'Red rice', quantity: 180, unit: 'g' },
              { name: 'Chicken curry', quantity: 180, unit: 'g' },
              { name: 'Green beans tempered', quantity: 80, unit: 'g' },
            ],
          },
          {
            mealType: 'dinner',
            name: 'Roast Bread with Fish Curry & Pol Sambol',
            description: 'Traditional Sri Lankan dinner',
            servings: 1,
            calories: 650,
            protein: 35,
            carbs: 80,
            fat: 16,
            estimatedCostLkr: 450,
            prepTimeMinutes: 20,
            allergens: ['fish'],
            dietTags: ['non-veg'],
            reason: 'Nutritious dinner',
            ingredients: [
              { name: 'Roast bread', quantity: 3, unit: 'slices' },
              { name: 'Tuna fish ambul thiyal', quantity: 120, unit: 'g' },
            ],
          },
        ],
      },
    ],
  };

  describe('TC-1: User selects vegetarian diet', () => {
    it('should PASS when all meals are strictly vegetarian', () => {
      const context: MealPlanGenerationContext = {
        ...baseContext,
        dietType: 'vegetarian',
      };

      const result = service.validateDiet(sampleVegetarianPlan, context);
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should FAIL when meals contain chicken, fish, or non-veg tags', () => {
      const context: MealPlanGenerationContext = {
        ...baseContext,
        dietType: 'vegetarian',
      };

      const result = service.validateDiet(sampleNonVegPlan, context);
      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(
        result.violations.some((v) => v.mealName.includes('Chicken')),
      ).toBe(true);
    });
  });

  describe('TC-2: User adds peanut allergy', () => {
    it('should FAIL when peanut is in meal allergens or ingredient names', () => {
      const context: MealPlanGenerationContext = {
        ...baseContext,
        allergies: ['peanut'],
      };

      const planWithPeanuts: GeneratedMealPlan = {
        days: [
          {
            day: 1,
            meals: [
              {
                mealType: 'breakfast',
                name: 'Toast with Peanut Butter & Banana',
                description: 'Energy toast',
                servings: 1,
                calories: 450,
                protein: 15,
                carbs: 60,
                fat: 16,
                estimatedCostLkr: 200,
                prepTimeMinutes: 10,
                allergens: ['peanut'],
                dietTags: ['vegetarian'],
                reason: 'Pre-workout',
                ingredients: [
                  { name: 'Whole wheat bread', quantity: 2, unit: 'slices' },
                  { name: 'Roasted peanut butter', quantity: 30, unit: 'g' },
                ],
              },
            ],
          },
        ],
      };

      const result = service.validateAllergies(planWithPeanuts, context);
      expect(result.passed).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].matchedAllergen).toBe('peanut');
    });

    it('should PASS when no meals contain peanut allergens or peanut ingredients', () => {
      const context: MealPlanGenerationContext = {
        ...baseContext,
        allergies: ['peanut'],
      };

      const result = service.validateAllergies(sampleVegetarianPlan, context);
      expect(result.passed).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('TC-3: Daily budget adherence', () => {
    it('should PASS with 100 score when average daily cost is within daily budget', () => {
      const context: MealPlanGenerationContext = {
        ...baseContext,
        dailyBudget: 1500,
      };

      const result = service.validateBudget(sampleVegetarianPlan, context);
      expect(result.passed).toBe(true);
      expect(result.averageDailyCost).toBe(950); // 250 + 400 + 300
      expect(result.score).toBe(100);
    });

    it('should penalize budget score when average daily cost significantly exceeds daily budget', () => {
      const context: MealPlanGenerationContext = {
        ...baseContext,
        dailyBudget: 500, // strictly low budget
      };

      const result = service.validateBudget(sampleNonVegPlan, context);
      // Cost is 300 + 600 + 450 = 1350 LKR vs 500 LKR budget
      expect(result.passed).toBe(false);
      expect(result.overBudgetPct).toBeGreaterThan(50);
      expect(result.score).toBeLessThan(50);
    });
  });

  describe('TC-4 & TC-5: Calorie target & deterministic quality score', () => {
    it('should compute deterministic quality score based on 30% nutrition, 30% constraints, 15% preferences, 15% budget, 10% diversity', () => {
      const context: MealPlanGenerationContext = {
        ...baseContext,
        dailyCalorieTarget: 1800,
        dailyBudget: 1500,
        dietType: 'vegetarian',
      };

      const fullResult = service.validatePlan(
        {
          days: sampleVegetarianPlan.days.map((d) => ({
            ...d,
            meals: d.meals.map((m) => ({
              ...m,
              instructions: ['Prepare the meal.'],
            })),
          })),
        },
        { ...context, durationDays: 1 },
      );
      expect(fullResult.isValid).toBe(true);
      expect(fullResult.qualityScore).toBeGreaterThanOrEqual(80);
      expect(fullResult.scoreBreakdown.constraints).toBe(100);
      expect(fullResult.scoreBreakdown.budget).toBe(100);
      expect(fullResult.validationSummary.allergySafe).toBe(true);
      expect(fullResult.validationSummary.dietCompliant).toBe(true);
    });
  });
  describe('daily hard constraints', () => {
    it('rejects calories that cancel out across days', () => {
      const plan = testPlan(2);
      plan.days[0].meals.forEach((m) => (m.calories = 500));
      plan.days[1].meals.forEach((m) => (m.calories = 900));
      expect(service.validateCalories(plan, testContext).passed).toBe(false);
    });
    it('rejects a day over budget even if the average is affordable', () => {
      const plan = testPlan(2);
      plan.days[0].meals.forEach((m) => (m.estimatedCostLkr = 800));
      plan.days[1].meals.forEach((m) => (m.estimatedCostLkr = 100));
      expect(service.validateBudget(plan, testContext).passed).toBe(false);
    });
    it('rejects missing prices', () => {
      const plan = testPlan();
      delete plan.days[0].meals[0].estimatedCostLkr;
      expect(service.validateBudget(plan, testContext).passed).toBe(false);
    });
    it('does not treat a zero budget as unlimited', () => {
      expect(
        service.validateBudget(testPlan(), { ...testContext, dailyBudget: 0 })
          .passed,
      ).toBe(false);
    });
    it('rejects implausible calories and macros', () => {
      const plan = testPlan();
      plan.days[0].meals[0].protein = 900;
      expect(service.validateCalories(plan, testContext).passed).toBe(false);
    });
    it('requires a real trusted ID for strict mode', () => {
      const plan = testPlan();
      plan.days[0].meals.forEach((m) => (m.mealId = 'invented'));
      expect(
        service.validateStrictCalorieControl(plan, {
          ...testContext,
          strictCalorieControl: true,
        }).passed,
      ).toBe(false);
    });
    it('rejects excessive preparation time and structurally incomplete plans', () => {
      const plan = testPlan();
      plan.days[0].meals[0].prepTimeMinutes = 60;
      expect(service.validatePlan(plan, testContext).isValid).toBe(false);
      expect(
        service.validatePlan(testPlan(), { ...testContext, durationDays: 2 })
          .validationSummary.structureValid,
      ).toBe(false);
    });
    it('detects groundnut as a peanut alias', () => {
      const plan = testPlan();
      plan.days[0].meals[0].ingredients[0].name = 'groundnut oil';
      expect(
        service.validateAllergies(plan, {
          ...testContext,
          allergies: ['peanut'],
        }).passed,
      ).toBe(false);
    });
    it('does not reject eggplant and coconut milk for vegan meals', () => {
      const plan = testPlan();
      plan.days[0].meals[0] = testMeal({
        mealType: 'breakfast',
        name: 'Eggplant in coconut milk',
        ingredients: [
          { name: 'Eggplant', quantity: 100, unit: 'g' },
          { name: 'Coconut milk', quantity: 50, unit: 'ml' },
        ],
      });
      expect(
        service.validateDiet(plan, { ...testContext, dietType: 'vegan' })
          .passed,
      ).toBe(true);
    });
  });
  it('recognizes plural allergen labels and ingredient aliases', () => {
    const plan = testPlan();
    plan.days[0].meals[0].ingredients[0].name = 'Groundnuts';
    expect(
      service.validateAllergies(plan, {
        ...testContext,
        allergies: ['Peanuts'],
      }).passed,
    ).toBe(false);
  });
});
