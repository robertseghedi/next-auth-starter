import { requireGuest } from "@/lib/auth-helpers";
import { AuthCard } from "@/components/auth/auth-card";

export default async function SignUpPage() {
  await requireGuest();
  return <AuthCard />;
}
