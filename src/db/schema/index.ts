/**
 * Barrel export for all database schemas.
 *
 * Every new schema file should be re-exported here so that
 * the Drizzle client and drizzle-kit can discover all tables
 * from a single import:
 *
 *   import * as schema from "@/db/schema";
 */

export * from "./auth";
// Re-export future schemas here, e.g.:
// export * from "./posts";
// export * from "./teams";
