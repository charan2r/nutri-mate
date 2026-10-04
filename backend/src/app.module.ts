import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { MealModule } from './modules/meal/meal.module';
import { UserModule } from './modules/user/user.module';
import { AllergyModule } from './modules/allergy/allergy.module';
import { AiModule } from './modules/ai/ai.module';
import { ProfileModule } from './modules/profile/profile.module';
import { MealPlanModule } from './modules/meal-plan/meal-plan.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { UserPreferencesModule } from './modules/user-preferences/user-preferences.module';
import { MealItemsModule } from './modules/meal-items/meal-items.module';
import { MealPlanRequestModule } from './modules/meal-plan-request/meal-plan-request.module';
import { GroceryListModule } from './modules/grocery-list/grocery-list.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { ValidationModule } from './modules/validation/validation.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        ssl: { rejectUnauthorized: false },
      }),
    }),
    AuthModule,
    MealModule,
    UserModule,
    AllergyModule,
    AiModule,
    ProfileModule,
    MealPlanModule,
    FeedbackModule,
    UserPreferencesModule,
    MealItemsModule,
    MealPlanRequestModule,
    GroceryListModule,
    OnboardingModule,
    ValidationModule,
  ],
})
export class AppModule {}
