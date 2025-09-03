import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { HabitsService } from '../habits/habits.service';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private habits: HabitsService) {}

  @Get()
  async get(@CurrentUser() user: any) {
    return this.habits.stats(user.id);
  }
}
