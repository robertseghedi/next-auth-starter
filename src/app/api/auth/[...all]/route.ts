/**
 * Better Auth catch-all API route handler.
 *
 * All auth requests (sign-in, sign-up, OAuth callbacks, session checks, etc.)
 * are handled by Better Auth through this single route at `/api/auth/*`.
 *
 * `toNextJsHandler` converts Better Auth's generic handler into
 * Next.js App Router-compatible GET and POST exports.
 */

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
