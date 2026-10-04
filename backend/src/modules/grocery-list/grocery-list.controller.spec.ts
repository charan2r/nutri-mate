import { Test, TestingModule } from '@nestjs/testing';
import { GroceryListController } from './grocery-list.controller';
import { GroceryListService } from './grocery-list.service';

describe('GroceryListController', () => {
  let controller: GroceryListController;

  const mockService = {
    findByPlanId: jest.fn().mockResolvedValue({ id: 'grocery-1', items: [] }),
    generateForPlan: jest.fn().mockResolvedValue({ id: 'grocery-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroceryListController],
      providers: [
        {
          provide: GroceryListService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<GroceryListController>(GroceryListController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
