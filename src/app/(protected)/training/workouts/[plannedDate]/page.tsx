import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft01Icon, Dumbbell01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/Icon/Icon";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import { WorkoutSession } from "@/features/training/components/WorkoutSession/WorkoutSession";
import { getTrainingWeekStartForDate } from "@/features/training/domain/training";
import { getWorkoutForClerkUser } from "@/features/training/server/workout-session-service";
import { workoutDateSchema } from "@/features/training/workout-session-schema";
import styles from "./page.module.css";

type WorkoutPageProps = Readonly<{
  params: Promise<{ plannedDate: string }>;
}>;

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  weekday: "long",
  year: "numeric",
});

function toDisplayDate(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
  const { userId } = await auth.protect();
  const dateResult = workoutDateSchema.safeParse((await params).plannedDate);

  if (!dateResult.success) {
    notFound();
  }

  const plannedDate = dateResult.data;
  const workout = await getWorkoutForClerkUser(userId, plannedDate);
  const weekStart = getTrainingWeekStartForDate(plannedDate);
  const planHref = weekStart
    ? `${AUTH_ROUTES.training}?week=${encodeURIComponent(weekStart)}`
    : AUTH_ROUTES.training;

  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <Link href={planHref} aria-label="Back to weekly training plan">
          <Icon icon={ArrowLeft01Icon} size={20} />
        </Link>
        <div>
          <p>Planned workout</p>
          <h1>{dateFormatter.format(toDisplayDate(plannedDate))}</h1>
        </div>
      </header>

      {workout ? (
        <WorkoutSession initialWorkout={workout} planHref={planHref} />
      ) : (
        <section className={styles.emptyState}>
          <span aria-hidden="true">
            <Icon icon={Dumbbell01Icon} size={64} />
          </span>
          <h2>No workout is planned for this day</h2>
          <p>
            Choose a workout day in your weekly plan and add at least one
            exercise before starting a session.
          </p>
          <Link href={planHref}>Open weekly plan</Link>
        </section>
      )}
    </main>
  );
}
