/**
 * Email sending utility via Resend + React Email.
 *
 * Uses React Email components for templating and Resend for delivery.
 * Logs full request/response in development for debugging.
 */

import "server-only";

import { Resend } from "resend";
import { render } from "@react-email/components";
import { env } from "@/lib/env";
import { authServerConfig } from "@/auth.config.server";
import { authConfig } from "@/auth.config";
import { MagicLinkEmail } from "@/lib/emails/magic-link-email";
import { ResetPasswordEmail } from "@/lib/emails/reset-password-email";
import { OTPEmail } from "@/lib/emails/otp-email";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface SendOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
}

async function send({ to, subject, react }: SendOptions) {
  const html = await render(react);

  if (!resend) {
    console.warn("[email] Resend not configured (RESEND_API_KEY missing).");
    console.log("[email] To:", to);
    console.log("[email] Subject:", subject);
    console.log("[email] HTML:", html);
    return;
  }

  console.log(`[email] Sending to ${to} — "${subject}"`);

  const { data, error } = await resend.emails.send({
    from: authServerConfig.email.from,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[email] Resend error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to send email: ${error.message}`);
  }

  console.log("[email] Sent — id:", data?.id);
  return data;
}

export async function sendMagicLinkEmail(email: string, url: string) {
  return send({
    to: email,
    subject: `Sign in to ${authConfig.appName}`,
    react: MagicLinkEmail({ url, appName: authConfig.appName }),
  });
}

export async function sendResetPasswordEmail(email: string, url: string) {
  return send({
    to: email,
    subject: `Reset your ${authConfig.appName} password`,
    react: ResetPasswordEmail({ url, appName: authConfig.appName }),
  });
}

export async function sendOTPEmail(email: string, otp: string, type: string) {
  const subjectMap: Record<string, string> = {
    "sign-in": `Your ${authConfig.appName} sign-in code: ${otp}`,
    "email-verification": `Verify your ${authConfig.appName} email`,
    "forget-password": `Your ${authConfig.appName} password reset code`,
  };

  return send({
    to: email,
    subject: subjectMap[type] ?? `Your ${authConfig.appName} code: ${otp}`,
    react: OTPEmail({ otp, type, appName: authConfig.appName }),
  });
}
