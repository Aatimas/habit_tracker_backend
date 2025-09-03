import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Habit } from './habit.entity';
import { HabitRecord } from './habit-record.entity';
import { HabitsService } from './habits.service';
import { HabitsController } from './habits.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Habit, HabitRecord])],
  providers: [HabitsService],
  controllers: [HabitsController],
  exports: [HabitsService]
})
export class HabitsModule {}
