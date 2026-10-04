import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  GroceryListService,
  MealWithIngredients,
} from './grocery-list.service';
import { GroceryList } from './entities/grocery-list.entity';

describe('GroceryListService (TC-8: Grocery Generation & Categorization)', () => {
  let service: GroceryListService;

  const mockGroceryRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest
      .fn()
      .mockImplementation((entity) =>
        Promise.resolve({ id: 'mock-grocery-uuid', ...entity }),
      ),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroceryListService,
        {
          provide: getRepositoryToken(GroceryList),
          useValue: mockGroceryRepo,
        },
      ],
    }).compile();

    service = module.get<GroceryListService>(GroceryListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('aggregateIngredients', () => {
    it('should combine duplicate ingredients, sum quantities, and assign correct grocery categories', () => {
      const sampleMeals: MealWithIngredients[] = [
        {
          name: 'String Hoppers & Dhal',
          servings: 1,
          ingredients: [
            { name: 'Red rice string hoppers', quantity: 5, unit: 'pieces' },
            { name: 'Dhal', quantity: 100, unit: 'g' },
            { name: 'Coconut milk', quantity: 50, unit: 'ml' },
          ],
        },
        {
          name: 'Red Rice & Chicken Curry',
          servings: 2,
          ingredients: [
            { name: 'Red rice', quantity: 150, unit: 'g' },
            { name: 'Chicken', quantity: 200, unit: 'g' },
            { name: 'Coconut milk', quantity: 100, unit: 'ml' },
            { name: 'Dhal', quantity: 50, unit: 'g' },
          ],
        },
        {
          name: 'Gotukola Sambol',
          servings: 1,
          ingredients: [
            { name: 'Gotukola', quantity: 1, unit: 'bunch' },
            { name: 'Red onion', quantity: 30, unit: 'g' },
          ],
        },
      ];

      const groceryItems = service.aggregateIngredients(sampleMeals);

      // Verify Dhal is combined: 100g (meal 1) + 50g * 2 (meal 2) = 200g
      const dhalItem = groceryItems.find(
        (i) => i.ingredientName.toLowerCase() === 'dhal',
      );
      expect(dhalItem).toBeDefined();
      expect(dhalItem!.quantity).toBe(200);
      expect(dhalItem!.unit).toBe('g');
      expect(dhalItem!.category).toBe('Fresh Vegetables & Produce');

      // Verify Coconut Milk is combined: 50ml (meal 1) + 100ml * 2 (meal 2) = 250ml
      const coconutMilkItem = groceryItems.find(
        (i) => i.ingredientName.toLowerCase() === 'coconut milk',
      );
      expect(coconutMilkItem).toBeDefined();
      expect(coconutMilkItem!.quantity).toBe(250);
      expect(coconutMilkItem!.unit).toBe('ml');
      expect(coconutMilkItem!.category).toBe('Dairy & Alternatives');

      // Verify Chicken is categorized as Proteins & Seafood with 200g * 2 = 400g
      const chickenItem = groceryItems.find(
        (i) => i.ingredientName.toLowerCase() === 'chicken',
      );
      expect(chickenItem).toBeDefined();
      expect(chickenItem!.quantity).toBe(400);
      expect(chickenItem!.category).toBe('Proteins & Seafood');

      // Verify Red rice string hoppers categorized as Grains & Bakery
      const hoppersItem = groceryItems.find((i) =>
        i.ingredientName.toLowerCase().includes('string hopper'),
      );
      expect(hoppersItem).toBeDefined();
      expect(hoppersItem!.category).toBe('Grains & Bakery');
    });
  });

  describe('generateForPlan', () => {
    it('should persist generated grocery list linked to mealPlanId', async () => {
      const sampleMeals: MealWithIngredients[] = [
        {
          name: 'Red Rice & Dhal',
          servings: 1,
          ingredients: [
            { name: 'Red rice', quantity: 150, unit: 'g' },
            { name: 'Dhal', quantity: 100, unit: 'g' },
          ],
        },
      ];

      const result = await service.generateForPlan(
        'test-plan-123',
        sampleMeals,
      );
      expect(result.mealPlanId).toBe('test-plan-123');
      expect(result.items.length).toBe(2);
      expect(mockGroceryRepo.save).toHaveBeenCalled();
    });
  });
  it('uses serving-adjusted meal estimates instead of reporting free groceries', async () => {
    mockGroceryRepo.findOne.mockResolvedValue(null);
    const result = await service.generateForPlan('plan', [
      {
        name: 'Rice',
        servings: 2,
        ingredients: [{ name: 'Rice', quantity: 100, unit: 'g' }],
        estimatedCostLkr: 400,
      },
    ]);
    expect(result.estimatedTotalCostLkr).toBe(800);
  });
  it('reports unknown prices as unknown', async () => {
    mockGroceryRepo.findOne.mockResolvedValue(null);
    const result = await service.generateForPlan('plan', [
      {
        name: 'Rice',
        servings: 1,
        ingredients: [{ name: 'Rice', quantity: 100, unit: 'g' }],
      },
    ]);
    expect(result.estimatedTotalCostLkr).toBeNull();
  });
  it('updates the existing list and preserves unchanged purchase marks', async () => {
    mockGroceryRepo.findOne.mockResolvedValue({
      id: 'existing',
      items: [
        { ingredientName: 'Rice', quantity: 100, unit: 'g', purchased: true },
      ],
    });
    const result = await service.generateForPlan('plan', [
      {
        name: 'Rice',
        servings: 1,
        ingredients: [{ name: 'Rice', quantity: 100, unit: 'g' }],
        estimatedCostLkr: 200,
      },
    ]);
    expect(result.id).toBe('existing');
    expect((result.items[0] as any).purchased).toBe(true);
  });
});
