/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { UserPreferencesService } from './user-preferences.service';
import { UserPreferencesController } from './user-preferences.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPreference } from './entities/user-preference.entity';
import { UserProfile } from '../profile/entities/profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserPreference, UserProfile])],
  controllers: [UserPreferencesController],
  providers: [UserPreferencesService],
})
export class UserPreferencesModule {}
