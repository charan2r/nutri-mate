import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GroceryListService } from './grocery-list.service';
import { CreateGroceryListDto } from './dto/create-grocery-list.dto';
import { UpdateGroceryListDto } from './dto/update-grocery-list.dto';

@Controller('grocery-list')
export class GroceryListController {
  constructor(private readonly groceryListService: GroceryListService) {}

  @Get('plan/:mealPlanId')
  getByPlanId(@Param('mealPlanId') mealPlanId: string) {
    return this.groceryListService.findByPlanId(mealPlanId);
  }
}
