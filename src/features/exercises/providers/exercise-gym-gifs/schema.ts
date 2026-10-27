import { z } from "zod";
import {
  bodyPartIds,
  equipmentIds,
  exerciseCategoryIds,
  muscleIds,
} from "../../domain/exercise";

const exerciseSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const instructionSchema = z.string().trim().min(1).max(600);

export const providerExerciseSchema = z
  .object({
    id: z.string().trim().min(3).max(200),
    slug: exerciseSlugSchema,
    name: z.string().trim().min(1).max(180),
    muscle: z.enum(muscleIds),
    bodyPart: z.enum(bodyPartIds).optional(),
    equipment: z.enum(equipmentIds).optional(),
    category: z.enum(exerciseCategoryIds).optional(),
    secondaryMuscles: z.array(z.enum(muscleIds)).max(12).optional(),
    instructions: z.array(instructionSchema).max(30).optional(),
    file: z.string().trim().min(1).max(240).optional(),
    gifUrl: z.string().trim().min(1).max(500).optional(),
  })
  .superRefine((exercise, context) => {
    if (exercise.id !== `${exercise.muscle}/${exercise.slug}`) {
      context.addIssue({
        code: "custom",
        message: "Exercise identity does not match its muscle and slug.",
        path: ["id"],
      });
    }
  });

export const providerExerciseCatalogSchema = z
  .object({
    count: z.number().int().nonnegative().max(2_000),
    exercises: z.array(providerExerciseSchema).max(2_000),
  })
  .superRefine((catalog, context) => {
    if (catalog.count !== catalog.exercises.length) {
      context.addIssue({
        code: "custom",
        message: "Catalog count does not match the exercise collection.",
        path: ["count"],
      });
    }
  });

export type ProviderExercise = z.infer<typeof providerExerciseSchema>;
