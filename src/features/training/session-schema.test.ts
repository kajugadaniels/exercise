import assert from "node:assert/strict";
import test from "node:test";
import {
  scheduleExerciseSchema,
  trainingSessionMonthSchema,
} from "./session-schema";

const validSchedule = {
  exerciseId: "biceps/barbell-curl",
  repetitionsPerSet: 8,
  scheduledDate: "2026-10-29",
  sets: 3,
  weightKilograms: 12.5,
};

test("accepts a provider exercise, date, and bounded prescription", () => {
  assert.equal(
    scheduleExerciseSchema.safeParse(validSchedule).success,
    true,
  );
});

test("rejects impossible dates and unknown fields", () => {
  assert.equal(
    scheduleExerciseSchema.safeParse({
      ...validSchedule,
      scheduledDate: "2026-02-30",
    }).success,
    false,
  );
  assert.equal(
    scheduleExerciseSchema.safeParse({
      ...validSchedule,
      userId: "untrusted-owner",
    }).success,
    false,
  );
});

test("rejects malformed provider exercise identifiers", () => {
  assert.equal(
    scheduleExerciseSchema.safeParse({
      ...validSchedule,
      exerciseId: "https://untrusted.example/exercise",
    }).success,
    false,
  );
});

test("rejects missing, fractional, and out-of-range prescription values", () => {
  assert.equal(
    scheduleExerciseSchema.safeParse({
      ...validSchedule,
      sets: undefined,
    }).success,
    false,
  );
  assert.equal(
    scheduleExerciseSchema.safeParse({
      ...validSchedule,
      repetitionsPerSet: 8.5,
    }).success,
    false,
  );
  assert.equal(
    scheduleExerciseSchema.safeParse({
      ...validSchedule,
      weightKilograms: 12.3,
    }).success,
    false,
  );
  assert.equal(
    scheduleExerciseSchema.safeParse({
      ...validSchedule,
      weightKilograms: 0,
    }).success,
    true,
  );
});

test("accepts only real calendar months", () => {
  assert.equal(trainingSessionMonthSchema.safeParse("2026-10").success, true);
  assert.equal(trainingSessionMonthSchema.safeParse("2026-13").success, false);
  assert.equal(trainingSessionMonthSchema.safeParse("2026-10-01").success, false);
});
