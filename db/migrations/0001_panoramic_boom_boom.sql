CREATE TABLE "common_foods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"calories" integer NOT NULL,
	"protein_g" numeric(5, 1) NOT NULL,
	"carbs_g" numeric(5, 1) NOT NULL,
	"fat_g" numeric(5, 1) NOT NULL,
	"is_estimate" boolean DEFAULT true NOT NULL,
	CONSTRAINT "common_foods_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "content_comments" ADD COLUMN "item_slug" varchar(180);--> statement-breakpoint
ALTER TABLE "saved_foods" ADD COLUMN "times_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "saved_foods" ADD COLUMN "last_used_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "equipment" varchar(40);--> statement-breakpoint
CREATE INDEX "workouts_user_date_idx" ON "workouts" USING btree ("user_id","workout_date");--> statement-breakpoint
ALTER TABLE "food_logs" DROP COLUMN "times_used";--> statement-breakpoint
ALTER TABLE "food_logs" DROP COLUMN "last_used_at";--> statement-breakpoint
ALTER TABLE "progress_entries" DROP COLUMN "log_date";