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

	// 🔄 Utility: format today
	private todayISO(): string {
		return new Date().toISOString().split("T")[0];
	}

	// 🔄 Utility: recalculate streaks from records
	private recalcStreaks(habit: Habit) {
		const dates = habit.records.map((r) => r.date).sort(); // ascending
		if (dates.length === 0) {
			habit.streak = 0;
			habit.longestStreak = 0;
			return habit;
		}

		let longest = 1;
		let current = 1;

		for (let i = 1; i < dates.length; i++) {
			const prev = new Date(dates[i - 1]);
			const curr = new Date(dates[i]);

			// difference in days
			const diff = Math.floor(
				(curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
			);

			if (diff === 1) {
				current++;
				longest = Math.max(longest, current);
			} else {
				current = 1;
			}
		}

		// check if streak is "active" (ends today or yesterday)
		const last = dates[dates.length - 1];
		const today = this.todayISO();
		const yesterday = new Date(Date.now() - 86400000)
			.toISOString()
			.split("T")[0];

		if (last === today || last === yesterday) {
			habit.streak = current;
		} else {
			habit.streak = 0;
		}

		habit.longestStreak = longest;
		return habit;
	}

	// 🔄 Convert Habit entity into API response
	private toResponse(habit: Habit) {
		const today = this.todayISO();
		const completedDates = habit.records.map((r) => r.date);

		return {
			...habit,
			completedDates, // ✅ computed dynamically
			completedToday: completedDates.includes(today),
		};
	}

	// 📌 Find all habits for user
	async findAllForUser(userId: string) {
		const habits = await this.habitRepo.find({
			where: { user: { id: userId } },
			relations: ["records"],
		});
		return habits.map((h) => this.toResponse(this.recalcStreaks(h)));
	}

	// 📌 Create habit
	async createForUser(user: User, dto: Partial<Habit>) {
		const habit = this.habitRepo.create({ ...dto, user });
		const saved = await this.habitRepo.save(habit);
		saved.records = [];
		return this.toResponse(this.recalcStreaks(saved));
	}

	// 📌 Update habit
	async update(userId: string, id: string, updates: Partial<Habit>) {
		const habit = await this.habitRepo.findOne({
			where: { id, user: { id: userId } },
			relations: ["records"],
		});
		if (!habit) throw new NotFoundException("Habit not found");

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
		return this.toResponse(this.recalcStreaks(saved));
	}

	// 📌 Delete habit
	async delete(userId: string, id: string) {
		const res = await this.habitRepo.delete({
			id,
			user: { id: userId },
		} as any);
		if (res.affected === 0) throw new NotFoundException("Habit not found");
		return { deleted: true };
	}

	// 📌 Toggle check-in
	async checkin(userId: string, habitId: string, dateISO?: string) {
		const habit = await this.habitRepo.findOne({
			where: { id: habitId, user: { id: userId } },
			relations: ["records"],
		});
		if (!habit) throw new NotFoundException("Habit not found");

		const date = dateISO ?? this.todayISO();
		const existing = habit.records.find((r) => r.date === date);

		if (existing) {
			// UNCHECK: remove record
			await this.recordRepo.delete({ id: existing.id });
			habit.records = habit.records.filter((r) => r.date !== date);
		} else {
			// ✅ CHECK: add record
			const rec = this.recordRepo.create({ date, habit });
			await this.recordRepo.save(rec);
			habit.records.push(rec);
		}

		// recalc streaks from updated records
		this.recalcStreaks(habit);
		await this.habitRepo.save(habit);

		return this.toResponse(habit);
	}

	// 📌 Get habit records
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

	// 📌 Stats
	async stats(userId: string) {
		const habits = await this.findAllForUser(userId);
		const total = habits.length;
		const today = this.todayISO();

		const completedToday = habits.filter((h) =>
			h.completedDates.includes(today)
		).length;

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
