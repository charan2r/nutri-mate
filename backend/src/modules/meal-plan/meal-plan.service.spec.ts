import { MealPlanService } from './meal-plan.service';
import { MealPlanValidationService } from '../validation/meal-plan-validation.service';
import { MealPlan } from './entities/meal-plan.entity';
import { testContext, testPlan, testMeal } from '../ai/meal-test.fixture';

describe('Plan generation and authoritative validation', () => {
  let service: MealPlanService;
  let ai: any,
    catalogue: any,
    dataSource: any,
    plans: any,
    items: any,
    grocery: any;
  beforeEach(() => {
    plans = {
      create: jest.fn((v) => v),
      save: jest.fn(async (v) => ({ id: 'plan', ...v })),
    };
    items = { create: jest.fn((v) => v), save: jest.fn(async (v) => v) };
    catalogue = { find: jest.fn(async () => []) };
    ai = {
      generateMealPlan: jest.fn(async () => ({
        plan: testPlan(),
        model: 'gemma-4-26b-a4b-it',
        provider: 'google-ai-studio',
        attempts: 1,
      })),
    };
    dataSource = {
      transaction: jest.fn(async (callback) =>
        callback({
          getRepository: (entity) => (entity === MealPlan ? plans : items),
        }),
      ),
    };
    grocery = { generateForPlan: jest.fn(async () => ({ id: 'grocery' })) };
    const profile = {
      findOneBy: jest.fn(async () => ({
        ...testContext,
        dateOfBirth: '2000-01-01',
      })),
    };
    const preferences = { findOneBy: jest.fn(async () => testContext) };
    const allergies = { find: jest.fn(async () => []) };
    const requests = {
      create: (v) => v,
      save: jest.fn(async (v) => ({ id: 'request', ...v })),
    };
    const feedback = { find: jest.fn(async () => []) };
    service = new MealPlanService(
      profile as any,
      preferences as any,
      allergies as any,
      requests as any,
      plans as any,
      catalogue as any,
      feedback as any,
      dataSource as any,
      ai as any,
      new MealPlanValidationService(),
      grocery as any,
    );
  });
  it('persists a valid plan, its meals, groceries, and provenance', async () => {
    const result = await service.generateForUser('user', {
      startDate: testContext.startDate,
      durationDays: 1,
    });
    expect(result.items).toHaveLength(3);
    expect(result.validation.safetyValidated).toBe(true);
    expect(result.plan.provider).toBe('google-ai-studio');
    expect(result.plan.totalCalories).toBe(2100);
  });
  it('does not persist plans that repeatedly violate daily constraints', async () => {
    ai.generateMealPlan.mockImplementation(async () => {
      const plan = testPlan();
      plan.days[0].meals[0].estimatedCostLkr = 3000;
      return { plan, attempts: 1 };
    });
    await expect(
      service.generateForUser('user', {
        startDate: testContext.startDate,
        durationDays: 1,
      }),
    ).rejects.toThrow('No plan met');
    expect(ai.generateMealPlan).toHaveBeenCalledTimes(2);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
  it('validates canonical database values before persisting', async () => {
    catalogue.find.mockResolvedValue([
      {
        ...testMeal({ mealType: 'breakfast', estimatedCostLkr: 3000 }),
        id: 'trusted',
        nutritionSource: 'test',
        nutritionSourceReference: 'fixture',
        recipe: 'Cook rice.',
        nutritionVerificationStatus: 'verified',
        isActive: true,
      },
    ]);
    ai.generateMealPlan.mockImplementation(async () => {
      const plan = testPlan();
      plan.days[0].meals[0].mealId = 'trusted';
      return { plan, attempts: 1 };
    });
    await expect(
      service.generateForUser('user', {
        startDate: testContext.startDate,
        durationDays: 1,
      }),
    ).rejects.toThrow('No plan met');
    expect(plans.save).not.toHaveBeenCalled();
  });
  it('rejects a fabricated verified ID', async () => {
    ai.generateMealPlan.mockImplementation(async () => {
      const plan = testPlan();
      plan.days[0].meals[0].mealId = 'invented';
      return { plan, attempts: 1 };
    });
    await expect(
      service.generateForUser('user', {
        startDate: testContext.startDate,
        durationDays: 1,
      }),
    ).rejects.toThrow('unsupported');
    expect(plans.save).not.toHaveBeenCalled();
  });
});
