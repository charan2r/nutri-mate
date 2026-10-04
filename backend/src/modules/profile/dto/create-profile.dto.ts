/* eslint-disable prettier/prettier */
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class CreateProfileDto {
  @IsDateString() dateOfBirth: string;
  @IsEnum(['male', 'female', 'prefer_not_to_say']) biologicalSex: string;
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(50)
  @Max(300)
  heightCm: number;
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20)
  @Max(500)
  weightKg: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20)
  @Max(500)
  targetWeightKg?: number;
  @IsEnum(['lose_weight', 'maintain', 'gain_weight']) goal: string;
  @IsEnum(['sedentary', 'moderately_active', 'very_active'])
  activityLevel: string;
}
