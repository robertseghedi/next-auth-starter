# CLAUDE.md — Auth Starter Reference

This is an already-built, production-ready Next.js 16 authentication starter. **Do not rebuild it from scratch.** This file tells you how the codebase works so you can extend it correctly.

---

## Core principle

**`src/auth.config.ts` is the single source of truth** for all auth behavior. Routes, plugins, session/cookie settings, social providers, and feature toggles all live here. Every other auth file reads from this config. When the user wants to change auth behavior, the answer is almost always "edit `auth.config.ts`".

---

## Tech stack

- **Framework**: Next.js 16 (App Router, Server Components, `proxy.ts` not `middleware.ts`)
- **Auth**: Better Auth (with plugins)
- **ORM**: Drizzle ORM + Neon Postgres (HTTP driver)
- **Env**: T3 Env (`@t3-oss/env-nextjs`) + Zod
- **UI**: shadcn/ui (radix-luma style) + Tailwind CSS + Framer Motion
- **Email**: Resend + React Email templates
- **Captcha**: Cloudflare Turnstile
- **Package manager**: bun

---

## Non-negotiable rules

1. **`auth.config.ts` is the single source of truth.** Never hardcode `"/sign-in"`, `60 * 60 * 24 * 7`, or feature flags anywhere else.
2. **Two config files exist:**
   - `src/auth.config.ts` — shared between server and client. Must NOT import `env.ts`. Uses only `process.env.NEXT_PUBLIC_*` and `process.env.NODE_ENV`.
   - `src/auth.config.server.ts` — server-only (`import "server-only"`). Contains secrets, OAuth credentials, email config, passkey config, captcha secret.
3. **`import "server-only"`** must appear at the top of: `auth.ts`, `auth.config.server.ts`, `auth-helpers.ts`, `email.ts`, `db/index.ts`.
4. **Pages are Server Components.** Only leaf interactive components (forms, buttons) use `"use client"`.
5. **No raw SQL.** Everything goes through Drizzle.
6. **Schema types come from `$inferSelect` / `$inferInsert`.** Extended user fields are typed in `src/lib/types.ts` (`SessionUser`).
7. **No client-side secrets.** The auth client (`auth-client.ts`) only knows the base URL.
8. **`nextCookies()` must be the LAST plugin** in the Better Auth plugins array.
9. **`bun` is the package manager.** Not npm, not pnpm.

---

## File map

```
src/
├── auth.config.ts                  # Shared config (routes, toggles, plugins, session, cookies)
├── auth.config.server.ts           # Server-only config (secrets, OAuth creds, email, passkey, captcha)
│
├── app/
│   ├── page.tsx                    # Landing page (shows auth status + active plugins)
│   ├── layout.tsx                  # Root layout
│   ├── (auth)/                     # Auth pages — all use requireGuest()
│   │   ├── sign-in/page.tsx        # → <AuthCard /> (tabbed sign-in/sign-up)
│   │   ├── sign-up/page.tsx        # → <AuthCard /> (same component, different tab)
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── two-factor/page.tsx     # 2FA verification during sign-in
│   ├── (app)/
│   │   └── dashboard/page.tsx      # Protected — shows security settings
│   └── api/auth/[...all]/route.ts  # Better Auth catch-all handler
│
├── lib/
│   ├── env.ts                      # T3 Env validation (all env vars defined here)
│   ├── auth.ts                     # Better Auth server instance (consumes both configs)
│   ├── auth-client.ts              # Better Auth React client + client plugins
│   ├── auth-helpers.ts             # getSession(), requireSession(), requireGuest()
│   ├── email.ts                    # Resend sender (sendMagicLinkEmail, sendResetPasswordEmail, sendOTPEmail)
│   ├── emails/                     # React Email templates
│   │   ├── magic-link-email.tsx
│   │   ├── reset-password-email.tsx
│   │   └── otp-email.tsx
│   └── types.ts                    # SessionUser type (extends Better Auth user with plugin fields)
│
├── db/
│   ├── index.ts                    # Drizzle client (server-only, Neon HTTP)
│   └── schema/
│       ├── auth.ts                 # All tables: user, session, account, verification, twoFactor, passkey
│       └── index.ts                # Barrel export
│
├── components/auth/                # All auth UI components ("use client")
│   ├── auth-card.tsx               # Tabbed Sign In / Sign Up with Framer Motion animations
│   ├── auth-background.tsx         # Dot grid SVG background for auth pages
│   ├── sign-in-form.tsx            # Method picker → email/password, magic link, email OTP, phone, passkey
│   ├── sign-up-form.tsx            # Email/password + social providers
│   ├── sign-out-button.tsx
│   ├── forgot-password-form.tsx
│   ├── reset-password-form.tsx
│   ├── magic-link-form.tsx
│   ├── email-otp-form.tsx          # Two-step: enter email → enter 6-digit code
│   ├── phone-sign-in-form.tsx      # Two-step: enter phone → enter SMS code
│   ├── phone-link.tsx              # Link/change phone number from dashboard (dialog)
│   ├── two-factor-setup.tsx        # Enable/disable 2FA (multi-step dialog with QR code)
│   ├── two-factor-verify-form.tsx  # TOTP code + backup code input
│   ├── passkey-manage.tsx          # Register/list/delete passkeys
│   ├── captcha.tsx                 # Cloudflare Turnstile widget (invisible mode)
│   └── social-icons.tsx            # Google/GitHub SVG icons (shared)
│
├── hooks/
│   └── use-captcha.ts              # Captcha token state + fetchOptions headers
│
└── proxy.ts                        # Route protection (Next.js 16 — NOT middleware.ts)
```

