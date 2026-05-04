import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { AuthBackground } from "@/components/auth/auth-background";
import { TwoFactorVerifyForm } from "@/components/auth/two-factor-verify-form";

export default function TwoFactorPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      <AuthBackground />
      <Card className="relative z-10 w-full max-w-[420px]">
        <CardHeader>
          <CardTitle>Two-factor authentication</CardTitle>
          <CardDescription>
            Verify your identity to continue signing in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorVerifyForm />
        </CardContent>
      </Card>
    </div>
  );
}
