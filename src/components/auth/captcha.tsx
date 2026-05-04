/**
 * Cloudflare Turnstile captcha widget — managed (invisible) mode.
 *
 * Invisible by default. Turnstile auto-verifies in the background.
 * Only shows a visible challenge if it suspects bot activity.
 *
 * Usage:
 *   const { captchaToken, setCaptchaToken } = useCaptcha();
 *   <Captcha onVerify={setCaptchaToken} />
 */

"use client";

import { Turnstile } from "react-turnstile";
import { authConfig } from "@/auth.config";

interface CaptchaProps {
  onVerify: (token: string) => void;
}

export function Captcha({ onVerify }: CaptchaProps) {
  if (!authConfig.plugins.captcha.enabled) return null;

  return (
    <Turnstile
      sitekey={authConfig.plugins.captcha.siteKey}
      onVerify={onVerify}
      appearance="interaction-only"
      size="flexible"
    />
  );
}
