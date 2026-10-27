import { z } from "zod";

export const genderValues = [
  "woman",
  "man",
  "non-binary",
  "self-described",
  "prefer-not-to-say",
] as const;

export type ProfileGender = (typeof genderValues)[number];

export type ProfileInput = {
  gender: ProfileGender;
  genderDescription?: string;
  heightCentimeters: number;
  weightKilograms: number;
  country: string;
};

export type ProfileView = ProfileInput & {
  bmi: number;
  updatedAt: string;
};

export type MeasurementSnapshotView = {
  bmi: number;
  heightCentimeters: number;
  id: string;
  recordedAt: string;
  weightKilograms: number;
};

export const profileSchema = z
  .object({
    gender: z.enum(genderValues),
    genderDescription: z.string().trim().max(80).optional(),
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
  .strict()
  .superRefine((profile, context) => {
    if (
      profile.gender === "self-described" &&
      !profile.genderDescription?.trim()
    ) {
      context.addIssue({
        code: "custom",
        message: "Tell us how you describe your gender.",
        path: ["genderDescription"],
      });
    }
  });

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
