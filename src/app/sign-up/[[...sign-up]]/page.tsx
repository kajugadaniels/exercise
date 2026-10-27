import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import {
  AuthLoading,
  AuthPage,
} from "@/features/auth/components/AuthPage/AuthPage";
import { AUTH_ROUTES } from "@/features/auth/config/routes";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create an account to access the GYM Fitness exercise library.",
};

export default function SignUpPage() {
  return (
    <AuthPage
      title="A focused place to learn every movement."
      description="Create your account to search exercises, study technique, and understand the muscles each movement targets."
    >
      <Suspense fallback={<AuthLoading label="Loading secure sign up…" />}>
        <SignUp
          path={AUTH_ROUTES.signUp}
          signInUrl={AUTH_ROUTES.signIn}
          fallbackRedirectUrl={AUTH_ROUTES.home}
        />
      </Suspense>
    </AuthPage>
  );
}
