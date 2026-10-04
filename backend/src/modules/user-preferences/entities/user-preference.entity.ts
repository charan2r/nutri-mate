import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('user_preferences')
export class UserPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User, (user) => user.preference, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** Calculated by backend (BMR/TDEE), not by AI */
  @Column({ type: 'int' })
  dailyCalorieTarget: number;

  /**
   * non-veg | vegetarian | vegan | other
   */
  @Column({ length: 50, default: 'non-veg' })
  dietType: string;

  /**
   * low | medium | high
   */
  @Column({ length: 30, default: 'medium' })
  appetiteLevel: string;

  @Column({ type: 'smallint', default: 3 })
  mealsPerDay: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  dailyBudget: number | null;

  @Column({ type: 'text', array: true, default: '{}' })
  preferredCuisines: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  excludedIngredients: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  dislikedFoods: string[];

  @Column({ type: 'smallint', nullable: true })
  maximumPrepMinutes: number | null;

  /**
   * beginner | intermediate | advanced | null
   */
  @Column({ length: 30, nullable: true })
  cookingSkill: string | null;

  @Column({ type: 'smallint', default: 1 })
  servings: number;

  @Column({ length: 10, default: 'en' })
  preferredLanguage: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
