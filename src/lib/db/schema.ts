import {
  text,
  integer,
  pgTable,
  serial,
  unique,
  index,
} from "drizzle-orm/pg-core";

export const payoutTable = pgTable("payouts", {
  id: serial("id_").primaryKey(),
  sirInUSD: text("sir_in_usd").notNull(),
  ethInUSD: text("eth_in_usd").notNull(),
  timestamp: integer("timestamp").notNull(),
  chainId: integer("chain_id").notNull(),
  contractAddress: text("contract_address").notNull(),
}, (table) => [
  index("payouts_chain_contract_idx").on(table.chainId, table.contractAddress),
  index("payouts_timestamp_idx").on(table.timestamp),
]);

export const currentApr = pgTable(
  "current_apr",
  {
    id: serial("id").primaryKey(),
    apr: text("apr").notNull(),
    latestTimestamp: integer("timestamp").notNull(),
    chainId: integer("chain_id").notNull(),
    contractAddress: text("contract_address").notNull(),
  },
  (table) => [
    unique().on(table.chainId, table.contractAddress), // Ensures only one row per chain/contract
    index("current_apr_chain_contract_idx").on(table.chainId, table.contractAddress),
  ],
);

export const errorLogs = pgTable(
  "error_logs",
  {
    id: serial("id").primaryKey(),
    error: text("error").notNull(),
    details: text("details").notNull(),
    timestamp: integer("timestamp").notNull(),
    ip: text("ip").notNull(),
    userAddress: text("user_address").notNull(),
  },
  (table) => [index("ip_index").on(table.ip)],
);

export type InsertPayout = typeof payoutTable.$inferInsert;
export type SelectPayout = typeof payoutTable.$inferSelect;
export type InsertCurrentApr = typeof currentApr.$inferInsert;
export type SelectCurrentApr = typeof currentApr.$inferSelect;
export type InsertErrorLogs = typeof errorLogs.$inferInsert;
export type SelectErrorLogs = typeof errorLogs.$inferSelect;
