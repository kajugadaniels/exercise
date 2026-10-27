import { z } from "zod";
import {
  bodyPartIds,
  equipmentIds,
  exerciseCategoryIds,
  formatExerciseValue,
  muscleIds,
  type Exercise,
  type ExerciseFacets,
  type ExerciseQuery,
} from "../../domain/exercise";

const searchParamsSchema = z.object({
  search: z.string().trim().min(3).max(80).optional().catch(undefined),
  muscle: z.enum(muscleIds).optional().catch(undefined),
  bodyPart: z.enum(bodyPartIds).optional().catch(undefined),
  equipment: z.enum(equipmentIds).optional().catch(undefined),
  category: z.enum(exerciseCategoryIds).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(100).optional().catch(1),
});

export type ExerciseSearchParams = Record<
  string,
  string | string[] | undefined
>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseExerciseQuery(
  searchParams: ExerciseSearchParams,
): ExerciseQuery {
  const parsed = searchParamsSchema.parse({
    search: firstValue(searchParams.search),
    muscle: firstValue(searchParams.muscle),
    bodyPart: firstValue(searchParams.bodyPart),
    equipment: firstValue(searchParams.equipment),
    category: firstValue(searchParams.category),
    page: firstValue(searchParams.page),
  });

  return {
    ...(parsed.search ? { search: parsed.search } : {}),
    ...(parsed.muscle ? { muscle: parsed.muscle } : {}),
    ...(parsed.bodyPart ? { bodyPart: parsed.bodyPart } : {}),
    ...(parsed.equipment ? { equipment: parsed.equipment } : {}),
    ...(parsed.category ? { category: parsed.category } : {}),
    page: parsed.page ?? 1,
  };
}

export function filterExercises(
  exercises: readonly Exercise[],
  query: ExerciseQuery,
): Exercise[] {
  const normalizedSearch = query.search?.toLocaleLowerCase("en");

  return exercises
    .filter((exercise) => {
      if (
        normalizedSearch &&
        !exercise.name.toLocaleLowerCase("en").includes(normalizedSearch)
      ) {
        return false;
      }

      return (
        (!query.muscle || exercise.primaryMuscle === query.muscle) &&
        (!query.bodyPart || exercise.bodyPart === query.bodyPart) &&
        (!query.equipment || exercise.equipment === query.equipment) &&
        (!query.category || exercise.category === query.category)
      );
    })
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name, "en") ||
        left.id.localeCompare(right.id, "en"),
    );
}

function collectFacet<T extends string>(
  exercises: readonly Exercise[],
  select: (exercise: Exercise) => T | undefined,
): Array<{ value: T; label: string }> {
  return Array.from(
    new Set(exercises.map(select).filter((value): value is T => Boolean(value))),
  )
    .sort((left, right) => left.localeCompare(right, "en"))
    .map((value) => ({ value, label: formatExerciseValue(value) }));
}

export function createExerciseFacets(
  exercises: readonly Exercise[],
): ExerciseFacets {
  return {
    muscles: collectFacet(exercises, (exercise) => exercise.primaryMuscle),
    bodyParts: collectFacet(exercises, (exercise) => exercise.bodyPart),
    equipment: collectFacet(exercises, (exercise) => exercise.equipment),
    categories: collectFacet(exercises, (exercise) => exercise.category),
  };
}

export function buildExerciseLibraryUrl(
  query: ExerciseQuery,
  page: number,
  overrides?: Readonly<{
    bodyPart?: ExerciseQuery["bodyPart"] | null;
    category?: ExerciseQuery["category"] | null;
    search?: string | null;
  }>,
): string {
  const params = new URLSearchParams();
  const bodyPart =
    overrides && "bodyPart" in overrides
      ? (overrides.bodyPart ?? undefined)
      : query.bodyPart;
  const category =
    overrides && "category" in overrides
      ? (overrides.category ?? undefined)
      : query.category;
  const search =
    overrides && "search" in overrides
      ? (overrides.search ?? undefined)
      : query.search;

  if (search) params.set("search", search);
  if (query.muscle) params.set("muscle", query.muscle);
  if (bodyPart) params.set("bodyPart", bodyPart);
  if (query.equipment) params.set("equipment", query.equipment);
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));

  const queryString = params.toString();
  return queryString ? `/exercises?${queryString}` : "/exercises";
}
