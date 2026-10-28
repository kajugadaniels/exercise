import assert from "node:assert/strict";
import test from "node:test";
import {
  workoutDateSchema,
  workoutSessionActionSchema,
} from "./workout-session-schema";

test("accepts valid workout calendar dates", () => {
  assert.equal(workoutDateSchema.safeParse("2026-10-28").success, true);
  assert.equal(workoutDateSchema.safeParse("2026-02-30").success, false);
});

test("accepts a bounded recorded set", () => {
  const result = workoutSessionActionSchema.safeParse({
    action: "record-set",
    exercisePosition: 1,
    setNumber: 2,
    repetitions: 8,
    weightKilograms: 52.5,
    effortRir: 2,
  });

  assert.equal(result.success, true);
});

test("rejects unknown fields and invalid actual performance", () => {
  const result = workoutSessionActionSchema.safeParse({
    action: "record-set",
    exercisePosition: 1,
    setNumber: 1,
    repetitions: 0,
    weightKilograms: -1,
    effortRir: 11,
    userId: "not-accepted",
  });

  assert.equal(result.success, false);
});

test("accepts only supported workout lifecycle actions", () => {
  assert.equal(
    workoutSessionActionSchema.safeParse({ action: "complete" }).success,
    true,
  );
  assert.equal(
    workoutSessionActionSchema.safeParse({ action: "skip" }).success,
    true,
  );
  assert.equal(
    workoutSessionActionSchema.safeParse({
      action: "skip",
      userId: "not-accepted",
    }).success,
    false,
  );
  assert.equal(
    workoutSessionActionSchema.safeParse({ action: "pause" }).success,
    false,
  );
});
