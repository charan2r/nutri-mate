/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { calculateDailyCalorieTarget } from '../../common/calorie-target';
import { UserPreference } from '../user-preferences/entities/user-preference.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UserProfile } from './entities/profile.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly profiles: Repository<UserProfile>,
    @InjectRepository(UserPreference)
    private readonly preferences: Repository<UserPreference>,
  ) {}

  async findForUser(userId: string) {
    const profile = await this.profiles.findOneBy({ userId });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async upsertForUser(userId: string, dto: CreateProfileDto) {
    const existing = await this.profiles.findOneBy({ userId });
    const profile = await this.profiles.save(
      this.profiles.create({
        ...existing,
        ...dto,
        userId,
        targetWeightKg: dto.targetWeightKg ?? null,
      }),
    );
    const preference = await this.preferences.findOneBy({ userId });
    if (preference) {
      await this.preferences.update(preference.id, {
        dailyCalorieTarget: calculateDailyCalorieTarget(profile),
      });
    }
    return profile;
  }
}
