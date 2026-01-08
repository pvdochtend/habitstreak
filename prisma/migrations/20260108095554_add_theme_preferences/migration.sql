-- AlterTable
ALTER TABLE "users" ADD COLUMN     "color_scheme" TEXT NOT NULL DEFAULT 'blue',
ADD COLUMN     "dark_mode" BOOLEAN NOT NULL DEFAULT false;
