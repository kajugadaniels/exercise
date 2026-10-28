import { z } from "zod";
import { muscleIds } from "@/features/exercises/domain/exercise";
import { trainingWeekStartSchema } from "./training-week-schema";
import { workoutDateSchema } from "./workout-session-schema";

export const trainingAnalyticsWeeks = [4, 8, 12] as const;

export const trainingAnalyticsQuerySchema = z
  .object({
    weeks: z.coerce
      .number()
      .int()
      .pipe(z.union([z.literal(4), z.literal(8), z.literal(12)]))
      .default(8),
  })
  .strict();

const weeklySignalSchema = z
  .object({
    activeMinutes: z.number().int().min(0),
    completedWorkouts: z.number().int().min(0).max(7),
    scheduledWorkouts: z.number().int().min(0).max(7),
    totalRepetitions: z.number().int().min(0),
    totalSets: z.number().int().min(0),
    volumeKilograms: z.number().min(0),
    weekStart: trainingWeekStartSchema,
  })
  .strict();

const exerciseProgressSchema = z
  .object({
    appearances: z.number().int().min(1),
    bestWeightKilograms: z.number().min(0).max(1_000).nullable(),
    currentBestRepetitions: z.number().int().min(1).max(1_000),
    currentMaxWeightKilograms: z.number().min(0).max(1_000).nullable(),
    exerciseId: z.string().min(1).max(300),
    exerciseName: z.string().min(1).max(180),
    firstCompletedDate: workoutDateSchema,
    latestCompletedDate: workoutDateSchema,
    primaryMuscle: z.enum(muscleIds),
    startingBestRepetitions: z.number().int().min(1).max(1_000),
    startingMaxWeightKilograms: z.number().min(0).max(1_000).nullable(),
    totalSets: z.number().int().min(1),
    weightChangeKilograms: z.number().min(-1_000).max(1_000).nullable(),
  })
  .strict();

export const trainingAnalyticsViewSchema = z
  .object({
    exerciseProgress: z.array(exerciseProgressSchema).max(8),
    muscleDistribution: z
      .array(
        z
          .object({
            muscle: z.enum(muscleIds),
            percentage: z.number().int().min(0).max(100),
            setCount: z.number().int().min(1),
          })
          .strict(),
      )
      .max(20),
    range: z
      .object({
        endDate: workoutDateSchema,
        startDate: trainingWeekStartSchema,
        weeks: z.union([z.literal(4), z.literal(8), z.literal(12)]),
      })
      .strict(),
    summary: z
      .object({
        activeMinutes: z.number().int().min(0),
        completedWorkouts: z.number().int().min(0),
        completionRate: z.number().int().min(0).max(100),
        scheduledWorkouts: z.number().int().min(0),
        totalRepetitions: z.number().int().min(0),
        totalSets: z.number().int().min(0),
        volumeKilograms: z.number().min(0),
      })
      .strict(),
    weeklySignals: z.array(weeklySignalSchema).min(4).max(12),
  })
  .strict();

export const trainingAnalyticsResponseSchema = z
  .object({ data: trainingAnalyticsViewSchema })
  .strict();

export type TrainingAnalyticsQuery = z.infer<
  typeof trainingAnalyticsQuerySchema
>;
export type TrainingAnalyticsView = z.infer<
  typeof trainingAnalyticsViewSchema
>;
