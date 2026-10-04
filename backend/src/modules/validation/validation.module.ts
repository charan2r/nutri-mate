/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MealPlanValidationService } from './meal-plan-validation.service';

@Module({
  providers: [MealPlanValidationService],
  exports: [MealPlanValidationService],
})
export class ValidationModule {}
