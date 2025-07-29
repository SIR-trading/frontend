-- Remove unused tables that are no longer needed
-- These tables were used for payout tracking but the app now uses subgraph data directly

DROP TABLE IF EXISTS "payouts";
DROP TABLE IF EXISTS "current_apr";

-- Drop any related indexes that might still exist
DROP INDEX IF EXISTS "payouts_chain_contract_idx";
DROP INDEX IF EXISTS "payouts_timestamp_idx";
DROP INDEX IF EXISTS "current_apr_chain_contract_idx";
