import { Injectable } from '@nestjs/common';
import { CreateMealPlanRequestDto } from './dto/create-meal-plan-request.dto';
import { UpdateMealPlanRequestDto } from './dto/update-meal-plan-request.dto';

@Injectable()
export class MealPlanRequestService {
  create(createMealPlanRequestDto: CreateMealPlanRequestDto) {
    return 'This action adds a new mealPlanRequest';
  }

  findAll() {
    return `This action returns all mealPlanRequest`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mealPlanRequest`;
  }

  update(id: number, updateMealPlanRequestDto: UpdateMealPlanRequestDto) {
    return `This action updates a #${id} mealPlanRequest`;
  }

  remove(id: number) {
    return `This action removes a #${id} mealPlanRequest`;
  }
}
