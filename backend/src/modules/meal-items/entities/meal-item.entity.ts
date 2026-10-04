import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MealPlan } from '../../meal-plan/entities/meal-plan.entity';
import { Meal } from '../../meal/entities/meal.entity';
import { Feedback } from '../../feedback/entities/feedback.entity';

@Entity('meal_items')
export class MealItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  mealPlanId: string;

  @ManyToOne(() => MealPlan, (plan) => plan.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mealPlanId' })
  mealPlan: MealPlan;

  /** Day number within plan: 1, 2, 3... */
  @Column({ type: 'smallint' })
  day: number;

  /**
   * breakfast | lunch | dinner | snack
   */
  @Column({ length: 30 })
  mealType: string;

  /** FK to reusable meal from trusted DB. Nullable when AI generates a novel meal. */
  @Column({ nullable: true })
  mealId: string | null;

  @ManyToOne(() => Meal, (meal) => meal.planItems, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'mealId' })
  meal: Meal | null;

  /**
   * Self-referential FK: points to the meal item this one replaced.
   * The original item should have status = 'replaced'.
   */
  @Column({ nullable: true })
  replacesMealItemId: string | null;

  @ManyToOne(() => MealItem, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'replacesMealItemId' })
  replacesMealItem: MealItem | null;

  /**
   * Used when AI generated a novel meal. Stores the original proposed meal snapshot.
   */
  @Column({ type: 'jsonb', nullable: true })
  generatedMealSnapshot: object | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 1 })
  servings: number;

  // Nutrition Snapshots (per-serving at time of plan generation)
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  caloriesSnapshot: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  proteinSnapshot: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  carbsSnapshot: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  fatSnapshot: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  estimatedCostSnapshot: number | null;

  // Verification
  /**
   * unverified | partially_verified | verified | rejected
   */
  @Column({ length: 30, default: 'unverified' })
  nutritionVerificationStatus: string;

  @Column({ length: 255, nullable: true })
  nutritionSource: string | null;

  /**
   * Example: { allergySafe: true, withinBudget: true, matchesCuisine: true, reason: "..." }
   */
  @Column({ type: 'jsonb', nullable: true })
  selectionExplanation: object | null;

  // Status & Tracking
  /**
   * scheduled | completed | skipped | replaced
   */
  @Column({ length: 30, default: 'scheduled' })
  status: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  consumedServings: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Feedback, (fb) => fb.mealItem)
  feedbacks: Feedback[];
}