---

## How auth.config.ts works

This file is imported by BOTH server and client code. It must never import `env.ts` (which contains server secrets). It uses `process.env.NEXT_PUBLIC_*` for values that need to be on the client.

### Key sections:
- **`appName`** / **`baseUrl`** — app identity
- **`routes`** — all auth route paths + redirect targets + legal page links
- **`protection`** — arrays of path prefixes for protected and public-auth routes
- **`emailAndPassword`** — toggle, password rules, auto sign-in
- **`socialProviders`** — `{ google: { enabled: true }, github: { enabled: true } }` (UI toggle only, credentials are in `auth.config.server.ts`)
- **`plugins`** — each has an `enabled` boolean. Some have extra config (e.g. `admin.defaultRole`).
- **`session`** — expiresIn, updateAge, cookieCache
- **`cookies`** — prefix, secure, sameSite
- **`rateLimit`** — enabled in production only

### Social providers hydration note
Social provider `enabled` flags are static booleans, NOT derived from `process.env.GOOGLE_CLIENT_ID`. This is because server-only env vars aren't available on the client, which causes hydration mismatch. Set them to `true`/`false` manually.

---

## Plugins currently enabled

| Plugin | Server import | Client import | DB tables/fields |
|--------|--------------|---------------|-----------------|
| twoFactor | `better-auth/plugins` | `twoFactorClient` | `twoFactor` table, `twoFactorEnabled` on user |
| admin | `better-auth/plugins` | `adminClient` | `role`, `banned`, `banReason`, `banExpires` on user |
| username | `better-auth/plugins` | `usernameClient` | `username`, `displayUsername` on user (disabled by default) |
| bearer | `better-auth/plugins` | — (server-only) | None |
| magicLink | `better-auth/plugins` | `magicLinkClient` | None |
| emailOTP | `better-auth/plugins` | `emailOTPClient` | None |
| passkey | `@better-auth/passkey` | `passkeyClient` from `@better-auth/passkey/client` | `passkey` table |
| phoneNumber | `better-auth/plugins` | `phoneNumberClient` | `phoneNumber`, `phoneNumberVerified` on user |
| multiSession | `better-auth/plugins` | `multiSessionClient` | None |
| captcha | `better-auth/plugins` | — (invisible Turnstile widget) | None |
| openAPI | `better-auth/plugins` | — (server-only) | None |

---

## How to add a new feature

### New protected route
1. Add prefix to `authConfig.protection.protectedPrefixes`
2. In the page's Server Component, call `await requireSession()`

### New plugin
1. Add toggle to `authConfig.plugins` in `auth.config.ts`
2. Add server plugin to the `plugins` array in `auth.ts` (before `nextCookies()`)
3. Add client plugin to the `plugins` array in `auth-client.ts`
4. If plugin adds DB fields/tables, update `db/schema/auth.ts` and run `bun run db:push`
5. If plugin needs UI, add component to `components/auth/` and render conditionally based on the config toggle

### New email template
1. Create in `src/lib/emails/` using React Email components
2. Add send function in `src/lib/email.ts`
3. Wire it in `auth.ts` in the relevant plugin's callback

