import { z } from "zod";
import { bodyPartIds } from "@/features/exercises/domain/exercise";
import {
  getTrainingWeekDates,
  isMondayCalendarDate,
} from "./domain/training";

export const MAX_EXERCISES_PER_DAY = 12;
export const MAX_EXERCISES_PER_WEEK = 40;
export const MAX_PLANNED_SETS_PER_EXERCISE = 20;
export const MAX_PLANNED_SETS_PER_WEEK = 200;

export const trainingCalendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a calendar date in YYYY-MM-DD format.");

export const trainingWeekStartSchema = trainingCalendarDateSchema.refine(
  isMondayCalendarDate,
  "The training week must start on a Monday.",
);

const exerciseIdSchema = z
  .string()
  .trim()
  .min(1, "Choose an exercise.")
  .max(200, "Exercise identifier is too long.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Choose a valid exercise.",
  );

const weightKilogramsSchema = z
  .number()
  .finite()
  .min(0, "Weight cannot be negative.")
  .max(1_000, "Weight must be 1,000 kg or less.")
  .refine(
    (value) => Number.isInteger(value * 1_000),
    "Weight supports up to three decimal places.",
  );

const plannedSetSchema = z
  .object({
    targetRepetitions: z
      .number()
      .int("Repetitions must be a whole number.")
      .min(1, "Enter at least one repetition.")
      .max(1_000, "Repetitions must be 1,000 or less."),
    targetWeightKilograms: weightKilogramsSchema.nullable().default(null),
    restSeconds: z
      .number()
      .int("Rest time must be a whole number of seconds.")
      .min(0, "Rest time cannot be negative.")
      .max(3_600, "Rest time must be one hour or less.")
      .nullable()
      .default(null),
  })
  .strict();

const plannedExerciseSchema = z
  .object({
    exerciseId: exerciseIdSchema,
    sets: z
      .array(plannedSetSchema)
      .min(1, "Add at least one set.")
      .max(
        MAX_PLANNED_SETS_PER_EXERCISE,
        `An exercise supports at most ${MAX_PLANNED_SETS_PER_EXERCISE} sets.`,
      ),
  })
  .strict();

const restDaySchema = z
  .object({
    kind: z.literal("rest"),
    plannedDate: trainingCalendarDateSchema,
  })
  .strict();

const workoutDaySchema = z
  .object({
    kind: z.literal("workout"),
    plannedDate: trainingCalendarDateSchema,
    availableMinutes: z
      .number()
      .int("Available time must be a whole number of minutes.")
      .min(15, "Allow at least 15 minutes for a workout.")
      .max(480, "A workout must be eight hours or less."),
    preferredBodyPart: z.enum(bodyPartIds).nullable().default(null),
    exercises: z
      .array(plannedExerciseSchema)
      .min(1, "Add at least one exercise to a workout day.")
      .max(
        MAX_EXERCISES_PER_DAY,
        `A day supports at most ${MAX_EXERCISES_PER_DAY} exercises.`,
      )
      .refine(
        (exercises) =>
          new Set(exercises.map((exercise) => exercise.exerciseId)).size ===
          exercises.length,
        "Add each exercise only once per day.",
      ),
  })
  .strict();

const trainingDayInputSchema = z.discriminatedUnion("kind", [
  workoutDaySchema,
  restDaySchema,
]);

const trainingWeekInputBaseSchema = z
  .object({
    days: z
      .array(trainingDayInputSchema)
      .length(7, "A training week must include Monday through Sunday."),
  })
  .strict();

export type TrainingWeekInput = z.infer<
  typeof trainingWeekInputBaseSchema
>;

export function createTrainingWeekInputSchema(weekStart: string) {
  return trainingWeekInputBaseSchema.superRefine((value, context) => {
    const expectedDates = getTrainingWeekDates(weekStart);
    const submittedDates = value.days.map((day) => day.plannedDate);

    if (
      expectedDates.length !== 7 ||
      new Set(submittedDates).size !== submittedDates.length ||
      expectedDates.some((date) => !submittedDates.includes(date))
    ) {
      context.addIssue({
        code: "custom",
        path: ["days"],
        message: "Include each date from Monday through Sunday exactly once.",
      });
    }

    const workoutDays = value.days.filter((day) => day.kind === "workout");
    const exerciseCount = workoutDays.reduce(
      (total, day) => total + day.exercises.length,
      0,
    );
    const setCount = workoutDays.reduce(
      (total, day) =>
        total +
        day.exercises.reduce(
          (dayTotal, exercise) => dayTotal + exercise.sets.length,
          0,
        ),
      0,
    );

    if (exerciseCount > MAX_EXERCISES_PER_WEEK) {
      context.addIssue({
        code: "custom",
        path: ["days"],
        message: `A week supports at most ${MAX_EXERCISES_PER_WEEK} exercises.`,
      });
    }

    if (setCount > MAX_PLANNED_SETS_PER_WEEK) {
      context.addIssue({
        code: "custom",
        path: ["days"],
        message: `A week supports at most ${MAX_PLANNED_SETS_PER_WEEK} planned sets.`,
      });
    }
  });
}
