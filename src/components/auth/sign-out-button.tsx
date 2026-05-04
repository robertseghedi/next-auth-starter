/**
 * Sign-out button — client component.
 * Calls authClient.signOut() and redirects to afterSignOut route.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authConfig } from "@/auth.config";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await authClient.signOut();
    router.push(authConfig.routes.afterSignOut);
    router.refresh();
  }

  return (
    <Button variant="outline" disabled={pending} onClick={handleSignOut}>
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
