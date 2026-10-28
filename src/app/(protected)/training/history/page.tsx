import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Dumbbell01Icon,
  RepeatIcon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/Icon/Icon";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import { formatExerciseValue } from "@/features/exercises/domain/exercise";
import {
  getCalendarDateInTimeZone,
  getTrainingWeekStartForDate,
} from "@/features/training/domain/training";
import { getTrainingHistoryForClerkUser } from "@/features/training/server/training-history-service";
import { getTrainingPreferencesForClerkUser } from "@/features/training/server/training-preferences-service";
import { trainingHistoryQuerySchema } from "@/features/training/training-history-schema";
import { WorkoutHistoryActions } from "@/features/training/components/WorkoutHistoryActions/WorkoutHistoryActions";
import { getAdjacentWeekStart } from "@/features/training/training-week-editor";
import styles from "./page.module.css";

type TrainingHistoryPageProps = Readonly<{
  searchParams: Promise<{
    page?: string | string[];
    week?: string | string[];
  }>;
}>;

const dayFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  weekday: "short",
});
const longDateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "UTC",
});
const numberFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
});

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function dateFromCalendarDate(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}

function historyHref(week: string, page = 1): string {
  const parameters = new URLSearchParams({ week });
  if (page > 1) {
    parameters.set("page", String(page));
  }
  return `${AUTH_ROUTES.trainingHistory}?${parameters.toString()}`;
}

function formatLoad(weightKilograms: number | null): string {
  return weightKilograms === null
    ? "Bodyweight"
    : `${numberFormatter.format(weightKilograms)} kg`;
}

