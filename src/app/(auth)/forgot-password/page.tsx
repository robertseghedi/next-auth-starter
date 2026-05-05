import { requireGuest } from "@/lib/auth-helpers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AuthBackground } from "@/components/auth/auth-background";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default async function ForgotPasswordPage() {
  await requireGuest();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      <AuthBackground />
      <Card className="relative z-10 w-full max-w-[420px]">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
