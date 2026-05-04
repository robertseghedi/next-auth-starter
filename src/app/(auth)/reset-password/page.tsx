import { requireGuest } from "@/lib/auth-helpers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AuthBackground } from "@/components/auth/auth-background";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage() {
  await requireGuest();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      <AuthBackground />
      <Card className="relative z-10 w-full max-w-[420px]">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Enter your new password</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
