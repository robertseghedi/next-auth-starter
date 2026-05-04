/**
 * Phone number OTP sign-in form — two-step: enter phone, then enter code.
 * Only rendered when `authConfig.plugins.phoneNumber.enabled` is true.
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

export function PhoneSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl =
    searchParams.get("callbackUrl") ?? authConfig.routes.afterSignIn;

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const { error } = await authClient.phoneNumber.sendOtp({
      phoneNumber: phone,
    });

    if (error) {
      setError(error.message ?? "Failed to send code.");
      setPending(false);
    } else {
      setStep("code");
      setPending(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const { error } = await authClient.phoneNumber.verify({
      phoneNumber: phone,
      code,
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
      <form onSubmit={handleVerify} className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to{" "}
          <span className="font-medium text-foreground">{phone}</span>
        </p>

        <div className="flex justify-center">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
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

        <Button type="submit" disabled={pending || code.length < 6}>
          {pending ? "Verifying..." : "Verify code"}
        </Button>

        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setCode("");
            setError("");
          }}
          className="text-center text-sm text-muted-foreground hover:underline"
        >
          Use a different number
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOTP} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 234 567 8900"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoComplete="tel"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Sending..." : "Send code via SMS"}
      </Button>
    </form>
  );
}