export default async function TrainingHistoryPage({
  searchParams,
}: TrainingHistoryPageProps) {
  const { userId } = await auth.protect();
  const preferences = await getTrainingPreferencesForClerkUser(userId);
  const currentCalendarDate = getCalendarDateInTimeZone(
    preferences?.timezone ?? "UTC",
  );
  const currentWeekStart = getTrainingWeekStartForDate(currentCalendarDate);

  if (!currentWeekStart) {
    throw new Error("The current training week could not be determined.");
  }

  const rawSearchParams = await searchParams;
  const queryResult = trainingHistoryQuerySchema.safeParse({
    page: firstValue(rawSearchParams.page),
    week: firstValue(rawSearchParams.week),
  });
  const query = queryResult.success
    ? queryResult.data
    : { page: 1, week: currentWeekStart };
  const weekStart = query.week ?? currentWeekStart;
  const history = await getTrainingHistoryForClerkUser(
    userId,
    weekStart,
    query.page,
  );
  const { weeklyReport } = history;
  const previousWeek = getAdjacentWeekStart(weekStart, "previous");
  const nextWeek = getAdjacentWeekStart(weekStart, "next");

  return (
    <main className={styles.page} id="main-content">
      <header className={styles.pageHeader}>
        <Link
          className={styles.backLink}
          href={`${AUTH_ROUTES.training}?week=${weekStart}`}
          aria-label="Back to weekly training plan"
        >
          <Icon icon={ArrowLeft01Icon} size={20} />
        </Link>
        <div>
          <p>Private training record</p>
          <h1>History &amp; insights</h1>
          <span>
            Completed sets shape your report and progression guidance. No
            workout data is sent to the exercise catalog provider.
          </span>
        </div>
      </header>

      <section className={styles.weekReport} aria-labelledby="week-report-title">
        <header className={styles.weekHeader}>
          <div>
            <p>Weekly report</p>
            <h2 id="week-report-title">
              {longDateFormatter.format(dateFromCalendarDate(weekStart))}–
              {longDateFormatter.format(
                dateFromCalendarDate(weeklyReport.weekEnd),
              )}
            </h2>
          </div>
          <nav aria-label="Choose report week">
            <Link href={historyHref(previousWeek)} aria-label="Previous week">
              <Icon icon={ArrowLeft01Icon} size={20} />
            </Link>
            {weekStart !== currentWeekStart && (
              <Link href={historyHref(currentWeekStart)}>Current week</Link>
            )}
            {weekStart < currentWeekStart && (
              <Link href={historyHref(nextWeek)} aria-label="Next week">
                <Icon icon={ArrowRight01Icon} size={20} />
              </Link>
            )}
          </nav>
        </header>

        <ol className={styles.weekStrip} aria-label="Daily training status">
          {weeklyReport.days.map((day) => (
            <li data-status={day.status} key={day.date}>
              <time dateTime={day.date}>
                {dayFormatter.format(dateFromCalendarDate(day.date))}
              </time>
              <span aria-hidden="true" />
              <strong>{day.status.replace("-", " ")}</strong>
            </li>
          ))}
        </ol>

        <dl className={styles.weekMetrics}>
          <div>
            <dt>Completed</dt>
            <dd>
              {weeklyReport.completedWorkouts}/
              {weeklyReport.scheduledWorkouts}
            </dd>
          </div>
          <div>
            <dt>Working sets</dt>
            <dd>{weeklyReport.totalSets}</dd>
          </div>
          <div>
            <dt>Total reps</dt>
            <dd>{numberFormatter.format(weeklyReport.totalRepetitions)}</dd>
          </div>
          <div>
            <dt>Loaded volume</dt>
            <dd>{numberFormatter.format(weeklyReport.volumeKilograms)} kg</dd>
          </div>
          <div>
            <dt>Training time</dt>
            <dd>{weeklyReport.activeMinutes} min</dd>
          </div>
        </dl>

        <div className={styles.muscleFocus}>
          <h3>Muscle focus</h3>
          {weeklyReport.muscleFocus.length > 0 ? (
            <ul>
              {weeklyReport.muscleFocus.map((item) => (
                <li key={item.muscle}>
                  <span>{formatExerciseValue(item.muscle)}</span>
                  <strong>{item.setCount} sets</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>Complete a set this week to reveal your training balance.</p>
          )}
        </div>
      </section>

      <div className={styles.historyGrid}>
        <section className={styles.sessions} aria-labelledby="sessions-title">
          <header className={styles.sectionHeader}>
            <div>
              <p>Workout ledger</p>
              <h2 id="sessions-title">Session history</h2>
            </div>
            <span>Page {history.pagination.page}</span>
          </header>

          {history.sessions.length > 0 ? (
            <div className={styles.sessionList}>
              {history.sessions.map((session) => (
                <details
                  className={styles.sessionRecord}
                  key={`${session.plannedDate}-${session.startedAt}`}
                >
                  <summary>
                    <span
                      className={styles.sessionStatus}
                      data-status={session.status}
                      aria-hidden="true"
                    >
                      <Icon
                        icon={
                          session.status === "completed"
                            ? CheckmarkCircle02Icon
                            : Dumbbell01Icon
                        }
                        size={20}
                      />
                    </span>
                    <div className={styles.sessionTitle}>
                      <strong>
                        {longDateFormatter.format(
                          dateFromCalendarDate(session.plannedDate),
                        )}
                      </strong>
                      <span>
                        {session.status === "completed"
                          ? "Completed workout"
                          : "Ended early"}
                      </span>
                    </div>
                    <div
                      className={styles.sessionMetrics}
                      aria-label="Session summary"
                      role="group"
                    >
                      <span>
                        <small>Sets</small>
                        <strong>{session.totalSets}</strong>
                      </span>
                      <span>
                        <small>Time</small>
                        <strong>{session.durationMinutes} min</strong>
                      </span>
                      <span>
                        <small>Volume</small>
                        <strong>
                          {numberFormatter.format(session.volumeKilograms)} kg
                        </strong>
                      </span>
                    </div>
                    <span className={styles.expandIcon} aria-hidden="true">
                      <Icon icon={ArrowDown01Icon} size={18} />
                    </span>
                  </summary>

                  <div className={styles.sessionDetails}>
                    {session.exercises.length > 0 ? (
                      session.exercises.map((exercise) => (
                        <article key={exercise.position}>
                          <header>
                            <div>
                              <h3>{exercise.name}</h3>
                              <p>{formatExerciseValue(exercise.primaryMuscle)}</p>
                            </div>
                            <span>{exercise.sets.length} sets</span>
                          </header>
                          <ol>
                            {exercise.sets.map((set) => (
                              <li key={set.setNumber}>
                                <span>Set {set.setNumber}</span>
                                <strong>{set.repetitions} reps</strong>
                                <span>{formatLoad(set.weightKilograms)}</span>
                                <span>
                                  {set.effortRir === null
                                    ? "RIR not recorded"
                                    : `${set.effortRir} RIR`}
                                </span>
                              </li>
                            ))}
                          </ol>
                        </article>
                      ))
                    ) : (
                      <p className={styles.noSets}>
                        This session ended before a set was recorded.
                      </p>
                    )}
                    <WorkoutHistoryActions
                      plannedDate={session.plannedDate}
                    />
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Icon icon={Dumbbell01Icon} size={48} />
              <h3>
                {history.pagination.page > 1
                  ? "No workouts on this page"
                  : "No ended workouts yet"}
              </h3>
              <p>
                {history.pagination.page > 1
                  ? "Return to your latest sessions to continue reviewing your training ledger."
                  : "Complete or end a planned workout to build your private training ledger."}
              </p>
              <Link
                href={
                  history.pagination.page > 1
                    ? historyHref(weekStart)
                    : AUTH_ROUTES.training
                }
              >
                {history.pagination.page > 1
                  ? "View latest sessions"
                  : "Open weekly plan"}
              </Link>
            </div>
          )}

          {(history.pagination.page > 1 ||
            history.pagination.hasNextPage) && (
            <nav className={styles.pagination} aria-label="Session pages">
              {history.pagination.page > 1 ? (
                <Link
                  href={historyHref(
                    weekStart,
                    history.pagination.page - 1,
                  )}
                >
                  <Icon icon={ArrowLeft01Icon} size={18} />
                  Newer
                </Link>
              ) : (
                <span />
              )}
              {history.pagination.hasNextPage && (
                <Link
                  href={historyHref(
                    weekStart,
                    history.pagination.page + 1,
                  )}
                >
                  Older
                  <Icon icon={ArrowRight01Icon} size={18} />
                </Link>
              )}
            </nav>
          )}
        </section>

        <aside className={styles.insights} aria-labelledby="insights-title">
          <header className={styles.sectionHeader}>
            <div>
              <p>Progression guide</p>
              <h2 id="insights-title">Next-load advice</h2>
            </div>
          </header>
          <p className={styles.insightNote}>
            Advice uses your latest completed sessions. It never uses abandoned
            workouts or estimates bodyweight load.
          </p>

          {history.recommendations.length > 0 ? (
            <ol className={styles.recommendations}>
              {history.recommendations.map((recommendation) => (
                <li
                  data-status={recommendation.status}
                  key={recommendation.exerciseId}
                >
                  <div>
                    <span aria-hidden="true">
                      <Icon
                        icon={
                          recommendation.status === "increase"
                            ? WeightScale01Icon
                            : RepeatIcon
                        }
                        size={20}
                      />
                    </span>
                    <div>
                      <h3>{recommendation.exerciseName}</h3>
                      <p>
                        {recommendation.status === "increase"
                          ? `Try ${numberFormatter.format(recommendation.suggestedWeightKilograms)} kg next time`
                          : `Hold at ${numberFormatter.format(recommendation.currentWeightKilograms)} kg`}
                      </p>
                    </div>
                  </div>
                  {recommendation.previousWeightKilograms !== null && (
                    <p className={styles.loadHistory}>
                      Last two loads: {numberFormatter.format(
                        recommendation.previousWeightKilograms,
                      )}{" "}
                      kg → {numberFormatter.format(
                        recommendation.currentWeightKilograms,
                      )}{" "}
                      kg
                    </p>
                  )}
                  <p>{recommendation.reason}</p>
                </li>
              ))}
            </ol>
          ) : (
            <div className={styles.insightEmpty}>
              <Icon icon={Clock01Icon} size={28} />
              <p>
                Record weighted sets in completed workouts to unlock
                progression guidance.
              </p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
