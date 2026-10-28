import { z } from "zod";

export const genderValues = ["female", "male"] as const;

export type ProfileGender = (typeof genderValues)[number];

export type ProfileInput = {
  gender: ProfileGender;
  heightCentimeters: number;
  weightKilograms: number;
  country: string;
};

export type ProfileView = ProfileInput & {
  bmi: number;
  updatedAt: string;
};

export type BmiCategory = "low" | "healthy" | "moderate" | "high";

export const profileSchema = z
  .object({
    gender: z.enum(genderValues),
    heightCentimeters: z
      .number()
      .int("Enter height as a whole number.")
      .min(100, "Height must be at least 100 cm.")
      .max(250, "Height must be 250 cm or less."),
    weightKilograms: z
      .number()
      .min(20, "Weight must be at least 20 kg.")
      .max(400, "Weight must be 400 kg or less."),
    country: z
      .string()
      .trim()
      .min(2, "Enter your country.")
      .max(80, "Country must be 80 characters or less."),
  })
  .strict();

export function calculateBmi(
  heightCentimeters: number,
  weightKilograms: number,
): number | null {
  if (
    !Number.isFinite(heightCentimeters) ||
    !Number.isFinite(weightKilograms) ||
    heightCentimeters <= 0 ||
    weightKilograms <= 0
  ) {
    return null;
  }

  const heightMeters = heightCentimeters / 100;
  return Math.round((weightKilograms / heightMeters ** 2) * 10) / 10;
}

export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) {
    return "low";
  }

  if (bmi < 25) {
    return "healthy";
  }

  if (bmi < 30) {
    return "moderate";
  }

  return "high";
}
