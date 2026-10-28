import assert from "node:assert/strict";
import test from "node:test";
import { scheduleExerciseSchema } from "./session-schema";

test("accepts a provider exercise and valid calendar date", () => {
  assert.equal(
    scheduleExerciseSchema.safeParse({
      exerciseId: "biceps/barbell-curl",
      scheduledDate: "2026-10-28",
    }).success,
    true,
  );
});

test("rejects impossible dates and unknown fields", () => {
  assert.equal(
    scheduleExerciseSchema.safeParse({
      exerciseId: "biceps/barbell-curl",
      scheduledDate: "2026-02-30",
    }).success,
    false,
  );
  assert.equal(
    scheduleExerciseSchema.safeParse({
      exerciseId: "biceps/barbell-curl",
      scheduledDate: "2026-10-28",
      userId: "untrusted-owner",
    }).success,
    false,
  );
});

test("rejects malformed provider exercise identifiers", () => {
  assert.equal(
    scheduleExerciseSchema.safeParse({
      exerciseId: "https://untrusted.example/exercise",
      scheduledDate: "2026-10-28",
    }).success,
    false,
  );
});
