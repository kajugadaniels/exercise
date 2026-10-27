import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import { ProfileForm } from "@/features/profile/components/ProfileForm/ProfileForm";
import {
  ensureAppUser,
  getProfileForClerkUser,
} from "@/features/profile/server/profile-service";
import styles from "./page.module.css";

export default async function OnboardingPage() {
  const { userId } = await auth.protect();
  await ensureAppUser(userId);

  const profile = await getProfileForClerkUser(userId);
  if (profile) {
    redirect(AUTH_ROUTES.home);
  }

  return (
    <main className={styles.page} id="main-content">
      <section className={styles.content} aria-labelledby="profile-title">
        <header className={styles.header}>
          <Image
            className={styles.logo}
            src="/logo.png"
            alt=""
            width={44}
            height={44}
            priority
          />
          <div className={styles.heading}>
            <h1 className={styles.title} id="profile-title">
              Complete your profile
            </h1>
            <p className={styles.summary}>
              Set your baseline to start tracking progress.
            </p>
          </div>
        </header>

        <ProfileForm mode="onboarding" />
      </section>
    </main>
  );
}
