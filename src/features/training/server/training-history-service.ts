import "server-only";
import {
  Prisma,
  TrainingDayKind,
  TrainingDayStatus,
  WorkoutSessionStatus,
} from "@/generated/prisma/client";
import {
  muscleIds,
  type MuscleId,
} from "@/features/exercises/domain/exercise";
import { prisma } from "@/server/database/prisma";
import { getTrainingWeekDates } from "../domain/training";
import {
  buildProgressionRecommendations,
  buildWeeklyReport,
  toWorkoutHistorySession,
  type TrainingHistorySourceSet,
  type TrainingHistorySourceSession,
} from "../training-history";
import {
  TRAINING_HISTORY_PAGE_SIZE,
  trainingHistoryViewSchema,
  type TrainingHistoryView,
} from "../training-history-schema";

const RECOMMENDATION_SESSION_LIMIT = 40;

export const trainingHistorySessionInclude = {
  trainingDay: { select: { plannedDate: true } },
  setLogs: {
    orderBy: [{ completedAt: "asc" }, { setNumber: "asc" }],
    include: {
      plannedSet: { select: { targetRepetitions: true } },
      workoutExercise: {
        select: {
          exerciseName: true,
          exercisePrimaryMuscle: true,
          exerciseProvider: true,
          exerciseSourceId: true,
          position: true,
        },
      },
    },
  },
} satisfies Prisma.WorkoutSessionInclude;

export type StoredTrainingHistorySession = Prisma.WorkoutSessionGetPayload<{
  include: typeof trainingHistorySessionInclude;
}>;

function toCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toDatabaseDate(calendarDate: string): Date {
  return new Date(`${calendarDate}T00:00:00.000Z`);
}

function parseMuscle(value: string): MuscleId {
  const muscle = muscleIds.find((candidate) => candidate === value);
  if (!muscle) {
    throw new Error("Stored exercise muscle is invalid.");
  }

  return muscle;
}

function toHistoryStatus(
  status: WorkoutSessionStatus,
): "completed" | "abandoned" {
  if (status === WorkoutSessionStatus.COMPLETED) {
    return "completed";
  }

  if (status === WorkoutSessionStatus.ABANDONED) {
    return "abandoned";
  }

  throw new Error("An active session cannot appear in workout history.");
}

export function toTrainingHistorySourceSession(
  session: StoredTrainingHistorySession,
): TrainingHistorySourceSession {
  if (!session.completedAt) {
    throw new Error("An ended workout session is missing its end time.");
  }

  const exerciseByKey = new Map<
    string,
    {
      exerciseKey: string;
      name: string;
      position: number;
      primaryMuscle: MuscleId;
      sets: TrainingHistorySourceSet[];
    }
  >();

  for (const log of session.setLogs) {
    if (!log.plannedSet) {
      continue;
    }

    const exerciseKey = [
      log.workoutExercise.exerciseProvider,
      log.workoutExercise.exerciseSourceId,
    ].join("/");
    const existing = exerciseByKey.get(exerciseKey) ?? {
      exerciseKey,
      name: log.workoutExercise.exerciseName,
      position: log.workoutExercise.position,
      primaryMuscle: parseMuscle(
        log.workoutExercise.exercisePrimaryMuscle,
      ),
      sets: [],
    };

    existing.sets.push({
      completedAt: log.completedAt.toISOString(),
      effortRir: log.effortRir,
      repetitions: log.repetitions,
      setNumber: log.setNumber,
      targetRepetitions: log.plannedSet.targetRepetitions,
      weightGrams: log.weightGrams,
    });
    exerciseByKey.set(exerciseKey, existing);
  }

  const exercises = [...exerciseByKey.values()]
    .sort((left, right) => left.position - right.position)
    .map((exercise) => ({
      exerciseKey: exercise.exerciseKey,
      name: exercise.name,
      position: exercise.position,
      primaryMuscle: exercise.primaryMuscle,
      sets: [...exercise.sets].sort(
        (left, right) => left.setNumber - right.setNumber,
      ),
    }));

  return {
    endedAt: session.completedAt.toISOString(),
    exercises,
    plannedDate: toCalendarDate(session.trainingDay.plannedDate),
    startedAt: session.startedAt.toISOString(),
    status: toHistoryStatus(session.status),
  };
}

export async function getTrainingHistoryForClerkUser(
  clerkUserId: string,
  weekStart: string,
  page: number,
): Promise<TrainingHistoryView> {
  const weekDates = getTrainingWeekDates(weekStart);
  const weekEnd = weekDates.at(-1);

  if (!weekEnd) {
    throw new Error("The requested training week is invalid.");
  }

  const ownerScope = { trainingDay: { trainingWeek: { user: { clerkUserId } } } };
  const endedStatusScope = {
    status: {
      in: [
        WorkoutSessionStatus.COMPLETED,
        WorkoutSessionStatus.ABANDONED,
      ],
    },
    completedAt: { not: null },
  };
  const [scheduledWorkoutDays, weekRecords, pageRecords, insightRecords] =
    await Promise.all([
      prisma.trainingDay.findMany({
        where: {
          kind: TrainingDayKind.WORKOUT,
          plannedDate: {
            gte: toDatabaseDate(weekStart),
            lte: toDatabaseDate(weekEnd),
          },
          trainingWeek: { user: { clerkUserId } },
        },
        orderBy: { plannedDate: "asc" },
        select: { plannedDate: true, status: true },
      }),
      prisma.workoutSession.findMany({
        where: {
          ...ownerScope,
          ...endedStatusScope,
          trainingDay: {
            plannedDate: {
              gte: toDatabaseDate(weekStart),
              lte: toDatabaseDate(weekEnd),
            },
            trainingWeek: { user: { clerkUserId } },
          },
        },
        orderBy: { completedAt: "desc" },
        include: trainingHistorySessionInclude,
      }),
      prisma.workoutSession.findMany({
        where: { ...ownerScope, ...endedStatusScope },
        orderBy: { completedAt: "desc" },
        skip: (page - 1) * TRAINING_HISTORY_PAGE_SIZE,
        take: TRAINING_HISTORY_PAGE_SIZE + 1,
        include: trainingHistorySessionInclude,
      }),
      prisma.workoutSession.findMany({
        where: {
          ...ownerScope,
          status: WorkoutSessionStatus.COMPLETED,
          completedAt: { not: null },
        },
        orderBy: { completedAt: "desc" },
        take: RECOMMENDATION_SESSION_LIMIT,
        include: trainingHistorySessionInclude,
      }),
    ]);

  const hasNextPage = pageRecords.length > TRAINING_HISTORY_PAGE_SIZE;
  const sessions = pageRecords
    .slice(0, TRAINING_HISTORY_PAGE_SIZE)
    .map(toTrainingHistorySourceSession);
  const weeklySessions = weekRecords.map(toTrainingHistorySourceSession);
  const insightSessions = insightRecords.map(toTrainingHistorySourceSession);

  return trainingHistoryViewSchema.parse({
    pagination: {
      hasNextPage,
      page,
      pageSize: TRAINING_HISTORY_PAGE_SIZE,
    },
    recommendations: buildProgressionRecommendations(insightSessions),
    sessions: sessions.map(toWorkoutHistorySession),
    weeklyReport: buildWeeklyReport(
      weekStart,
      scheduledWorkoutDays.map((day) => ({
        date: toCalendarDate(day.plannedDate),
        status:
          day.status === TrainingDayStatus.IN_PROGRESS
            ? "in-progress"
            : day.status === TrainingDayStatus.SKIPPED
              ? "skipped"
            : "planned",
      })),
      weeklySessions,
    ),
  });
}
