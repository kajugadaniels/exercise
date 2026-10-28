import { z } from "zod";
import { equipmentIds } from "@/features/exercises/domain/exercise";

export const trainingGoalValues = [
  "general-fitness",
  "strength",
  "muscle-gain",
  "endurance",
] as const;

export const trainingExperienceValues = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export type TrainingGoalValue = (typeof trainingGoalValues)[number];
export type TrainingExperienceValue =
  (typeof trainingExperienceValues)[number];

function hasUniqueValues(values: readonly unknown[]): boolean {
  return new Set(values).size === values.length;
}

export function isSupportedTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export const trainingPreferencesSchema = z
  .object({
    goal: z.enum(trainingGoalValues, {
      message: "Choose your main training goal.",
    }),
    experienceLevel: z.enum(trainingExperienceValues, {
      message: "Choose your current experience level.",
    }),
    preferredSessionMinutes: z
      .number()
      .int("Use a whole number of minutes.")
      .min(15, "A session must be at least 15 minutes.")
      .max(240, "A session must be 240 minutes or less."),
    timezone: z
      .string()
      .trim()
      .min(1, "Enter your timezone.")
      .max(64, "Timezone must be 64 characters or less.")
      .refine(isSupportedTimeZone, "Enter a valid IANA timezone."),
    availableEquipment: z
      .array(z.enum(equipmentIds))
      .min(1, "Select at least one equipment option.")
      .max(equipmentIds.length)
      .refine(hasUniqueValues, "Select each equipment option only once."),
    preferredTrainingDays: z
      .array(z.number().int().min(1).max(7))
      .max(7)
      .refine(hasUniqueValues, "Select each training day only once."),
  })
  .strict();

export type TrainingPreferencesInput = z.infer<
  typeof trainingPreferencesSchema
>;

export type TrainingPreferencesView = TrainingPreferencesInput & {
  updatedAt: string;
};
