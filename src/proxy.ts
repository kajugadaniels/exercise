import { clerkMiddleware } from "@clerk/nextjs/server";
import { AUTH_ROUTES } from "./features/auth/config/routes";

export default clerkMiddleware({
  signInUrl: AUTH_ROUTES.signIn,
  signUpUrl: AUTH_ROUTES.signUp,
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
