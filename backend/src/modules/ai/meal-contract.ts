import type { GeneratedMealPlan, Meal } from './ai.service';
import type {
  MealPlanGenerationContext,
  VerifiedMealSummary,
} from '../meal-plan/meal-plan.service';

export function mealTypes(count: number): Meal['mealType'][] {
  const schedules: Record<number, Meal['mealType'][]> = {
    1: ['lunch'],
    2: ['lunch', 'dinner'],
    3: ['breakfast', 'lunch', 'dinner'],
    4: ['breakfast', 'lunch', 'snack', 'dinner'],
    5: ['breakfast', 'snack', 'lunch', 'snack', 'dinner'],
    6: ['breakfast', 'snack', 'lunch', 'snack', 'dinner', 'snack'],
  };
  if (!schedules[count]) throw new Error('Invalid meals per day');
  return schedules[count];
}

export function parseJson(raw: string): any {
  return JSON.parse(
    raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, ''),
  );
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`Missing ${field}`);
  return value.trim();
}

function number(value: unknown, field: string, minimum = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum)
    throw new Error(
      `Invalid ${field}: a finite number >= ${minimum} is required`,
    );
  return value;
}

function strings(value: unknown, field: string, nonempty = false): string[] {
  if (!Array.isArray(value) || (nonempty && !value.length))
    throw new Error(`Missing ${field}`);
  return value.map((item) => text(item, field));
}

// Shared contract for model output, database records, and submitted replacements.
// Missing nutrition, cost, ingredients, or preparation steps never receive invented defaults.
export function parseMeal(value: any): Meal {
  if (
    !value ||
    !['breakfast', 'lunch', 'dinner', 'snack'].includes(value.mealType)
  )
    throw new Error('Invalid meal type');
  if (!Array.isArray(value.ingredients) || !value.ingredients.length)
    throw new Error('Missing ingredients');
  const servings = number(value.servings, 'servings', 0.01);
  if (servings > 20) throw new Error('Servings cannot exceed 20');
  const prep = number(value.prepTimeMinutes, 'prepTimeMinutes', 1);
  if (!Number.isInteger(prep) || prep > 1440)
    throw new Error('Invalid preparation time');
  if (
    value.mealId != null &&
    (typeof value.mealId !== 'string' || !value.mealId.trim())
  )
    throw new Error('Invalid meal ID');
  return {
    mealId: value.mealId ?? null,
    mealType: value.mealType,
    name: text(value.name, 'meal name'),
    description: typeof value.description === 'string' ? value.description : '',
    ingredients: value.ingredients.map((i: any) => ({
      name: text(i?.name, 'ingredient name'),
      quantity: number(i?.quantity, 'ingredient quantity', 0.001),
      unit: text(i?.unit, 'ingredient unit'),
    })),
    instructions: strings(value.instructions, 'instructions', true),
    servings,
    calories: number(value.calories, 'calories', 1),
    protein: number(value.protein, 'protein'),
    carbs: number(value.carbs, 'carbs'),
    fat: number(value.fat, 'fat'),
    estimatedCostLkr: number(value.estimatedCostLkr, 'estimatedCostLkr'),
    prepTimeMinutes: prep,
    allergens: strings(value.allergens, 'allergens'),
    dietTags: strings(value.dietTags, 'dietTags'),
    reason: typeof value.reason === 'string' ? value.reason : '',
  };
}

export function parsePlan(
  value: any,
  context: MealPlanGenerationContext,
): GeneratedMealPlan {
  if (!Array.isArray(value?.days) || value.days.length !== context.durationDays)
    throw new Error(`Exactly ${context.durationDays} days are required`);
  const expectedTypes = mealTypes(context.mealsPerDay).sort();
  const seen = new Set<number>();
  const days = value.days.map((day: any) => {
    if (
      !Number.isInteger(day.day) ||
      day.day < 1 ||
      day.day > context.durationDays ||
      seen.has(day.day)
    )
      throw new Error('Day numbers must be unique and consecutive');
    seen.add(day.day);
    if (!Array.isArray(day.meals) || day.meals.length !== context.mealsPerDay)
      throw new Error(
        `Exactly ${context.mealsPerDay} meals are required per day`,
      );
    const meals = day.meals.map(parseMeal);
    if (
      meals
        .map((m: Meal) => m.mealType)
        .sort()
        .join() !== expectedTypes.join()
    )
      throw new Error('Meal types do not match the requested schedule');
    return { day: day.day, meals };
  });
  return { days: days.sort((a, b) => a.day - b.day) };
}

export function canonicalMeal(
  meal: Meal,
  catalogue: VerifiedMealSummary[],
): Meal {
  if (!meal.mealId) return parseMeal(meal);
  const record = catalogue.find((m) => m.id === meal.mealId);
  if (!record || record.mealType !== meal.mealType)
    throw new Error('Unknown, unsuitable, or inactive verified meal ID');
  return parseMeal({
    ...meal,
    ...record,
    mealId: record.id,
    servings: meal.servings,
    reason: meal.reason,
    instructions:
      record.instructions ?? record.recipe?.split(/\r?\n/).filter(Boolean),
  });
}

export function canonicalPlan(
  plan: GeneratedMealPlan,
  context: MealPlanGenerationContext,
): GeneratedMealPlan {
  return parsePlan(
    {
      days: plan.days.map((d) => ({
        day: d.day,
        meals: d.meals.map((m) =>
          canonicalMeal(m, context.verifiedMeals ?? []),
        ),
      })),
    },
    context,
  );
}
