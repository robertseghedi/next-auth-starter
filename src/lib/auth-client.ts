/**
 * Better Auth React client — used in Client Components.
 *
 * This is the ONLY auth file safe to import from "use client" components.
 * It knows nothing about the database or secrets — just the base URL.
 *
 * Plugins are registered here on the client side too, mirroring the
 * server config. Each client plugin unlocks additional methods on
 * `authClient` (e.g. `authClient.twoFactor.enable()`,
 * `authClient.twoFactor.enable()`, etc.).
 *
 * Usage:
 * ──────
 *   import { authClient, useSession } from "@/lib/auth-client";
 *
 *   // In a component:
 *   const { data: session, isPending } = useSession();
 *
 *   // Sign in with email/password:
 *   await authClient.signIn.email({ email, password });
 *
 *   // Sign in with a social provider:
 *   await authClient.signIn.social({ provider: "google" });
 *
 *   // Enable 2FA (when plugin is active):
 *   await authClient.twoFactor.enable({ password });
 *
 */

"use client";

import { createAuthClient } from "better-auth/react";
import {
  twoFactorClient,
  adminClient,
  usernameClient,
  magicLinkClient,
  emailOTPClient,
  phoneNumberClient,
  multiSessionClient,
} from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { authConfig } from "@/auth.config";

// ─────────────────────────────────────────────────────────────────
// Build client plugins array from config — mirrors the server plugins.
// Each client plugin adds typed methods to the authClient instance.
// ─────────────────────────────────────────────────────────────────
const plugins = [
  /**
   * 2FA client — adds `authClient.twoFactor.*` methods:
   *   .enable()    — start 2FA setup, returns QR code URI
   *   .verify()    — verify a TOTP code
   *   .disable()   — disable 2FA
   *
   * `onTwoFactorRedirect` fires when the server requires 2FA verification
   * during sign-in. Redirect the user to your 2FA page here.
   */
  ...(authConfig.plugins.twoFactor.enabled
    ? [
        twoFactorClient({
          onTwoFactorRedirect() {
            window.location.href = authConfig.routes.twoFactor;
          },
        }),
      ]
    : []),

  /**
   * Admin client — adds `authClient.admin.*` methods:
   *   .listUsers()     — paginated user list
   *   .banUser()       — ban a user with reason/expiry
   *   .unbanUser()     — remove ban
   *   .setRole()       — change a user's role
   *   .removeUser()    — delete a user
   */
  ...(authConfig.plugins.admin.enabled ? [adminClient()] : []),

  /**
   * Username client — extends sign-up to accept a `username` field:
   *   authClient.signUp.email({ email, password, name, username })
   */
  ...(authConfig.plugins.username.enabled ? [usernameClient()] : []),

  /**
   * Multi-session client — adds `authClient.multiSession.*` methods:
   *   .listSessions()   — get all active sessions
   *   .setActive()      — switch to a different session
   *   .revoke()         — remove a session
   */
  ...(authConfig.plugins.multiSession.enabled
    ? [multiSessionClient()]
    : []),

  /**
   * Magic Link client — adds `authClient.magicLink.*` methods:
   *   .signIn()   — send a magic link email
   *   .verify()   — verify a magic link token
   */
  ...(authConfig.plugins.magicLink.enabled
    ? [magicLinkClient()]
    : []),

  /**
   * Email OTP client — adds `authClient.emailOtp.*` methods:
   *   .sendVerificationOtp() — send a 6-digit code
   *   .verifyEmail()         — verify the code
   */
  ...(authConfig.plugins.emailOTP.enabled ? [emailOTPClient()] : []),

  /**
   * Passkey client — adds `authClient.passkey.*` and `authClient.signIn.passkey()`:
   *   .addPasskey()       — register a new passkey (Face ID, Touch ID, etc.)
   *   .listUserPasskeys() — list registered passkeys
   *   .deletePasskey()    — remove a passkey
   *   signIn.passkey()    — sign in with a registered passkey
   */
  ...(authConfig.plugins.passkey.enabled ? [passkeyClient()] : []),

  /**
   * Phone Number client — adds `authClient.phoneNumber.*` methods:
   *   .sendOtp()  — request an OTP to the user's phone
   *   .verify()   — verify the OTP code
   */
  ...(authConfig.plugins.phoneNumber.enabled ? [phoneNumberClient()] : []),

  // Note: bearer and openAPI are server-only plugins — no client counterpart needed.
];

/**
 * The auth client instance.
 * `baseURL` tells it where the Better Auth API route is mounted.
 * Since we mount it at `/api/auth/[...all]`, the base URL is just the app URL.
 */
export const authClient = createAuthClient({
  baseURL: authConfig.baseUrl,
  plugins,
});

/**
 * Convenience export for the `useSession` hook.
 * This is the most commonly used client-side function,
 * so we export it directly for cleaner imports:
 *
 *   import { useSession } from "@/lib/auth-client";
 */
export const { useSession } = authClient;
