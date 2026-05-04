/**
 * Reset password form — client component.
 * Reads the token from the URL and submits the new password.
 */

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { authConfig } from "@/auth.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!token) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-destructive">
          Invalid or missing reset token.
        </p>
        <Link href={authConfig.routes.forgotPassword}>
          <Button variant="outline" className="w-full">
            Request a new link
          </Button>
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const { error } = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    });

    if (error) {
      setError(error.message ?? "Failed to reset password.");
      setPending(false);
    } else {
      router.push(authConfig.routes.signIn);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={authConfig.emailAndPassword.minPasswordLength}
          maxLength={authConfig.emailAndPassword.maxPasswordLength}
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground">
          At least {authConfig.emailAndPassword.minPasswordLength} characters
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Resetting..." : "Reset password"}
      </Button>
    </form>
  );
}
