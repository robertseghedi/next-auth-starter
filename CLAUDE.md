# CLAUDE.md — Auth Starter Implementation Guide

This file is the source of truth for building a production-grade authentication starter with **Better Auth + Drizzle ORM + Neon Postgres** in a Next.js 15 (App Router) project.

The architecture is designed around a single principle: **everything related to auth must be controllable from one central file — `auth.config.ts`**. Routes, providers, sessions, cookies, redirects, password rules, OAuth scopes, email templates — all flow from this config. No magic strings scattered across the codebase.

---

## Tech stack (locked decisions)

- **Framework**: Next.js 15+ (App Router, Server Components, Server Actions)
- **Auth library**: `better-auth` (latest)
- **ORM**: `drizzle-orm` + `drizzle-kit`
- **Database**: Neon Postgres (HTTP driver `@neondatabase/serverless`)
- **Env validation**: `@t3-oss/env-nextjs` + `zod`
- **Validation**: `zod`
- **TypeScript**: strict mode, no `any`, no `// @ts-ignore`
- **Package manager**: respect whatever the project uses (`bun`, `pnpm`, `npm`)

---

## Non-negotiable rules

1. **`auth.config.ts` is the single source of truth.** Any auth-related constant, route, scope, duration, or feature flag goes here. Never hardcode `"/login"` or `60 * 60 * 24 * 7` anywhere else.
2. **`import "server-only"`** must appear at the top of every file that touches the DB client, the auth instance, or secrets. No exceptions.
3. **Env vars are validated.** If a var is missing or malformed, the app must fail to start, not fail at runtime.
4. **No raw SQL in app code.** Everything goes through Drizzle.
5. **Schema types come from `$inferSelect` / `$inferInsert`.** Never write a `User` interface by hand.
6. **Migrations are committed.** `drizzle-kit push` is forbidden outside local dev.
7. **No client-side secrets.** The Better Auth client (`auth-client.ts`) only knows the base URL.

---

## Project structure

Build the project to match this layout exactly. Create directories that don't exist.

```
src/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (app)/
│   │   └── dashboard/page.tsx        # protected example
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/route.ts     # Better Auth handler
│   └── layout.tsx
│
├── lib/
│   ├── env.ts                        # T3 env validation
│   ├── auth.ts                       # Better Auth server instance
│   ├── auth-client.ts                # Better Auth React client
│   └── auth-helpers.ts               # getSession, requireSession, etc.
│
├── auth.config.ts                    # ⭐ CENTRAL CONFIG — everything auth-related
│
├── db/
│   ├── index.ts                      # Drizzle client (server-only)
│   ├── schema/
│   │   ├── index.ts                  # barrel export
│   │   ├── _shared.ts                # timestamps, id helpers
│   │   └── auth.ts                   # users, sessions, accounts, verifications
│   └── relations.ts
│
├── components/
│   └── auth/
│       ├── sign-in-form.tsx
│       ├── sign-up-form.tsx
│       └── sign-out-button.tsx
│
├── middleware.ts                     # route protection driven by auth.config.ts
└── drizzle/                          # generated migrations (committed)

drizzle.config.ts
.env.local
.env.example
```

---

## Step 1 — Dependencies

Install in this order:

```bash
# Core
<pkg> add better-auth drizzle-orm @neondatabase/serverless

# Env + validation
<pkg> add @t3-oss/env-nextjs zod

# Dev
<pkg> add -D drizzle-kit @types/node tsx
```

Replace `<pkg>` with the project's package manager.

---

## Step 2 — Environment validation (`src/lib/env.ts`)

```ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // Database
    DATABASE_URL: z.string().url(),
    DATABASE_URL_UNPOOLED: z.string().url().optional(), // for migrations

    // Better Auth
    BETTER_AUTH_SECRET: z.string().min(32, "Must be at least 32 chars (run: openssl rand -base64 32)"),
    BETTER_AUTH_URL: z.string().url(),

    // OAuth — Google
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // OAuth — GitHub
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    // Email (Resend)
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().email().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
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
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
});
```

Also create `.env.example` listing every required variable with safe placeholder values.

---

## Step 3 — The central `auth.config.ts` (⭐ CORE FILE)

This file lives at `src/auth.config.ts`. **Every other auth-related file reads from here.** When the user wants to add a provider, change session duration, tweak password rules, or rename a route, they edit ONLY this file.

