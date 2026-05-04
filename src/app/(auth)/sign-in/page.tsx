import { Suspense } from "react";
import { requireGuest } from "@/lib/auth-helpers";
import { AuthCard } from "@/components/auth/auth-card";

export default async function SignInPage() {
  await requireGuest();
  return (
    <Suspense>
      <AuthCard />
    </Suspense>
  );
}
