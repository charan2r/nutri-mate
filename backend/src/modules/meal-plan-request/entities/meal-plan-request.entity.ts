import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { MealPlan } from '../../meal-plan/entities/meal-plan.entity';

@Entity('meal_plan_requests')
export class MealPlanRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.mealPlanRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'smallint', default: 7 })
  durationDays: number;

  @Column({ type: 'int', nullable: true })
  targetCalories: number | null;

  /**
   * Example: { protein: 120, carbs: 220, fat: 65 }
   */
  @Column({ type: 'jsonb', nullable: true })
  targetMacros: object | null;

  /**
   * Snapshot of user profile/preferences/allergies at generation time.
   */
  @Column({ type: 'jsonb' })
  inputSnapshot: object;

  /**
   * SHA-256 hash of normalized request inputs. Used for caching/idempotency.
   */
  @Column({ length: 64, nullable: true })
  requestHash: string | null;

  /**
   * When true, unverified meals must be excluded from the plan.
   */
  @Column({ default: false })
  strictCalorieControl: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relations
  @OneToMany(() => MealPlan, (plan) => plan.request)
  mealPlans: MealPlan[];
}
