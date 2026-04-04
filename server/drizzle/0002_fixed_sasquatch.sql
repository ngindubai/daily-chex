CREATE TYPE "public"."task_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'completed', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TABLE "task_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"check_template_id" uuid NOT NULL,
	"assigned_to" uuid,
	"assigned_team" uuid,
	"site_id" uuid,
	"created_by" uuid NOT NULL,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"priority" "task_priority" DEFAULT 'normal' NOT NULL,
	"due_date" date,
	"notes" text,
	"completed_check_id" uuid,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_check_template_id_check_templates_id_fk" FOREIGN KEY ("check_template_id") REFERENCES "public"."check_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_assigned_to_people_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_assigned_team_teams_id_fk" FOREIGN KEY ("assigned_team") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_created_by_people_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."people"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_completed_check_id_checks_id_fk" FOREIGN KEY ("completed_check_id") REFERENCES "public"."checks"("id") ON DELETE no action ON UPDATE no action;