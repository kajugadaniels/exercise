import assert from "node:assert/strict";
import test from "node:test";
import type { TrainingWeekPlan } from "./domain/training";
import {
  createEmptyTrainingWeek,
  createTrainingWeekEditor,
  getAdjacentWeekStart,
  toTrainingWeekInput,
} from "./training-week-editor";

const weekStart = "2026-10-26";

test("creates a complete rest week for a new plan", () => {
  const editor = createEmptyTrainingWeek(weekStart);

  assert.equal(editor.days.length, 7);
  assert.equal(editor.days.every((day) => day.kind === "rest"), true);
  assert.equal(editor.days[6].plannedDate, "2026-11-01");
});

test("converts stored grams into editable kilograms", () => {
  const plan: TrainingWeekPlan = {
    weekStart,
    createdAt: "2026-10-26T08:00:00.000Z",
    updatedAt: "2026-10-26T08:00:00.000Z",
    isLocked: false,
    days: [
      {
        plannedDate: weekStart,
        kind: "workout",
        source: "manual",
        status: "planned",
        availableMinutes: 60,
        preferredBodyPart: "chest",
        exercises: [
          {
            position: 1,
            recommendationReasons: [],
            exercise: {
              provider: "exercise-gym-gifs-db",
              sourceId: "pectorals/barbell-bench-press",
              sourceVersion: "v1.1.0",
              attributionUrl: "https://example.com",
              name: "Barbell bench press",
              primaryMuscle: "pectorals",
              secondaryMuscles: [],
            },
            sets: [
              {
                setNumber: 1,
                targetRepetitions: 8,
                targetWeightGrams: 52_500,
                restSeconds: 90,
              },
            ],
          },
        ],
      },
    ],
  };

  const editor = createTrainingWeekEditor(weekStart, plan);
  assert.equal(editor.days.length, 7);
  assert.equal(editor.days.slice(1).every((day) => day.kind === "rest"), true);
  assert.equal(editor.days[0].exercises[0].sets[0].weightKilograms, "52.5");
});

test("converts editor strings into the strict API input", () => {
  const editor = createEmptyTrainingWeek(weekStart);
  editor.days[0] = {
    ...editor.days[0],
    kind: "workout",
    availableMinutes: "75",
    preferredBodyPart: "chest",
    exercises: [
      {
        exerciseId: "pectorals/barbell-bench-press",
        name: "Barbell bench press",
        sets: [
          {
            repetitions: "8",
            weightKilograms: "52.5",
            restSeconds: "90",
          },
        ],
      },
    ],
  };

  const input = toTrainingWeekInput(editor);
  const firstDay = input.days[0];

  assert.equal(firstDay.kind, "workout");
  if (firstDay.kind === "workout") {
    assert.equal(firstDay.availableMinutes, 75);
    assert.equal(firstDay.exercises[0].sets[0].targetWeightKilograms, 52.5);
  }
});

test("moves between adjacent Monday week boundaries", () => {
  assert.equal(getAdjacentWeekStart(weekStart, "previous"), "2026-10-19");
  assert.equal(getAdjacentWeekStart(weekStart, "next"), "2026-11-02");
});
