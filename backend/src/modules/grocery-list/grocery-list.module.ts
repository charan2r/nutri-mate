import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroceryListService } from './grocery-list.service';
import { GroceryListController } from './grocery-list.controller';
import { GroceryList } from './entities/grocery-list.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GroceryList])],
  controllers: [GroceryListController],
  providers: [GroceryListService],
  exports: [GroceryListService, TypeOrmModule],
})
export class GroceryListModule {}
