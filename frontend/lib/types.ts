export interface User {
  id: string;
  email: string;
  name?: string | null;
  isGuest?: boolean;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  name?: string;
  email: string;
  password?: string;
}

export interface OnboardingStatusResponse {
  isOnboarded: boolean;
  hasProfile: boolean;
  hasPreferences: boolean;
}

export interface UserProfileDto {
  dateOfBirth: string;
  biologicalSex: 'male' | 'female' | 'prefer_not_to_say';
  heightCm: number;
  weightKg: number;
  targetWeightKg?: number;
  goal: 'lose_weight' | 'maintain' | 'gain_weight';
  activityLevel: 'sedentary' | 'moderately_active' | 'very_active';
}

export interface UserPreferenceDto {
  dietType: 'non-veg' | 'vegetarian' | 'vegan' | 'other';
  appetiteLevel: 'low' | 'medium' | 'high';
  mealsPerDay: number;
  dailyBudget?: number;
  preferredCuisines: string[];
  excludedIngredients: string[];
  dislikedFoods: string[];
  maximumPrepMinutes?: number;
  cookingSkill?: 'beginner' | 'intermediate' | 'advanced';
  servings: number;
  preferredLanguage: string;
}

export interface AllergyItem {
  id?: string;
  allergen: string;
}
