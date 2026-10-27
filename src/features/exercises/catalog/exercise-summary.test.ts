import assert from "node:assert/strict";
import test from "node:test";
import type { Exercise } from "../domain/exercise";
import { toExerciseSummary } from "./exercise-summary";

const exercise: Exercise = {
  id: "biceps/barbell-curl",
  slug: "barbell-curl",
  name: "Barbell Curl",
  primaryMuscle: "biceps",
  secondaryMuscles: ["forearms"],
  instructions: ["Provider instruction that must not enter list responses."],
  media: {
    kind: "gif",
    providerUrl:
      "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-curl.gif",
    rightsStatus: "restricted",
    displayStatus: "blocked",
  },
  source: {
    provider: "exercise-gym-gifs-db",
    sourceId: "biceps/barbell-curl",
    version: "v1.1.0",
    attributionUrl: "https://provider.example",
  },
};

test("uses the pinned provider GIF when a static image is unavailable", () => {
  assert.deepEqual(toExerciseSummary(exercise), {
    id: "biceps/barbell-curl",
    image: {
      alt: "Barbell Curl animated exercise preview",
      kind: "gif",
      url: "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-curl.gif",
    },
    name: "Barbell Curl",
  });
});

test("rejects a GIF outside the pinned provider path", () => {
  assert.equal(
    toExerciseSummary({
      ...exercise,
      media: {
        kind: "gif",
        providerUrl: "https://cdn.example/biceps/barbell-curl.gif",
        rightsStatus: "restricted",
        displayStatus: "blocked",
      },
    }).image,
    null,
  );
});

test("keeps a verified HTTPS static image", () => {
  assert.deepEqual(
    toExerciseSummary({
      ...exercise,
      media: {
        kind: "image",
        displayUrl: "https://images.example/barbell-curl.webp",
        rightsStatus: "verified",
        displayStatus: "available",
      },
    }).image,
    {
      alt: "Barbell Curl exercise preview",
      kind: "image",
      url: "https://images.example/barbell-curl.webp",
    },
  );
});
