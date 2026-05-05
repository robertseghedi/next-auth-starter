/**
 * Better Auth server instance.
 *
 * This file consumes both config files and produces the auth instance:
 * - `auth.config.ts` — shared config (routes, toggles, session, cookies)
 * - `auth.config.server.ts` — server-only config (secrets, OAuth creds, email)
 *
 * Why "server-only"?
 * ──────────────────
 * This file accesses the database and secrets. The `import "server-only"`
 * directive ensures Next.js throws a build error if anyone accidentally
 * imports it from a Client Component.
 *
 * Usage (server-side only):
 * ─────────────────────────
 *   import { auth } from "@/lib/auth";
 *   const session = await auth.api.getSession({ headers: await headers() });
 */

import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import {
  twoFactor,
  admin,
  username,
  bearer,
  multiSession,
  openAPI,
  magicLink,
  emailOTP,
  phoneNumber,
  captcha,
} from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { db } from "@/db";
import { authConfig } from "@/auth.config";
import { authServerConfig } from "@/auth.config.server";
import {
  sendMagicLinkEmail,
  sendResetPasswordEmail,
  sendOTPEmail,
} from "@/lib/email";
import * as schema from "@/db/schema";

// ─────────────────────────────────────────────────────────────────
// Build social providers map — credentials come from authServerConfig
// ─────────────────────────────────────────────────────────────────
const socialProviders: Record<
  string,
  { clientId: string; clientSecret: string; scope?: string[] }
> = {};

if (authServerConfig.socialProviders.google.enabled) {
  socialProviders.google = {
    clientId: authServerConfig.socialProviders.google.clientId,
    clientSecret: authServerConfig.socialProviders.google.clientSecret,
    scope: [...authServerConfig.socialProviders.google.scopes],
  };
}

if (authServerConfig.socialProviders.github.enabled) {
  socialProviders.github = {
    clientId: authServerConfig.socialProviders.github.clientId,
    clientSecret: authServerConfig.socialProviders.github.clientSecret,
    scope: [...authServerConfig.socialProviders.github.scopes],
  };
}

// ─────────────────────────────────────────────────────────────────
// Build plugins array — only include enabled ones.
// `nextCookies()` is always added LAST (Better Auth requirement).
// ─────────────────────────────────────────────────────────────────
const plugins = [
  ...(authConfig.plugins.twoFactor.enabled ? [twoFactor()] : []),
  ...(authConfig.plugins.admin.enabled
    ? [
        admin({
          defaultRole: authConfig.plugins.admin.defaultRole,
          adminRole: authConfig.plugins.admin.adminRole,
        }),
      ]
    : []),
  ...(authConfig.plugins.username.enabled ? [username()] : []),
  ...(authConfig.plugins.bearer.enabled ? [bearer()] : []),
  ...(authConfig.plugins.magicLink.enabled
    ? [
        magicLink({
          sendMagicLink: async ({ email, url }) => {
            await sendMagicLinkEmail(email, url);
          },
        }),
      ]
    : []),
  ...(authConfig.plugins.emailOTP.enabled
    ? [
        emailOTP({
          async sendVerificationOTP({ email, otp, type }) {
            await sendOTPEmail(email, otp, type);
          },
        }),
      ]
    : []),
  ...(authConfig.plugins.passkey.enabled
    ? [
        passkey({
          rpID: authServerConfig.passkey.rpID,
          rpName: authConfig.appName,
          origin: authServerConfig.passkey.origin,
        }),
      ]
    : []),
  /**
   * Phone Number — OTP-based phone authentication.
   *
   * IMPORTANT: You MUST implement the `sendOTP` function below using
   * YOUR OWN SMS provider. Better Auth generates the OTP code, but
   * delivery is entirely your responsibility.
   *
   * Popular SMS providers:
   *   - Twilio:     https://www.twilio.com/docs/sms
   *   - Vonage:     https://developer.vonage.com/en/messaging/sms
   *   - AWS SNS:    https://docs.aws.amazon.com/sns
   *   - Plivo:      https://www.plivo.com/docs/sms
   *   - MessageBird: https://developers.messagebird.com
   *
   * Example with Twilio:
   *   import twilio from "twilio";
   *   const client = twilio(ACCOUNT_SID, AUTH_TOKEN);
   *   await client.messages.create({
   *     body: `Your code is ${code}`,
   *     from: "+1234567890",
   *     to: phoneNumber,
   *   });
   */
  ...(authConfig.plugins.phoneNumber.enabled
    ? [
        phoneNumber({
          sendOTP: async ({ phoneNumber: phone, code }) => {
            // ⚠️ REPLACE THIS with your SMS provider integration.
            // This console.log is a placeholder — no SMS is actually sent.
            if (process.env.NODE_ENV === "development") {
              console.warn(
                `[phone] OTP for ${phone}: ${code} — implement your SMS provider in auth.ts`,
              );
            }
          },
        }),
      ]
    : []),
  ...(authConfig.plugins.multiSession.enabled ? [multiSession()] : []),
  ...(authConfig.plugins.captcha.enabled
    ? [
        captcha({
          provider: "cloudflare-turnstile",
          secretKey: authServerConfig.captcha.secretKey,
        }),
      ]
    : []),
  ...(authConfig.plugins.openAPI.enabled ? [openAPI()] : []),
  nextCookies(),
];

// ─────────────────────────────────────────────────────────────────
// The Better Auth instance
// ─────────────────────────────────────────────────────────────────
export const auth = betterAuth({
  appName: authConfig.appName,
  baseURL: authServerConfig.baseUrl,
  secret: authServerConfig.secret,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),

  emailAndPassword: {
    enabled: authConfig.emailAndPassword.enabled,
    requireEmailVerification:
      authConfig.emailAndPassword.requireEmailVerification,
    minPasswordLength: authConfig.emailAndPassword.minPasswordLength,
    maxPasswordLength: authConfig.emailAndPassword.maxPasswordLength,
    autoSignIn: authConfig.emailAndPassword.autoSignIn,
    sendResetPassword: authServerConfig.email.enabled
      ? async ({ user, url }) => {
          await sendResetPasswordEmail(user.email, url);
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

  trustedOrigins: authServerConfig.trustedOrigins,

  plugins,
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
