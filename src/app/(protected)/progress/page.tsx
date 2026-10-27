import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import {
  getMeasurementHistoryForClerkUser,
  getProfileForClerkUser,
} from "@/features/profile/server/profile-service";
import styles from "./page.module.css";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});

function signedChange(value: number): string {
  if (value === 0) {
    return "No change";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(1)} kg`;
}

export default async function ProgressPage() {
  const { userId } = await auth.protect();
  const [profile, history] = await Promise.all([
    getProfileForClerkUser(userId),
    getMeasurementHistoryForClerkUser(userId),
  ]);

  const newest = history[0];
  const oldest = history.at(-1);
  const weightChange =
    newest && oldest ? newest.weightKilograms - oldest.weightKilograms : 0;

  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Personal record</p>
          <h1 className={styles.title}>Progress &amp; history</h1>
        </div>
        <p className={styles.summary}>
          Every profile update creates a private measurement snapshot, giving
          you a reliable record without storing BMI separately.
        </p>
      </header>

      {profile && (
        <section className={styles.metrics} aria-label="Current measurements">
          <article className={styles.metricCard}>
            <span>Current weight</span>
            <strong>{profile.weightKilograms} kg</strong>
          </article>
          <article className={styles.metricCard}>
            <span>Current BMI</span>
            <strong>{profile.bmi}</strong>
          </article>
          <article className={styles.metricCard}>
            <span>From first entry</span>
            <strong>{signedChange(weightChange)}</strong>
          </article>
        </section>
      )}

      <section className={styles.history} aria-labelledby="history-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="history-title">Measurement history</h2>
            <p>{history.length} saved {history.length === 1 ? "entry" : "entries"}</p>
          </div>
          <Link className={styles.updateLink} href={AUTH_ROUTES.profile}>
            Update measurements
          </Link>
        </div>

        {history.length > 0 ? (
          <ol className={styles.timeline}>
            {history.map((entry, index) => (
              <li className={styles.entry} key={entry.id}>
                <div className={styles.entryMarker} aria-hidden="true" />
                <div className={styles.entryHeader}>
                  <div>
                    <h3>{index === 0 ? "Latest update" : "Profile update"}</h3>
                    <time dateTime={entry.recordedAt}>
                      {dateFormatter.format(new Date(entry.recordedAt))}
                    </time>
                  </div>
                  {index === 0 && <span className={styles.current}>Current</span>}
                </div>
                <dl className={styles.entryValues}>
                  <div>
                    <dt>Weight</dt>
                    <dd>{entry.weightKilograms} kg</dd>
                  </div>
                  <div>
                    <dt>Height</dt>
                    <dd>{entry.heightCentimeters} cm</dd>
                  </div>
                  <div>
                    <dt>BMI</dt>
                    <dd>{entry.bmi}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        ) : (
          <div className={styles.emptyState}>
            <h3>Your first snapshot is ready to be recorded</h3>
            <p>Save your profile once to begin your private progress history.</p>
            <Link className={styles.updateLink} href={AUTH_ROUTES.profile}>
              Open profile
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
