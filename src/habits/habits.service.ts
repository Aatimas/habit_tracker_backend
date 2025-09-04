import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Habit } from "./habit.entity";
import { HabitRecord } from "./habit-record.entity";
import { User } from "../users/user.entity";

@Injectable()
export class HabitsService {
	constructor(
		@InjectRepository(Habit) private habitRepo: Repository<Habit>,
		@InjectRepository(HabitRecord) private recordRepo: Repository<HabitRecord>
	) {}

	/** Compute streaks and completion info from HabitRecords */
	private async addComputedFields(habit: Habit) {
		const today = new Date().toISOString().split("T")[0];

		// fetch all records for this habit
		const records = await this.recordRepo.find({
			where: { habit: { id: habit.id } },
			order: { date: "ASC" },
		});
		const dates = records.map((r) => r.date);

		// check if completed today
		const completedToday = dates.includes(today);

		// streak calculation (count backwards until a missed day)
		let streak = 0;
		let current = new Date(today);
		while (dates.includes(current.toISOString().split("T")[0])) {
			streak++;
			current.setDate(current.getDate() - 1);
		}

		// longest streak calculation
		let longestStreak = 0;
		let temp = 0;
		for (let i = 0; i < dates.length; i++) {
			const d = new Date(dates[i]);
			if (i > 0) {
				const prev = new Date(dates[i - 1]);
				const diff = (d.getTime() - prev.getTime()) / 86400000;
				if (diff === 1) {
					temp++;
				} else {
					temp = 1;
				}
			} else {
				temp = 1;
			}
			if (temp > longestStreak) longestStreak = temp;
		}

		return {
			...habit,
			completedToday,
			streak,
			longestStreak,
			completedDates: dates, // virtual field for frontend
		};
	}

	async findAllForUser(userId: string) {
		const habits = await this.habitRepo.find({
			where: { user: { id: userId } },
		});
		return Promise.all(habits.map((h) => this.addComputedFields(h)));
	}

	async createForUser(user: User, dto: Partial<Habit>) {
		const habit = this.habitRepo.create({ ...dto, user });
		const saved = await this.habitRepo.save(habit);
		return this.addComputedFields(saved);
	}

	async update(userId: string, id: string, updates: Partial<Habit>) {
		const habit = await this.habitRepo.findOne({
			where: { id, user: { id: userId } },
		});
		if (!habit) throw new NotFoundException("Habit not found");

		// only allow editable fields
		const allowed = [
			"name",
			"description",
			"category",
			"frequency",
			"targetDays",
		];
		for (const key of allowed) {
			if (updates[key] !== undefined) {
				(habit as any)[key] = updates[key];
			}
		}

		const saved = await this.habitRepo.save(habit);
		return this.addComputedFields(saved);
	}

	async delete(userId: string, id: string) {
		const res = await this.habitRepo.delete({
			id,
			user: { id: userId },
		} as any);
		if (res.affected === 0) throw new NotFoundException("Habit not found");
		return { deleted: true };
	}

	async checkin(userId: string, habitId: string, dateISO?: string) {
		const habit = await this.habitRepo.findOne({
			where: { id: habitId, user: { id: userId } },
		});
		if (!habit) throw new NotFoundException("Habit not found");

		const date = dateISO ?? new Date().toISOString().split("T")[0];

		// check if already checked in
		const existing = await this.recordRepo.findOne({
			where: { habit: { id: habitId }, date },
		});

		if (existing) {
			// UNCHECK → delete record
			await this.recordRepo.delete({ id: existing.id });
		} else {
			// CHECK-IN → add new record
			const rec = this.recordRepo.create({ date, habit });
			await this.recordRepo.save(rec);
		}

		return this.addComputedFields(habit);
	}

	async getRecords(
		userId: string,
		habitId: string,
		from?: string,
		to?: string
	) {
		const qb = this.recordRepo
			.createQueryBuilder("r")
			.leftJoinAndSelect("r.habit", "habit")
			.where("habit.id = :habitId", { habitId })
			.andWhere("habit.userId = :userId", { userId });
		if (from) qb.andWhere("r.date >= :from", { from });
		if (to) qb.andWhere("r.date <= :to", { to });
		return qb.orderBy("r.date", "ASC").getMany();
	}

	async stats(userId: string) {
		const habits = await this.findAllForUser(userId);
		const total = habits.length;
		const today = new Date().toISOString().split("T")[0];
		const completedToday = habits.filter((h) =>
			h.completedDates.includes(today)
		).length;

		// calculate completions in last 7 days
		const last7 = new Date(Date.now() - 6 * 86400000)
			.toISOString()
			.split("T")[0];
		let completions = 0;
		habits.forEach((h) => {
			completions += h.completedDates.filter((d) => d >= last7).length;
		});

		const weeklyRate = total === 0 ? 0 : completions / (total * 7);
		return {
			totalHabits: total,
			completedToday,
			weeklyCompletionRate: weeklyRate,
		};
	}
}
