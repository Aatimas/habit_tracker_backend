import { Module } from '@nestjs/common';
import { HabitsModule } from '../habits/habits.module';
import { StatsController } from './stats.controller';

@Module({
  imports: [HabitsModule],
  controllers: [StatsController],
})
export class StatsModule {}
