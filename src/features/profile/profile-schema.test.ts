import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateBmi,
  getBmiCategory,
  profileSchema,
} from "./profile-schema";

test("calculates BMI to one decimal place", () => {
  assert.equal(calculateBmi(180, 81), 25);
});

test("does not calculate BMI from invalid measurements", () => {
  assert.equal(calculateBmi(0, 81), null);
  assert.equal(calculateBmi(180, 0), null);
  assert.equal(calculateBmi(Number.NaN, 81), null);
});

test("accepts only male or female gender values", () => {
  const result = profileSchema.safeParse({
    gender: "non-binary",
    heightCentimeters: 180,
    weightKilograms: 81,
    country: "Rwanda",
  });

  assert.equal(result.success, false);
});

test("categorizes BMI screening ranges", () => {
  assert.equal(getBmiCategory(18), "low");
  assert.equal(getBmiCategory(18.5), "healthy");
  assert.equal(getBmiCategory(22), "healthy");
  assert.equal(getBmiCategory(25), "moderate");
  assert.equal(getBmiCategory(27), "moderate");
  assert.equal(getBmiCategory(30), "high");
  assert.equal(getBmiCategory(31), "high");
});
