/**
 * Drizzle ORM client — the single database entry point.
 *
 * Why "server-only"?
 * ──────────────────
 * The `import "server-only"` directive ensures this file can NEVER be
 * imported from a Client Component. If someone accidentally imports it
 * in a "use client" file, Next.js throws a build error immediately
 * instead of leaking the database connection to the browser.
 *
 * Why Neon HTTP driver?
 * ─────────────────────
 * `@neondatabase/serverless` provides a stateless HTTP-based driver
 * optimized for serverless environments (Vercel, Cloudflare, etc.).
 * Each query is a single HTTP request — no persistent connection needed.
 * Use the WebSocket driver instead if you need transactions.
 *
 * Usage:
 * ──────
 *   import { db } from "@/db";
 *   const users = await db.select().from(schema.user);
 *
 * The `schema` object is passed to Drizzle so you can use the
 * relational query API:
 *   const result = await db.query.user.findFirst({ ... });
 */

import "server-only";

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Create the Neon HTTP SQL client.
 * This is a thin wrapper that sends SQL over HTTP to your Neon database.
 */
const sql = neon(env.DATABASE_URL);

/**
 * The Drizzle ORM instance — use this everywhere for database access.
 *
 * `casing: "snake_case"` tells Drizzle to automatically map camelCase
 * TypeScript field names to snake_case database column names, so you
 * don't need to specify column names manually in every field.
 */
export const db = drizzle({
  client: sql,
  schema,
  casing: "snake_case",
});

/** Export the DB type for use in function signatures */
export type DB = typeof db;
