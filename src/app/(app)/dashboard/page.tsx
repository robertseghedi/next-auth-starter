import { requireSession } from "@/lib/auth-helpers";
import { authConfig } from "@/auth.config";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { TwoFactorSetup } from "@/components/auth/two-factor-setup";
import { PasskeyManage } from "@/components/auth/passkey-manage";
import { PhoneLink } from "@/components/auth/phone-link";

export default async function DashboardPage() {
  const session = await requireSession();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col gap-4">
        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>
              Signed in as {session.user.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignOutButton />
          </CardContent>
        </Card>

        {/* Two-factor setup — only if plugin is enabled */}
        {authConfig.plugins.twoFactor.enabled && (
          <Card>
            <CardHeader>
              <CardTitle>Two-factor authentication</CardTitle>
              <CardDescription>
                Protect your account with a TOTP authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TwoFactorSetup />
            </CardContent>
          </Card>
        )}

        {/* Phone number — only if plugin is enabled */}
        {authConfig.plugins.phoneNumber.enabled && (
          <Card>
            <CardHeader>
              <CardTitle>Phone number</CardTitle>
              <CardDescription>
                Link a phone number to sign in via SMS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PhoneLink />
            </CardContent>
          </Card>
        )}

        {/* Passkey management — only if plugin is enabled */}
        {authConfig.plugins.passkey.enabled && (
          <Card>
            <CardHeader>
              <CardTitle>Passkeys</CardTitle>
              <CardDescription>
                Manage Face ID, Touch ID, and security keys
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasskeyManage />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