```ts
/**
 * ⭐ CENTRAL AUTH CONFIGURATION ⭐
 *
 * Single source of truth for all auth behavior.
 * Edit this file to:
 *   - Toggle providers (email/password, Google, GitHub, ...)
 *   - Change session/cookie durations
 *   - Adjust password policy
 *   - Rename auth routes
 *   - Configure protected route patterns
 *   - Customize email templates and sender
 *
 * After changing OAuth provider toggles, restart the dev server.
 */

import { env } from "@/lib/env";

export const authConfig = {
  // ─────────────────────────────────────────────────────────────
  // App identity
  // ─────────────────────────────────────────────────────────────
  appName: "YourApp",
  baseUrl: env.BETTER_AUTH_URL,

  // ─────────────────────────────────────────────────────────────
  // Routes — change these to rename auth pages
  // ─────────────────────────────────────────────────────────────
  routes: {
    signIn: "/sign-in",
    signUp: "/sign-up",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
    verifyEmail: "/verify-email",
    afterSignIn: "/dashboard",
    afterSignOut: "/",
    afterSignUp: "/dashboard",
  },

  // ─────────────────────────────────────────────────────────────
  // Route protection — middleware reads these
  // ─────────────────────────────────────────────────────────────
  protection: {
    // Routes that REQUIRE an authenticated session
    protectedPrefixes: ["/dashboard", "/settings", "/account"],
    // Auth pages — redirect to afterSignIn if already logged in
    publicAuthPrefixes: ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"],
  },

  // ─────────────────────────────────────────────────────────────
  // Email & password
  // ─────────────────────────────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,        // flip to true for prod
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,                       // auto sign in after sign up
    resetPasswordTokenExpiresIn: 60 * 60,   // 1 hour
  },

  // ─────────────────────────────────────────────────────────────
  // OAuth providers — gated by env vars being present
  // ─────────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────
  // Session & cookie behavior
  // ─────────────────────────────────────────────────────────────
  session: {
    expiresIn: 60 * 60 * 24 * 30,           // 30 days
    updateAge: 60 * 60 * 24,                // refresh once per day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,                       // 5 min — fast session reads
    },
  },

  // ─────────────────────────────────────────────────────────────
  // Cookies
  // ─────────────────────────────────────────────────────────────
  cookies: {
    prefix: "yourapp",
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
  },

  // ─────────────────────────────────────────────────────────────
  // Rate limiting
  // ─────────────────────────────────────────────────────────────
  rateLimit: {
    enabled: env.NODE_ENV === "production",
    window: 60,                             // seconds
    max: 100,                               // requests per window
  },

  // ─────────────────────────────────────────────────────────────
  // Email — used by sendResetPassword, sendVerificationEmail
  // ─────────────────────────────────────────────────────────────
  email: {
    from: env.EMAIL_FROM ?? "noreply@example.com",
    enabled: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
  },

  // ─────────────────────────────────────────────────────────────
  // Trusted origins for CORS / redirect safety
  // ─────────────────────────────────────────────────────────────
  trustedOrigins: [env.BETTER_AUTH_URL, env.NEXT_PUBLIC_APP_URL].filter(Boolean),
} as const;

export type AuthConfig = typeof authConfig;
```

---

## Step 4 — Drizzle setup

### 4.1 — `src/db/schema/_shared.ts`

```ts
import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
```

### 4.2 — `src/db/schema/auth.ts`

Better Auth requires four tables: `user`, `session`, `account`, `verification`. Use exactly these names (Better Auth conventions). Do NOT pluralize.

```ts
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
```

### 4.3 — `src/db/schema/index.ts`

```ts
export * from "./auth";
// re-export future schemas here
```

### 4.4 — `src/db/index.ts`

```ts
import "server-only";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { env } from "@/lib/env";
import * as schema from "./schema";

const sql = neon(env.DATABASE_URL);

export const db = drizzle({
  client: sql,
  schema,
  casing: "snake_case",
});

export type DB = typeof db;
```

### 4.5 — `drizzle.config.ts` (project root)

```ts
import { defineConfig } from "drizzle-kit";
import { env } from "@/lib/env";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
```

### 4.6 — `package.json` scripts

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

