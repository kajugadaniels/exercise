import "server-only";
import {
  TrainingExperienceLevel,
  TrainingGoal,
} from "@/generated/prisma/client";
import { prisma } from "@/server/database/prisma";
import {
  trainingPreferencesSchema,
  type TrainingExperienceValue,
  type TrainingGoalValue,
  type TrainingPreferencesInput,
  type TrainingPreferencesView,
} from "../training-preferences-schema";

const databaseGoalByValue: Record<TrainingGoalValue, TrainingGoal> = {
  "general-fitness": TrainingGoal.GENERAL_FITNESS,
  strength: TrainingGoal.STRENGTH,
  "muscle-gain": TrainingGoal.MUSCLE_GAIN,
  endurance: TrainingGoal.ENDURANCE,
};

const goalValueByDatabaseGoal: Record<TrainingGoal, TrainingGoalValue> = {
  [TrainingGoal.GENERAL_FITNESS]: "general-fitness",
  [TrainingGoal.STRENGTH]: "strength",
  [TrainingGoal.MUSCLE_GAIN]: "muscle-gain",
  [TrainingGoal.ENDURANCE]: "endurance",
};

const databaseExperienceByValue: Record<
  TrainingExperienceValue,
  TrainingExperienceLevel
> = {
  beginner: TrainingExperienceLevel.BEGINNER,
  intermediate: TrainingExperienceLevel.INTERMEDIATE,
  advanced: TrainingExperienceLevel.ADVANCED,
};

const experienceValueByDatabaseExperience: Record<
  TrainingExperienceLevel,
  TrainingExperienceValue
> = {
  [TrainingExperienceLevel.BEGINNER]: "beginner",
  [TrainingExperienceLevel.INTERMEDIATE]: "intermediate",
  [TrainingExperienceLevel.ADVANCED]: "advanced",
};

type StoredTrainingPreferences = {
  availableEquipment: string[];
  experienceLevel: TrainingExperienceLevel;
  goal: TrainingGoal;
  preferredSessionMinutes: number;
  preferredTrainingDays: number[];
  timezone: string;
  updatedAt: Date;
};

function toTrainingPreferencesView(
  preferences: StoredTrainingPreferences,
): TrainingPreferencesView {
  const result = trainingPreferencesSchema.safeParse({
    goal: goalValueByDatabaseGoal[preferences.goal],
    experienceLevel:
      experienceValueByDatabaseExperience[preferences.experienceLevel],
    preferredSessionMinutes: preferences.preferredSessionMinutes,
    timezone: preferences.timezone,
    availableEquipment: preferences.availableEquipment,
    preferredTrainingDays: preferences.preferredTrainingDays,
  });

  if (!result.success) {
    throw new Error("Stored training preferences are invalid.");
  }

  return {
    ...result.data,
    updatedAt: preferences.updatedAt.toISOString(),
  };
}

export async function getTrainingPreferencesForClerkUser(
  clerkUserId: string,
): Promise<TrainingPreferencesView | null> {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { trainingPreferences: true },
  });

  return user?.trainingPreferences
    ? toTrainingPreferencesView(user.trainingPreferences)
    : null;
}

export async function saveTrainingPreferencesForClerkUser(
  clerkUserId: string,
  preferences: TrainingPreferencesInput,
): Promise<TrainingPreferencesView> {
  const storedPreferences = {
    goal: databaseGoalByValue[preferences.goal],
    experienceLevel:
      databaseExperienceByValue[preferences.experienceLevel],
    preferredSessionMinutes: preferences.preferredSessionMinutes,
    timezone: preferences.timezone.trim(),
    availableEquipment: [...preferences.availableEquipment].sort(),
    preferredTrainingDays: [...preferences.preferredTrainingDays].sort(
      (left, right) => left - right,
    ),
  };

  const user = await prisma.user.upsert({
    where: { clerkUserId },
    create: {
      clerkUserId,
      trainingPreferences: { create: storedPreferences },
    },
    update: {
      trainingPreferences: {
        upsert: {
          create: storedPreferences,
          update: storedPreferences,
        },
      },
    },
    select: { trainingPreferences: true },
  });

  if (!user.trainingPreferences) {
    throw new Error("Training preferences were not persisted.");
  }

  return toTrainingPreferencesView(user.trainingPreferences);
}

export async function deleteTrainingPreferencesForClerkUser(
  clerkUserId: string,
): Promise<void> {
  await prisma.trainingPreferences.deleteMany({
    where: { user: { clerkUserId } },
  });
}
