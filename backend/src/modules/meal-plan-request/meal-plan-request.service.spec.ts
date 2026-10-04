import { Test, TestingModule } from '@nestjs/testing';
import { MealPlanRequestService } from './meal-plan-request.service';

describe('MealPlanRequestService', () => {
  let service: MealPlanRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MealPlanRequestService],
    }).compile();

    service = module.get<MealPlanRequestService>(MealPlanRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
