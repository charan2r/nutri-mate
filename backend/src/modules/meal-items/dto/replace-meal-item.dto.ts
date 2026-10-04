import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class ReplacementIngredientDto {
  @IsString() @MinLength(1) name: string;
  @IsNumber() @Min(0.001) quantity: number;
  @IsString() @MinLength(1) unit: string;
}

export class ReplaceMealItemDto {
  @IsString() @MinLength(1) name: string;
  @IsNumber() @Min(1) calories: number;
  @IsNumber() @Min(0) protein: number;
  @IsNumber() @Min(0) carbs: number;
  @IsNumber() @Min(0) fat: number;
  @IsNumber() @Min(0) budgetLkr: number;
  @IsArray() @IsString({ each: true }) tags: string[];
  @IsArray() @IsString({ each: true }) allergens: string[];
  @IsInt() @Min(1) @Max(1440) prepTimeMinutes: number;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReplacementIngredientDto)
  ingredients: ReplacementIngredientDto[];
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  instructions: string[];
  @IsOptional() @IsUUID() mealId?: string;
  @IsOptional() @IsString() reason?: string;
}
