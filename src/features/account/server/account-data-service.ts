import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/database/prisma";

const accountExportInclude = {
  measurementSnapshots: { orderBy: { recordedAt: "asc" } },
  profile: true,
  trainingPreferences: true,
  trainingWeeks: {
    orderBy: { weekStart: "asc" },
    include: {
      days: {
        orderBy: { plannedDate: "asc" },
        include: {
          exercises: {
            orderBy: { position: "asc" },
            include: { plannedSets: { orderBy: { setNumber: "asc" } } },
          },
          session: {
            include: {
              setLogs: {
                orderBy: [{ completedAt: "asc" }, { setNumber: "asc" }],
                include: {
                  workoutExercise: { select: { position: true } },
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

type StoredAccountExport = Prisma.UserGetPayload<{
  include: typeof accountExportInclude;
}>;

function toCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function kilograms(grams: number | null): number | null {
  return grams === null ? null : grams / 1_000;
}

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
          weightKilograms: kilograms(user.profile.weightGrams),
        }
      : null,
    measurementHistory: user.measurementSnapshots.map((snapshot) => ({
      heightCentimeters: snapshot.heightCentimeters,
      recordedAt: snapshot.recordedAt.toISOString(),
      weightKilograms: kilograms(snapshot.weightGrams),
    })),
    trainingPreferences: user.trainingPreferences
      ? {
          availableEquipment: user.trainingPreferences.availableEquipment,
          experienceLevel:
            user.trainingPreferences.experienceLevel.toLowerCase(),
          goal: user.trainingPreferences.goal.toLowerCase(),
          preferredSessionMinutes:
            user.trainingPreferences.preferredSessionMinutes,
          preferredTrainingDays:
            user.trainingPreferences.preferredTrainingDays,
          timezone: user.trainingPreferences.timezone,
          updatedAt: user.trainingPreferences.updatedAt.toISOString(),
        }
      : null,
    trainingWeeks: user.trainingWeeks.map((week) => ({
      weekStart: toCalendarDate(week.weekStart),
      days: week.days.map((day) => ({
        availableMinutes: day.availableMinutes,
        kind: day.kind.toLowerCase(),
        plannedDate: toCalendarDate(day.plannedDate),
        preferredBodyPart: day.preferredBodyPart,
        recommendationEngineVersion: day.recommendationEngineVersion,
        source: day.source.toLowerCase(),
        status: day.status.toLowerCase(),
        exercises: day.exercises.map((exercise) => ({
          bodyPart: exercise.exerciseBodyPart,
          category: exercise.exerciseCategory,
          equipment: exercise.exerciseEquipment,
          name: exercise.exerciseName,
          position: exercise.position,
          primaryMuscle: exercise.exercisePrimaryMuscle,
          provider: exercise.exerciseProvider,
          providerAttributionUrl: exercise.exerciseAttributionUrl,
          providerExerciseId: exercise.exerciseSourceId,
          providerSourceVersion: exercise.exerciseSourceVersion,
          recommendationReasons: exercise.recommendationReasons,
          secondaryMuscles: exercise.exerciseSecondaryMuscles,
          sets: exercise.plannedSets.map((set) => ({
            restSeconds: set.restSeconds,
            setNumber: set.setNumber,
            targetRepetitions: set.targetRepetitions,
            targetWeightKilograms: kilograms(set.targetWeightGrams),
          })),
        })),
        session: day.session
          ? {
              completedAt: day.session.completedAt?.toISOString() ?? null,
              startedAt: day.session.startedAt.toISOString(),
              status: day.session.status.toLowerCase(),
              sets: day.session.setLogs.map((log) => ({
                completedAt: log.completedAt.toISOString(),
                effortRir: log.effortRir,
                exercisePosition: log.workoutExercise.position,
                repetitions: log.repetitions,
                setNumber: log.setNumber,
                weightKilograms: kilograms(log.weightGrams),
              })),
            }
          : null,
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
