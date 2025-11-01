import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { HabitRecord } from './habit-record.entity';

@Entity()
export class Habit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 'General' })
  category: string;

  @Column({ default: 'daily' })
  frequency: 'daily' | 'weekly';

  // @Column('simple-array', { nullable: true })
  // targetDays?: number[];

  @Column({ default: 0 })
  streak: number;

  @Column({ default: 0 })
  longestStreak: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.habits)
  user: User;

  @OneToMany(() => HabitRecord, (r) => r.habit)
  records: HabitRecord[];
}
