import { z } from "zod";
import { muscleIds } from "@/features/exercises/domain/exercise";
import { trainingWeekStartSchema } from "./training-week-schema";
import { workoutDateSchema } from "./workout-session-schema";

export const TRAINING_HISTORY_PAGE_SIZE = 10;
export const TRAINING_HISTORY_MAX_PAGE = 100;

export const trainingHistoryQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .max(TRAINING_HISTORY_MAX_PAGE)
      .default(1),
    week: trainingWeekStartSchema.optional(),
  })
  .strict();

const historySetSchema = z
  .object({
    completedAt: z.string().datetime(),
    effortRir: z.number().int().min(0).max(10).nullable(),
    repetitions: z.number().int().min(1).max(1_000),
    setNumber: z.number().int().min(1).max(20),
    targetRepetitions: z.number().int().min(1).max(1_000),
    weightKilograms: z.number().min(0).max(1_000).nullable(),
  })
  .strict();

const historyExerciseSchema = z
  .object({
    name: z.string().min(1).max(180),
    position: z.number().int().min(1).max(12),
    primaryMuscle: z.enum(muscleIds),
    sets: z.array(historySetSchema).min(1).max(20),
  })
  .strict();

const historySessionSchema = z
  .object({
    durationMinutes: z.number().int().min(0),
    endedAt: z.string().datetime(),
    exercises: z.array(historyExerciseSchema).max(12),
    plannedDate: workoutDateSchema,
    startedAt: z.string().datetime(),
    status: z.enum(["completed", "abandoned"]),
    totalRepetitions: z.number().int().min(0),
    totalSets: z.number().int().min(0),
    volumeKilograms: z.number().min(0),
  })
  .strict();

const weeklyReportSchema = z
  .object({
    abandonedWorkouts: z.number().int().min(0),
    activeMinutes: z.number().int().min(0),
    completedWorkouts: z.number().int().min(0),
    days: z
      .array(
        z
          .object({
            date: workoutDateSchema,
            status: z.enum([
              "rest",
              "planned",
              "in-progress",
              "completed",
              "abandoned",
              "skipped",
            ]),
          })
          .strict(),
      )
      .length(7),
    muscleFocus: z
      .array(
        z
          .object({
            muscle: z.enum(muscleIds),
            setCount: z.number().int().min(1),
          })
          .strict(),
      )
      .max(20),
    scheduledWorkouts: z.number().int().min(0).max(7),
    totalRepetitions: z.number().int().min(0),
    totalSets: z.number().int().min(0),
    volumeKilograms: z.number().min(0),
    weekEnd: workoutDateSchema,
    weekStart: trainingWeekStartSchema,
  })
  .strict();

const progressionRecommendationSchema = z
  .object({
    currentWeightKilograms: z.number().min(0).max(1_000),
    exerciseId: z.string().min(1).max(300),
    exerciseName: z.string().min(1).max(180),
    latestCompletedAt: z.string().datetime(),
    previousWeightKilograms: z.number().min(0).max(1_000).nullable(),
    reason: z.string().min(1).max(240),
    status: z.enum(["increase", "hold"]),
    suggestedWeightKilograms: z.number().min(0).max(1_000),
  })
  .strict();

export const trainingHistoryViewSchema = z
  .object({
    pagination: z
      .object({
        hasNextPage: z.boolean(),
        page: z.number().int().min(1).max(TRAINING_HISTORY_MAX_PAGE),
        pageSize: z.literal(TRAINING_HISTORY_PAGE_SIZE),
      })
      .strict(),
    recommendations: z.array(progressionRecommendationSchema).max(6),
    sessions: z.array(historySessionSchema).max(TRAINING_HISTORY_PAGE_SIZE),
    weeklyReport: weeklyReportSchema,
  })
  .strict();

export const trainingHistoryResponseSchema = z
  .object({ data: trainingHistoryViewSchema })
  .strict();

export type TrainingHistoryQuery = z.infer<
  typeof trainingHistoryQuerySchema
>;
export type TrainingHistoryView = z.infer<
  typeof trainingHistoryViewSchema
>;
export type WorkoutHistorySession = z.infer<typeof historySessionSchema>;
export type ProgressionRecommendation = z.infer<
  typeof progressionRecommendationSchema
>;
