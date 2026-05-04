/**
 * Hook for managing Cloudflare Turnstile captcha state.
 *
 * Returns:
 * - `captchaToken`: current token (empty string if not verified yet)
 * - `setCaptchaToken`: setter for the token (passed to <Captcha onVerify={...} />)
 * - `captchaHeaders`: headers object to spread into fetchOptions
 * - `isCaptchaRequired`: whether captcha is enabled and token is needed
 *
 * Usage:
 *   const { captchaToken, setCaptchaToken, captchaHeaders, isCaptchaRequired } = useCaptcha();
 *
 *   await authClient.signIn.email({
 *     email, password,
 *     fetchOptions: { headers: captchaHeaders },
 *   });
 *
 *   <Captcha onVerify={setCaptchaToken} />
 *   <Button disabled={isCaptchaRequired && !captchaToken}>Submit</Button>
 */

"use client";

import { useState } from "react";
import { authConfig } from "@/auth.config";

export function useCaptcha() {
  const [captchaToken, setCaptchaToken] = useState("");

  const isCaptchaRequired = authConfig.plugins.captcha.enabled;

  const captchaHeaders: Record<string, string> = captchaToken
    ? { "x-captcha-response": captchaToken }
    : {};

  return {
    captchaToken,
    setCaptchaToken,
    captchaHeaders,
    isCaptchaRequired,
  };
}
