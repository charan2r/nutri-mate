import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { MealItem } from '../../meal-items/entities/meal-item.entity';

@Entity('feedback')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.feedbacks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  mealItemId: string | null;

  @ManyToOne(() => MealItem, (item) => item.feedbacks, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mealItemId' })
  mealItem: MealItem | null;

  @Column({ nullable: true })
  mealName: string | null;

  @Column({ nullable: true })
  mealType: string | null;

  /** Optional: user liked or disliked the meal */
  @Column({ nullable: true })
  liked: boolean | null;

  /** Optional: 1-5 rating */
  @Column({ type: 'smallint', nullable: true })
  rating: number | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  /**
   * too_spicy | too_expensive | hard_to_prepare | unavailable_ingredients
   * | portion_too_small | portion_too_large | disliked_taste
   */
  @Column({ type: 'text', array: true, default: '{}' })
  reasonTags: string[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
