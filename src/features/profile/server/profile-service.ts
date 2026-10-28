import "server-only";
import { Gender } from "@/generated/prisma/client";
import { prisma } from "@/server/database/prisma";
import {
  calculateBmi,
  type ProfileGender,
  type ProfileInput,
  type ProfileView,
} from "../profile-schema";

const databaseGenderByProfileGender: Record<ProfileGender, Gender> = {
  female: Gender.FEMALE,
  male: Gender.MALE,
};

const profileGenderByDatabaseGender: Record<Gender, ProfileGender> = {
  [Gender.FEMALE]: "female",
  [Gender.MALE]: "male",
};

type StoredProfile = {
  country: string;
  gender: Gender;
  heightCentimeters: number;
  updatedAt: Date;
  weightGrams: number;
};

function toProfileView(profile: StoredProfile): ProfileView {
  const weightKilograms = profile.weightGrams / 1_000;
  const bmi = calculateBmi(profile.heightCentimeters, weightKilograms);

  if (bmi === null) {
    throw new Error("Stored profile details are invalid.");
  }

  return {
    gender: profileGenderByDatabaseGender[profile.gender],
    heightCentimeters: profile.heightCentimeters,
    weightKilograms,
    country: profile.country,
    bmi,
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export async function ensureAppUser(clerkUserId: string): Promise<void> {
  await prisma.user.upsert({
    where: { clerkUserId },
    create: { clerkUserId },
    update: {},
  });
}

export async function getProfileForClerkUser(
  clerkUserId: string,
): Promise<ProfileView | null> {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { profile: true },
  });

  return user?.profile ? toProfileView(user.profile) : null;
}

export async function saveProfileForClerkUser(
  clerkUserId: string,
  profile: ProfileInput,
): Promise<ProfileView> {
  const storedProfile = {
    country: profile.country.trim(),
    gender: databaseGenderByProfileGender[profile.gender],
    heightCentimeters: profile.heightCentimeters,
    weightGrams: Math.round(profile.weightKilograms * 1_000),
  };

  const user = await prisma.user.upsert({
    where: { clerkUserId },
    create: {
      clerkUserId,
      profile: { create: storedProfile },
    },
    update: {
      profile: {
        upsert: {
          create: storedProfile,
          update: storedProfile,
        },
      },
    },
    select: { profile: true },
  });

  if (!user.profile) {
    throw new Error("Profile was not persisted.");
  }

  return toProfileView(user.profile);
}

export async function deleteProfileForClerkUser(
  clerkUserId: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });

  if (!user) {
    return;
  }

  await prisma.$transaction([
    prisma.trainingSession.deleteMany({ where: { userId: user.id } }),
    prisma.userProfile.deleteMany({ where: { userId: user.id } }),
  ]);
}
