import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserProfile } from '../../profile/entities/profile.entity';
import { UserPreference } from '../../user-preferences/entities/user-preference.entity';
import { Allergy } from '../../allergy/entities/allergy.entity';
import { MealPlan } from '../../meal-plan/entities/meal-plan.entity';
import { MealPlanRequest } from '../../meal-plan-request/entities/meal-plan-request.entity';
import { Feedback } from '../../feedback/entities/feedback.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255, nullable: true })
  name: string | null;

  @Column()
  passwordHash: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile: UserProfile;

  @OneToOne(() => UserPreference, (pref) => pref.user)
  preference: UserPreference;

  @OneToMany(() => Allergy, (allergy) => allergy.user)
  allergies: Allergy[];

  @OneToMany(() => MealPlan, (plan) => plan.user)
  mealPlans: MealPlan[];

  @OneToMany(() => MealPlanRequest, (req) => req.user)
  mealPlanRequests: MealPlanRequest[];

  @OneToMany(() => Feedback, (fb) => fb.user)
  feedbacks: Feedback[];
}
