import { PartialType } from '@nestjs/mapped-types';
import { CreateMealPlanRequestDto } from './create-meal-plan-request.dto';

export class UpdateMealPlanRequestDto extends PartialType(CreateMealPlanRequestDto) {}
