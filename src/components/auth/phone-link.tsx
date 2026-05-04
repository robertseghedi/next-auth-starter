/**
 * Phone number linking component — link/update a phone number on the account.
 *
 * Two-step flow:
 * 1. Enter phone number → send OTP
 * 2. Enter 6-digit code → verify and link
 *
 * Uses `updatePhoneNumber: true` on verify to link/update the number.
 * Shown on dashboard when `authConfig.plugins.phoneNumber.enabled` is true.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Phone, Check, ArrowRight } from "lucide-react";
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

type Step = "phone" | "code" | "done";

const slide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.15, ease: "easeInOut" },
};

export function PhoneLink() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  const currentPhone = user?.phoneNumber ?? undefined;
  const isVerified = user?.phoneNumberVerified;

  const [open, setOpen] = useState(false);
  const [linkedPhone, setLinkedPhone] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function openDialog() {
    setStep("phone");
    setPhone(currentPhone ?? "");
    setCode("");
    setError("");
    setOpen(true);
  }

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
      updatePhoneNumber: true,
    });

    if (error) {
      setError(error.message ?? "Invalid code.");
      setPending(false);
    } else {
      setLinkedPhone(phone);
      setStep("done");
      setPending(false);
    }
  }

  const displayPhone = linkedPhone ?? currentPhone;
  const displayVerified = linkedPhone ? true : isVerified;

  return (
    <>
      {/* Trigger */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          {displayPhone ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="size-4 text-muted-foreground" />
                <span className="font-mono text-sm">{displayPhone}</span>
                {displayVerified && (
                  <span className="text-xs text-emerald-500">Verified</span>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No phone number linked
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={openDialog}>
          {displayPhone ? "Change" : "Link phone"}
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={step !== "done"}>
          <AnimatePresence mode="wait" initial={false}>
            {/* Step 1: Enter phone number */}
            {step === "phone" && (
              <motion.div key="phone" {...slide}>
                <form
                  onSubmit={handleSendOTP}
                  className="flex flex-col gap-4"
                >
                  <DialogHeader>
                    <DialogTitle>
                      {currentPhone ? "Change phone number" : "Link phone number"}
                    </DialogTitle>
                    <DialogDescription>
                      Enter your phone number. We'll send a verification code
                      via SMS.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="link-phone">Phone number</Label>
                    <Input
                      id="link-phone"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      autoComplete="tel"
                      autoFocus
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <Button type="submit" disabled={pending || !phone}>
                    {pending ? "Sending..." : "Send code"}
                    {!pending && <ArrowRight className="size-4" />}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* Step 2: Enter verification code */}
            {step === "code" && (
              <motion.div key="code" {...slide}>
                <form
                  onSubmit={handleVerify}
                  className="flex flex-col gap-4"
                >
                  <DialogHeader>
                    <DialogTitle>Verify phone number</DialogTitle>
                    <DialogDescription>
                      Enter the 6-digit code sent to{" "}
                      <span className="font-medium text-foreground">
                        {phone}
                      </span>
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={code}
                      onChange={setCode}
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
                    disabled={pending || code.length < 6}
                  >
                    {pending ? "Verifying..." : "Verify and link"}
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
              </motion.div>
            )}

            {/* Step 3: Done */}
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
                  <Check className="size-12 text-emerald-500" />
                </motion.div>
                <div className="text-center">
                  <p className="text-sm font-medium">Phone number linked</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {phone}
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    router.refresh();
                  }}
                >
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
