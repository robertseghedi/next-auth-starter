/**
 * CENTRAL AUTH CONFIGURATION
 *
 * Single source of truth for ALL auth behavior in the app.
 * Every other auth-related file reads from here.
 *
 * IMPORTANT: This file is imported by BOTH server and client code.
 * It must NOT import server-only env vars. Server-specific values
 * (secrets, OAuth credentials, email config) live in `auth.config.server.ts`.
 *
 * Edit this file to:
 *   - Toggle plugins (2FA, admin, organizations, etc.)
 *   - Change session/cookie durations
 *   - Adjust password policy
 *   - Rename auth routes
 *   - Configure protected route patterns
 *
 * After changing plugin toggles, restart the dev server.
 */

export const authConfig = {
  // ───────────────────────────────────────────────────────────
  // App identity
  // ───────────────────────────────────────────────────────────
  appName: "YourApp",

  /**
   * Base URL for the auth client.
   * Uses NEXT_PUBLIC_APP_URL directly (safe on both server and client).
   */
  baseUrl: process.env.NEXT_PUBLIC_APP_URL!,

  // ───────────────────────────────────────────────────────────
  // Routes — change these to rename auth pages across the app.
  // Every redirect, link, and proxy rule reads from here.
  // ───────────────────────────────────────────────────────────
  routes: {
    signIn: "/sign-in",
    signUp: "/sign-up",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
    verifyEmail: "/verify-email",
    twoFactor: "/two-factor",
    /** Where users land after signing in */
    afterSignIn: "/dashboard",
    /** Where users land after signing out */
    afterSignOut: "/",
    /** Where users land after signing up */
    afterSignUp: "/dashboard",
    /** Legal pages — shown as links on auth pages */
    termsOfService: "/terms",
    privacyPolicy: "/privacy",
  },

  // ───────────────────────────────────────────────────────────
  // Route protection — proxy reads these arrays.
  // To protect a new route, just add its prefix here.
  // ───────────────────────────────────────────────────────────
  protection: {
    /** Routes that REQUIRE an authenticated session */
    protectedPrefixes: ["/dashboard", "/settings", "/account"],
    /** Auth pages — redirect to afterSignIn if user is already logged in */
    publicAuthPrefixes: [
      "/sign-in",
      "/sign-up",
      "/forgot-password",
      "/reset-password",
    ],
  },

  // ───────────────────────────────────────────────────────────
  // Email & password authentication
  // ───────────────────────────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    /** Set to true in production to require email verification */
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    /** Automatically sign in after sign-up (skip verification step) */
    autoSignIn: true,
    /** How long a password reset token stays valid (in seconds) */
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
  },

  // ───────────────────────────────────────────────────────────
  // Social providers — UI toggle only.
  // The actual credentials live in auth.config.server.ts.
  // These booleans control whether buttons render in the UI.
  //
  // Set to `true` when you've added the provider's env vars.
  // Cannot be derived from process.env here because server-only
  // env vars aren't available on the client (hydration mismatch).
  // ───────────────────────────────────────────────────────────
  socialProviders: {
    google: {
      enabled: true,
    },
    github: {
      enabled: true,
    },
  },

  // ───────────────────────────────────────────────────────────
  // Plugins — flip these toggles to enable/disable features.
  // The server (auth.ts) and client (auth-client.ts) both read
  // from here to conditionally register plugins.
  //
  // When you enable a plugin that adds DB fields/tables, you MUST
  // run `bun run db:generate` → review → `bun run db:migrate`.
  // ───────────────────────────────────────────────────────────
  plugins: {
    /**
     * Two-Factor Authentication (TOTP).
     * Adds `twoFactorEnabled`, `twoFactorSecret`, `twoFactorBackupCodes`
     * fields to the `user` table + a `twoFactor` table.
     */
    twoFactor: {
      enabled: true,
    },

    /**
     * Admin panel — user management, banning, role assignment.
     * Adds `role`, `banned`, `banReason`, `banExpires` to `user` table.
     */
    admin: {
      enabled: true,
      /** Default role for new users */
      defaultRole: "user",
      /** Role name for admin users */
      adminRole: "admin",
    },

    /**
     * Username-based authentication alongside email.
     * Adds `username` and `displayUsername` fields to `user` table.
     */
    username: {
      enabled: false,
    },

    /**
     * Bearer token authentication — allows API access via
     * `Authorization: Bearer <token>` header.
     * No extra DB tables needed.
     */
    bearer: {
      enabled: true,
    },

    /**
     * Magic Link — passwordless sign-in via email link.
     * Sends a one-time link to the user's email. Clicking it signs them in.
     * Requires RESEND_API_KEY + EMAIL_FROM to be set in .env.
     * No extra DB tables needed (uses the `verification` table).
     */
    magicLink: {
      enabled: true,
    },

    /**
     * Email OTP — sign-in and verification via one-time codes sent by email.
     * Sends a 6-digit code instead of a link.
     * Requires RESEND_API_KEY + EMAIL_FROM to be set in .env.
     * No extra DB tables needed.
     */
    emailOTP: {
      enabled: true,
    },

    /**
     * Passkey — WebAuthn/FIDO2 biometric and security key authentication.
     * Users can register passkeys (Face ID, Touch ID, hardware keys) and
     * use them for passwordless sign-in.
     * Adds a `passkey` table to the database.
     */
    passkey: {
      enabled: true,
    },

    /**
     * Phone Number — OTP-based phone authentication.
     * Adds `phoneNumber` and `phoneNumberVerified` fields to user table.
     *
     * IMPORTANT: You must implement your own `sendOTP` function in
     * `auth.ts` using your SMS provider (Twilio, Vonage, AWS SNS, etc.).
     * Better Auth does NOT ship with any SMS provider — it only generates
     * the OTP code and calls your function to deliver it.
     *
     * See `auth.ts` → phoneNumber plugin for the implementation point.
     */
    phoneNumber: {
      enabled: true,
    },

    /**
     * Multi-session — allows users to be logged in with multiple
     * accounts and switch between them.
     * No extra DB tables needed.
     */
    multiSession: {
      enabled: true,
    },

    /**
     * Captcha — Cloudflare Turnstile bot protection on auth endpoints.
     * Requires TURNSTILE_SECRET_KEY (server) and NEXT_PUBLIC_TURNSTILE_SITE_KEY (client).
     * Get keys at: https://dash.cloudflare.com/?to=/:account/turnstile
     */
    captcha: {
      enabled: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
      siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
    },

    /**
     * OpenAPI — auto-generated API documentation.
     * Available at GET /api/auth/reference when enabled.
     * Recommended: enable in development, disable in production.
     */
    openAPI: {
      enabled: process.env.NODE_ENV === "development",
    },
  },

  // ───────────────────────────────────────────────────────────
  // Session behavior
  // ───────────────────────────────────────────────────────────
  session: {
    /** Total session lifetime (in seconds) */
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    /** How often the session is refreshed in the DB (in seconds) */
    updateAge: 60 * 60 * 24, // once per day
    /** Cookie-based session cache — avoids a DB read on every request */
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // ───────────────────────────────────────────────────────────
  // Cookie settings
  // ───────────────────────────────────────────────────────────
  cookies: {
    /** Prefix for all auth cookies (e.g. "yourapp.session_token") */
    prefix: "yourapp",
    /** Auto-enable secure cookies in production */
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  },

  // ───────────────────────────────────────────────────────────
  // Rate limiting — only active in production
  // ───────────────────────────────────────────────────────────
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    /** Time window in seconds */
    window: 60,
    /** Max requests per window */
    max: 100,
  },
} as const;

export type AuthConfig = typeof authConfig;