## Step 5 — Better Auth server instance (`src/lib/auth.ts`)

This file consumes `auth.config.ts` and produces the Better Auth instance. It MUST NOT contain hardcoded auth values — everything comes from the config.

```ts
import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { authConfig } from "@/auth.config";
import { env } from "@/lib/env";

// Build social providers map from config — only include enabled ones
const socialProviders: Record<string, { clientId: string; clientSecret: string; scope?: string[] }> = {};

if (authConfig.socialProviders.google.enabled) {
  socialProviders.google = {
    clientId: authConfig.socialProviders.google.clientId,
    clientSecret: authConfig.socialProviders.google.clientSecret,
    scope: authConfig.socialProviders.google.scopes,
  };
}

if (authConfig.socialProviders.github.enabled) {
  socialProviders.github = {
    clientId: authConfig.socialProviders.github.clientId,
    clientSecret: authConfig.socialProviders.github.clientSecret,
    scope: authConfig.socialProviders.github.scopes,
  };
}

export const auth = betterAuth({
  appName: authConfig.appName,
  baseURL: authConfig.baseUrl,
  secret: env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: authConfig.emailAndPassword.enabled,
    requireEmailVerification: authConfig.emailAndPassword.requireEmailVerification,
    minPasswordLength: authConfig.emailAndPassword.minPasswordLength,
    maxPasswordLength: authConfig.emailAndPassword.maxPasswordLength,
    autoSignIn: authConfig.emailAndPassword.autoSignIn,
    sendResetPassword: authConfig.email.enabled
      ? async ({ user, url }) => {
          // TODO: wire to Resend / your email provider
          // await sendEmail({ to: user.email, subject: "Reset your password", html: `<a href="${url}">Reset</a>` });
          console.log(`[dev] Reset password for ${user.email}: ${url}`);
        }
      : undefined,
  },

  socialProviders,

  session: {
    expiresIn: authConfig.session.expiresIn,
    updateAge: authConfig.session.updateAge,
    cookieCache: authConfig.session.cookieCache,
  },

  advanced: {
    cookiePrefix: authConfig.cookies.prefix,
    useSecureCookies: authConfig.cookies.secure,
    defaultCookieAttributes: {
      sameSite: authConfig.cookies.sameSite,
      secure: authConfig.cookies.secure,
    },
  },

  rateLimit: authConfig.rateLimit.enabled
    ? {
        enabled: true,
        window: authConfig.rateLimit.window,
        max: authConfig.rateLimit.max,
      }
    : undefined,

  trustedOrigins: authConfig.trustedOrigins,

  // nextCookies plugin — must be LAST
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
```

---

## Step 6 — Better Auth React client (`src/lib/auth-client.ts`)

```ts
"use client";

import { createAuthClient } from "better-auth/react";
import { authConfig } from "@/auth.config";

export const authClient = createAuthClient({
  baseURL: authConfig.baseUrl,
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  forgetPassword,
  resetPassword,
} = authClient;
```

---

## Step 7 — API route handler (`src/app/api/auth/[...all]/route.ts`)

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth.handler);
```

---

## Step 8 — Server-side helpers (`src/lib/auth-helpers.ts`)

```ts
import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { authConfig } from "@/auth.config";

