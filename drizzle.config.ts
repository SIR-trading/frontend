import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres.wwogvwdgbevkgqyagedi:tfp1TYoft0ZLO09Q@aws-0-us-west-1.pooler.supabase.com:6543/postgres",
  },
  verbose: true,
  strict: true,
});
