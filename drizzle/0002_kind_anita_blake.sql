ALTER TABLE "users" ALTER COLUMN "clerk_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "registration_form_status" varchar(20) DEFAULT 'not_filled';--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "registration_form_notes" text;