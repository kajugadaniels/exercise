import assert from "node:assert/strict";
import test from "node:test";
import {
  getPlannedSetIssues,
  getTrainingWeekDates,
  getTrainingWeekStartForDate,
  isDateInTrainingWeek,
  isMondayCalendarDate,
  trainingDayStatuses,
  workoutSessionStatuses,
} from "./training";

test("exposes stable plan and session lifecycle states", () => {
  assert.deepEqual(trainingDayStatuses, [
    "planned",
    "in-progress",
    "completed",
    "skipped",
  ]);
  assert.deepEqual(workoutSessionStatuses, [
    "in-progress",
    "completed",
    "abandoned",
  ]);
});

test("recognizes only valid Monday calendar dates as week starts", () => {
  assert.equal(isMondayCalendarDate("2026-10-26"), true);
  assert.equal(isMondayCalendarDate("2026-10-27"), false);
  assert.equal(isMondayCalendarDate("2026-02-30"), false);
  assert.equal(isMondayCalendarDate("26-10-26"), false);
});

test("returns one Monday through Sunday training week", () => {
  assert.deepEqual(getTrainingWeekDates("2026-12-28"), [
    "2026-12-28",
    "2026-12-29",
    "2026-12-30",
    "2026-12-31",
    "2027-01-01",
    "2027-01-02",
    "2027-01-03",
  ]);
});

test("finds the Monday boundary for any valid calendar date", () => {
  assert.equal(getTrainingWeekStartForDate("2026-10-26"), "2026-10-26");
  assert.equal(getTrainingWeekStartForDate("2026-11-01"), "2026-10-26");
  assert.equal(getTrainingWeekStartForDate("2026-02-30"), null);
});

test("rejects dates outside the selected weekly boundary", () => {
  assert.equal(isDateInTrainingWeek("2026-10-26", "2026-10-26"), true);
  assert.equal(isDateInTrainingWeek("2026-11-01", "2026-10-26"), true);
  assert.equal(isDateInTrainingWeek("2026-10-25", "2026-10-26"), false);
  assert.equal(isDateInTrainingWeek("2026-11-02", "2026-10-26"), false);
});

test("accepts a bodyweight set without a stored equipment load", () => {
  assert.deepEqual(
    getPlannedSetIssues({
      setNumber: 1,
      targetRepetitions: 12,
      targetWeightGrams: null,
      restSeconds: 60,
    }),
    [],
  );
});

test("reports invalid planned set values without inventing defaults", () => {
  assert.deepEqual(
    getPlannedSetIssues({
      setNumber: 0,
      targetRepetitions: 0,
      targetWeightGrams: -1,
      restSeconds: -1,
    }),
    [
      "set-number-invalid",
      "repetitions-invalid",
      "weight-invalid",
      "rest-invalid",
    ],
  );
});
