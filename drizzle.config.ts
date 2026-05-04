/**
 * Drizzle Kit configuration — used by CLI commands:
 *
 *   bun run db:generate  → generates SQL migration files in ./drizzle
 *   bun run db:migrate   → applies pending migrations to the database
 *   bun run db:push      → pushes schema directly (local dev only!)
 *   bun run db:studio    → opens Drizzle Studio (visual DB browser)
 *
 * `schema` points to the barrel export so drizzle-kit discovers all tables.
 * `out` is where generated migration SQL files are stored (commit these!).
 *
 * We prefer `DATABASE_URL_UNPOOLED` for migrations because pooled
 * connections (e.g. PgBouncer) can interfere with DDL statements.
 * Falls back to `DATABASE_URL` if unpooled isn't configured.
 */

import { defineConfig } from "drizzle-kit";
import { env } from "@/lib/env";

export default defineConfig({
  /** Where Drizzle finds your table definitions */
  schema: "./src/db/schema/index.ts",

  /** Where generated migration files are written */
  out: "./drizzle",

  /** Database dialect — Neon is Postgres-compatible */
  dialect: "postgresql",

  /**
   * Automatically maps camelCase TS fields → snake_case DB columns.
   * Must match the `casing` option in the Drizzle client (src/db/index.ts).
   */
  casing: "snake_case",

  dbCredentials: {
    url: env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL,
  },

  /** Print generated SQL to the console during generation */
  verbose: true,

  /** Require confirmation before applying destructive changes */
  strict: true,
});
