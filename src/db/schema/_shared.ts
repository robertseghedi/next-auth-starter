/**
 * Shared column helpers reused across all database schemas.
 *
 * Instead of repeating `createdAt` / `updatedAt` definitions in every table,
 * we define them once here and spread them into each table definition:
 *
 *   import { timestamps } from "./_shared";
 *   export const myTable = pgTable("my_table", {
 *     id: text("id").primaryKey(),
 *     ...timestamps,
 *   });
 */

import { timestamp } from "drizzle-orm/pg-core";

/**
 * Standard timestamp columns for every table.
 *
 * - `createdAt`: set automatically on INSERT (via `defaultNow()`)
 * - `updatedAt`: set on INSERT, then auto-refreshed on every UPDATE
 *   via Drizzle's `$onUpdate` hook (runs in the ORM, not a DB trigger)
 *
 * Both use `withTimezone: true` so Postgres stores them as `timestamptz`,
 * which ensures correct behavior across time zones.
 */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
