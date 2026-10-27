import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar/Navbar";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import {
  ensureAppUser,
  getProfileForClerkUser,
} from "@/features/profile/server/profile-service";
import styles from "./layout.module.css";

type ProtectedLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const { userId } = await auth.protect();
  await ensureAppUser(userId);

  const profile = await getProfileForClerkUser(userId);
  if (!profile) {
    redirect(AUTH_ROUTES.onboarding);
  }

  return (
    <>
      <Navbar />
      <div className={styles.content}>{children}</div>
    </>
  );
}
