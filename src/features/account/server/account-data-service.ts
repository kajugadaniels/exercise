import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/database/prisma";

const accountExportInclude = {
  profile: true,
  trainingSessions: {
    orderBy: { scheduledDate: "asc" },
    include: {
      exercises: { orderBy: { createdAt: "asc" } },
    },
  },
} satisfies Prisma.UserInclude;

type StoredAccountExport = Prisma.UserGetPayload<{
  include: typeof accountExportInclude;
}>;

function toAccountExport(user: StoredAccountExport) {
  return {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    profile: user.profile
      ? {
          completedAt: user.profile.completedAt.toISOString(),
          country: user.profile.country,
          gender: user.profile.gender.toLowerCase(),
          heightCentimeters: user.profile.heightCentimeters,
          updatedAt: user.profile.updatedAt.toISOString(),
          weightKilograms: user.profile.weightGrams / 1_000,
        }
      : null,
    trainingSessions: user.trainingSessions.map((session) => ({
      scheduledDate: session.scheduledDate.toISOString().slice(0, 10),
      exercises: session.exercises.map((exercise) => ({
        addedAt: exercise.createdAt.toISOString(),
        name: exercise.exerciseName,
        provider: exercise.exerciseProvider,
        providerAttributionUrl: exercise.exerciseAttributionUrl,
        providerExerciseId: exercise.exerciseSourceId,
        providerSourceVersion: exercise.exerciseSourceVersion,
      })),
    })),
  };
}

export async function getAccountDataExportForClerkUser(clerkUserId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    include: accountExportInclude,
  });
  return user ? toAccountExport(user) : null;
}

export async function deleteAccountDataForClerkUser(
  clerkUserId: string,
): Promise<void> {
  await prisma.user.deleteMany({ where: { clerkUserId } });
}
