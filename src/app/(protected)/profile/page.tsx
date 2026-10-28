import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import { ProfileForm } from "@/features/profile/components/ProfileForm/ProfileForm";
import { getProfileForClerkUser } from "@/features/profile/server/profile-service";
import { TrainingPreferencesForm } from "@/features/training/components/TrainingPreferencesForm/TrainingPreferencesForm";
import { getTrainingPreferencesForClerkUser } from "@/features/training/server/training-preferences-service";
import styles from "./page.module.css";

export default async function ProfilePage() {
  const { userId } = await auth.protect();
  const [profile, trainingPreferences] = await Promise.all([
    getProfileForClerkUser(userId),
    getTrainingPreferencesForClerkUser(userId),
  ]);

  if (!profile) {
    redirect(AUTH_ROUTES.onboarding);
  }

  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Account settings</p>
        <h1 className={styles.title}>Profile and preferences</h1>
        <p className={styles.summary}>
          Keep your physical details current and define how training should fit
          your routine.
        </p>
      </header>

      <div className={styles.settingsStack}>
        <section className={styles.formCard} aria-labelledby="profile-card-title">
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle} id="profile-card-title">
              Physical profile
            </h2>
            <p className={styles.cardSummary}>
              Used for your private measurement history and profile context.
            </p>
          </header>
          <ProfileForm mode="settings" initialProfile={profile} />
        </section>

        <section
          className={styles.formCard}
          aria-labelledby="preferences-card-title"
        >
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle} id="preferences-card-title">
              Training preferences
            </h2>
            <p className={styles.cardSummary}>
              Define your goal, schedule, experience, and available equipment.
              You can update these choices whenever your routine changes.
            </p>
          </header>
          <TrainingPreferencesForm initialPreferences={trainingPreferences} />
        </section>
      </div>
    </main>
  );
}
