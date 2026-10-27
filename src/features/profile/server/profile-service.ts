import "server-only";
import { Gender } from "@/generated/prisma/client";
import { prisma } from "@/server/database/prisma";
import {
  calculateBmi,
  type MeasurementSnapshotView,
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
    throw new Error("Stored profile measurements are invalid.");
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

type StoredMeasurementSnapshot = {
  heightCentimeters: number;
  id: string;
  recordedAt: Date;
  weightGrams: number;
};

function toMeasurementSnapshotView(
  snapshot: StoredMeasurementSnapshot,
): MeasurementSnapshotView {
  const weightKilograms = snapshot.weightGrams / 1_000;
  const bmi = calculateBmi(snapshot.heightCentimeters, weightKilograms);

  if (bmi === null) {
    throw new Error("Stored measurement snapshot is invalid.");
  }

  return {
    id: snapshot.id,
    heightCentimeters: snapshot.heightCentimeters,
    weightKilograms,
    bmi,
    recordedAt: snapshot.recordedAt.toISOString(),
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

  const user = await prisma.$transaction(async (transaction) => {
    const existingUser = await transaction.user.findUnique({
      where: { clerkUserId },
      select: {
        profile: {
          select: { heightCentimeters: true, weightGrams: true },
        },
      },
    });
    const shouldRecordMeasurement =
      !existingUser?.profile ||
      existingUser.profile.heightCentimeters !==
        storedProfile.heightCentimeters ||
      existingUser.profile.weightGrams !== storedProfile.weightGrams;

    return transaction.user.upsert({
      where: { clerkUserId },
      create: {
        clerkUserId,
        profile: { create: storedProfile },
        measurementSnapshots: {
          create: {
            heightCentimeters: storedProfile.heightCentimeters,
            weightGrams: storedProfile.weightGrams,
          },
        },
      },
      update: {
        profile: {
          upsert: {
            create: storedProfile,
            update: storedProfile,
          },
        },
        ...(shouldRecordMeasurement
          ? {
              measurementSnapshots: {
                create: {
                  heightCentimeters: storedProfile.heightCentimeters,
                  weightGrams: storedProfile.weightGrams,
                },
              },
            }
          : {}),
      },
      select: { profile: true },
    });
  });

  if (!user.profile) {
    throw new Error("Profile was not persisted.");
  }

  return toProfileView(user.profile);
}

export async function getMeasurementHistoryForClerkUser(
  clerkUserId: string,
): Promise<MeasurementSnapshotView[]> {
  const snapshots = await prisma.measurementSnapshot.findMany({
    where: { user: { clerkUserId } },
    orderBy: { recordedAt: "desc" },
    take: 100,
    select: {
      id: true,
      heightCentimeters: true,
      weightGrams: true,
      recordedAt: true,
    },
  });

  return snapshots.map(toMeasurementSnapshotView);
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
    prisma.measurementSnapshot.deleteMany({ where: { userId: user.id } }),
    prisma.userProfile.deleteMany({ where: { userId: user.id } }),
  ]);
}
