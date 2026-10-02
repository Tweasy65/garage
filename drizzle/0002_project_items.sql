CREATE TABLE "project_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"notes" text,
	"area" text DEFAULT 'misc' NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_items" ADD CONSTRAINT "project_items_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "project_items_vehicle_idx" ON "project_items" USING btree ("vehicle_id");
--> statement-breakpoint
CREATE INDEX "project_items_user_idx" ON "project_items" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "project_items_vehicle_area_idx" ON "project_items" USING btree ("vehicle_id","area","sort_order");
