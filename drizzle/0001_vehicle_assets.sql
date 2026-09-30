ALTER TABLE "vehicles" ADD COLUMN "assets" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "model_asset_id" text;
