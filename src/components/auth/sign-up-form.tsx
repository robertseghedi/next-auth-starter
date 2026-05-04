/**
 * Sign-up form — client component.
 *
 * Renders fields conditionally based on authConfig:
 * - Username field only if `plugins.username.enabled`
 * - Social provider buttons only if their provider is enabled
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { authConfig } from "@/auth.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon, GitHubIcon } from "@/components/auth/social-icons";
import { Captcha } from "@/components/auth/captcha";
import { useCaptcha } from "@/hooks/use-captcha";

export function SignUpForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const { captchaToken, setCaptchaToken, captchaHeaders, isCaptchaRequired } = useCaptcha();

  const hasSocialProviders =
    authConfig.socialProviders.google.enabled ||
    authConfig.socialProviders.github.enabled;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);

    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
      callbackURL: authConfig.routes.afterSignUp,
      ...(authConfig.plugins.username.enabled && username ? { username } : {}),
      fetchOptions: { headers: captchaHeaders },
    });

    if (error) {
      setError(error.message ?? "Sign up failed.");
      setPending(false);
    } else {
      router.push(authConfig.routes.afterSignUp);
      router.refresh();
    }
  }

  async function handleSocial(provider: "google" | "github") {
    setPending(true);
    await authClient.signIn.social({
      provider,
      callbackURL: authConfig.routes.afterSignUp,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {hasSocialProviders && (
        <>
          <div className="flex gap-2">
            {authConfig.socialProviders.google.enabled && (
              <Button
                variant="outline"
                className="flex-1"
                disabled={pending}
                onClick={() => handleSocial("google")}
              >
                <GoogleIcon />
                Google
              </Button>
            )}
            {authConfig.socialProviders.github.enabled && (
              <Button
                variant="outline"
                className="flex-1"
                disabled={pending}
                onClick={() => handleSocial("github")}
              >
                <GitHubIcon />
                GitHub
              </Button>
            )}
          </div>

          {authConfig.emailAndPassword.enabled && (
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>
          )}
        </>
      )}

      {authConfig.emailAndPassword.enabled && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          {/* Username field — only if username plugin is enabled */}
          {authConfig.plugins.username.enabled && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="your-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={authConfig.emailAndPassword.minPasswordLength}
              maxLength={authConfig.emailAndPassword.maxPasswordLength}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              At least {authConfig.emailAndPassword.minPasswordLength} characters
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Captcha onVerify={setCaptchaToken} />

          <Button type="submit" disabled={pending || (isCaptchaRequired && !captchaToken)}>
            {pending ? "Creating account..." : "Create account"}
          </Button>
        </form>
      )}
    </div>
  );
}
