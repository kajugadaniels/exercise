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
  page: z.coerce.number().int().min(1).max(100).optional().catch(1),
});

export type ExerciseSearchParams = Record<
  string,
  string | string[] | undefined
>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function selectedValues<TValue extends string>(
  value: string | string[] | undefined,
  allowedValues: readonly TValue[],
): TValue[] | undefined {
  const submittedValues = new Set(
    Array.isArray(value) ? value : value ? [value] : [],
  );
  const values = allowedValues.filter((option) => submittedValues.has(option));

  return values.length > 0 ? values : undefined;
}

export function parseExerciseQuery(
  searchParams: ExerciseSearchParams,
): ExerciseQuery {
  const parsed = searchParamsSchema.parse({
    search: firstValue(searchParams.search),
    page: firstValue(searchParams.page),
  });
  const muscles = selectedValues(searchParams.muscle, muscleIds);
  const bodyParts = selectedValues(searchParams.bodyPart, bodyPartIds);
  const equipment = selectedValues(searchParams.equipment, equipmentIds);
  const categories = selectedValues(
    searchParams.category,
    exerciseCategoryIds,
  );

  return {
    ...(parsed.search ? { search: parsed.search } : {}),
    ...(muscles ? { muscles } : {}),
    ...(bodyParts ? { bodyParts } : {}),
    ...(equipment ? { equipment } : {}),
    ...(categories ? { categories } : {}),
    page: parsed.page ?? 1,
  };
}

export function filterExercises(
  exercises: readonly Exercise[],
  query: ExerciseQuery,
): Exercise[] {
  const normalizedSearch = query.search?.toLocaleLowerCase("en");
  const selectedMuscles = new Set(query.muscles);
  const selectedBodyParts = new Set(query.bodyParts);
  const selectedEquipment = new Set(query.equipment);
  const selectedCategories = new Set(query.categories);

  return exercises
    .filter((exercise) => {
      if (
        normalizedSearch &&
        !exercise.name.toLocaleLowerCase("en").includes(normalizedSearch)
      ) {
        return false;
      }

      return (
        (selectedMuscles.size === 0 ||
          selectedMuscles.has(exercise.primaryMuscle)) &&
        (selectedBodyParts.size === 0 ||
          (exercise.bodyPart !== undefined &&
            selectedBodyParts.has(exercise.bodyPart))) &&
        (selectedEquipment.size === 0 ||
          (exercise.equipment !== undefined &&
            selectedEquipment.has(exercise.equipment))) &&
        (selectedCategories.size === 0 ||
          (exercise.category !== undefined &&
            selectedCategories.has(exercise.category)))
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

function appendFilterValues(
  params: URLSearchParams,
  key: string,
  values: readonly string[] | undefined,
) {
  new Set(values).forEach((value) => params.append(key, value));
}

export function buildExerciseLibraryUrl(
  query: ExerciseQuery,
  page: number,
  overrides?: Readonly<{
    bodyParts?: ExerciseQuery["bodyParts"] | null;
    categories?: ExerciseQuery["categories"] | null;
    equipment?: ExerciseQuery["equipment"] | null;
    muscles?: ExerciseQuery["muscles"] | null;
    search?: string | null;
  }>,
): string {
  const params = new URLSearchParams();
  const bodyParts =
    overrides && "bodyParts" in overrides
      ? (overrides.bodyParts ?? undefined)
      : query.bodyParts;
  const categories =
    overrides && "categories" in overrides
      ? (overrides.categories ?? undefined)
      : query.categories;
  const equipment =
    overrides && "equipment" in overrides
      ? (overrides.equipment ?? undefined)
      : query.equipment;
  const muscles =
    overrides && "muscles" in overrides
      ? (overrides.muscles ?? undefined)
      : query.muscles;
  const search =
    overrides && "search" in overrides
      ? (overrides.search ?? undefined)
      : query.search;

  if (search) params.set("search", search);
  appendFilterValues(params, "muscle", muscles);
  appendFilterValues(params, "bodyPart", bodyParts);
  appendFilterValues(params, "equipment", equipment);
  appendFilterValues(params, "category", categories);
  if (page > 1) params.set("page", String(page));
  const queryString = params.toString();
  return queryString ? `/exercises?${queryString}` : "/exercises";
}
