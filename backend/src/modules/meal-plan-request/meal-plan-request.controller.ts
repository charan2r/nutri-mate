import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MealPlanRequestService } from './meal-plan-request.service';
import { CreateMealPlanRequestDto } from './dto/create-meal-plan-request.dto';
import { UpdateMealPlanRequestDto } from './dto/update-meal-plan-request.dto';

@Controller('meal-plan-request')
export class MealPlanRequestController {
  constructor(private readonly mealPlanRequestService: MealPlanRequestService) {}

  @Post()
  create(@Body() createMealPlanRequestDto: CreateMealPlanRequestDto) {
    return this.mealPlanRequestService.create(createMealPlanRequestDto);
  }

  @Get()
  findAll() {
    return this.mealPlanRequestService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mealPlanRequestService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMealPlanRequestDto: UpdateMealPlanRequestDto) {
    return this.mealPlanRequestService.update(+id, updateMealPlanRequestDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mealPlanRequestService.remove(+id);
  }
}
