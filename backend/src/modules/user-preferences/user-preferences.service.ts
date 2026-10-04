/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { calculateDailyCalorieTarget } from '../../common/calorie-target';
import { UserProfile } from '../profile/entities/profile.entity';
import { CreateUserPreferenceDto } from './dto/create-user-preference.dto';
import { UserPreference } from './entities/user-preference.entity';

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectRepository(UserPreference)
    private readonly preferences: Repository<UserPreference>,
    @InjectRepository(UserProfile)
    private readonly profiles: Repository<UserProfile>,
  ) {}

  async findForUser(userId: string) {
    const preference = await this.preferences.findOneBy({ userId });
    if (!preference) throw new NotFoundException('Preferences not found');
    return preference;
  }

  async upsertForUser(userId: string, dto: CreateUserPreferenceDto) {
    const profile = await this.profiles.findOneBy({ userId });
    if (!profile)
      throw new NotFoundException(
        'Complete your profile before setting preferences',
      );
    const existing = await this.preferences.findOneBy({ userId });
    return this.preferences.save(
      this.preferences.create({
        ...existing,
        ...dto,
        userId,
        dailyCalorieTarget: calculateDailyCalorieTarget(profile),
        dailyBudget: dto.dailyBudget ?? null,
        maximumPrepMinutes: dto.maximumPrepMinutes ?? null,
        cookingSkill: dto.cookingSkill ?? null,
      }),
    );
  }
}
