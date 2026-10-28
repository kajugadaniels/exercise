import assert from "node:assert/strict";
import test from "node:test";
import {
  createTrainingWeekInputSchema,
  type TrainingWeekInput,
} from "./training-week-schema";

const weekStart = "2026-10-26";

function createValidWeek(): TrainingWeekInput {
  return {
    days: [
      {
        kind: "workout",
        plannedDate: "2026-10-26",
        availableMinutes: 60,
        preferredBodyPart: "chest",
        exercises: [
          {
            exerciseId: "pectorals/barbell-bench-press",
            sets: [
              {
                targetRepetitions: 8,
                targetWeightKilograms: 50,
                restSeconds: 90,
              },
            ],
          },
        ],
      },
      { kind: "rest", plannedDate: "2026-10-27" },
      { kind: "rest", plannedDate: "2026-10-28" },
      { kind: "rest", plannedDate: "2026-10-29" },
      { kind: "rest", plannedDate: "2026-10-30" },
      { kind: "rest", plannedDate: "2026-10-31" },
      { kind: "rest", plannedDate: "2026-11-01" },
    ],
  };
}

test("accepts one complete Monday through Sunday plan", () => {
  assert.equal(
    createTrainingWeekInputSchema(weekStart).safeParse(createValidWeek())
      .success,
    true,
  );
});

test("rejects duplicate or out-of-week calendar dates", () => {
  const week = createValidWeek();
  week.days[6] = { kind: "rest", plannedDate: "2026-10-26" };

  assert.equal(
    createTrainingWeekInputSchema(weekStart).safeParse(week).success,
    false,
  );
});

test("rejects workout-only properties on a rest day", () => {
  const week = createValidWeek();
  const invalidWeek = {
    days: week.days.map((day, index) =>
      index === 1 ? { ...day, availableMinutes: 60 } : day,
    ),
  };

  assert.equal(
    createTrainingWeekInputSchema(weekStart).safeParse(invalidWeek).success,
    false,
  );
});

test("rejects duplicate exercises within a workout day", () => {
  const week = createValidWeek();
  const workoutDay = week.days[0];

  if (workoutDay.kind !== "workout") {
    throw new Error("Expected a workout fixture.");
  }

  workoutDay.exercises.push(workoutDay.exercises[0]);

  assert.equal(
    createTrainingWeekInputSchema(weekStart).safeParse(week).success,
    false,
  );
});

test("rejects negative equipment weight and excessive rest", () => {
  const week = createValidWeek();
  const workoutDay = week.days[0];

  if (workoutDay.kind !== "workout") {
    throw new Error("Expected a workout fixture.");
  }

  workoutDay.exercises[0].sets[0] = {
    targetRepetitions: 8,
    targetWeightKilograms: -1,
    restSeconds: 3_601,
  };

  assert.equal(
    createTrainingWeekInputSchema(weekStart).safeParse(week).success,
    false,
  );
});
