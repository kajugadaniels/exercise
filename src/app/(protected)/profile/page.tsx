import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import { ProfileForm } from "@/features/profile/components/ProfileForm/ProfileForm";
import { getProfileForClerkUser } from "@/features/profile/server/profile-service";
import styles from "./page.module.css";

export default async function ProfilePage() {
  const { userId } = await auth.protect();
  const profile = await getProfileForClerkUser(userId);

  if (!profile) {
    redirect(AUTH_ROUTES.onboarding);
  }

  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Account settings</p>
        <h1 className={styles.title}>Your profile</h1>
        <p className={styles.summary}>
          Keep your details current so future training and progress records
          remain meaningful to you.
        </p>
      </header>

      <section className={styles.formCard} aria-label="Edit training profile">
        <ProfileForm mode="settings" initialProfile={profile} />
      </section>
    </main>
  );
}
