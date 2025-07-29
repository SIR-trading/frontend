import {
  text,
  integer,
  pgTable,
  serial,
  index,
} from "drizzle-orm/pg-core";

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

export type InsertErrorLogs = typeof errorLogs.$inferInsert;
export type SelectErrorLogs = typeof errorLogs.$inferSelect;
