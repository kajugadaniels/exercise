import "server-only";
import {
  TrainingDayKind,
  WorkoutSessionStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/server/database/prisma";
import {
  buildTrainingAnalytics,
  getTrainingAnalyticsStartDate,
} from "../training-analytics";
import type { TrainingAnalyticsView } from "../training-analytics-schema";
import {
  toTrainingHistorySourceSession,
  trainingHistorySessionInclude,
} from "./training-history-service";

function toDatabaseDate(calendarDate: string): Date {
  return new Date(`${calendarDate}T00:00:00.000Z`);
}

function toCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getTrainingAnalyticsForClerkUser(
  clerkUserId: string,
  weeks: 4 | 8 | 12,
  endDate: string,
): Promise<TrainingAnalyticsView> {
  const startDate = getTrainingAnalyticsStartDate(endDate, weeks);
  const dateRange = {
    gte: toDatabaseDate(startDate),
    lte: toDatabaseDate(endDate),
  };
  const [scheduledWorkouts, completedSessions] = await Promise.all([
    prisma.trainingDay.findMany({
      where: {
        kind: TrainingDayKind.WORKOUT,
        plannedDate: dateRange,
        trainingWeek: { user: { clerkUserId } },
      },
      orderBy: { plannedDate: "asc" },
      select: { plannedDate: true },
    }),
    prisma.workoutSession.findMany({
      where: {
        completedAt: { not: null },
        status: WorkoutSessionStatus.COMPLETED,
        trainingDay: {
          plannedDate: dateRange,
          trainingWeek: { user: { clerkUserId } },
        },
      },
      orderBy: { completedAt: "asc" },
      include: trainingHistorySessionInclude,
    }),
  ]);

  return buildTrainingAnalytics(
    endDate,
    weeks,
    scheduledWorkouts.map((workout) => ({
      plannedDate: toCalendarDate(workout.plannedDate),
    })),
    completedSessions.map(toTrainingHistorySourceSession),
  );
}
