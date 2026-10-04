import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { MealPlanRequest } from '../../meal-plan-request/entities/meal-plan-request.entity';
import { MealItem } from '../../meal-items/entities/meal-item.entity';
import { GroceryList } from '../../grocery-list/entities/grocery-list.entity';

@Entity('meal_plans')
export class MealPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.mealPlans, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  requestId: string;

  @ManyToOne(() => MealPlanRequest, (req) => req.mealPlans, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'requestId' })
  request: MealPlanRequest;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  /**
   * pending | generating | validating | validated | failed
   */
  @Column({ length: 30, default: 'pending' })
  status: string;

  /**
   * ai | database_fallback | hybrid
   */
  @Column({ length: 30, default: 'ai' })
  generationMethod: string;

  // AI Traceability 
  @Column({ length: 50, nullable: true })
  provider: string | null;

  @Column({ length: 100, nullable: true })
  modelUsed: string | null;

  @Column({ length: 50, nullable: true })
  promptVersion: string | null;

  // Validation 
  /**
   * Example: { allergySafe: true, calorieTargetMet: true, budgetMet: true, nutritionVerified: true }
   */
  @Column({ type: 'jsonb', nullable: true })
  validationSummary: object | null;

  // Quality Score
  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  qualityScore: number | null;

  /**
   * Example: { nutrition: 90, constraints: 100, preferences: 85, budget: 90, diversity: 80 }
   */
  @Column({ type: 'jsonb', nullable: true })
  scoreBreakdown: object | null;

  @Column({ length: 30, nullable: true })
  scoreVersion: string | null;

  // Plan Totals 
  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  totalCalories: number | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  totalProtein: number | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  totalCarbs: number | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  totalFat: number | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  estimatedCostLkr: number | null;

  // AI Telemetry 
  /**
   * Example: { retryCount: 0, inputTokens: 2000, outputTokens: 3500, generationLatencyMs: 4200 }
   */
  @Column({ type: 'jsonb', nullable: true })
  generationMeta: object | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations 
  @OneToMany(() => MealItem, (item) => item.mealPlan)
  items: MealItem[];

  @OneToOne(() => GroceryList, (gl) => gl.mealPlan, { nullable: true })
  groceryList: GroceryList | null;
}
