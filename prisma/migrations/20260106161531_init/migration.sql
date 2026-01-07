-- CreateEnum
CREATE TYPE "SchedulePreset" AS ENUM ('ALL_WEEK', 'WORKWEEK', 'WEEKEND', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('DONE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "daily_target" INTEGER NOT NULL DEFAULT 1,
    "streak_freezes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "schedule_preset" "SchedulePreset" NOT NULL,
    "days_of_week" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" "CheckInStatus" NOT NULL DEFAULT 'DONE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "tasks_user_id_is_active_idx" ON "tasks"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "check_ins_user_id_date_idx" ON "check_ins"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_task_id_date_key" ON "check_ins"("task_id", "date");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
