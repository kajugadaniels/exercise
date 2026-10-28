import assert from "node:assert/strict";
import test from "node:test";
import { trainingPreferencesSchema } from "./training-preferences-schema";

const validPreferences = {
  goal: "strength",
  experienceLevel: "intermediate",
  preferredSessionMinutes: 60,
  timezone: "Africa/Kigali",
  availableEquipment: ["barbell", "bodyweight"],
  preferredTrainingDays: [1, 3, 5],
};

test("accepts bounded training preferences", () => {
  assert.equal(
    trainingPreferencesSchema.safeParse(validPreferences).success,
    true,
  );
});

test("rejects unsupported timezones", () => {
  const result = trainingPreferencesSchema.safeParse({
    ...validPreferences,
    timezone: "Kigali/Unknown",
  });

  assert.equal(result.success, false);
});

test("requires at least one equipment option", () => {
  const result = trainingPreferencesSchema.safeParse({
    ...validPreferences,
    availableEquipment: [],
  });

  assert.equal(result.success, false);
});

test("rejects duplicate equipment and training days", () => {
  const result = trainingPreferencesSchema.safeParse({
    ...validPreferences,
    availableEquipment: ["barbell", "barbell"],
    preferredTrainingDays: [1, 1],
  });

  assert.equal(result.success, false);
});

test("rejects unbounded session durations", () => {
  assert.equal(
    trainingPreferencesSchema.safeParse({
      ...validPreferences,
      preferredSessionMinutes: 241,
    }).success,
    false,
  );
});
