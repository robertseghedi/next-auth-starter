/**
 * Next.js 16 Proxy — route protection driven by auth.config.ts.
 *
 * Replaces the deprecated `middleware.ts` convention.
 * The exported function MUST be named `proxy` (not `middleware`).
 * Runs on the Node.js runtime (not Edge) before routes are rendered.
 *
 * How it works:
 * ─────────────
 * 1. Checks for the presence of a session cookie (fast, no DB call).
 * 2. If the user is logged in and hits an auth page (sign-in, sign-up),
 *    they're redirected to the dashboard.
 * 3. If the user is NOT logged in and hits a protected page,
 *    they're redirected to sign-in with a `callbackUrl` param
 *    so they land back on the original page after authentication.
 *
 * Important:
 * ──────────
 * This proxy only checks cookie PRESENCE, not session VALIDITY.
 * Always re-validate inside Server Components using `requireSession()`.
 * The proxy is just an optimistic redirect for better UX.
 *
 * To protect a new route:
 * ──────────────────────
 * Add its prefix to `authConfig.protection.protectedPrefixes` in
 * `auth.config.ts` — no proxy edits needed.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { authConfig } from "@/auth.config";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: authConfig.cookies.prefix,
  });

  /** Check if the current path matches any protected route prefix */
  const isProtected = authConfig.protection.protectedPrefixes.some((p) =>
    pathname.startsWith(p),
  );

  /** Check if the current path is an auth page (sign-in, sign-up, etc.) */
  const isAuthPage = authConfig.protection.publicAuthPrefixes.some((p) =>
    pathname.startsWith(p),
  );

  // Logged-in user hitting an auth page → bounce to dashboard
  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(
      new URL(authConfig.routes.afterSignIn, request.url),
    );
  }

  // Not-logged-in user hitting a protected page → bounce to sign-in
  if (!sessionCookie && isProtected) {
    const url = new URL(authConfig.routes.signIn, request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/**
 * Matcher config — run proxy on all routes EXCEPT:
 * - /api (API routes handle their own auth)
 * - /_next/static (static assets)
 * - /_next/image (image optimization)
 * - /favicon.ico
 */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
