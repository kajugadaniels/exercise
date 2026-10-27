import type { Exercise, ExerciseMedia } from "../../domain/exercise";
import type { ProviderExercise } from "./schema";

export const EXERCISE_PROVIDER_VERSION = "v1.1.0" as const;
export const EXERCISE_PROVIDER_BASE_URL =
  "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0";
export const EXERCISE_PROVIDER_ATTRIBUTION_URL =
  "https://github.com/JahelCuadrado/ExerciseGymGifsDB/tree/v1.1.0";

function normalizeProviderMedia(
  exercise: ProviderExercise,
): ExerciseMedia | undefined {
  const { gifUrl } = exercise;

  if (!gifUrl) {
    return undefined;
  }

  try {
    const url = new URL(gifUrl);
    const baseUrl = new URL(EXERCISE_PROVIDER_BASE_URL);
    const expectedFile = exercise.file ?? `${exercise.id}.gif`;
    const expectedPath = `${baseUrl.pathname}/${expectedFile}`;

    if (
      url.protocol !== "https:" ||
      url.origin !== baseUrl.origin ||
      url.pathname !== expectedPath ||
      url.search !== "" ||
      url.hash !== ""
    ) {
      return undefined;
    }

    return {
      kind: "gif",
      providerUrl: url.toString(),
      rightsStatus: "restricted",
      displayStatus: "blocked",
    };
  } catch {
    return undefined;
  }
}

export function normalizeProviderExercise(
  providerExercise: ProviderExercise,
): Exercise {
  const secondaryMuscles = Array.from(
    new Set(
      (providerExercise.secondaryMuscles ?? []).filter(
        (muscle) => muscle !== providerExercise.muscle,
      ),
    ),
  );
  const media = normalizeProviderMedia(providerExercise);

  return {
    id: providerExercise.id,
    slug: providerExercise.slug,
    name: providerExercise.name,
    category: providerExercise.category,
    primaryMuscle: providerExercise.muscle,
    secondaryMuscles,
    bodyPart: providerExercise.bodyPart,
    equipment: providerExercise.equipment,
    instructions: providerExercise.instructions ?? [],
    ...(media ? { media } : {}),
    source: {
      provider: "exercise-gym-gifs-db",
      sourceId: providerExercise.id,
      version: EXERCISE_PROVIDER_VERSION,
      attributionUrl: EXERCISE_PROVIDER_ATTRIBUTION_URL,
    },
  };
}
