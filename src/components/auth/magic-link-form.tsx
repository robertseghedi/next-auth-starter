/**
 * Magic link sign-in form — client component.
 *
 * Sends a one-time sign-in link to the user's email.
 * Only rendered when `authConfig.plugins.magicLink.enabled` is true.
 */

"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authConfig } from "@/auth.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Captcha } from "@/components/auth/captcha";
import { useCaptcha } from "@/hooks/use-captcha";

export function MagicLinkForm() {
  const searchParams = useSearchParams();
  const callbackUrl =
    searchParams.get("callbackUrl") ?? authConfig.routes.afterSignIn;

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const { captchaToken, setCaptchaToken, captchaHeaders, isCaptchaRequired } = useCaptcha();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const { error } = await authClient.signIn.magicLink({
      email: email.trim(),
      callbackURL: callbackUrl,
      fetchOptions: { headers: captchaHeaders },
    });

    if (error) {
      setError(error.message ?? "Failed to send magic link.");
      setPending(false);
    } else {
      setSent(true);
      setPending(false);
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        Check your inbox — we sent a sign-in link to{" "}
        <span className="font-medium text-foreground">{email}</span>.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="magic-email">Email</Label>
        <Input
          id="magic-email"
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

      <Button type="submit" variant="outline" disabled={pending || (isCaptchaRequired && !captchaToken)}>
        {pending ? "Sending..." : "Send magic link"}
      </Button>
    </form>
  );
}
