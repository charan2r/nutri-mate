import { Module } from '@nestjs/common';
import { MealPlanRequestService } from './meal-plan-request.service';
import { MealPlanRequestController } from './meal-plan-request.controller';

@Module({
  controllers: [MealPlanRequestController],
  providers: [MealPlanRequestService],
})
export class MealPlanRequestModule {}
