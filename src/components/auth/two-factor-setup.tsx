/**
 * Two-factor setup — dialog-based multi-step flow.
 *
 * Steps:
 * 1. Enter password → enable 2FA
 * 2. Scan QR code
 * 3. Save backup codes
 * 4. Verify TOTP code
 * 5. Done
 *
 * Each step animates in/out with framer-motion.
 */

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, ShieldOff, Copy, Check, ArrowRight } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";
import type { SessionUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type Step = "password" | "qr" | "backup" | "verify" | "done";

const slide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.15, ease: "easeInOut" as const },
};

export function TwoFactorSetup() {
  const { data: session } = useSession();
  const is2FAEnabled = (session?.user as SessionUser | undefined)
    ?.twoFactorEnabled;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("password");
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  function openDialog() {
    setStep("password");
    setPassword("");
    setVerifyCode("");
    setError("");
    setCopied(false);
    setOpen(true);
  }

  async function handleEnable() {
    setError("");
    setPending(true);

    const { data, error } = await authClient.twoFactor.enable({ password });

    if (error) {
      setError(error.message ?? "Failed to enable 2FA.");
      setPending(false);
      return;
    }

    setTotpURI(data?.totpURI ?? "");
    setBackupCodes(data?.backupCodes ?? []);
    setStep("qr");
    setPending(false);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const { error } = await authClient.twoFactor.verifyTotp({ code: verifyCode });

    if (error) {
      setError(error.message ?? "Invalid code.");
      setPending(false);
    } else {
      setStep("done");
      setPending(false);
    }
  }

  async function handleDisable() {
    setError("");
    setPending(true);

    const { error } = await authClient.twoFactor.disable({ password });

    if (error) {
      setError(error.message ?? "Failed to disable 2FA.");
      setPending(false);
    } else {
      setOpen(false);
      setPassword("");
      setPending(false);
    }
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Trigger button (shown on dashboard) ──────────────────────
  const trigger = is2FAEnabled ? (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <ShieldCheck className="size-4 text-emerald-500" />
        <span className="text-muted-foreground">2FA is enabled</span>
      </div>
      <Button variant="outline" size="sm" onClick={openDialog}>
        <ShieldOff className="size-3.5" />
        Disable
      </Button>
    </div>
  ) : (
    <Button onClick={openDialog}>
      <ShieldCheck className="size-4" />
      Enable 2FA
    </Button>
  );

  return (
    <>
      {trigger}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={step !== "done"}>
          <AnimatePresence mode="wait" initial={false}>
            {/* Step 1: Password */}
            {step === "password" && (
              <motion.div key="password" {...slide} className="flex flex-col gap-4">
                <DialogHeader>
                  <DialogTitle>
                    {is2FAEnabled ? "Disable 2FA" : "Enable 2FA"}
                  </DialogTitle>
                  <DialogDescription>
                    {is2FAEnabled
                      ? "Enter your password to disable two-factor authentication."
                      : "Enter your password to get started."}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="2fa-password">Password</Label>
                  <Input
                    id="2fa-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && password) {
                        if (is2FAEnabled) { handleDisable(); } else { handleEnable(); }
                      }
                    }}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  disabled={pending || !password}
                  onClick={is2FAEnabled ? handleDisable : handleEnable}
                >
                  {pending
                    ? "Please wait..."
                    : is2FAEnabled
                      ? "Disable 2FA"
                      : "Continue"}
                  {!pending && !is2FAEnabled && <ArrowRight className="size-4" />}
                </Button>
              </motion.div>
            )}

            {/* Step 2: QR Code */}
            {step === "qr" && (
              <motion.div key="qr" {...slide} className="flex flex-col gap-4">
                <DialogHeader>
                  <DialogTitle>Scan QR code</DialogTitle>
                  <DialogDescription>
                    Open your authenticator app and scan this code.
                  </DialogDescription>
                </DialogHeader>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="flex justify-center"
                >
                  <div className="rounded-2xl border bg-white p-4">
                    <QRCodeSVG
                      value={totpURI}
                      size={160}
                      level="M"
                      bgColor="transparent"
                      aria-label="QR code for two-factor authentication setup"
                    />
                  </div>
                </motion.div>

                <details className="w-full">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Can&apos;t scan? Copy setup key
                  </summary>
                  <code className="mt-2 block break-all rounded-lg bg-muted p-3 text-xs">
                    {totpURI}
                  </code>
                </details>

                <Button onClick={() => setStep("backup")}>
                  Continue
                  <ArrowRight className="size-4" />
                </Button>
              </motion.div>
            )}

            {/* Step 3: Backup codes */}
            {step === "backup" && (
              <motion.div key="backup" {...slide} className="flex flex-col gap-4">
                <DialogHeader>
                  <DialogTitle>Save backup codes</DialogTitle>
                  <DialogDescription>
                    Store these codes somewhere safe. You can use them to sign in
                    if you lose access to your authenticator app.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl bg-muted p-4">
                  {backupCodes.map((c, i) => (
                    <motion.code
                      key={c}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="font-mono text-xs"
                    >
                      {c}
                    </motion.code>
                  ))}
                </div>

                <Button variant="outline" onClick={copyBackupCodes}>
                  {copied ? (
                    <Check className="size-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied ? "Copied to clipboard" : "Copy all codes"}
                </Button>

                <Button onClick={() => setStep("verify")}>
                  I&apos;ve saved them
                  <ArrowRight className="size-4" />
                </Button>
              </motion.div>
            )}

            {/* Step 4: Verify */}
            {step === "verify" && (
              <motion.div key="verify" {...slide}>
                <form
                  onSubmit={handleVerify}
                  className="flex flex-col gap-4"
                >
                  <DialogHeader>
                    <DialogTitle>Verify code</DialogTitle>
                    <DialogDescription>
                      Enter a 6-digit code from your authenticator app to
                      confirm setup.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={verifyCode}
                      onChange={setVerifyCode}
                      autoFocus
                    >
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

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <Button
                    type="submit"
                    disabled={pending || verifyCode.length < 6}
                  >
                    {pending ? "Verifying..." : "Verify and activate"}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Step 5: Done */}
            {step === "done" && (
              <motion.div
                key="done"
                {...slide}
                className="flex flex-col items-center gap-4 py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <ShieldCheck className="size-12 text-emerald-500" />
                </motion.div>
                <div className="text-center">
                  <p className="text-sm font-medium">2FA is now active</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You&apos;ll need a code from your authenticator app when signing
                    in.
                  </p>
                </div>
                <Button className="w-full" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}
