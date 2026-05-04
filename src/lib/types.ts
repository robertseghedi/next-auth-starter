/**
 * Extended session user type — includes fields added by Better Auth plugins.
 *
 * Use this instead of `Record<string, unknown>` casts when accessing
 * plugin-specific fields on `session.user`.
 */

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Plugin: twoFactor
  twoFactorEnabled?: boolean;

  // Plugin: phoneNumber
  phoneNumber?: string | null;
  phoneNumberVerified?: boolean;

  // Plugin: admin
  role?: string;
  banned?: boolean;
}
