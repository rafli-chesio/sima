ALTER TABLE "assets" ALTER COLUMN "kode_unik" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "sumber_data" varchar(100);