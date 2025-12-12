CREATE TYPE "recurring_frequency" AS ENUM ('weekly', 'monthly');

CREATE TABLE IF NOT EXISTS "recurring_bookings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_name" varchar,
	"visitor_name" varchar NOT NULL,
	"visitor_email" varchar NOT NULL,
	"visitor_phone" varchar,
	"group_size" "group_size" NOT NULL,
	"number_of_people" integer DEFAULT 1,
	"tour_type" "tour_type" NOT NULL,
	"frequency" "recurring_frequency" NOT NULL,
	"day_of_week" integer,
	"week_of_month" integer,
	"start_date" date NOT NULL,
	"end_date" date,
	"start_time" time NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_generated_date" date,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "recurring_booking_id" varchar;

DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_recurring_booking_id_recurring_bookings_id_fk" FOREIGN KEY ("recurring_booking_id") REFERENCES "recurring_bookings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
