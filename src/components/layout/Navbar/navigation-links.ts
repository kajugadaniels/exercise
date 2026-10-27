import { AUTH_ROUTES } from "@/features/auth/config/routes";

export type NavigationLink = Readonly<{
  href: string;
  label: string;
}>;

export const primaryNavigationLinks = [
  { href: "/", label: "Home" },
  { href: AUTH_ROUTES.home, label: "Exercises" },
] as const satisfies readonly NavigationLink[];
