-- AlterTable
ALTER TABLE "users" ADD COLUMN     "install_prompt_dismissed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pwa_installed" BOOLEAN NOT NULL DEFAULT false;
