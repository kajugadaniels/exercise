import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/database/prisma";
import { getExerciseCatalogItem } from "@/features/exercises/server/exercise-catalog";
import type { ScheduleExerciseInput } from "../session-schema";

export type ScheduleExerciseResult =
  | Readonly<{
      exerciseName: string;
      scheduledDate: string;
      status: "created";
    }>
  | Readonly<{
      status: "duplicate" | "exercise-not-found" | "profile-required";
    }>;

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
