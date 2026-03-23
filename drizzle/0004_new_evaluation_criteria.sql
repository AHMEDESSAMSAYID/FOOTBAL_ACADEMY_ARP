-- Migration: New 4-criteria evaluation system
-- Date: 2026-03-23
-- 
-- New criteria (total /50):
-- 1️⃣ الانضباطية (15): تنفيذ تعليمات المدرب
-- 2️⃣ الأخلاق (15): احترام (10) + اللعب النظيف (5)
-- 3️⃣ المستوى الفني (20): التطور المهاري والأداء البدني

-- Add new evaluation columns
ALTER TABLE "evaluations" ADD COLUMN "coach_instructions" integer;
ALTER TABLE "evaluations" ADD COLUMN "respect_score" integer;
ALTER TABLE "evaluations" ADD COLUMN "fair_play_score" integer;
ALTER TABLE "evaluations" ADD COLUMN "technical_progress" integer;

-- Make legacy columns nullable (for existing data compatibility)
ALTER TABLE "evaluations" ALTER COLUMN "ball_control" DROP NOT NULL;
ALTER TABLE "evaluations" ALTER COLUMN "passing" DROP NOT NULL;
ALTER TABLE "evaluations" ALTER COLUMN "shooting" DROP NOT NULL;
ALTER TABLE "evaluations" ALTER COLUMN "speed" DROP NOT NULL;
ALTER TABLE "evaluations" ALTER COLUMN "fitness" DROP NOT NULL;
ALTER TABLE "evaluations" ALTER COLUMN "positioning" DROP NOT NULL;
ALTER TABLE "evaluations" ALTER COLUMN "game_awareness" DROP NOT NULL;
ALTER TABLE "evaluations" ALTER COLUMN "commitment" DROP NOT NULL;
ALTER TABLE "evaluations" ALTER COLUMN "teamwork" DROP NOT NULL;
ALTER TABLE "evaluations" ALTER COLUMN "discipline" DROP NOT NULL;
