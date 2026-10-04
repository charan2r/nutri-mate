/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from '../profile/entities/profile.entity';
import { UserPreference } from '../user-preferences/entities/user-preference.entity';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly profiles: Repository<UserProfile>,
    @InjectRepository(UserPreference)
    private readonly preferences: Repository<UserPreference>,
  ) {}
  async getStatus(userId: string) {
    const [profileCompleted, preferencesCompleted] = await Promise.all([
      this.profiles.existsBy({ userId }),
      this.preferences.existsBy({ userId }),
    ]);
    return {
      profileCompleted,
      preferencesCompleted,
      onboardingCompleted: profileCompleted && preferencesCompleted,
    };
  }
}
