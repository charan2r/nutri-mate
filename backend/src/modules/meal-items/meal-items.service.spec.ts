import { MealItemsService } from './meal-items.service';
import { MealPlan } from '../meal-plan/entities/meal-plan.entity';
import { MealPlanValidationService } from '../validation/meal-plan-validation.service';
import { testContext, testPlan, testMeal } from '../ai/meal-test.fixture';

describe('Validated meal replacements', () => {
  let service: MealItemsService,
    itemRepo: any,
    planRepo: any,
    dataSource: any,
    grocery: any,
    allergyRepo: any,
    preferences: any,
    ai: any;
  let plan: any, storedItems: any[], replacement: any;
  beforeEach(() => {
    plan = {
      id: 'plan',
      userId: 'user',
      startDate: '2026-10-04',
      endDate: '2026-10-04',
      request: { inputSnapshot: testContext },
    };
    storedItems = testPlan().days[0].meals.map((m, i) => ({
      id: `item-${i}`,
      mealPlanId: 'plan',
      mealPlan: plan,
      day: 1,
      mealType: m.mealType,
      servings: 1,
      status: 'scheduled',
      mealId: null,
      caloriesSnapshot: m.calories,
      proteinSnapshot: m.protein,
      carbsSnapshot: m.carbs,
      fatSnapshot: m.fat,
      estimatedCostSnapshot: m.estimatedCostLkr,
      generatedMealSnapshot: m,
    }));
    itemRepo = {
      findOne: jest.fn(async () => storedItems[0]),
      find: jest.fn(async () => storedItems),
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => ({ id: 'new', ...v })),
    };
    planRepo = {
      findOne: jest.fn(async () => plan),
      save: jest.fn(async (v) => v),
    };
    dataSource = {
      transaction: jest.fn(async (callback) =>
        callback({
          getRepository: (entity) =>
            entity === MealPlan ? planRepo : itemRepo,
        }),
      ),
    };
    grocery = { generateForPlan: jest.fn(async () => ({})) };
    allergyRepo = { find: jest.fn(async () => []) };
    preferences = { ...testContext };
    ai = { generateMealAlternatives: jest.fn() };
    service = new MealItemsService(
      itemRepo,
      planRepo,
      { find: async () => [] } as any,
      {
        findOne: async () => ({ ...testContext, dateOfBirth: '2000-01-01' }),
      } as any,
      { findOne: async () => preferences } as any,
      allergyRepo,
      { find: async () => [] } as any,
      ai,
      new MealPlanValidationService(),
      grocery,
      dataSource,
    );
    const meal = testMeal({ mealType: 'breakfast' });
    replacement = {
      ...meal,
      budgetLkr: meal.estimatedCostLkr,
      tags: meal.dietTags,
    };
  });
  it('keeps generated nutrition unverified and refreshes totals, validation, and groceries', async () => {
    const result = await service.replaceMealItem('user', 'item-0', replacement);
    expect(result.newItem.nutritionVerificationStatus).toBe('unverified');
    expect(plan.totalCalories).toBe(2100);
    expect(plan.validationSummary.budgetMet).toBe(true);
    expect(grocery.generateForPlan).toHaveBeenCalled();
    expect(planRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
  });
  it('rejects allergenic meals before any write', async () => {
    allergyRepo.find.mockResolvedValue([{ allergen: 'peanut' }]);
    replacement.ingredients = [{ name: 'Groundnuts', quantity: 20, unit: 'g' }];
    await expect(
      service.replaceMealItem('user', 'item-0', replacement),
    ).rejects.toThrow('constraints');
    expect(itemRepo.save).not.toHaveBeenCalled();
    expect(planRepo.save).not.toHaveBeenCalled();
  });
  it('rejects over-budget swaps before any write', async () => {
    replacement.budgetLkr = 1900;
    await expect(
      service.replaceMealItem('user', 'item-0', replacement),
    ).rejects.toThrow('constraints');
    expect(itemRepo.save).not.toHaveBeenCalled();
  });
  it('rejects missing macros without defaults', async () => {
    delete replacement.protein;
    await expect(
      service.replaceMealItem('user', 'item-0', replacement),
    ).rejects.toThrow('protein');
    expect(itemRepo.save).not.toHaveBeenCalled();
  });
  it('rejects spoofed verified IDs', async () => {
    replacement.mealId = 'unknown';
    await expect(
      service.replaceMealItem('user', 'item-0', replacement),
    ).rejects.toThrow('verified meal ID');
    expect(itemRepo.save).not.toHaveBeenCalled();
  });
  it('rejects a second replacement of an archived item', async () => {
    storedItems[0].status = 'replaced';
    await expect(
      service.replaceMealItem('user', 'item-0', replacement),
    ).rejects.toThrow('already been replaced');
  });
  it('includes servings in plan totals', async () => {
    storedItems.forEach((item) => (item.servings = 2));
    preferences.dailyCalorieTarget = 4200;
    preferences.dailyBudget = 4000;
    await service.replaceMealItem('user', 'item-0', replacement);
    expect(plan.totalCalories).toBe(4200);
    expect(plan.estimatedCostLkr).toBe(2400);
  });
  it('filters unsafe alternatives before returning them', async () => {
    ai.generateMealAlternatives.mockResolvedValue({
      alternatives: [
        { ...replacement, id: 'safe' },
        { ...replacement, id: 'costly', budgetLkr: 3000 },
      ],
      model: 'gemma',
      provider: 'test',
    });
    const result = await service.getAlternatives('user', 'item-0');
    expect(result.alternatives.map((a) => a.id)).toEqual(['safe']);
  });
  it('does not allow status updates to revive replaced meals', async () => {
    storedItems[0].status = 'replaced';
    await expect(service.toggleStatus('user', 'item-0')).rejects.toThrow(
      'cannot be changed',
    );
    await expect(
      service.updateStatus('user', 'item-0', 'scheduled'),
    ).rejects.toThrow('cannot be changed');
    expect(itemRepo.save).not.toHaveBeenCalled();
  });
  it('rejects arbitrary status values and negative consumed servings', async () => {
    await expect(
      service.updateStatus('user', 'item-0', 'replaced'),
    ).rejects.toThrow('Invalid meal status');
    await expect(
      service.updateStatus('user', 'item-0', 'completed', -1),
    ).rejects.toThrow('Consumed servings');
    expect(itemRepo.save).not.toHaveBeenCalled();
  });
});
