import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealItemsService } from './meal-items.service';
import { MealItemsController } from './meal-items.controller';
import { MealItem } from './entities/meal-item.entity';
import { MealPlan } from '../meal-plan/entities/meal-plan.entity';
import { Meal } from '../meal/entities/meal.entity';
import { UserProfile } from '../profile/entities/profile.entity';
import { UserPreference } from '../user-preferences/entities/user-preference.entity';
import { Allergy } from '../allergy/entities/allergy.entity';
import { Feedback } from '../feedback/entities/feedback.entity';
import { ValidationModule } from '../validation/validation.module';
import { GroceryListModule } from '../grocery-list/grocery-list.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MealItem,
      MealPlan,
      Meal,
      UserProfile,
      UserPreference,
      Allergy,
      Feedback,
    ]),
    AiModule,
    ValidationModule,
    GroceryListModule,
  ],
  controllers: [MealItemsController],
  providers: [MealItemsService],
  exports: [MealItemsService],
})
export class MealItemsModule {}
