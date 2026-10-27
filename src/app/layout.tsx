import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastProvider } from "@/components/ui/Toast/Toast";
import { clerkAppearance } from "@/features/auth/config/appearance";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GYM Fitness Platform",
    template: "%s | GYM Fitness Platform",
  },
  description:
    "Discover exercises, learn proper technique, and understand the muscles they target.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>
        <ClerkProvider
          appearance={clerkAppearance}
          signInUrl={AUTH_ROUTES.signIn}
          signUpUrl={AUTH_ROUTES.signUp}
          signInFallbackRedirectUrl={AUTH_ROUTES.home}
          signUpFallbackRedirectUrl={AUTH_ROUTES.home}
        >
          <ToastProvider>{children}</ToastProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
