CREATE TABLE "asset_import_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"error_details" jsonb,
	"imported_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "kode_barang" varchar(255);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "additional_data" jsonb;--> statement-breakpoint
ALTER TABLE "asset_import_logs" ADD CONSTRAINT "asset_import_logs_imported_by_users_id_fk" FOREIGN KEY ("imported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;