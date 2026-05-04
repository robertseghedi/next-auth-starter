/**
 * SERVER-ONLY AUTH CONFIGURATION
 *
 * Contains secrets, OAuth credentials, and email config that must
 * never reach the client bundle. Only imported by `auth.ts`.
 *
 * The shared config (routes, toggles, session, cookies) lives in
 * `auth.config.ts` which is safe for both server and client.
 */

import "server-only";

import { env } from "@/lib/env";

export const authServerConfig = {
  /** Better Auth secret for signing cookies and tokens */
  secret: env.BETTER_AUTH_SECRET,

  /** Server-side base URL (from validated env) */
  baseUrl: env.BETTER_AUTH_URL,

  // ───────────────────────────────────────────────────────────
  // OAuth provider credentials — only needed on the server
  // ───────────────────────────────────────────────────────────
  socialProviders: {
    google: {
      enabled: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      clientId: env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
      scopes: ["email", "profile"],
    },
    github: {
      enabled: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
      clientId: env.GITHUB_CLIENT_ID ?? "",
      clientSecret: env.GITHUB_CLIENT_SECRET ?? "",
      scopes: ["read:user", "user:email"],
    },
  },

  // ───────────────────────────────────────────────────────────
  // Email — used by password reset and email verification flows
  // ───────────────────────────────────────────────────────────
  email: {
    from: env.EMAIL_FROM ?? "noreply@example.com",
    /** Only enabled when both RESEND_API_KEY and EMAIL_FROM are set */
    enabled: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
  },

  // ───────────────────────────────────────────────────────────
  // Passkey (WebAuthn) — server-side config
  // rpID: your domain without protocol (e.g. "example.com")
  // origin: full origin URL (e.g. "https://example.com")
  // ───────────────────────────────────────────────────────────
  passkey: {
    rpID: new URL(env.BETTER_AUTH_URL).hostname,
    origin: env.BETTER_AUTH_URL,
  },

  // ───────────────────────────────────────────────────────────
  // Captcha (Cloudflare Turnstile) — server-side secret
  // ───────────────────────────────────────────────────────────
  captcha: {
    secretKey: env.TURNSTILE_SECRET_KEY ?? "",
  },

  // ───────────────────────────────────────────────────────────
  // Trusted origins for CORS / redirect safety
  // ───────────────────────────────────────────────────────────
  trustedOrigins: [
    env.BETTER_AUTH_URL,
    env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean),
} as const;
