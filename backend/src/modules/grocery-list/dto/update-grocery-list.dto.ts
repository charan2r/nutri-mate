import { PartialType } from '@nestjs/mapped-types';
import { CreateGroceryListDto } from './create-grocery-list.dto';

export class UpdateGroceryListDto extends PartialType(CreateGroceryListDto) {}
