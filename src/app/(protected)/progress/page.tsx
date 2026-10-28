import type { CSSProperties } from "react";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  ChartLineIcon,
  Dumbbell01Icon,
  RepeatIcon,
  TimeQuarter02Icon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/Icon/Icon";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import { formatExerciseValue } from "@/features/exercises/domain/exercise";
import {
  getMeasurementHistoryForClerkUser,
  getProfileForClerkUser,
} from "@/features/profile/server/profile-service";
import { getCalendarDateInTimeZone } from "@/features/training/domain/training";
import { getTrainingAnalyticsForClerkUser } from "@/features/training/server/training-analytics-service";
import { getTrainingPreferencesForClerkUser } from "@/features/training/server/training-preferences-service";
import {
  trainingAnalyticsQuerySchema,
  trainingAnalyticsWeeks,
} from "@/features/training/training-analytics-schema";
import styles from "./page.module.css";

type ProgressPageProps = Readonly<{
  searchParams: Promise<{ weeks?: string | string[] }>;
}>;

type SignalStyle = CSSProperties & { "--signal-level": string };

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "UTC",
});
const weekFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const numberFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
});

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function dateFromCalendarDate(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}

function signedKilograms(value: number): string {
  if (value === 0) return "No change";
  return `${value > 0 ? "+" : ""}${numberFormatter.format(value)} kg`;
}

function formatLoad(value: number | null): string {
  return value === null ? "Bodyweight" : `${numberFormatter.format(value)} kg`;
}

