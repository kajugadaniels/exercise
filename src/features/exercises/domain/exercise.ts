export const muscleIds = [
  "abductors",
  "abs",
  "adductors",
  "biceps",
  "calves",
  "cardio",
  "delts",
  "forearms",
  "glutes",
  "hamstrings",
  "lats",
  "levator-scapulae",
  "pectorals",
  "quads",
  "serratus-anterior",
  "spine",
  "traps",
  "triceps",
  "upper-back",
] as const;

export const bodyPartIds = [
  "arms",
  "back",
  "cardio",
  "chest",
  "core",
  "legs",
  "shoulders",
] as const;

export const equipmentIds = [
  "band",
  "barbell",
  "bodyweight",
  "cable",
  "dumbbell",
  "ez-bar",
  "kettlebell",
  "lever",
  "machine",
  "other",
  "sled",
  "smith",
] as const;

export const exerciseCategoryIds = [
  "cardio",
  "plyometrics",
  "strength",
  "stretching",
] as const;

export type MuscleId = (typeof muscleIds)[number];
export type BodyPartId = (typeof bodyPartIds)[number];
export type EquipmentId = (typeof equipmentIds)[number];
export type ExerciseCategory = (typeof exerciseCategoryIds)[number];

export type ExerciseMedia =
  | {
      kind: "gif";
      providerUrl: string;
      rightsStatus: "restricted";
      displayStatus: "blocked";
    }
  | {
      kind: "gif" | "image" | "video";
      displayUrl: string;
      posterUrl?: string;
      rightsStatus: "verified";
      displayStatus: "available";
      attribution?: string;
    };

export type ExerciseSource = {
  provider: "exercise-gym-gifs-db";
  sourceId: string;
  version: "v1.1.0";
  attributionUrl: string;
};

export type Exercise = {
  id: string;
  slug: string;
  name: string;
  category?: ExerciseCategory;
  primaryMuscle: MuscleId;
  secondaryMuscles: MuscleId[];
  bodyPart?: BodyPartId;
  equipment?: EquipmentId;
  instructions: string[];
  media?: ExerciseMedia;
  source: ExerciseSource;
};

export type ExerciseSummary = {
  id: string;
  image: {
    alt: string;
    kind: "gif" | "image";
    url: string;
  } | null;
  name: string;
};

export type ExerciseSummaryPage = {
  items: ExerciseSummary[];
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
};

export const EXERCISE_PAGE_SIZE = 24;

export type ExerciseQuery = {
  search?: string;
  muscles?: MuscleId[];
  bodyParts?: BodyPartId[];
  equipment?: EquipmentId[];
  categories?: ExerciseCategory[];
  page: number;
};

export type ExerciseFacetOption<T extends string> = {
  value: T;
  label: string;
};

export type ExerciseFacets = {
  muscles: ExerciseFacetOption<MuscleId>[];
  bodyParts: ExerciseFacetOption<BodyPartId>[];
  equipment: ExerciseFacetOption<EquipmentId>[];
  categories: ExerciseFacetOption<ExerciseCategory>[];
};

export type ExercisePage = {
  exercises: Exercise[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

const labelOverrides: Partial<Record<MuscleId | EquipmentId, string>> = {
  "ez-bar": "EZ bar",
  "levator-scapulae": "Levator scapulae",
  "serratus-anterior": "Serratus anterior",
};

export function formatExerciseValue(value: string): string {
  const override = labelOverrides[value as MuscleId | EquipmentId];

  if (override) {
    return override;
  }

  return value
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}
