import type {
  Exercise,
  ExerciseSummary,
} from "../domain/exercise";

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
      url: url.toString(),
    };
  } catch {
    return null;
  }
}

export function toExerciseSummary(exercise: Exercise): ExerciseSummary {
  return {
    id: exercise.id,
    image: getVerifiedImage(exercise),
    name: exercise.name,
  };
}
