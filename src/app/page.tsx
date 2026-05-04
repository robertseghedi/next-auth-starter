import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth-helpers";
import { authConfig } from "@/auth.config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Image
            src="/rounded.png"
            alt="Logo"
            width={48}
            height={48}
            className="mb-2"
          />
          <CardTitle className="text-xl">Better Auth Starter</CardTitle>
          <CardDescription>
            by peal.dev — Next.js 16 + Better Auth + Drizzle ORM + Neon Postgres
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {session ? (
            <>
              <p className="text-sm">
                Signed in as <span className="font-medium">{session.user.email}</span>
              </p>
              <Link href={authConfig.routes.afterSignIn}>
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                You are not signed in.
              </p>
              <div className="flex gap-2">
                <Link href={authConfig.routes.signIn} className="flex-1">
                  <Button variant="outline" className="w-full">Sign in</Button>
                </Link>
                <Link href={authConfig.routes.signUp} className="flex-1">
                  <Button className="w-full">Sign up</Button>
                </Link>
              </div>
            </>
          )}

          <Separator />

          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground text-sm">Stack</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Next.js 16 (App Router, Server Components)</li>
              <li>Better Auth (email/password, OAuth, 2FA, admin, orgs)</li>
              <li>Drizzle ORM + Neon Postgres</li>
              <li>T3 Env (validated environment variables)</li>
              <li>shadcn/ui</li>
            </ul>
          </div>

          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground text-sm">Active plugins</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {authConfig.plugins.twoFactor.enabled && <li>Two-Factor Auth (TOTP)</li>}
              {authConfig.plugins.admin.enabled && <li>Admin (user management)</li>}

              {authConfig.plugins.username.enabled && <li>Username</li>}
              {authConfig.plugins.magicLink.enabled && <li>Magic Link (passwordless)</li>}
              {authConfig.plugins.emailOTP.enabled && <li>Email OTP (verification codes)</li>}
              {authConfig.plugins.passkey.enabled && <li>Passkey (WebAuthn/FIDO2)</li>}
              {authConfig.plugins.phoneNumber.enabled && <li>Phone Number (SMS OTP)</li>}
              {authConfig.plugins.bearer.enabled && <li>Bearer (API tokens)</li>}
              {authConfig.plugins.captcha.enabled && <li>Captcha (Cloudflare Turnstile)</li>}
              {authConfig.plugins.multiSession.enabled && <li>Multi-session</li>}
              {authConfig.plugins.openAPI.enabled && <li>OpenAPI (docs)</li>}
            </ul>
          </div>
          <Separator />

          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <a href="https://www.peal.dev/privacy" className="hover:underline">
              Privacy Policy
            </a>
            <a href="https://www.peal.dev/terms" className="hover:underline">
              Terms of Service
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
