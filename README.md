# Habit Tracker Backend (NestJS + TypeORM + PostgreSQL)

This is a simple, learning-focused backend intended to integrate with your Next.js habit-tracker frontend.
It includes authentication (JWT), habits CRUD, habit check-ins (records), and a simple stats endpoint.

Instructions:
1. Copy `.env.example` to `.env` and edit DB credentials.
2. `npm install`
3. Create Postgres DB (e.g. `psql -U postgres -c "CREATE DATABASE habit_tracker;"`)
4. `npm run seed` (optional seed)
5. `npm run start:dev`