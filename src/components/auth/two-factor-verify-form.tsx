/**
 * Two-factor verification form — shown during sign-in when 2FA is required.
 * User enters their 6-digit TOTP code from their authenticator app,
 * or a backup code.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function TwoFactorVerifyForm() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [backupCode, setBackupCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleTOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const { error } = await authClient.twoFactor.verifyTotp({
      code,
    });

    if (error) {
      setError(error.message ?? "Invalid code.");
      setPending(false);
    } else {
      router.push(authConfig.routes.afterSignIn);
      router.refresh();
    }
  }

  async function handleBackup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const { error } = await authClient.twoFactor.verifyBackupCode({
      code: backupCode,
    });

    if (error) {
      setError(error.message ?? "Invalid backup code.");
      setPending(false);
    } else {
      router.push(authConfig.routes.afterSignIn);
      router.refresh();
    }
  }

  if (mode === "backup") {
    return (
      <form onSubmit={handleBackup} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="backup-code">Backup code</Label>
          <Input
            id="backup-code"
            type="text"
            placeholder="Enter a backup code"
            value={backupCode}
            onChange={(e) => setBackupCode(e.target.value)}
            required
            autoComplete="off"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={pending || !backupCode}>
          {pending ? "Verifying..." : "Verify backup code"}
        </Button>

        <button
          type="button"
          onClick={() => {
            setMode("totp");
            setError("");
          }}
          className="text-center text-sm text-muted-foreground hover:underline"
        >
          Use authenticator app instead
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleTOTP} className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit code from your authenticator app.
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
        {pending ? "Verifying..." : "Verify"}
      </Button>

      <button
        type="button"
        onClick={() => {
          setMode("backup");
          setError("");
        }}
        className="text-center text-sm text-muted-foreground hover:underline"
      >
        Use a backup code instead
      </button>
    </form>
  );
}
