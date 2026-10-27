import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AUTH_ROUTES } from "@/features/auth/config/routes";

export default async function Home() {
  await auth.protect();
  redirect(AUTH_ROUTES.home);
}
