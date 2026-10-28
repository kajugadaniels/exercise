import assert from "node:assert/strict";
import test from "node:test";
import type { Exercise } from "@/features/exercises/domain/exercise";
import {
  chooseRecommendationFocus,
  createDailyRecommendation,
  type RecentTrainingEntry,
} from "./daily-recommendation";
import { dailyRecommendationInputSchema } from "./daily-recommendation-schema";

const source = {
  attributionUrl: "https://github.com/example/exercises",
  provider: "exercise-gym-gifs-db",
  sourceId: "pectorals/push-up",
  version: "v1.1.0",
} as const;

function exercise(
  id: string,
  name: string,
  primaryMuscle: Exercise["primaryMuscle"],
): Exercise {
  return {
    bodyPart: "chest",
    category: "strength",
    equipment: "bodyweight",
    id,
    instructions: [],
    name,
    primaryMuscle,
    secondaryMuscles: [],
    slug: id.split("/").at(-1) ?? id,
    source: { ...source, sourceId: id },
  };
}

test("bounds daily recommendation input", () => {
  assert.equal(
    dailyRecommendationInputSchema.safeParse({
      availableMinutes: 14,
      plannedDate: "2026-10-28",
      preferredBodyPart: null,
    }).success,
    false,
  );
  assert.equal(
    dailyRecommendationInputSchema.safeParse({
      availableMinutes: 60,
      plannedDate: "2026-10-28",
      preferredBodyPart: "chest",
      exercises: [],
    }).success,
    false,
  );
});

test("avoids a body part trained the previous day when focus is automatic", () => {
  const focus = chooseRecommendationFocus(
    {
      availableMinutes: 45,
      plannedDate: "2026-10-28",
      preferredBodyPart: null,
    },
    "general-fitness",
    [
      {
        bodyPart: "arms",
        exerciseId: "biceps/curl",
        heaviestWeightGrams: 20_000,
        plannedDate: "2026-10-27",
        primaryMuscle: "biceps",
        setCount: 3,
      },
    ],
  );

  assert.notEqual(focus.bodyPart, "arms");
  assert.equal(focus.recovery.status, "ready");
  assert.deepEqual(focus.recovery.recentlyTrainedBodyParts, ["arms"]);
});

test("keeps an explicit focus but communicates recovery caution", () => {
  const focus = chooseRecommendationFocus(
    {
      availableMinutes: 45,
      plannedDate: "2026-10-28",
      preferredBodyPart: "legs",
    },
    "strength",
    [
      {
        bodyPart: "legs",
        exerciseId: "quads/squat",
        heaviestWeightGrams: 80_000,
        plannedDate: "2026-10-27",
        primaryMuscle: "quads",
        setCount: 4,
      },
    ],
  );

  assert.equal(focus.bodyPart, "legs");
  assert.equal(focus.recovery.status, "caution");
});

test("creates a time-bounded plan and reuses the last verified load", () => {
  const input = {
    availableMinutes: 15,
    plannedDate: "2026-10-28",
    preferredBodyPart: "chest",
  } as const;
  const history: RecentTrainingEntry[] = [
    {
      bodyPart: "chest",
      exerciseId: "pectorals/push-up",
      heaviestWeightGrams: 15_000,
      plannedDate: "2026-10-20",
      primaryMuscle: "pectorals",
      setCount: 3,
    },
  ];
  const focus = chooseRecommendationFocus(input, "strength", history);
  const recommendation = createDailyRecommendation(
    input,
    { experienceLevel: "intermediate", goal: "strength" },
    focus,
    [
      exercise("pectorals/push-up", "Push-up", "pectorals"),
      exercise("triceps/close-push-up", "Close push-up", "triceps"),
    ],
    history,
  );

  assert.equal(recommendation.exercises.length, 1);
  assert.equal(
    recommendation.exercises[0]?.sets[0]?.targetWeightKilograms,
    15,
  );
  assert.match(recommendation.exercises[0]?.reasons[0] ?? "", /focus/);
});
