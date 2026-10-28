import { z } from "zod";
import {
  getTrainingWeekStartForDate,
  trainingDayStatuses,
  workoutSessionStatuses,
} from "./domain/training";
import {
  MAX_EXERCISES_PER_DAY,
  MAX_PLANNED_SETS_PER_EXERCISE,
} from "./training-week-schema";

export const workoutDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a calendar date in YYYY-MM-DD format.")
  .refine(
    (value) => getTrainingWeekStartForDate(value) !== null,
    "Use a valid calendar date.",
  );

const actualWeightKilogramsSchema = z
  .number()
  .finite()
  .min(0, "Weight cannot be negative.")
  .max(1_000, "Weight must be 1,000 kg or less.")
  .refine(
    (value) => Number.isInteger(value * 1_000),
    "Weight supports up to three decimal places.",
  );

const recordSetActionSchema = z
  .object({
    action: z.literal("record-set"),
    exercisePosition: z.number().int().min(1).max(MAX_EXERCISES_PER_DAY),
    setNumber: z
      .number()
      .int()
      .min(1)
      .max(MAX_PLANNED_SETS_PER_EXERCISE),
    repetitions: z
      .number()
      .int("Repetitions must be a whole number.")
      .min(1, "Enter at least one repetition.")
      .max(1_000, "Repetitions must be 1,000 or less."),
    weightKilograms: actualWeightKilogramsSchema.nullable(),
    effortRir: z.number().int().min(0).max(10).nullable(),
  })
  .strict();

const workoutLifecycleActionSchema = z
  .object({ action: z.enum(["complete", "abandon", "skip"]) })
  .strict();

export const workoutSessionActionSchema = z.discriminatedUnion("action", [
  recordSetActionSchema,
  workoutLifecycleActionSchema,
]);

const recordedSetSchema = z
  .object({
    completedAt: z.string().datetime(),
    effortRir: z.number().int().min(0).max(10).nullable(),
    repetitions: z.number().int().min(1).max(1_000),
    weightGrams: z.number().int().min(0).nullable(),
  })
  .strict();

const executableSetSchema = z
  .object({
    actual: recordedSetSchema.nullable(),
    restSeconds: z.number().int().min(0).max(3_600).nullable(),
    setNumber: z
      .number()
      .int()
      .min(1)
      .max(MAX_PLANNED_SETS_PER_EXERCISE),
    targetRepetitions: z.number().int().min(1).max(1_000),
    targetWeightGrams: z.number().int().min(0).nullable(),
  })
  .strict();

const executableExerciseSchema = z
  .object({
    equipment: z.string().max(50).nullable(),
    name: z.string().min(1).max(180),
    position: z.number().int().min(1).max(MAX_EXERCISES_PER_DAY),
    sets: z
      .array(executableSetSchema)
      .min(1)
      .max(MAX_PLANNED_SETS_PER_EXERCISE),
  })
  .strict();

const workoutSessionViewSchema = z
  .object({
    completedAt: z.string().datetime().nullable(),
    startedAt: z.string().datetime(),
    status: z.enum(workoutSessionStatuses),
  })
  .strict();

export const workoutExecutionViewSchema = z
  .object({
    availableMinutes: z.number().int().min(15).max(480).nullable(),
    exercises: z
      .array(executableExerciseSchema)
      .min(1)
      .max(MAX_EXERCISES_PER_DAY),
    plannedDate: workoutDateSchema,
    session: workoutSessionViewSchema.nullable(),
    status: z.enum(trainingDayStatuses),
  })
  .strict();

export const workoutExecutionResponseSchema = z
  .object({ data: workoutExecutionViewSchema })
  .strict();

export type WorkoutSessionAction = z.infer<
  typeof workoutSessionActionSchema
>;
export type WorkoutExecutionView = z.infer<
  typeof workoutExecutionViewSchema
>;
export type WorkoutSetAction = Extract<
  WorkoutSessionAction,
  { action: "record-set" }
>;
