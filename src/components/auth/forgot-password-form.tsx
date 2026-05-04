/**
 * Forgot password form — client component.
 * Sends a password reset email via authClient.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { authConfig } from "@/auth.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Captcha } from "@/components/auth/captcha";
import { useCaptcha } from "@/hooks/use-captcha";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const { captchaToken, setCaptchaToken, captchaHeaders, isCaptchaRequired } = useCaptcha();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const { error } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: authConfig.routes.resetPassword,
      fetchOptions: { headers: captchaHeaders },
    });

    if (error) {
      setError(error.message ?? "Failed to send reset email.");
      setPending(false);
    } else {
      setSent(true);
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          If an account with that email exists, we sent a password reset link.
          Check your inbox.
        </p>
        <Link href={authConfig.routes.signIn}>
          <Button variant="outline" className="w-full">
            Back to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Captcha onVerify={setCaptchaToken} />

      <Button type="submit" disabled={pending || (isCaptchaRequired && !captchaToken)}>
        {pending ? "Sending..." : "Send reset link"}
      </Button>

      <Link
        href={authConfig.routes.signIn}
        className="text-center text-sm text-muted-foreground hover:underline"
      >
        Back to sign in
      </Link>
    </form>
  );
}
