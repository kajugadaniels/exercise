import { z } from "zod";
import {
  bodyPartIds,
  equipmentIds,
  muscleIds,
} from "@/features/exercises/domain/exercise";
import { trainingGoalValues } from "./training-preferences-schema";
import { workoutDateSchema } from "./workout-session-schema";

export const DAILY_RECOMMENDATION_ENGINE_VERSION = "daily-v1";

export const dailyRecommendationInputSchema = z
  .object({
    availableMinutes: z
      .number()
      .int("Use a whole number of minutes.")
      .min(15, "Allow at least 15 minutes for a recommendation.")
      .max(240, "A recommended session must be 240 minutes or less."),
    plannedDate: workoutDateSchema,
    preferredBodyPart: z.enum(bodyPartIds).nullable(),
  })
  .strict();

const recommendedSetSchema = z
  .object({
    restSeconds: z.number().int().min(0).max(3_600),
    setNumber: z.number().int().min(1).max(20),
    targetRepetitions: z.number().int().min(1).max(1_000),
    targetWeightKilograms: z.number().min(0).max(1_000).nullable(),
  })
  .strict();

const recommendedExerciseSchema = z
  .object({
    bodyPart: z.enum(bodyPartIds),
    equipment: z.enum(equipmentIds).nullable(),
    id: z.string().min(1).max(200),
    name: z.string().min(1).max(180),
    primaryMuscle: z.enum(muscleIds),
    reasons: z.array(z.string().min(1).max(160)).min(1).max(4),
    sets: z.array(recommendedSetSchema).min(1).max(20),
  })
  .strict();

export const dailyRecommendationViewSchema = z
  .object({
    availableMinutes: z.number().int().min(15).max(240),
    engineVersion: z.literal(DAILY_RECOMMENDATION_ENGINE_VERSION),
    exercises: z.array(recommendedExerciseSchema).min(1).max(8),
    focusBodyPart: z.enum(bodyPartIds),
    goal: z.enum(trainingGoalValues),
    plannedDate: workoutDateSchema,
    recovery: z
      .object({
        message: z.string().min(1).max(240),
        recentlyTrainedBodyParts: z.array(z.enum(bodyPartIds)).max(
          bodyPartIds.length,
        ),
        status: z.enum(["ready", "caution"]),
      })
      .strict(),
    weekStart: workoutDateSchema,
  })
  .strict();

export const dailyRecommendationResponseSchema = z
  .object({ data: dailyRecommendationViewSchema })
  .strict();

export type DailyRecommendationInput = z.infer<
  typeof dailyRecommendationInputSchema
>;
export type DailyRecommendationView = z.infer<
  typeof dailyRecommendationViewSchema
>;
