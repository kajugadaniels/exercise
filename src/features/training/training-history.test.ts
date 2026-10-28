import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProgressionRecommendations,
  buildWeeklyReport,
  toWorkoutHistorySession,
  type TrainingHistorySourceSession,
} from "./training-history";
import { trainingHistoryQuerySchema } from "./training-history-schema";

test("bounds training history query input", () => {
  assert.deepEqual(
    trainingHistoryQuerySchema.parse({
      page: "2",
      week: "2026-10-26",
    }),
    { page: 2, week: "2026-10-26" },
  );
  assert.equal(
    trainingHistoryQuerySchema.safeParse({
      page: "101",
      week: "2026-10-27",
    }).success,
    false,
  );
});

function createSession(
  overrides: Partial<TrainingHistorySourceSession> = {},
): TrainingHistorySourceSession {
  return {
    endedAt: "2026-10-28T09:00:00.000Z",
    exercises: [
      {
        exerciseKey: "provider/squat",
        name: "Back squat",
        position: 1,
        primaryMuscle: "quads",
        sets: [
          {
            completedAt: "2026-10-28T08:30:00.000Z",
            effortRir: 2,
            repetitions: 8,
            setNumber: 1,
            targetRepetitions: 8,
            weightGrams: 100_000,
          },
          {
            completedAt: "2026-10-28T08:40:00.000Z",
            effortRir: 3,
            repetitions: 8,
            setNumber: 2,
            targetRepetitions: 8,
            weightGrams: 100_000,
          },
        ],
      },
    ],
    plannedDate: "2026-10-28",
    startedAt: "2026-10-28T08:00:00.000Z",
    status: "completed",
    ...overrides,
  };
}

test("builds a weekly report from ended workout sessions", () => {
  const report = buildWeeklyReport(
    "2026-10-26",
    [
      { date: "2026-10-27", status: "planned" },
      { date: "2026-10-28", status: "in-progress" },
      { date: "2026-10-30", status: "planned" },
    ],
    [createSession()],
  );

  assert.deepEqual(report, {
    abandonedWorkouts: 0,
    activeMinutes: 60,
    completedWorkouts: 1,
    days: [
      { date: "2026-10-26", status: "rest" },
      { date: "2026-10-27", status: "planned" },
      { date: "2026-10-28", status: "completed" },
      { date: "2026-10-29", status: "rest" },
      { date: "2026-10-30", status: "planned" },
      { date: "2026-10-31", status: "rest" },
      { date: "2026-11-01", status: "rest" },
    ],
    muscleFocus: [{ muscle: "quads", setCount: 2 }],
    scheduledWorkouts: 3,
    totalRepetitions: 16,
    totalSets: 2,
    volumeKilograms: 1_600,
    weekEnd: "2026-11-01",
    weekStart: "2026-10-26",
  });
});

test("normalizes a session without inventing bodyweight volume", () => {
  const session = createSession({
    exercises: [
      {
        exerciseKey: "provider/push-up",
        name: "Push-up",
        position: 1,
        primaryMuscle: "chest",
        sets: [
          {
            completedAt: "2026-10-28T08:30:00.000Z",
            effortRir: null,
            repetitions: 12,
            setNumber: 1,
            targetRepetitions: 10,
            weightGrams: null,
          },
        ],
      },
    ],
  });

  const view = toWorkoutHistorySession(session);
  assert.equal(view.volumeKilograms, 0);
  assert.equal(view.totalRepetitions, 12);
  assert.equal(view.exercises[0].sets[0].weightKilograms, null);
});

test("suggests a conservative increase after two qualified sessions", () => {
  const latest = createSession();
  const previous = createSession({
    endedAt: "2026-10-21T09:00:00.000Z",
    plannedDate: "2026-10-21",
    startedAt: "2026-10-21T08:00:00.000Z",
  });

  const recommendations = buildProgressionRecommendations([
    previous,
    latest,
  ]);

  assert.equal(recommendations[0]?.status, "increase");
  assert.equal(recommendations[0]?.previousWeightKilograms, 100);
  assert.equal(recommendations[0]?.currentWeightKilograms, 100);
  assert.equal(recommendations[0]?.suggestedWeightKilograms, 102.5);
});

test("never uses an abandoned session to recommend an increase", () => {
  const recommendations = buildProgressionRecommendations([
    createSession({ status: "abandoned" }),
  ]);

  assert.deepEqual(recommendations, []);
});
