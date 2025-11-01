// seed.ts
import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { HabitRecord } from "./habits/habit-record.entity";
import { Habit } from "./habits/habit.entity";
import { User } from "./users/user.entity";


// ⚙️ Adjust this to match your data source config

const AppDataSource = new DataSource({
	type: "postgres",
	host: "localhost",
	port: 5432,
	username: "postgres",
	password: "2077",
	database: "habit_tracker",
	entities: [User, Habit, HabitRecord],
	synchronize: true,
});

async function seed() {
	await AppDataSource.initialize();
	console.log("✅ Database connected");

	const userRepository = AppDataSource.getRepository(User);
	const habitRepository = AppDataSource.getRepository(Habit);
	const recordRepository = AppDataSource.getRepository(HabitRecord);

	// 🧍‍♂️ 1. Create User
	const passwordHash = await bcrypt.hash("password123", 10);
	const user = userRepository.create({
		name: "Test User",
		email: "test@example.com",
		password:passwordHash,
	});
	await userRepository.save(user);
	console.log("👤 User created");

	// 📅 2. Create 3 Habits
	const habits = [
		{ name: "Drink Water", category: "Health", frequency: "daily" },
		{ name: "Exercise", category: "Fitness", frequency: "daily" },
		{ name: "Meditate", category: "Mindfulness", frequency: "daily" },
	];

	const savedHabits: Habit[] = [];
	for (const h of habits) {
		const habit = habitRepository.create({
			...h,
			user,
			streak: 0,
			longestStreak: 0,
		});
		savedHabits.push(await habitRepository.save(habit));
	}
    console.log("✅ Habits created");
    
    function toLocalISODate(date: Date) {
			const offsetMs = date.getTimezoneOffset() * 60 * 1000;
			const local = new Date(date.getTime() - offsetMs);
			return local.toISOString().split("T")[0];
		}


	// 🗓️ 3. Add check-in records for "yesterday"
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	const yestISO = toLocalISODate(yesterday);

	// Completed habits (first 2)
	for (const habit of savedHabits.slice(0, 2)) {
		const record = recordRepository.create({
			habit,
			date: yestISO,
		});
		await recordRepository.save(record);
	}

	console.log("📆 Records added for yesterday (2 habits)");

	console.log("🌱 Seed data created successfully");
	await AppDataSource.destroy();
}

seed().catch((err) => {
	console.error("❌ Error seeding database:", err);
	process.exit(1);
});
