/**
 * Email OTP sign-in form — two-step: enter email, then enter code.
 * Only rendered when `authConfig.plugins.emailOTP.enabled` is true.
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authConfig } from "@/auth.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Captcha } from "@/components/auth/captcha";
import { useCaptcha } from "@/hooks/use-captcha";

export function EmailOTPForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl =
    searchParams.get("callbackUrl") ?? authConfig.routes.afterSignIn;

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const { captchaToken, setCaptchaToken, captchaHeaders, isCaptchaRequired } = useCaptcha();

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: email.trim(),
      type: "sign-in",
      fetchOptions: { headers: captchaHeaders },
    });

    if (error) {
      setError(error.message ?? "Failed to send code.");
      setPending(false);
    } else {
      setStep("code");
      setPending(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const { error } = await authClient.signIn.emailOtp({
      email: email.trim(),
      otp,
      fetchOptions: { headers: captchaHeaders },
    });

    if (error) {
      setError(error.message ?? "Invalid code.");
      setPending(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  if (step === "code") {
    return (
      <form onSubmit={handleVerifyOTP} className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to{" "}
          <span className="font-medium text-foreground">{email}</span>
        </p>

        <div className="flex justify-center">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Captcha onVerify={setCaptchaToken} />

        <Button type="submit" disabled={pending || otp.length < 6 || (isCaptchaRequired && !captchaToken)}>
          {pending ? "Verifying..." : "Verify code"}
        </Button>

        <button
          type="button"
          onClick={() => {
            setStep("email");
            setOtp("");
            setError("");
          }}
          className="text-center text-sm text-muted-foreground hover:underline"
        >
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOTP} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="otp-email">Email</Label>
        <Input
          id="otp-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Sending..." : "Send sign-in code"}
      </Button>
    </form>
  );
}
