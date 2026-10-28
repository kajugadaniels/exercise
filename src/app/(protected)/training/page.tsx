import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ChartLineData01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/Icon/Icon";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import { TrainingPlanner } from "@/features/training/components/TrainingPlanner/TrainingPlanner";
import {
  getCalendarDateInTimeZone,
  getTrainingWeekStartForDate,
} from "@/features/training/domain/training";
import { getTrainingPreferencesForClerkUser } from "@/features/training/server/training-preferences-service";
import { getTrainingWeekForClerkUser } from "@/features/training/server/training-week-service";
import { trainingWeekStartSchema } from "@/features/training/training-week-schema";
import styles from "./page.module.css";

type TrainingPageProps = Readonly<{
  searchParams: Promise<{ week?: string | string[] }>;
}>;

export default async function TrainingPage({
  searchParams,
}: TrainingPageProps) {
  const { userId } = await auth.protect();
  const preferences = await getTrainingPreferencesForClerkUser(userId);
  const currentCalendarDate = getCalendarDateInTimeZone(
    preferences?.timezone ?? "UTC",
  );
  const currentWeekStart = getTrainingWeekStartForDate(currentCalendarDate);

  if (!currentWeekStart) {
    throw new Error("The current training week could not be determined.");
  }

  const requestedWeek = (await searchParams).week;
  const parsedWeek = trainingWeekStartSchema.safeParse(
    Array.isArray(requestedWeek) ? requestedWeek[0] : requestedWeek,
  );
  const weekStart = parsedWeek.success ? parsedWeek.data : currentWeekStart;
  const plan = await getTrainingWeekForClerkUser(userId, weekStart);

  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Personal training</p>
          <h1>Build your week</h1>
          <Link
            className={styles.historyLink}
            href={`${AUTH_ROUTES.trainingHistory}?week=${weekStart}`}
          >
            <Icon icon={ChartLineData01Icon} size={18} />
            View training history
          </Link>
        </div>
        <p>
          Plan one week at a time, keep recovery visible, and record the exact
          repetitions, rest, and weight you intend to use.
        </p>
      </header>

      <TrainingPlanner
        currentWeekStart={currentWeekStart}
        initialPlan={plan}
        key={weekStart}
        weekStart={weekStart}
      />
    </main>
  );
}
