import { PartialType } from '@nestjs/mapped-types';
import { CreateMealItemDto } from './create-meal-item.dto';

export class UpdateMealItemDto extends PartialType(CreateMealItemDto) {}
