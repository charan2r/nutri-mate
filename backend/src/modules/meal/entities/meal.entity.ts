import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MealItem } from '../../meal-items/entities/meal-item.entity';

@Entity('meals')
export class Meal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  /**
   * breakfast | lunch | dinner | snack
   */
  @Column({ length: 30 })
  mealType: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'text', default: '' })
  recipe: string;

  /**
   * Structured ingredient list.
   * Example: [{ "name": "red rice", "quantity": 150, "unit": "g" }]
   */
  @Column({ type: 'jsonb', default: '[]' })
  ingredients: object[];

  @Column({ type: 'text', array: true, default: '{}' })
  allergens: string[];

  /**
   * vegetarian | vegan | halal | dairy_free | etc.
   */
  @Column({ type: 'text', array: true, default: '{}' })
  dietTags: string[];

  @Column({ length: 100, nullable: true })
  cuisineType: string | null;

  //  Nutrition (per declared serving) 
  @Column({ type: 'numeric', precision: 10, scale: 2 })
  calories: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  protein: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  carbs: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  fat: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  servingSize: number | null;

  @Column({ length: 50, nullable: true })
  servingUnit: string | null;

  @Column({ type: 'smallint', nullable: true })
  prepTimeMinutes: number | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  estimatedCostLkr: number | null;

  // Source & Verification 
  /**
   * curated | ai_generated | imported
   */
  @Column({ length: 30, default: 'curated' })
  sourceType: string;

  /**
   * unverified | partially_verified | verified | rejected
   */
  @Column({ length: 30, default: 'unverified' })
  nutritionVerificationStatus: string;

  @Column({ length: 255, nullable: true })
  nutritionSource: string | null;

  @Column({ type: 'text', nullable: true })
  nutritionSourceReference: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => MealItem, (item) => item.meal)
  planItems: MealItem[];
}
