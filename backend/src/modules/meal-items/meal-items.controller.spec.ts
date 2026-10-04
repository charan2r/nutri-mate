import { Test, TestingModule } from '@nestjs/testing';
import { MealItemsController } from './meal-items.controller';
import { MealItemsService } from './meal-items.service';

describe('MealItemsController', () => {
  let controller: MealItemsController;

  const mockService = {
    findOne: jest.fn().mockResolvedValue({ id: 'item-1' }),
    toggleStatus: jest
      .fn()
      .mockResolvedValue({ id: 'item-1', status: 'completed' }),
    updateStatus: jest.fn().mockResolvedValue({ id: 'item-1' }),
    getAlternatives: jest.fn().mockResolvedValue({ alternatives: [] }),
    replaceMealItem: jest.fn().mockResolvedValue({ id: 'item-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MealItemsController],
      providers: [
        {
          provide: MealItemsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MealItemsController>(MealItemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
