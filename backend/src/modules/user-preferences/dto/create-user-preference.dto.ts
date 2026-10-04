/* eslint-disable prettier/prettier */
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateUserPreferenceDto {
  @IsEnum(['non-veg', 'vegetarian', 'vegan', 'other']) dietType: string;
  @IsEnum(['low', 'medium', 'high']) appetiteLevel: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(6) mealsPerDay: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dailyBudget?: number;
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  preferredCuisines: string[];
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  excludedIngredients: string[];
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  dislikedFoods: string[];
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  maximumPrepMinutes?: number;
  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  cookingSkill?: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(20) servings: number;
  @IsString() @MaxLength(10) preferredLanguage: string;
}