/** Cached per-request session lookup. Safe to call repeatedly in RSC. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Use in protected Server Components / Actions. Redirects if no session. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect(authConfig.routes.signIn);
  return session;
}

/** Use on auth pages to bounce already-logged-in users away. */
export async function requireGuest() {
  const session = await getSession();
  if (session) redirect(authConfig.routes.afterSignIn);
}
```

---

## Step 9 — Middleware (`src/middleware.ts`)

The middleware reads protection rules from `auth.config.ts`. To protect a new route, add its prefix to `authConfig.protection.protectedPrefixes` — no middleware edits required.

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { authConfig } from "@/auth.config";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  const isProtected = authConfig.protection.protectedPrefixes.some((p) => pathname.startsWith(p));
  const isAuthPage = authConfig.protection.publicAuthPrefixes.some((p) => pathname.startsWith(p));

  // Logged-in user hitting an auth page → bounce to dashboard
  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL(authConfig.routes.afterSignIn, request.url));
  }

  // Not-logged-in user hitting a protected page → bounce to sign-in
  if (!sessionCookie && isProtected) {
    const url = new URL(authConfig.routes.signIn, request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

> ⚠️ Note: the middleware checks for cookie *presence*, not session validity. Always re-validate inside Server Components / Actions using `requireSession()`.

---

## Step 10 — UI components

Build minimal but production-quality forms in `src/components/auth/`. Use the project's existing design system (Tailwind + whatever component library is in use). Forms must:

- Use Server Actions OR `authClient` from the client — pick one per project, document the choice
- Read all routes from `authConfig.routes`
- Show inline error messages from Better Auth responses
- Disable submit button while pending
- Honor `?callbackUrl=` from middleware redirects

Required components:
- `sign-in-form.tsx` — email/password + social provider buttons (rendered conditionally based on `authConfig.socialProviders.*.enabled`)
- `sign-up-form.tsx`
- `sign-out-button.tsx`

---

## Step 11 — First-run workflow

After scaffolding, run these in order:

1. Copy `.env.example` → `.env.local` and fill in real values
2. Generate `BETTER_AUTH_SECRET`: `openssl rand -base64 32`
3. `<pkg> run db:generate` — creates initial migration in `./drizzle`
4. Review the generated SQL — sanity check
5. `<pkg> run db:migrate` — apply to Neon
6. `<pkg> run dev`
7. Visit `/sign-up`, create an account, verify the protected `/dashboard` route works

---

## Common modifications — where they go

| Task | File to edit |
|------|--------------|
| Add a new protected route | `auth.config.ts` → `protection.protectedPrefixes` |
| Rename `/sign-in` to `/login` | `auth.config.ts` → `routes.signIn` (then move the page folder) |
| Enable Google OAuth | Add `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` to `.env.local`, restart |
| Increase session lifetime | `auth.config.ts` → `session.expiresIn` |
| Require email verification | `auth.config.ts` → `emailAndPassword.requireEmailVerification = true` |
| Add a database column | Edit `src/db/schema/*.ts` → `db:generate` → review → `db:migrate` |
| Add a new auth-protected API endpoint | Use `requireSession()` from `auth-helpers.ts` |
| Tighten password rules | `auth.config.ts` → `emailAndPassword.minPasswordLength` |

---

## Anti-patterns — do NOT do these

- ❌ `import { db } from "@/db"` in a Client Component
- ❌ Hardcoding `"/sign-in"` in a redirect — always import from `authConfig.routes`
- ❌ Reading `process.env.X` directly — go through `env` from `@/lib/env`
- ❌ `drizzle-kit push` against a production database
- ❌ Putting OAuth secrets in `auth.config.ts` directly (they come from `env`)
- ❌ Pluralizing the auth tables (`users` instead of `user`) — Better Auth expects singular
- ❌ Manually typing `interface User { ... }` — use `typeof user.$inferSelect`
- ❌ Calling `auth.api.getSession` without `await headers()` — it needs the request headers
- ❌ Putting `nextCookies()` plugin anywhere except last in the plugins array
- ❌ Trusting middleware as the only protection — always re-check in Server Components

---

## Verification checklist

Before declaring the starter complete, verify:

- [ ] `<pkg> run build` succeeds with zero TS errors
- [ ] `.env.example` lists every var used in `env.ts`
- [ ] Sign-up → auto sign-in → land on `/dashboard` works
- [ ] Direct visit to `/dashboard` while logged out redirects to `/sign-in?callbackUrl=/dashboard`
- [ ] Visit to `/sign-in` while logged in redirects to `/dashboard`
- [ ] Sign-out clears the cookie and redirects to `/`
- [ ] Disabling Google in `.env.local` (remove vars) hides the Google button on next restart
- [ ] Renaming `routes.signIn` in `auth.config.ts` + moving the page folder updates all redirects
- [ ] Initial migration in `./drizzle` is committed
- [ ] No `any`, no `@ts-ignore`, no `process.env.X` outside `env.ts`

---

## When in doubt

- For Better Auth API specifics, consult the latest docs at https://www.better-auth.com/docs
- For Drizzle adapter table conventions, follow Better Auth's expected schema exactly
- For Neon-specific behavior (HTTP vs WebSocket driver), default to `neon-http` unless you need transactions
- If a decision isn't covered here, prefer the option that keeps `auth.config.ts` as the single source of truth