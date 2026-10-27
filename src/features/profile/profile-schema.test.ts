import assert from "node:assert/strict";
import test from "node:test";
import { calculateBmi, profileSchema } from "./profile-schema";

test("calculates BMI to one decimal place", () => {
  assert.equal(calculateBmi(180, 81), 25);
});

test("does not calculate BMI from invalid measurements", () => {
  assert.equal(calculateBmi(0, 81), null);
  assert.equal(calculateBmi(180, 0), null);
  assert.equal(calculateBmi(Number.NaN, 81), null);
});

test("requires a description for a self-described gender", () => {
  const result = profileSchema.safeParse({
    gender: "self-described",
    heightCentimeters: 180,
    weightKilograms: 81,
    country: "Rwanda",
  });

  assert.equal(result.success, false);
});
