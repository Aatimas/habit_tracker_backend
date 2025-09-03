import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit } from './habit.entity';
import { HabitRecord } from './habit-record.entity';
import { User } from '../users/user.entity';

@Injectable()
export class HabitsService {
  constructor(
    @InjectRepository(Habit) private habitRepo: Repository<Habit>,
    @InjectRepository(HabitRecord) private recordRepo: Repository<HabitRecord>,
  ) {}

  async findAllForUser(userId: string) {
    return this.habitRepo.find({ where: { user: { id: userId } }, relations: ['records'] });
  }

  async createForUser(user: User, dto: Partial<Habit>) {
    const habit = this.habitRepo.create({ ...dto, user });
    if (!habit.completedDates) habit.completedDates = [];
    return this.habitRepo.save(habit);
  }

  async update(userId: string, id: string, updates: Partial<Habit>) {
    const habit = await this.habitRepo.findOne({ where: { id, user: { id: userId } } });
    if (!habit) throw new NotFoundException('Habit not found');
    Object.assign(habit, updates);
    return this.habitRepo.save(habit);
  }

  async delete(userId: string, id: string) {
    const res = await this.habitRepo.delete({ id, user: { id: userId } } as any);
    if (res.affected === 0) throw new NotFoundException('Habit not found');
    return { deleted: true };
  }

  async checkin(userId: string, habitId: string, dateISO?: string) {
    const habit = await this.habitRepo.findOne({ where: { id: habitId, user: { id: userId } }, relations: ['records'] });
    if (!habit) throw new NotFoundException('Habit not found');
    const date = dateISO ? dateISO : new Date().toISOString().split('T')[0];

    if (habit.completedDates?.includes(date)) {
      return habit;
    }
    habit.completedDates = [...(habit.completedDates || []), date];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (habit.completedDates.includes(yesterday)) {
      habit.streak = (habit.streak || 0) + 1;
    } else {
      habit.streak = 1;
    }
    if ((habit.longestStreak || 0) < habit.streak) habit.longestStreak = habit.streak;
    await this.habitRepo.save(habit);

    const rec = this.recordRepo.create({ date, habit });
    await this.recordRepo.save(rec);
    return habit;
  }

  async getRecords(userId: string, habitId: string, from?: string, to?: string) {
    const qb = this.recordRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.habit', 'habit')
      .where('habit.id = :habitId', { habitId })
      .andWhere('habit.userId = :userId', { userId });
    if (from) qb.andWhere('r.date >= :from', { from });
    if (to) qb.andWhere('r.date <= :to', { to });
    return qb.orderBy('r.date', 'ASC').getMany();
  }

  async stats(userId: string) {
    const habits = await this.findAllForUser(userId);
    const total = habits.length;
    const today = new Date().toISOString().split('T')[0];
    const completedToday = habits.filter((h) => h.completedDates?.includes(today)).length;
    const last7 = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];
    let completions = 0;
    habits.forEach((h) => {
      completions += (h.completedDates || []).filter((d) => d >= last7).length;
    });
    const weeklyRate = total === 0 ? 0 : completions / (total * 7);
    return { totalHabits: total, completedToday, weeklyCompletionRate: weeklyRate };
  }
}
