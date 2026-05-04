/**
 * Auth card — shared container for sign-in and sign-up with animated tabs.
 */

"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { authConfig } from "@/auth.config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AuthBackground } from "@/components/auth/auth-background";

const tabContent = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: "easeInOut" },
};

export function AuthCard() {
  const router = useRouter();
  const pathname = usePathname();

  const isSignUp = pathname === authConfig.routes.signUp;
  const [activeTab, setActiveTab] = useState(isSignUp ? "sign-up" : "sign-in");

  function handleTabChange(value: string) {
    setActiveTab(value);
    if (value === "sign-up") {
      router.push(authConfig.routes.signUp);
    } else {
      router.push(authConfig.routes.signIn);
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      <AuthBackground />

      <motion.div
        className="relative z-10 w-full max-w-[420px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mx-auto mb-4">
            <TabsTrigger value="sign-in">Sign In</TabsTrigger>
            <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
          </TabsList>

          <Card className="gap-8 py-8">
            <AnimatePresence mode="wait" initial={false}>
              {activeTab === "sign-in" ? (
                <motion.div key="sign-in" {...tabContent} className="flex flex-col gap-8">
                  <CardHeader>
                    <CardTitle>Welcome back</CardTitle>
                    <CardDescription>
                      Sign in to your {authConfig.appName} account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SignInForm />
                  </CardContent>
                </motion.div>
              ) : (
                <motion.div key="sign-up" {...tabContent} className="flex flex-col gap-8">
                  <CardHeader>
                    <CardTitle>Create account</CardTitle>
                    <CardDescription>
                      Get started with {authConfig.appName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SignUpForm />
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </Tabs>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link
            href={authConfig.routes.termsOfService}
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href={authConfig.routes.privacyPolicy}
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </motion.div>
    </div>
  );
}
