CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"trim" text,
	"year" integer NOT NULL,
	"color" text,
	"vin" text,
	"license_plate" text,
	"mileage" integer DEFAULT 0 NOT NULL,
	"purchase_date" timestamp with time zone,
	"notes" text,
	"is_project" boolean DEFAULT false NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"body_style" text,
	"transmission" text,
	"fuel_type" text,
	"drivetrain" text,
	"engine_type" text,
	"engine_size" text,
	"seating_capacity" integer,
	"mpg_city" integer,
	"mpg_highway" integer,
	"title_status" text,
	"image_url" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"cost_cents" integer,
	"mileage" integer,
	"service_provider" text,
	"next_due_date" timestamp with time zone,
	"next_due_mileage" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "vehicles_user_idx" ON "vehicles" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "vehicles_user_favorite_idx" ON "vehicles" USING btree ("user_id","is_favorite");
--> statement-breakpoint
CREATE INDEX "maintenance_vehicle_idx" ON "maintenance_records" USING btree ("vehicle_id");
--> statement-breakpoint
CREATE INDEX "maintenance_user_idx" ON "maintenance_records" USING btree ("user_id");