### New env var
1. Add to `src/lib/env.ts` (server or client section + runtimeEnv mapping)
2. Add to `.env.example`
3. If it's a secret, add to `auth.config.server.ts`. If it's public, use directly in `auth.config.ts` via `process.env.NEXT_PUBLIC_*`

---

## How sign-in works (UX flow)

The sign-in page renders `<AuthCard />` which contains tabs (Sign In / Sign Up) with Framer Motion animations.

The sign-in form (`sign-in-form.tsx`) uses a **method picker** pattern:
1. Social provider buttons always visible at top (Google, GitHub — if enabled)
2. Below separator, a list of method buttons with icons: Email & password, Magic link, Email code, Phone number, Passkey
3. Clicking a method slides the corresponding form in (animated with Framer Motion)
4. "← All sign-in options" button to go back
5. If only one method exists, it renders directly without the picker

All forms include captcha (invisible Turnstile) when `plugins.captcha.enabled` is true.

---

## How the proxy works

`src/proxy.ts` (Next.js 16 convention, replaces `middleware.ts`):
- Checks session cookie **presence** (not validity) using `getSessionCookie()` with `cookiePrefix` from config
- Redirects unauthenticated users from protected routes to sign-in (with `?callbackUrl=`)
- Redirects authenticated users from auth pages to dashboard
- **Never trust the proxy alone** — always re-validate with `requireSession()` in Server Components

---

## How captcha works

- Component: `components/auth/captcha.tsx` — renders Turnstile in `interaction-only` mode (invisible)
- Hook: `hooks/use-captcha.ts` — manages token state, provides `captchaHeaders` for fetch
- Every auth form includes `<Captcha onVerify={setCaptchaToken} />` and passes `fetchOptions: { headers: captchaHeaders }` to Better Auth calls
- Auto-enabled when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set

---

## How email works

- `src/lib/email.ts` — centralized sender using Resend + React Email `render()`
- Three functions: `sendMagicLinkEmail`, `sendResetPasswordEmail`, `sendOTPEmail`
- Templates in `src/lib/emails/` — inline CSS styles (email client compatible), zinc color palette, rounded buttons
- If `RESEND_API_KEY` is missing, logs the HTML to console instead of crashing

---

## How phone number works

- `sendOTP` in `auth.ts` is a **stub** — logs to console in development only
- **You must implement your own SMS provider** (Twilio, Vonage, AWS SNS, etc.)
- Dashboard component `phone-link.tsx` lets users link/change their phone number via a dialog

---

## Session user type

`src/lib/types.ts` defines `SessionUser` which extends the base Better Auth user with plugin fields:
```ts
interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  twoFactorEnabled?: boolean;
  phoneNumber?: string | null;
  phoneNumberVerified?: boolean;
  role?: string;
  banned?: boolean;
}
```

Use this instead of `Record<string, unknown>` when accessing session user data in client components.

---

## Anti-patterns — do NOT do these

- Importing `env.ts` in `auth.config.ts` (causes server vars to leak to client)
- Importing `db` or `auth` in a Client Component (missing `"server-only"`)
- Hardcoding route strings — use `authConfig.routes`
- Reading `process.env.X` directly — use `env` from `@/lib/env`
- Writing `interface User { ... }` by hand — use `typeof user.$inferSelect` or `SessionUser`
- Pluralizing table names (`users` instead of `user`)
- Putting `nextCookies()` anywhere except last in plugins array
- Running `drizzle-kit push` in production — use `generate` + `migrate`
- Deriving social provider `enabled` from server env vars in `auth.config.ts` (hydration mismatch)
- Trusting the proxy as the only protection — always re-check with `requireSession()` in Server Components

---

## Database commands

```bash
bun run db:push      # Dev only: push schema directly to Neon
bun run db:generate  # Generate SQL migration files in ./drizzle
bun run db:migrate   # Apply pending migrations
bun run db:studio    # Open Drizzle Studio (visual DB browser)
```

---

## When in doubt

- Better Auth docs: https://www.better-auth.com/docs
- Table names must be singular (Better Auth convention)
- Default to `neon-http` driver unless you need transactions
- Keep `auth.config.ts` as the single source of truth
- If a plugin toggle is off, its UI, server code, and client code should all be skipped automatically via conditional checks on `authConfig.plugins.xxx.enabled`