export default async function ProgressPage({ searchParams }: ProgressPageProps) {
  const { userId } = await auth.protect();
  const rawSearchParams = await searchParams;
  const queryResult = trainingAnalyticsQuerySchema.safeParse({
    weeks: firstValue(rawSearchParams.weeks),
  });
  const weeks = queryResult.success ? queryResult.data.weeks : 8;
  const [profile, measurementHistory, preferences] = await Promise.all([
    getProfileForClerkUser(userId),
    getMeasurementHistoryForClerkUser(userId),
    getTrainingPreferencesForClerkUser(userId),
  ]);
  const endDate = getCalendarDateInTimeZone(preferences?.timezone ?? "UTC");
  const analytics = await getTrainingAnalyticsForClerkUser(
    userId,
    weeks,
    endDate,
  );
  const newestMeasurement = measurementHistory[0];
  const oldestMeasurement = measurementHistory.at(-1);
  const weightChange =
    newestMeasurement && oldestMeasurement
      ? newestMeasurement.weightKilograms - oldestMeasurement.weightKilograms
      : 0;
  const maxWeeklyVolume = Math.max(
    1,
    ...analytics.weeklySignals.map((week) => week.volumeKilograms),
  );

  return (
    <main className={styles.page} id="main-content">
      <header className={styles.pageHeader}>
        <div>
          <p>Your training signal</p>
          <h1>Progress, without guesswork</h1>
        </div>
        <p>
          Completed workouts shape these private trends. Planned, skipped, and
          abandoned sessions never inflate your results.
        </p>
      </header>

      <nav className={styles.rangePicker} aria-label="Progress date range">
        {trainingAnalyticsWeeks.map((option) => (
          <Link
            aria-current={weeks === option ? "page" : undefined}
            href={`${AUTH_ROUTES.progress}?weeks=${option}`}
            key={option}
          >
            {option} weeks
          </Link>
        ))}
      </nav>

      <section className={styles.signalBoard} aria-labelledby="signal-title">
        <header className={styles.signalHeader}>
          <div>
            <h2 id="signal-title">Training signal</h2>
            <p>
              {dateFormatter.format(dateFromCalendarDate(analytics.range.startDate))}
              {" – "}
              {dateFormatter.format(dateFromCalendarDate(analytics.range.endDate))}
            </p>
          </div>
          <span>{analytics.summary.completionRate}% completion</span>
        </header>

        <dl className={styles.signalSummary}>
          <div>
            <dt><Icon icon={Dumbbell01Icon} size={18} /> Workouts</dt>
            <dd>{analytics.summary.completedWorkouts}</dd>
            <small>of {analytics.summary.scheduledWorkouts} scheduled</small>
          </div>
          <div>
            <dt><Icon icon={RepeatIcon} size={18} /> Working sets</dt>
            <dd>{numberFormatter.format(analytics.summary.totalSets)}</dd>
            <small>{numberFormatter.format(analytics.summary.totalRepetitions)} reps</small>
          </div>
          <div>
            <dt><Icon icon={WeightScale01Icon} size={18} /> Loaded volume</dt>
            <dd>{numberFormatter.format(analytics.summary.volumeKilograms)}</dd>
            <small>kilograms recorded</small>
          </div>
          <div>
            <dt><Icon icon={TimeQuarter02Icon} size={18} /> Active time</dt>
            <dd>{numberFormatter.format(analytics.summary.activeMinutes)}</dd>
            <small>minutes trained</small>
          </div>
        </dl>

        <div className={styles.weeklySignal}>
          <div className={styles.signalAxis} aria-hidden="true">
            <span>Higher volume</span>
            <span>No loaded volume</span>
          </div>
          <ol aria-label="Weekly loaded volume">
            {analytics.weeklySignals.map((week) => {
              const level = Math.max(
                week.volumeKilograms > 0 ? 8 : 2,
                Math.round((week.volumeKilograms / maxWeeklyVolume) * 100),
              );
              return (
                <li key={week.weekStart}>
                  <span
                    className={styles.signalBar}
                    style={{ "--signal-level": `${level}%` } as SignalStyle}
                    aria-hidden="true"
                  />
                  <strong>{numberFormatter.format(week.volumeKilograms)} kg</strong>
                  <time dateTime={week.weekStart}>
                    {weekFormatter.format(dateFromCalendarDate(week.weekStart))}
                  </time>
                  <small>{week.completedWorkouts} workouts</small>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <div className={styles.detailGrid}>
        <section className={styles.exerciseLedger} aria-labelledby="exercise-progress-title">
          <header className={styles.sectionHeader}>
            <div>
              <p>Starting point to latest</p>
              <h2 id="exercise-progress-title">Exercise progression</h2>
            </div>
            <Icon icon={ChartLineIcon} size={24} />
          </header>
          {analytics.exerciseProgress.length > 0 ? (
            <ol>
              {analytics.exerciseProgress.map((exercise) => (
                <li key={exercise.exerciseId}>
                  <div className={styles.exerciseIdentity}>
                    <h3>{exercise.exerciseName}</h3>
                    <p>
                      {formatExerciseValue(exercise.primaryMuscle)} · {exercise.appearances}{" "}
                      {exercise.appearances === 1 ? "workout" : "workouts"}
                    </p>
                  </div>
                  <dl>
                    <div>
                      <dt>Load</dt>
                      <dd>
                        {formatLoad(exercise.startingMaxWeightKilograms)}
                        <span aria-hidden="true">→</span>
                        {formatLoad(exercise.currentMaxWeightKilograms)}
                      </dd>
                    </div>
                    <div>
                      <dt>Best load</dt>
                      <dd>{formatLoad(exercise.bestWeightKilograms)}</dd>
                    </div>
                    <div>
                      <dt>Best set reps</dt>
                      <dd>
                        {exercise.startingBestRepetitions}
                        <span aria-hidden="true">→</span>
                        {exercise.currentBestRepetitions}
                      </dd>
                    </div>
                    <div>
                      <dt>Change</dt>
                      <dd>
                        {exercise.weightChangeKilograms === null
                          ? "No loaded sets"
                          : signedKilograms(exercise.weightChangeKilograms)}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ol>
          ) : (
            <div className={styles.emptyState}>
              <Icon icon={ChartLineIcon} size={64} />
              <h3>Your progression starts with a completed workout</h3>
              <p>Record every set and complete a session to compare performance.</p>
              <Link href={AUTH_ROUTES.training}>Open training plan</Link>
            </div>
          )}
        </section>

        <aside className={styles.muscleBalance} aria-labelledby="muscle-balance-title">
          <header className={styles.sectionHeader}>
            <div>
              <p>Completed sets</p>
              <h2 id="muscle-balance-title">Muscle distribution</h2>
            </div>
          </header>
          {analytics.muscleDistribution.length > 0 ? (
            <ol>
              {analytics.muscleDistribution.map((item) => (
                <li key={item.muscle}>
                  <div>
                    <strong>{formatExerciseValue(item.muscle)}</strong>
                    <span>{item.setCount} sets · {item.percentage}%</span>
                  </div>
                  <span className={styles.distributionTrack} aria-hidden="true">
                    <span style={{ inlineSize: `${item.percentage}%` }} />
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.compactEmpty}>
              Muscle distribution appears after your first completed sets.
            </p>
          )}
        </aside>
      </div>

      <section className={styles.measurements} aria-labelledby="measurements-title">
        <header className={styles.sectionHeader}>
          <div>
            <p>Private profile record</p>
            <h2 id="measurements-title">Measurement history</h2>
          </div>
          <Link href={AUTH_ROUTES.profile}>Update measurements</Link>
        </header>

        {profile && (
          <dl className={styles.measurementSummary}>
            <div><dt>Current weight</dt><dd>{profile.weightKilograms} kg</dd></div>
            <div><dt>Current BMI</dt><dd>{profile.bmi}</dd></div>
            <div><dt>From first entry</dt><dd>{signedKilograms(weightChange)}</dd></div>
          </dl>
        )}

        {measurementHistory.length > 0 ? (
          <ol className={styles.measurementTimeline}>
            {measurementHistory.slice(0, 12).map((entry, index) => (
              <li key={entry.id}>
                <div>
                  <strong>{index === 0 ? "Latest update" : "Profile update"}</strong>
                  <time dateTime={entry.recordedAt}>
                    {dateFormatter.format(new Date(entry.recordedAt))}
                  </time>
                </div>
                <span>{entry.weightKilograms} kg</span>
                <span>{entry.heightCentimeters} cm</span>
                <span>BMI {entry.bmi}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className={styles.emptyState}>
            <h3>No measurement entries yet</h3>
            <p>Update your profile to create your first private snapshot.</p>
            <Link href={AUTH_ROUTES.profile}>Open profile</Link>
          </div>
        )}
        {measurementHistory.length > 12 && (
          <p className={styles.historyNote}>
            Showing the latest 12 of {measurementHistory.length} measurements.
            Your complete record is included in your account export.
          </p>
        )}
      </section>
    </main>
  );
}
