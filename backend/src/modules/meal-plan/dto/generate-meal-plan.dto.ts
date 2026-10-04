import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class GenerateMealPlanDto {
  @IsDateString() startDate: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  durationDays?: number;
  @IsOptional() @IsBoolean() strictCalorieControl?: boolean;
}
