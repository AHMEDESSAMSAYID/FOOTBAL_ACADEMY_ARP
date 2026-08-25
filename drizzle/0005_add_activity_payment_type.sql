-- Migration: Add "activity" (رسوم الأنشطة) payment type
-- Date: 2026-08-25
--
-- Activity fees are one-off charges like the uniform, not a recurring
-- subscription, so they are deliberately NOT added to fee_type — they create
-- no per-month payment_coverage rows.

ALTER TYPE "payment_type" ADD VALUE IF NOT EXISTS 'activity';
