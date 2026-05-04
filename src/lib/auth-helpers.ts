/**
 * Server-side auth helpers — used in Server Components and Server Actions.
 *
 * These functions wrap `auth.api.getSession()` with caching and redirects
 * so you don't have to repeat the same boilerplate in every page.
 *
 * Why "server-only"?
 * ──────────────────
 * These functions access the auth instance (which touches the DB).
 * The directive ensures a build error if imported from a Client Component.
 *
 * Why `cache()`?
 * ──────────────
 * React's `cache()` deduplicates calls within a single request.
 * If multiple Server Components call `getSession()` in one render,
 * only ONE database query is made. Subsequent calls return the cached result.
 *
 * Usage:
 * ──────
 *   // In a protected page (Server Component):
 *   const session = await requireSession(); // redirects if not logged in
 *
 *   // In a page where you want optional session data:
 *   const session = await getSession(); // returns null if not logged in
 *
 *   // On auth pages (sign-in, sign-up) to bounce logged-in users:
 *   await requireGuest(); // redirects if already logged in
 */

import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { authConfig } from "@/auth.config";

/**
 * Cached per-request session lookup.
 * Safe to call multiple times in the same render — only one DB query.
 * Returns the session object or null if not authenticated.
 */
export const getSession = cache(async () => {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
});

/**
 * Use in protected Server Components and Server Actions.
 * Redirects to the sign-in page if there's no active session.
 * Returns the session object (guaranteed non-null).
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect(authConfig.routes.signIn);
  return session;
}

/**
 * Use on auth pages (sign-in, sign-up, etc.) to bounce
 * already-logged-in users to the dashboard.
 */
export async function requireGuest() {
  const session = await getSession();
  if (session) redirect(authConfig.routes.afterSignIn);
}
