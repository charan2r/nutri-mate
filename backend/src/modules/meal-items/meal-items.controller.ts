import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MealItemsService } from './meal-items.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser, JwtUser } from '../user/user.decorator';
import { ReplaceMealItemDto } from './dto/replace-meal-item.dto';

@Controller('meal-items')
@UseGuards(AuthGuard)
export class MealItemsController {
  constructor(private readonly mealItemsService: MealItemsService) {}

  @Patch(':id/toggle')
  toggleStatus(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.mealItemsService.toggleStatus(user.id, id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('consumedServings') consumedServings?: number,
  ) {
    return this.mealItemsService.updateStatus(
      user.id,
      id,
      status,
      consumedServings,
    );
  }

  @Get(':id/alternatives')
  getAlternatives(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.mealItemsService.getAlternatives(user.id, id);
  }

  @Post(':id/replace')
  replaceMealItem(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() replaceDto: ReplaceMealItemDto,
  ) {
    return this.mealItemsService.replaceMealItem(user.id, id, replaceDto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.mealItemsService.findOne(user.id, id);
  }
}
