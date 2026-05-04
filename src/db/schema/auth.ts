/**
 * Database schema for Better Auth + plugins.
 *
 * Core tables (required by Better Auth):
 *   - user, session, account, verification
 *
 * Plugin tables (added by enabled plugins):
 *   - twoFactor       → `twoFactor` table + fields on `user`
 *   - admin           → fields on `user` (role, banned, etc.)
 *
 * Table names MUST be singular (not "users") — Better Auth convention.
 * After editing, run: `bun run db:generate` → review → `bun run db:migrate`
 */

import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────────
// User — the core identity table
//
// Also contains fields added by plugins:
//   - twoFactor plugin:   `twoFactorEnabled`
//   - admin plugin:       `role`, `banned`, `banReason`, `banExpires`
//   - phoneNumber plugin: `phoneNumber`, `phoneNumberVerified`
// ─────────────────────────────────────────────────────────────────
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),

  // ── twoFactor plugin ───────────────────────────────────────────
  twoFactorEnabled: boolean("two_factor_enabled"),

  // ── admin plugin ───────────────────────────────────────────────
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),

  // ── phoneNumber plugin ─────────────────────────────────────────
  phoneNumber: text("phone_number").unique(),
  phoneNumberVerified: boolean("phone_number_verified"),
});

// ─────────────────────────────────────────────────────────────────
// Session — one active session per device/browser
// ─────────────────────────────────────────────────────────────────
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

});

// ─────────────────────────────────────────────────────────────────
// Account — links a user to an auth provider
// ─────────────────────────────────────────────────────────────────
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

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─────────────────────────────────────────────────────────────────
// Verification — time-limited tokens for email verification,
// password reset, and other verification flows
// ─────────────────────────────────────────────────────────────────
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─────────────────────────────────────────────────────────────────
// twoFactor plugin — stores TOTP secrets and backup codes
// ─────────────────────────────────────────────────────────────────
export const twoFactor = pgTable("twoFactor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  verified: boolean("verified").notNull().default(false),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

// ─────────────────────────────────────────────────────────────────
// passkey plugin — WebAuthn credential storage
// ─────────────────────────────────────────────────────────────────
export const passkey = pgTable("passkey", {
  id: text("id").primaryKey(),
  name: text("name"),
  publicKey: text("public_key").notNull(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  credentialID: text("credential_id").notNull(),
  counter: integer("counter").notNull(),
  deviceType: text("device_type").notNull(),
  backedUp: boolean("backed_up").notNull(),
  transports: text("transports"),
  aaguid: text("aaguid"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─────────────────────────────────────────────────────────────────
// Inferred types
// ─────────────────────────────────────────────────────────────────
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
