import type { Metadata } from "next";
import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import {
  AuthLoading,
  AuthPage,
} from "@/features/auth/components/AuthPage/AuthPage";
import { AUTH_ROUTES } from "@/features/auth/config/routes";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in securely to access the GYM Fitness exercise library.",
};

export default function SignInPage() {
  return (
    <AuthPage
      title="Your exercise library, ready when you are."
      description="Sign in to explore verified movements, technique guidance, and interactive muscle references."
    >
      <Suspense fallback={<AuthLoading label="Loading secure sign in…" />}>
        <SignIn
          path={AUTH_ROUTES.signIn}
          signUpUrl={AUTH_ROUTES.signUp}
          fallbackRedirectUrl={AUTH_ROUTES.home}
        />
      </Suspense>
    </AuthPage>
  );
}
