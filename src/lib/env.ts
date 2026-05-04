/**
 * Environment variable validation with T3 Env + Zod.
 *
 * Why this file exists:
 * ─────────────────────
 * Instead of reading `process.env.X` directly throughout the codebase (where
 * a typo silently passes until runtime), we centralize ALL variables here.
 * On app startup, Zod validates every variable:
 *   - missing → immediate, clearly formatted error
 *   - wrong format (e.g. invalid URL) → immediate error
 *
 * Usage:
 * ──────
 *   import { env } from "@/lib/env";
 *   console.log(env.DATABASE_URL); // ✅ type-safe, validated
 *   console.log(process.env.DATABASE_URL); // ❌ forbidden — not validated
 *
 * Rules:
 * ──────
 * 1. Any new variable goes here FIRST (schema + runtimeEnv).
 * 2. Then add it to `.env.example` with a placeholder value.
 * 3. `server` variables never reach the client bundle.
 * 4. `client` variables MUST start with `NEXT_PUBLIC_`.
 */

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  // ───────────────────────────────────────────────────────────────
  // Server-only variables (never shipped to the browser)
  // ───────────────────────────────────────────────────────────────
  server: {
    /** Current execution environment */
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // ── Database (Neon Postgres) ──────────────────────────────────
    /** Database connection URL — used by Drizzle at runtime */
    DATABASE_URL: z.string().url(),

    /** Unpooled URL — used only for migrations (optional) */
    DATABASE_URL_UNPOOLED: z.string().url().optional(),

    // ── Better Auth ──────────────────────────────────────────────
    /** Secret for signing cookies and tokens */
    BETTER_AUTH_SECRET: z
      .string()
      .min(32, "Must be at least 32 chars (generate with: openssl rand -base64 32)"),

    /** App URL — used by Better Auth for callbacks */
    BETTER_AUTH_URL: z.string().url(),

    // ── OAuth: Google ────────────────────────────────────────────
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // ── OAuth: GitHub ────────────────────────────────────────────
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    // ── Email (Resend) ───────────────────────────────────────────
    /** Resend API key — only needed if email is enabled */
    RESEND_API_KEY: z.string().optional(),

    /** Sender address — "user@domain.com" or "Name <user@domain.com>" */
    EMAIL_FROM: z
      .string()
      .regex(
        /^([^<]+<[^>]+@[^>]+>|[^\s@]+@[^\s@]+\.[^\s@]+)$/,
        'Must be "user@domain.com" or "Name <user@domain.com>"',
      )
      .optional(),

    // ── Captcha (Cloudflare Turnstile) ───────────────────────────
    /** Server-side secret key for verifying Turnstile tokens */
    TURNSTILE_SECRET_KEY: z.string().optional(),
  },

  // ───────────────────────────────────────────────────────────────
  // Client variables (exposed to the browser — NEXT_PUBLIC_ prefix required)
  // ───────────────────────────────────────────────────────────────
  client: {
    /** Public app URL — used by the auth client */
    NEXT_PUBLIC_APP_URL: z.string().url(),

    /** Public site key for Cloudflare Turnstile widget */
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  },

  // ───────────────────────────────────────────────────────────────
  // Explicit process.env → validated variable mapping
  //
  // Why is this needed? Next.js replaces `process.env.X` at build time
  // with the actual value. Without this mapping, T3 Env can't access them.
  // ───────────────────────────────────────────────────────────────
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  },

  /**
   * Treat empty strings ("") as undefined.
   * Useful because many hosting platforms set env vars as empty strings
   * instead of leaving them undefined.
   */
  emptyStringAsUndefined: true,
});
