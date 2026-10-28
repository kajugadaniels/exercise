import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import { AccountDataControls } from "@/features/account/components/AccountDataControls/AccountDataControls";
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
        <h1 className={styles.title}>Profile and data</h1>
        <p className={styles.summary}>
          Keep your personal details current and control the information stored
          by this application.
        </p>
      </header>

      <div className={styles.settingsStack}>
        <section className={styles.formCard} aria-labelledby="profile-card-title">
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle} id="profile-card-title">
              Physical profile
            </h2>
            <p className={styles.cardSummary}>
              Private details used to personalize your account experience.
            </p>
          </header>
          <ProfileForm mode="settings" initialProfile={profile} />
        </section>

        <section className={styles.formCard} aria-labelledby="data-card-title">
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle} id="data-card-title">
              Data controls
            </h2>
            <p className={styles.cardSummary}>
              Download a portable copy or permanently remove the fitness data
              stored by this application.
            </p>
          </header>
          <AccountDataControls />
        </section>
      </div>
    </main>
  );
}
