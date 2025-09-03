import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();
import { User } from './users/user.entity';
import { Habit } from './habits/habit.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'habit_tracker',
  entities: [User, Habit],
  synchronize: true,
});

async function run() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const habitRepo = AppDataSource.getRepository(Habit);

  const existing = await userRepo.findOne({ where: { email: 'alice@example.com' } });
  if (existing) {
    console.log('Seed already applied');
    process.exit(0);
  }

  const user = userRepo.create({
    name: 'Alice',
    email: 'alice@example.com',
    passwordHash: '$2b$10$KIX/.(aMockHashForSeed.Gv3e',
  });
  await userRepo.save(user);

  const h1 = habitRepo.create({
    name: 'Morning Exercise',
    description: 'Do 20 push-ups',
    category: 'Health',
    frequency: 'daily',
    completedDates: [],
    user: user,
  });
  await habitRepo.save(h1);

  console.log('Seed done. Created user alice@example.com');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
