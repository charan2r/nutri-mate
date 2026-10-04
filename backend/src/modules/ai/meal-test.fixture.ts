import type { GeneratedMealPlan, Meal } from './ai.service';
import type { MealPlanGenerationContext } from '../meal-plan/meal-plan.service';

export const testContext: MealPlanGenerationContext = {
  age: 25,
  biologicalSex: 'male',
  heightCm: 175,
  weightKg: 70,
  goal: 'muscle_gain',
  activityLevel: 'moderately_active',
  dailyCalorieTarget: 2100,
  dietType: 'non-veg',
  appetiteLevel: 'medium',
  mealsPerDay: 3,
  dailyBudget: 2000,
  preferredCuisines: ['Sri Lankan'],
  excludedIngredients: [],
  dislikedFoods: [],
  maximumPrepMinutes: 30,
  cookingSkill: 'intermediate',
  servings: 1,
  allergies: [],
  startDate: '2026-10-04',
  durationDays: 1,
  strictCalorieControl: false,
};

export function testMeal(overrides: Partial<Meal> = {}): Meal {
  return {
    mealId: null,
    mealType: 'lunch',
    name: 'Rice and dhal',
    description: 'Test fixture, not nutrition data',
    ingredients: [{ name: 'Red rice', quantity: 200, unit: 'g' }],
    instructions: ['Cook the rice.'],
    servings: 1,
    calories: 700,
    protein: 40,
    carbs: 90,
    fat: 20,
    estimatedCostLkr: 400,
    prepTimeMinutes: 20,
    allergens: [],
    dietTags: ['vegan'],
    reason: 'Test fixture',
    ...overrides,
  };
}

export function testPlan(days = 1): GeneratedMealPlan {
  return {
    days: Array.from({ length: days }, (_, index) => ({
      day: index + 1,
      meals: [
        testMeal({ mealType: 'breakfast' }),
        testMeal(),
        testMeal({ mealType: 'dinner' }),
      ],
    })),
  };
}
