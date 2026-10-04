import { Test, TestingModule } from '@nestjs/testing';
import { MealPlanController } from './meal-plan.controller';
import { MealPlanService } from './meal-plan.service';

describe('MealPlanController', () => {
  let controller: MealPlanController;

  const mockService = {
    generateForUser: jest.fn().mockResolvedValue({ planId: 'plan-1' }),
    findAllForUser: jest.fn().mockResolvedValue([]),
    findOneForUser: jest.fn().mockResolvedValue({ id: 'plan-1' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MealPlanController],
      providers: [
        {
          provide: MealPlanService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MealPlanController>(MealPlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
