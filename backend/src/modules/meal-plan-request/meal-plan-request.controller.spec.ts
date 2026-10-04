import { Test, TestingModule } from '@nestjs/testing';
import { MealPlanRequestController } from './meal-plan-request.controller';
import { MealPlanRequestService } from './meal-plan-request.service';

describe('MealPlanRequestController', () => {
  let controller: MealPlanRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MealPlanRequestController],
      providers: [MealPlanRequestService],
    }).compile();

    controller = module.get<MealPlanRequestController>(MealPlanRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
