/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfile } from './entities/profile.entity';
import { UserPreference } from '../user-preferences/entities/user-preference.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserProfile, UserPreference])],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
