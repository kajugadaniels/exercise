import type {
  Exercise,
  ExerciseSummary,
} from "../domain/exercise";
import { EXERCISE_PROVIDER_BASE_URL } from "../providers/exercise-gym-gifs/mapping";

const providerBaseUrl = new URL(EXERCISE_PROVIDER_BASE_URL);

function getProviderGif(exercise: Exercise): ExerciseSummary["image"] {
  const media = exercise.media;

  if (media?.kind !== "gif" || !("providerUrl" in media)) {
    return null;
  }

  try {
    const url = new URL(media.providerUrl);
    const providerPath = `${providerBaseUrl.pathname}/`;

    if (
      url.protocol !== "https:" ||
      url.origin !== providerBaseUrl.origin ||
      !url.pathname.startsWith(providerPath) ||
      !url.pathname.endsWith(".gif") ||
      url.search !== "" ||
      url.hash !== ""
    ) {
      return null;
    }

    return {
      alt: `${exercise.name} animated exercise preview`,
      kind: "gif",
      url: url.toString(),
    };
  } catch {
    return null;
  }
}

function getVerifiedImage(exercise: Exercise): ExerciseSummary["image"] {
  const media = exercise.media;

  if (media?.displayStatus !== "available" || media.kind !== "image") {
    return null;
  }

  try {
    const url = new URL(media.displayUrl);
    if (url.protocol !== "https:") {
      return null;
    }

    return {
      alt: `${exercise.name} exercise preview`,
      kind: "image",
      url: url.toString(),
    };
  } catch {
    return null;
  }
}

export function toExerciseSummary(exercise: Exercise): ExerciseSummary {
  return {
    id: exercise.id,
    image: getVerifiedImage(exercise) ?? getProviderGif(exercise),
    name: exercise.name,
  };
}
