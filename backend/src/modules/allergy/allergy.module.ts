/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AllergyService } from './allergy.service';
import { AllergyController } from './allergy.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Allergy } from './entities/allergy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Allergy])],
  controllers: [AllergyController],
  providers: [AllergyService],
})
export class AllergyModule {}
