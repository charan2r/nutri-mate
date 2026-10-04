import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MealPlan } from '../../meal-plan/entities/meal-plan.entity';

@Entity('grocery_lists')
export class GroceryList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  mealPlanId: string;

  @OneToOne(() => MealPlan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mealPlanId' })
  mealPlan: MealPlan;

  /**
   * Array of grocery items.
   * Example:
   * [
   *   {
   *     "ingredientName": "Red rice",
   *     "quantity": 1,
   *     "unit": "kg",
   *     "category": "Grains",
   *     "estimatedCostLkr": 450,
   *     "purchased": false
   *   }
   * ]
   */
  @Column({ type: 'jsonb', default: '[]' })
  items: object[];

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  estimatedTotalCostLkr: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
