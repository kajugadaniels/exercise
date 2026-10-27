import assert from "node:assert/strict";
import test from "node:test";
import type { ExerciseQuery } from "../../domain/exercise";
import { ExerciseProviderError } from "../exercise-provider";
import { createExerciseGymGifsAdapter } from "./adapter";
import { filterExercises, parseExerciseQuery } from "./filters";
import { normalizeProviderExercise } from "./mapping";
import {
  providerExerciseCatalogSchema,
  providerExerciseSchema,
} from "./schema";

const providerExerciseFixture = {
  id: "biceps/barbell-curl",
  slug: "barbell-curl",
  name: "Barbell Curl",
  muscle: "biceps",
  bodyPart: "arms",
  equipment: "barbell",
  category: "strength",
  secondaryMuscles: ["forearms"],
  instructions: ["Raise the bar in a controlled movement."],
  file: "biceps/barbell-curl.gif",
  gifUrl:
    "https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/biceps/barbell-curl.gif",
} as const;

const secondProviderExerciseFixture = {
  id: "pectorals/dumbbell-bench-press",
  slug: "dumbbell-bench-press",
  name: "Dumbbell Bench Press",
  muscle: "pectorals",
  bodyPart: "chest",
  equipment: "dumbbell",
  category: "strength",
  secondaryMuscles: ["triceps", "delts"],
  instructions: [],
} as const;

test("validates the documented catalog wrapper and optional fields", () => {
  const result = providerExerciseCatalogSchema.safeParse({
    count: 2,
    exercises: [providerExerciseFixture, secondProviderExerciseFixture],
  });

  assert.equal(result.success, true);
});

test("rejects an exercise whose identity does not match its route fields", () => {
  const result = providerExerciseSchema.safeParse({
    ...providerExerciseFixture,
    id: "biceps/not-the-same-exercise",
  });

  assert.equal(result.success, false);
});

test("normalizes provenance and keeps media display permission restricted", () => {
  const parsed = providerExerciseSchema.parse(providerExerciseFixture);
  const exercise = normalizeProviderExercise(parsed);

  assert.equal(exercise.source.sourceId, providerExerciseFixture.id);
  assert.equal(exercise.source.version, "v1.1.0");
  assert.equal(exercise.media?.rightsStatus, "restricted");
  assert.equal(exercise.media?.displayStatus, "blocked");
});

test("drops malformed media without dropping valid exercise metadata", () => {
  const parsed = providerExerciseSchema.parse({
    ...providerExerciseFixture,
    gifUrl: "https://unapproved.example/barbell-curl.gif",
  });
  const exercise = normalizeProviderExercise(parsed);

  assert.equal(exercise.media, undefined);
  assert.equal(exercise.name, "Barbell Curl");
});

test("filters normalized exercises with AND semantics", () => {
  const exercises = [providerExerciseFixture, secondProviderExerciseFixture].map(
    (fixture) => normalizeProviderExercise(providerExerciseSchema.parse(fixture)),
  );
  const cases: Array<[Partial<ExerciseQuery>, string[]]> = [
    [{ category: "strength" }, ["Barbell Curl", "Dumbbell Bench Press"]],
    [{ equipment: "barbell" }, ["Barbell Curl"]],
    [{ bodyPart: "chest" }, ["Dumbbell Bench Press"]],
    [{ muscle: "biceps" }, ["Barbell Curl"]],
    [{ search: "bench", equipment: "dumbbell" }, ["Dumbbell Bench Press"]],
  ];

  for (const [query, expectedNames] of cases) {
    const results = filterExercises(exercises, { ...query, page: 1 });
    assert.deepEqual(
      results.map((exercise) => exercise.name),
      expectedNames,
    );
  }
});

test("bounds and normalizes URL filter input", () => {
  assert.deepEqual(
    parseExerciseQuery({
      search: "  curl  ",
      muscle: "biceps",
      equipment: "not-supported",
      page: "999",
    }),
    {
      search: "curl",
      muscle: "biceps",
      page: 1,
    },
  );
});

test("resolves exercise details through the normalized provider contract", async () => {
  const adapter = createExerciseGymGifsAdapter(async (path) => {
    assert.equal(path, "exercises/biceps/barbell-curl.json");
    return providerExerciseFixture;
  });

  const exercise = await adapter.getById("biceps/barbell-curl");
  assert.equal(exercise?.name, "Barbell Curl");
  assert.equal(exercise?.primaryMuscle, "biceps");
});

test("translates unexpected provider failures into a safe typed error", async () => {
  const adapter = createExerciseGymGifsAdapter(async () => {
    throw new Error("synthetic upstream failure");
  });

  await assert.rejects(
    adapter.list({ page: 1 }),
    (error: unknown) =>
      error instanceof ExerciseProviderError &&
      error.code === "provider-unavailable",
  );
});
