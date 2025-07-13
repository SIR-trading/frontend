-- Add chainId and contractAddress columns to payouts table
ALTER TABLE "payouts" ADD COLUMN "chain_id" integer NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN "contract_address" text NOT NULL DEFAULT '';--> statement-breakpoint

-- Add chainId and contractAddress columns to current_apr table  
ALTER TABLE "current_apr" ADD COLUMN "chain_id" integer NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE "current_apr" ADD COLUMN "contract_address" text NOT NULL DEFAULT '';--> statement-breakpoint

-- Drop the existing unique constraint on current_apr.id
ALTER TABLE "current_apr" DROP CONSTRAINT IF EXISTS "current_apr_id_unique";--> statement-breakpoint

-- Change current_apr.id from integer with default 1 to serial
ALTER TABLE "current_apr" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "current_apr" ALTER COLUMN "id" TYPE serial;--> statement-breakpoint

-- Create indexes for better performance
CREATE INDEX "payouts_chain_contract_idx" ON "payouts" USING btree ("chain_id","contract_address");--> statement-breakpoint
CREATE INDEX "payouts_timestamp_idx" ON "payouts" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "current_apr_chain_contract_idx" ON "current_apr" USING btree ("chain_id","contract_address");--> statement-breakpoint

-- Create unique constraint for chain_id and contract_address combination on current_apr
CREATE UNIQUE INDEX "current_apr_chain_id_contract_address_unique" ON "current_apr" USING btree ("chain_id","contract_address");--> statement-breakpoint

-- Update existing records with current environment values
-- You'll need to manually set these values after running the migration
-- UPDATE "payouts" SET "chain_id" = 1, "contract_address" = '0x1278B112943Abc025a0DF081Ee42369414c3A834' WHERE "chain_id" = 1 AND "contract_address" = '';
-- UPDATE "current_apr" SET "chain_id" = 1, "contract_address" = '0x1278B112943Abc025a0DF081Ee42369414c3A834' WHERE "chain_id" = 1 AND "contract_address" = '';

-- Remove default values now that we've populated the columns
ALTER TABLE "payouts" ALTER COLUMN "chain_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "payouts" ALTER COLUMN "contract_address" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "current_apr" ALTER COLUMN "chain_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "current_apr" ALTER COLUMN "contract_address" DROP DEFAULT;--> statement-breakpoint
