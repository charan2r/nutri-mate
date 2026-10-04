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

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'date' })
  dateOfBirth: string;

  /**
   * male | female | other
   */
  @Column({ length: 20 })
  biologicalSex: string;

  @Column({ type: 'numeric', precision: 6, scale: 2 })
  heightCm: number;

  @Column({ type: 'numeric', precision: 6, scale: 2 })
  weightKg: number;

  @Column({ type: 'numeric', precision: 6, scale: 2, nullable: true })
  targetWeightKg: number | null;

  /**
   * lose_weight | maintain | gain_weight
   */
  @Column({ length: 50 })
  goal: string;

  /**
   * sedentary | moderately_active | very_active
   */
  @Column({ length: 50 })
  activityLevel: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
