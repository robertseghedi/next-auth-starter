/**
 * Sign-in form — method picker + animated form panels.
 *
 * UX flow:
 * 1. Social providers always visible at the top (if enabled)
 * 2. Below that, a method picker: Email, Magic Link, OTP, Phone, Passkey
 * 3. Selecting a method animates the corresponding form in
 * 4. "Back" returns to the method picker
 *
 * Everything conditional on authConfig.
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Mail,
  Wand2,
  KeyRound,
  Smartphone,
  Fingerprint,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { authConfig } from "@/auth.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MagicLinkForm } from "@/components/auth/magic-link-form";
import { EmailOTPForm } from "@/components/auth/email-otp-form";
import { PhoneSignInForm } from "@/components/auth/phone-sign-in-form";
import { GoogleIcon, GitHubIcon } from "@/components/auth/social-icons";
import { Captcha } from "@/components/auth/captcha";
import { useCaptcha } from "@/hooks/use-captcha";

type Method = "picker" | "email" | "magic-link" | "email-otp" | "phone";

const fadeSlide = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: { duration: 0.2, ease: "easeInOut" as const },
};


function MethodButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3.5 text-left text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
    </button>
  );
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl =
    searchParams.get("callbackUrl") ?? authConfig.routes.afterSignIn;

  const [method, setMethod] = useState<Method>("picker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const { captchaToken, setCaptchaToken, captchaHeaders, isCaptchaRequired } = useCaptcha();

  const hasSocialProviders =
    authConfig.socialProviders.google.enabled ||
    authConfig.socialProviders.github.enabled;

  // Count email-based methods to decide if we show method picker or direct form
  const emailMethods: { key: Method; icon: React.ElementType; label: string }[] = [];
  if (authConfig.emailAndPassword.enabled)
    emailMethods.push({ key: "email", icon: Mail, label: "Email & password" });
  if (authConfig.plugins.magicLink.enabled)
    emailMethods.push({ key: "magic-link", icon: Wand2, label: "Magic link" });
  if (authConfig.plugins.emailOTP.enabled)
    emailMethods.push({ key: "email-otp", icon: KeyRound, label: "Email code" });
  if (authConfig.plugins.phoneNumber.enabled)
    emailMethods.push({ key: "phone", icon: Smartphone, label: "Phone number" });

  const hasMultipleMethods = emailMethods.length > 1 || authConfig.plugins.passkey.enabled;

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const { error } = await authClient.signIn.email({
      email: email.trim(),
      password,
      callbackURL: callbackUrl,
      fetchOptions: { headers: captchaHeaders },
    });

    if (error) {
      setError(error.message ?? "Sign in failed.");
      setPending(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function handleSocial(provider: "google" | "github") {
    setPending(true);
    await authClient.signIn.social({
      provider,
      callbackURL: callbackUrl,
    });
  }

  async function handlePasskey() {
    setPending(true);
    try {
      await authClient.signIn.passkey({
        fetchOptions: {
          onSuccess() {
            router.push(callbackUrl);
            router.refresh();
          },
          onError(ctx) {
            setError(ctx.error.message ?? "Passkey authentication failed.");
            setPending(false);
          },
        },
      });
    } catch {
      setError("Passkey authentication was cancelled.");
      setPending(false);
    }
  }

  function goBack() {
    setMethod("picker");
    setError("");
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Social providers — always visible */}
      {hasSocialProviders && (
        <div className="flex gap-2">
          {authConfig.socialProviders.google.enabled && (
            <Button
              variant="outline"
              className="flex-1"
              disabled={pending}
              onClick={() => handleSocial("google")}
            >
              <GoogleIcon />
              Google
            </Button>
          )}
          {authConfig.socialProviders.github.enabled && (
            <Button
              variant="outline"
              className="flex-1"
              disabled={pending}
              onClick={() => handleSocial("github")}
            >
              <GitHubIcon />
              GitHub
            </Button>
          )}
        </div>
      )}

      {/* Separator */}
      {hasSocialProviders && emailMethods.length > 0 && (
        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or continue with</span>
          <Separator className="flex-1" />
        </div>
      )}

      {/* Animated panels */}
      <AnimatePresence mode="wait" initial={false}>
        {/* Method picker */}
        {method === "picker" && hasMultipleMethods && (
          <motion.div key="picker" {...fadeSlide} className="flex flex-col gap-2.5">
            {emailMethods.map((m) => (
              <MethodButton
                key={m.key}
                icon={m.icon}
                label={m.label}
                onClick={() => setMethod(m.key)}
                disabled={pending}
              />
            ))}
            {authConfig.plugins.passkey.enabled && (
              <MethodButton
                icon={Fingerprint}
                label="Passkey"
                onClick={handlePasskey}
                disabled={pending}
              />
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </motion.div>
        )}

        {/* Email/password — shown directly if it's the only method, or after selection */}
        {(method === "email" || (!hasMultipleMethods && authConfig.emailAndPassword.enabled)) && (
          <motion.div key="email" {...fadeSlide}>
            {hasMultipleMethods && (
              <button
                type="button"
                onClick={goBack}
                className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                All sign-in options
              </button>
            )}
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Captcha onVerify={setCaptchaToken} />

              <Button type="submit" disabled={pending || (isCaptchaRequired && !captchaToken)}>
                {pending ? "Signing in..." : "Sign in"}
              </Button>

              <Link
                href={authConfig.routes.forgotPassword}
                className="text-sm text-muted-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </form>
          </motion.div>
        )}

        {/* Magic link */}
        {method === "magic-link" && (
          <motion.div key="magic-link" {...fadeSlide}>
            <button
              type="button"
              onClick={goBack}
              className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              All sign-in options
            </button>
            <MagicLinkForm />
          </motion.div>
        )}

        {/* Email OTP */}
        {method === "email-otp" && (
          <motion.div key="email-otp" {...fadeSlide}>
            <button
              type="button"
              onClick={goBack}
              className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              All sign-in options
            </button>
            <EmailOTPForm />
          </motion.div>
        )}

        {/* Phone */}
        {method === "phone" && (
          <motion.div key="phone" {...fadeSlide}>
            <button
              type="button"
              onClick={goBack}
              className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              All sign-in options
            </button>
            <PhoneSignInForm />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
