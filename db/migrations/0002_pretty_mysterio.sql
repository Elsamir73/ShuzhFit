CREATE TABLE "user_insight_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"insight_id" varchar(50) NOT NULL,
	"decision" varchar(20) NOT NULL,
	"calorie_delta" integer DEFAULT 0 NOT NULL,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "progress_entries" ADD COLUMN "goal" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "age_years" integer;--> statement-breakpoint
ALTER TABLE "user_insight_actions" ADD CONSTRAINT "user_insight_actions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_insight_actions_user_id_unique" ON "user_insight_actions" USING btree ("user_id","insight_id");--> statement-breakpoint
CREATE INDEX "user_insight_actions_user_date_idx" ON "user_insight_actions" USING btree ("user_id","decided_at");