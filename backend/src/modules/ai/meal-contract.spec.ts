import { canonicalPlan, parseMeal, parsePlan } from './meal-contract';
import { testContext, testMeal, testPlan } from './meal-test.fixture';

describe('Strict meal contract', () => {
  it('rejects missing days instead of repeating the first day', () => {
    expect(() =>
      parsePlan(testPlan(), { ...testContext, durationDays: 3 }),
    ).toThrow('Exactly 3');
  });
  it('rejects repeated day numbers', () => {
    const plan = testPlan(2);
    plan.days[1].day = 1;
    expect(() => parsePlan(plan, { ...testContext, durationDays: 2 })).toThrow(
      'unique',
    );
  });
  it('rejects missing and duplicated meal slots', () => {
    const plan = testPlan();
    plan.days[0].meals[0].mealType = 'lunch';
    expect(() => parsePlan(plan, testContext)).toThrow('schedule');
    plan.days[0].meals.pop();
    expect(() => parsePlan(plan, testContext)).toThrow('Exactly 3');
  });
  it.each([
    'calories',
    'protein',
    'carbs',
    'fat',
    'estimatedCostLkr',
    'prepTimeMinutes',
    'servings',
  ])('rejects missing %s', (field) => {
    const meal: any = testMeal();
    delete meal[field];
    expect(() => parseMeal(meal)).toThrow();
  });
  it.each([NaN, Infinity, -1, '700'])(
    'rejects invalid nutrition: %s',
    (value) => {
      expect(() => parseMeal({ ...testMeal(), calories: value })).toThrow();
    },
  );
  it('preserves zero macros instead of fabricating protein', () => {
    expect(parseMeal(testMeal({ protein: 0 })).protein).toBe(0);
  });
  it('rejects unknown database IDs', () => {
    const plan = testPlan();
    plan.days[0].meals[0].mealId = 'unknown';
    expect(() => canonicalPlan(plan, testContext)).toThrow('verified meal ID');
  });
  it('uses database ingredients and nutrition before validation', () => {
    const record = {
      ...testMeal({
        mealType: 'breakfast',
        calories: 900,
        allergens: ['peanut'],
      }),
      id: 'known',
      estimatedCostLkr: 400,
      prepTimeMinutes: 20,
    };
    const plan = testPlan();
    plan.days[0].meals[0].mealId = 'known';
    const resolved = canonicalPlan(plan, {
      ...testContext,
      verifiedMeals: [record],
    });
    expect(resolved.days[0].meals[0].calories).toBe(900);
    expect(resolved.days[0].meals[0].allergens).toEqual(['peanut']);
  });
});
