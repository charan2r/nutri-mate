/* eslint-disable prettier/prettier */
import { BadRequestException } from '@nestjs/common';
import { UserProfile } from '../modules/profile/entities/profile.entity';

const activityMultipliers: Record<string, number> = {
  sedentary: 1.2,
  moderately_active: 1.55,
  very_active: 1.725,
};

export function calculateDailyCalorieTarget(profile: UserProfile): number {
  const age = getAge(profile.dateOfBirth);
  const weightKg = Number(profile.weightKg);
  const heightCm = Number(profile.heightCm);
  const sexAdjustment =
    profile.biologicalSex === 'male'
      ? 5
      : profile.biologicalSex === 'female'
        ? -161
        : -78;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sexAdjustment;
  const goalAdjustment =
    profile.goal === 'lose_weight'
      ? -500
      : profile.goal === 'gain_weight'
        ? 300
        : 0;
  const target =
    bmr * activityMultipliers[profile.activityLevel] + goalAdjustment;

  return Math.round(Math.min(4000, Math.max(1200, target)) / 10) * 10;
}

function getAge(dateOfBirth: string): number {
  const birthDate = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) {
    throw new BadRequestException('dateOfBirth must be a date in the past');
  }
  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const birthdayHasPassed =
    today.getUTCMonth() > birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() >= birthDate.getUTCDate());
  if (!birthdayHasPassed) age -= 1;
  if (age < 13 || age > 120) {
    throw new BadRequestException('Profile age must be between 13 and 120');
  }
  return age;
}
