import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/database/prisma";
import { toExerciseSummary } from "@/features/exercises/catalog/exercise-summary";
import { getExerciseCatalogItem } from "@/features/exercises/server/exercise-catalog";
import type {
  ScheduleExerciseInput,
  TrainingSessionCalendarExercise,
  TrainingSessionCalendarItem,
} from "../session-schema";

const MAX_CALENDAR_MEDIA_LOOKUPS = 120;
const CALENDAR_MEDIA_CONCURRENCY = 6;

export type ScheduleExerciseResult =
  | Readonly<{
      exerciseName: string;
      scheduledDate: string;
      status: "created";
    }>
  | Readonly<{
      status: "duplicate" | "exercise-not-found" | "profile-required";
    }>;

export type GetTrainingSessionsResult =
  | Readonly<{
      sessions: readonly TrainingSessionCalendarItem[];
      status: "ok";
    }>
  | Readonly<{ status: "profile-required" }>;

function calendarMonthBounds(month: string) {
  const year = Number(month.slice(0, 4));
  const monthNumber = Number(month.slice(5, 7));

  return {
    end: new Date(Date.UTC(year, monthNumber, 1)),
    start: new Date(Date.UTC(year, monthNumber - 1, 1)),
  };
}

async function loadCalendarExerciseImages(exerciseIds: readonly string[]) {
  const uniqueIds = Array.from(new Set(exerciseIds)).slice(
    0,
    MAX_CALENDAR_MEDIA_LOOKUPS,
  );
  const images = new Map<
    string,
    TrainingSessionCalendarExercise["image"]
  >();
  let nextIndex = 0;
  let providerUnavailable = false;

  async function worker() {
    while (!providerUnavailable && nextIndex < uniqueIds.length) {
      const exerciseId = uniqueIds[nextIndex];
      nextIndex += 1;

      try {
        const exercise = await getExerciseCatalogItem(exerciseId);
        images.set(
          exerciseId,
          exercise ? toExerciseSummary(exercise).image : null,
        );
      } catch {
        providerUnavailable = true;
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(CALENDAR_MEDIA_CONCURRENCY, uniqueIds.length) },
      () => worker(),
    ),
  );

  return images;
}

export async function getTrainingSessionsForClerkUser(
  clerkUserId: string,
  month: string,
): Promise<GetTrainingSessionsResult> {
  const { start, end } = calendarMonthBounds(month);
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: {
      profile: { select: { id: true } },
      trainingSessions: {
        where: { scheduledDate: { gte: start, lt: end } },
        orderBy: { scheduledDate: "asc" },
        select: {
          scheduledDate: true,
          exercises: {
            orderBy: { createdAt: "asc" },
            select: {
              exerciseName: true,
              exerciseSourceId: true,
              plannedRepetitionsPerSet: true,
              plannedSets: true,
              plannedWeightGrams: true,
            },
          },
        },
      },
    },
  });

  if (!user?.profile) {
    return { status: "profile-required" };
  }

  const images = await loadCalendarExerciseImages(
    user.trainingSessions.flatMap((session) =>
      session.exercises.map((exercise) => exercise.exerciseSourceId),
    ),
  );

  return {
    status: "ok",
    sessions: user.trainingSessions.map((session) => ({
      date: session.scheduledDate.toISOString().slice(0, 10),
      exercises: session.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseSourceId,
        image: images.get(exercise.exerciseSourceId) ?? null,
        name: exercise.exerciseName,
        repetitionsPerSet: exercise.plannedRepetitionsPerSet,
        sets: exercise.plannedSets,
        weightKilograms:
          exercise.plannedWeightGrams === null
            ? null
            : exercise.plannedWeightGrams / 1_000,
      })),
    })),
  };
}

export async function scheduleExerciseForClerkUser(
  clerkUserId: string,
  input: ScheduleExerciseInput,
): Promise<ScheduleExerciseResult> {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true, profile: { select: { id: true } } },
  });

  if (!user?.profile) {
    return { status: "profile-required" };
  }

  const exercise = await getExerciseCatalogItem(input.exerciseId);
  if (!exercise) {
    return { status: "exercise-not-found" };
  }

  const scheduledDate = new Date(`${input.scheduledDate}T00:00:00.000Z`);

  try {
    await prisma.$transaction(async (transaction) => {
      const session = await transaction.trainingSession.upsert({
        where: {
          userId_scheduledDate: {
            userId: user.id,
            scheduledDate,
          },
        },
        create: {
          userId: user.id,
          scheduledDate,
        },
        update: {},
        select: { id: true },
      });

      await transaction.trainingSessionExercise.create({
        data: {
          trainingSessionId: session.id,
          exerciseProvider: exercise.source.provider,
          exerciseSourceId: exercise.source.sourceId,
          exerciseSourceVersion: exercise.source.version,
          exerciseAttributionUrl: exercise.source.attributionUrl,
          exerciseName: exercise.name,
          plannedSets: input.sets,
          plannedRepetitionsPerSet: input.repetitionsPerSet,
          plannedWeightGrams: Math.round(input.weightKilograms * 1_000),
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { status: "duplicate" };
    }

    throw error;
  }

  return {
    exerciseName: exercise.name,
    scheduledDate: input.scheduledDate,
    status: "created",
  };
}
