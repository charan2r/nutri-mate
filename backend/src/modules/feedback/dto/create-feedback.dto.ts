import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateFeedbackDto {
  @IsOptional()
  @IsString()
  mealItemId?: string;

  @IsOptional()
  @IsString()
  mealName?: string;

  @IsOptional()
  @IsString()
  mealType?: string;

  @IsOptional()
  @IsBoolean()
  liked?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reasons?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reasonTags?: string[];

  @IsOptional()
  @IsString()
  comment?: string;
}
