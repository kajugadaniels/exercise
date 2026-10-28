import assert from "node:assert/strict";
import test from "node:test";
import type { WorkoutExecutionView } from "./workout-session-schema";
import {
  getNextIncompleteSet,
  getWorkoutProgress,
} from "./workout-progress";

function createWorkout(): WorkoutExecutionView {
  return {
    availableMinutes: 60,
    plannedDate: "2026-10-28",
    status: "in-progress",
    session: {
      status: "in-progress",
      startedAt: "2026-10-28T08:00:00.000Z",
      completedAt: null,
    },
    exercises: [
      {
        position: 1,
        name: "Fixture exercise",
        equipment: null,
        sets: [
          {
            setNumber: 1,
            targetRepetitions: 10,
            targetWeightGrams: null,
            restSeconds: 60,
            actual: {
              repetitions: 10,
              weightGrams: null,
              effortRir: 2,
              completedAt: "2026-10-28T08:05:00.000Z",
            },
          },
          {
            setNumber: 2,
            targetRepetitions: 10,
            targetWeightGrams: null,
            restSeconds: 60,
            actual: null,
          },
        ],
      },
    ],
  };
}

test("calculates completed workout set progress", () => {
  assert.deepEqual(getWorkoutProgress(createWorkout()), {
    completedSets: 1,
    totalSets: 2,
    percentage: 50,
  });
});

test("finds the first incomplete set in workout order", () => {
  assert.deepEqual(getNextIncompleteSet(createWorkout()), {
    exercisePosition: 1,
    setNumber: 2,
  });
});

test("returns no next set after every planned set is recorded", () => {
  const workout = createWorkout();
  const completedWorkout: WorkoutExecutionView = {
    ...workout,
    exercises: workout.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({
        ...set,
        actual: workout.exercises[0].sets[0].actual,
      })),
    })),
  };

  assert.equal(getNextIncompleteSet(completedWorkout), null);
});
