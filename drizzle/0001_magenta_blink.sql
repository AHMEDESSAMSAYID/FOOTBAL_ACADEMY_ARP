CREATE TYPE "public"."escalation_level" AS ENUM('reminder', 'warning', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."skill_category" AS ENUM('technical', 'physical', 'tactical', 'attitude', 'teamwork');--> statement-breakpoint
CREATE TYPE "public"."uniform_type" AS ENUM('red', 'navy');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'coach');--> statement-breakpoint
CREATE TABLE "escalation_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"level" "escalation_level" NOT NULL,
	"days_overdue" integer NOT NULL,
	"notification_id" uuid,
	"triggered_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"coach_id" uuid,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"ball_control" integer NOT NULL,
	"passing" integer NOT NULL,
	"shooting" integer NOT NULL,
	"speed" integer NOT NULL,
	"fitness" integer NOT NULL,
	"positioning" integer NOT NULL,
	"game_awareness" integer NOT NULL,
	"commitment" integer NOT NULL,
	"teamwork" integer NOT NULL,
	"discipline" integer NOT NULL,
	"grand_total" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_month_year_unique" UNIQUE("student_id","month","year")
);
--> statement-breakpoint
CREATE TABLE "parent_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"prayer" integer,
	"sleep" integer,
	"healthy_eating" integer,
	"respect_others" integer,
	"anger_control" integer,
	"prepare_bag" integer,
	"organize_personal" integer,
	"fulfill_requests" integer,
	"discipline_total" integer,
	"morals_total" integer,
	"home_total" integer,
	"grand_total" integer,
	"parent_notes" text,
	"is_submitted" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parent_eval_student_month_year" UNIQUE("student_id","month","year")
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"parent_name" varchar(100) NOT NULL,
	"child_name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"coaching_rating" integer NOT NULL,
	"communication_rating" integer NOT NULL,
	"enjoyment_rating" integer NOT NULL,
	"facilities_rating" integer NOT NULL,
	"organization_rating" integer NOT NULL,
	"improvements" text,
	"additional_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"token" varchar(64) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "surveys_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "uniform_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"uniform_type" "uniform_type" NOT NULL,
	"given_date" date NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"paid_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "sibling_group_id" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "escalation_logs" ADD CONSTRAINT "escalation_logs_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escalation_logs" ADD CONSTRAINT "escalation_logs_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_evaluations" ADD CONSTRAINT "parent_evaluations_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parent_evaluations" ADD CONSTRAINT "parent_evaluations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uniform_records" ADD CONSTRAINT "uniform_records_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;