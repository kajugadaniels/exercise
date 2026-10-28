import assert from "node:assert/strict";
import test from "node:test";
import { buildTrainingAnalytics } from "./training-analytics";
import { trainingAnalyticsQuerySchema } from "./training-analytics-schema";
import type { TrainingHistorySourceSession } from "./training-history";

function session(
  plannedDate: string,
  weightGrams: number,
  repetitions: number,
  status: "completed" | "abandoned" = "completed",
): TrainingHistorySourceSession {
  return {
    endedAt: `${plannedDate}T09:00:00.000Z`,
    exercises: [
      {
        exerciseKey: "provider/back-squat",
        name: "Back squat",
        position: 1,
        primaryMuscle: "quads",
        sets: [
          {
            completedAt: `${plannedDate}T08:30:00.000Z`,
            effortRir: 2,
            repetitions,
            setNumber: 1,
            targetRepetitions: 8,
            weightGrams,
          },
        ],
      },
    ],
    plannedDate,
    startedAt: `${plannedDate}T08:00:00.000Z`,
    status,
  };
}

test("accepts only bounded progress ranges", () => {
  assert.deepEqual(trainingAnalyticsQuerySchema.parse({ weeks: "4" }), {
    weeks: 4,
  });
  assert.equal(
    trainingAnalyticsQuerySchema.safeParse({ weeks: "52" }).success,
    false,
  );
});

test("builds progress only from completed sessions", () => {
  const analytics = buildTrainingAnalytics(
    "2026-10-28",
    4,
    [
      { plannedDate: "2026-10-07" },
      { plannedDate: "2026-10-28" },
      { plannedDate: "2026-10-27" },
    ],
    [
      session("2026-10-07", 50_000, 10),
      session("2026-10-27", 200_000, 20, "abandoned"),
      session("2026-10-28", 60_000, 8),
    ],
  );

  assert.deepEqual(analytics.summary, {
    activeMinutes: 120,
    completedWorkouts: 2,
    completionRate: 67,
    scheduledWorkouts: 3,
    totalRepetitions: 18,
    totalSets: 2,
    volumeKilograms: 980,
  });
  assert.equal(analytics.weeklySignals.length, 4);
  assert.equal(analytics.exerciseProgress[0]?.startingMaxWeightKilograms, 50);
  assert.equal(analytics.exerciseProgress[0]?.currentMaxWeightKilograms, 60);
  assert.equal(analytics.exerciseProgress[0]?.weightChangeKilograms, 10);
  assert.deepEqual(analytics.muscleDistribution, [
    { muscle: "quads", percentage: 100, setCount: 2 },
  ]);
});

test("returns an honest empty state without fabricated progress", () => {
  const analytics = buildTrainingAnalytics("2026-10-28", 8, [], []);
  assert.equal(analytics.summary.completedWorkouts, 0);
  assert.equal(analytics.summary.completionRate, 0);
  assert.deepEqual(analytics.exerciseProgress, []);
  assert.deepEqual(analytics.muscleDistribution, []);
});
