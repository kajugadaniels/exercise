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
      <section className={styles.introduction} aria-labelledby="profile-title">
        <Image
          className={styles.logo}
          src="/logo.png"
          alt=""
          width={56}
          height={56}
          priority
        />
        <p className={styles.eyebrow}>One-time setup</p>
        <h1 className={styles.title} id="profile-title">
          Build your training profile
        </h1>
        <p className={styles.summary}>
          Your profile gives every future session, measurement, and progress
          entry a secure home under your account.
        </p>

        <dl className={styles.promiseList}>
          <div>
            <dt>Private by default</dt>
            <dd>Your Clerk identity is resolved securely on the server.</dd>
          </div>
          <div>
            <dt>Always editable</dt>
            <dd>Update or delete this profile from your profile page.</dd>
          </div>
          <div>
            <dt>No hidden score</dt>
            <dd>BMI is informational and never used as a diagnosis.</dd>
          </div>
        </dl>
      </section>

      <section className={styles.formCard} aria-label="Training profile form">
        <div className={styles.progressRow}>
          <span>Profile setup</span>
          <span>Step 1 of 1</span>
        </div>
        <div className={styles.progressTrack} aria-hidden="true">
          <span />
        </div>
        <ProfileForm mode="onboarding" />
      </section>
    </main>
  );
}
