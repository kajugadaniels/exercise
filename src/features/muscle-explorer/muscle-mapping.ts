import type { Slug } from "react-muscle-highlighter";
import {
  formatExerciseValue,
  type MuscleId,
} from "@/features/exercises/domain/exercise";

export type MuscleMapping = {
  providerMuscle: MuscleId;
  appMuscle: MuscleId;
  highlighterSlug: Slug | null;
};

export const muscleMappings: Record<MuscleId, MuscleMapping> = {
  abductors: {
    providerMuscle: "abductors",
    appMuscle: "abductors",
    highlighterSlug: null,
  },
  abs: { providerMuscle: "abs", appMuscle: "abs", highlighterSlug: "abs" },
  adductors: {
    providerMuscle: "adductors",
    appMuscle: "adductors",
    highlighterSlug: "adductors",
  },
  biceps: {
    providerMuscle: "biceps",
    appMuscle: "biceps",
    highlighterSlug: "biceps",
  },
  calves: {
    providerMuscle: "calves",
    appMuscle: "calves",
    highlighterSlug: "calves",
  },
  cardio: {
    providerMuscle: "cardio",
    appMuscle: "cardio",
    highlighterSlug: null,
  },
  delts: {
    providerMuscle: "delts",
    appMuscle: "delts",
    highlighterSlug: "deltoids",
  },
  forearms: {
    providerMuscle: "forearms",
    appMuscle: "forearms",
    highlighterSlug: "forearm",
  },
  glutes: {
    providerMuscle: "glutes",
    appMuscle: "glutes",
    highlighterSlug: "gluteal",
  },
  hamstrings: {
    providerMuscle: "hamstrings",
    appMuscle: "hamstrings",
    highlighterSlug: "hamstring",
  },
  lats: { providerMuscle: "lats", appMuscle: "lats", highlighterSlug: null },
  "levator-scapulae": {
    providerMuscle: "levator-scapulae",
    appMuscle: "levator-scapulae",
    highlighterSlug: null,
  },
  pectorals: {
    providerMuscle: "pectorals",
    appMuscle: "pectorals",
    highlighterSlug: "chest",
  },
  quads: {
    providerMuscle: "quads",
    appMuscle: "quads",
    highlighterSlug: "quadriceps",
  },
  "serratus-anterior": {
    providerMuscle: "serratus-anterior",
    appMuscle: "serratus-anterior",
    highlighterSlug: null,
  },
  spine: {
    providerMuscle: "spine",
    appMuscle: "spine",
    highlighterSlug: null,
  },
  traps: {
    providerMuscle: "traps",
    appMuscle: "traps",
    highlighterSlug: "trapezius",
  },
  triceps: {
    providerMuscle: "triceps",
    appMuscle: "triceps",
    highlighterSlug: "triceps",
  },
  "upper-back": {
    providerMuscle: "upper-back",
    appMuscle: "upper-back",
    highlighterSlug: "upper-back",
  },
};

export function mapMuscleToHighlighter(muscle: MuscleId): Slug | null {
  return muscleMappings[muscle].highlighterSlug;
}

export function getMuscleLabel(muscle: MuscleId): string {
  return formatExerciseValue(muscle);
}
