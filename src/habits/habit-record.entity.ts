import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Habit } from './habit.entity';

@Entity()
export class HabitRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  date: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Habit, (h) => h.records, { onDelete: 'CASCADE' })
  habit: Habit;
}
