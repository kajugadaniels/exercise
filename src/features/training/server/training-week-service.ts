import "server-only";
import {
  Prisma,
  TrainingDayKind,
  TrainingDayStatus,
  TrainingPlanSource,
} from "@/generated/prisma/client";
import {
  bodyPartIds,
  equipmentIds,
  exerciseCategoryIds,
  muscleIds,
  type BodyPartId,
  type EquipmentId,
  type Exercise,
  type ExerciseCategory,
  type MuscleId,
} from "@/features/exercises/domain/exercise";
import { exerciseGymGifsAdapter } from "@/features/exercises/providers/exercise-gym-gifs/adapter";
import { prisma } from "@/server/database/prisma";
import type {
  TrainingDayKind as TrainingDayKindValue,
  TrainingDayStatus as TrainingDayStatusValue,
  TrainingExerciseSnapshot,
  TrainingPlanSource as TrainingPlanSourceValue,
  TrainingWeekPlan,
} from "../domain/training";
import type { TrainingWeekInput } from "../training-week-schema";

const EXERCISE_LOOKUP_CONCURRENCY = 4;

const trainingWeekInclude = {
  days: {
    orderBy: { plannedDate: "asc" },
    include: {
      exercises: {
        orderBy: { position: "asc" },
        include: {
          plannedSets: { orderBy: { setNumber: "asc" } },
        },
      },
      session: { select: { id: true } },
    },
  },
} satisfies Prisma.TrainingWeekInclude;

type StoredTrainingWeek = Prisma.TrainingWeekGetPayload<{
  include: typeof trainingWeekInclude;
}>;

const dayKindValueByDatabaseKind: Record<
  TrainingDayKind,
  TrainingDayKindValue
> = {
  [TrainingDayKind.WORKOUT]: "workout",
  [TrainingDayKind.REST]: "rest",
};

const planSourceValueByDatabaseSource: Record<
  TrainingPlanSource,
  TrainingPlanSourceValue
> = {
  [TrainingPlanSource.MANUAL]: "manual",
  [TrainingPlanSource.RECOMMENDED]: "recommended",
};

const dayStatusValueByDatabaseStatus: Record<
  TrainingDayStatus,
  TrainingDayStatusValue
> = {
  [TrainingDayStatus.PLANNED]: "planned",
  [TrainingDayStatus.IN_PROGRESS]: "in-progress",
  [TrainingDayStatus.COMPLETED]: "completed",
  [TrainingDayStatus.SKIPPED]: "skipped",
};

export class TrainingWeekConflictError extends Error {
  constructor() {
    super("A week with started, completed, or skipped workouts cannot be changed.");
    this.name = "TrainingWeekConflictError";
  }
}

export class TrainingWeekExerciseNotFoundError extends Error {
  constructor() {
    super("One or more selected exercises are no longer available.");
    this.name = "TrainingWeekExerciseNotFoundError";
  }
}

function toDatabaseDate(calendarDate: string): Date {
  return new Date(`${calendarDate}T00:00:00.000Z`);
}

function toCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toExerciseSnapshot(exercise: Exercise): TrainingExerciseSnapshot {
  return {
    provider: exercise.source.provider,
    sourceId: exercise.source.sourceId,
    sourceVersion: exercise.source.version,
    attributionUrl: exercise.source.attributionUrl,
    name: exercise.name,
    category: exercise.category,
    primaryMuscle: exercise.primaryMuscle,
    secondaryMuscles: exercise.secondaryMuscles,
    bodyPart: exercise.bodyPart,
    equipment: exercise.equipment,
  };
}

function parseBodyPart(value: string | null): BodyPartId | null {
  if (value === null) {
    return null;
  }

  const bodyPart = bodyPartIds.find((candidate) => candidate === value);
  if (!bodyPart) {
    throw new Error("Stored training body part is invalid.");
  }

  return bodyPart;
}

function parseOptionalCategory(
  value: string | null,
): ExerciseCategory | undefined {
  if (value === null) {
    return undefined;
  }

  const category = exerciseCategoryIds.find(
    (candidate) => candidate === value,
  );
  if (!category) {
    throw new Error("Stored exercise category is invalid.");
  }

  return category;
}

function parseMuscle(value: string): MuscleId {
  const muscle = muscleIds.find((candidate) => candidate === value);
  if (!muscle) {
    throw new Error("Stored exercise muscle is invalid.");
  }

  return muscle;
}

function parseOptionalEquipment(value: string | null): EquipmentId | undefined {
  if (value === null) {
    return undefined;
  }

  const equipment = equipmentIds.find((candidate) => candidate === value);
  if (!equipment) {
    throw new Error("Stored exercise equipment is invalid.");
  }

  return equipment;
}

async function loadExerciseSnapshots(
  input: TrainingWeekInput,
): Promise<Map<string, TrainingExerciseSnapshot>> {
  const exerciseIds = [
    ...new Set(
      input.days.flatMap((day) =>
        day.kind === "workout"
          ? day.exercises.map((exercise) => exercise.exerciseId)
          : [],
      ),
    ),
  ];
  const snapshots = new Map<string, TrainingExerciseSnapshot>();
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < exerciseIds.length) {
      const index = nextIndex;
      nextIndex += 1;
      const exerciseId = exerciseIds[index];
      const exercise = await exerciseGymGifsAdapter.getById(exerciseId);

      if (!exercise) {
        throw new TrainingWeekExerciseNotFoundError();
      }

      snapshots.set(exerciseId, toExerciseSnapshot(exercise));
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(EXERCISE_LOOKUP_CONCURRENCY, exerciseIds.length) },
      worker,
    ),
  );

  return snapshots;
}

function toTrainingWeekPlan(week: StoredTrainingWeek): TrainingWeekPlan {
  return {
    weekStart: toCalendarDate(week.weekStart),
    createdAt: week.createdAt.toISOString(),
    isLocked: week.days.some(
      (day) =>
        day.session !== null || day.status !== TrainingDayStatus.PLANNED,
    ),
    updatedAt: week.updatedAt.toISOString(),
    days: week.days.map((day) => ({
      plannedDate: toCalendarDate(day.plannedDate),
      kind: dayKindValueByDatabaseKind[day.kind],
      source: planSourceValueByDatabaseSource[day.source],
      status: dayStatusValueByDatabaseStatus[day.status],
      availableMinutes: day.availableMinutes,
      preferredBodyPart: parseBodyPart(day.preferredBodyPart),
      exercises: day.exercises.map((workoutExercise) => ({
        position: workoutExercise.position,
        recommendationReasons: workoutExercise.recommendationReasons,
        exercise: {
          provider: workoutExercise.exerciseProvider,
          sourceId: workoutExercise.exerciseSourceId,
          sourceVersion: workoutExercise.exerciseSourceVersion,
          attributionUrl: workoutExercise.exerciseAttributionUrl,
          name: workoutExercise.exerciseName,
          category: parseOptionalCategory(workoutExercise.exerciseCategory),
          primaryMuscle: parseMuscle(
            workoutExercise.exercisePrimaryMuscle,
          ),
          secondaryMuscles: workoutExercise.exerciseSecondaryMuscles.map(
            parseMuscle,
          ),
          bodyPart:
            parseBodyPart(workoutExercise.exerciseBodyPart) ?? undefined,
          equipment: parseOptionalEquipment(
            workoutExercise.exerciseEquipment,
          ),
        },
        sets: workoutExercise.plannedSets.map((set) => ({
          setNumber: set.setNumber,
          targetRepetitions: set.targetRepetitions,
          targetWeightGrams: set.targetWeightGrams,
          restSeconds: set.restSeconds,
        })),
      })),
    })),
  };
}

export async function getTrainingWeekForClerkUser(
  clerkUserId: string,
  weekStart: string,
): Promise<TrainingWeekPlan | null> {
  const week = await prisma.trainingWeek.findFirst({
    where: {
      weekStart: toDatabaseDate(weekStart),
      user: { clerkUserId },
    },
    include: trainingWeekInclude,
  });

  return week ? toTrainingWeekPlan(week) : null;
}

export async function saveTrainingWeekForClerkUser(
  clerkUserId: string,
  weekStart: string,
  input: TrainingWeekInput,
): Promise<TrainingWeekPlan> {
  const weekStartDate = toDatabaseDate(weekStart);
  const immutableDay = await prisma.trainingDay.findFirst({
    where: {
      trainingWeek: {
        weekStart: weekStartDate,
        user: { clerkUserId },
      },
      OR: [
        { session: { isNot: null } },
        { status: { not: TrainingDayStatus.PLANNED } },
      ],
    },
    select: { id: true },
  });

  if (immutableDay) {
    throw new TrainingWeekConflictError();
  }

  const snapshots = await loadExerciseSnapshots(input);

  return prisma.$transaction(
    async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { clerkUserId },
        select: { id: true },
      });

      if (!user) {
        throw new Error("Authenticated application user was not found.");
      }

      const immutableDay = await transaction.trainingDay.findFirst({
        where: {
          trainingWeek: { userId: user.id, weekStart: weekStartDate },
          OR: [
            { session: { isNot: null } },
            { status: { not: TrainingDayStatus.PLANNED } },
          ],
        },
        select: { id: true },
      });

      if (immutableDay) {
        throw new TrainingWeekConflictError();
      }

      const week = await transaction.trainingWeek.upsert({
        where: {
          userId_weekStart: { userId: user.id, weekStart: weekStartDate },
        },
        create: {
          userId: user.id,
          weekStart: weekStartDate,
          days: { create: createTrainingDays(input, snapshots) },
        },
        update: {
          days: {
            deleteMany: {},
            create: createTrainingDays(input, snapshots),
          },
        },
        include: trainingWeekInclude,
      });

      return toTrainingWeekPlan(week);
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

function createTrainingDays(
  input: TrainingWeekInput,
  snapshots: ReadonlyMap<string, TrainingExerciseSnapshot>,
): Prisma.TrainingDayCreateWithoutTrainingWeekInput[] {
  return [...input.days]
    .sort((left, right) => left.plannedDate.localeCompare(right.plannedDate))
    .map((day) => {
      if (day.kind === "rest") {
        return {
          plannedDate: toDatabaseDate(day.plannedDate),
          kind: TrainingDayKind.REST,
          source: TrainingPlanSource.MANUAL,
          status: TrainingDayStatus.PLANNED,
        };
      }

      return {
        plannedDate: toDatabaseDate(day.plannedDate),
        kind: TrainingDayKind.WORKOUT,
        source: TrainingPlanSource.MANUAL,
        status: TrainingDayStatus.PLANNED,
        availableMinutes: day.availableMinutes,
        preferredBodyPart: day.preferredBodyPart,
        exercises: {
          create: day.exercises.map((exercise, exerciseIndex) => {
            const snapshot = snapshots.get(exercise.exerciseId);

            if (!snapshot) {
              throw new TrainingWeekExerciseNotFoundError();
            }

            return {
              position: exerciseIndex + 1,
              exerciseProvider: snapshot.provider,
              exerciseSourceId: snapshot.sourceId,
              exerciseSourceVersion: snapshot.sourceVersion,
              exerciseAttributionUrl: snapshot.attributionUrl,
              exerciseName: snapshot.name,
              exerciseCategory: snapshot.category ?? null,
              exercisePrimaryMuscle: snapshot.primaryMuscle,
              exerciseSecondaryMuscles: [...snapshot.secondaryMuscles],
              exerciseBodyPart: snapshot.bodyPart ?? null,
              exerciseEquipment: snapshot.equipment ?? null,
              recommendationReasons: [],
              plannedSets: {
                create: exercise.sets.map((set, setIndex) => ({
                  setNumber: setIndex + 1,
                  targetRepetitions: set.targetRepetitions,
                  targetWeightGrams:
                    set.targetWeightKilograms === null
                      ? null
                      : Math.round(set.targetWeightKilograms * 1_000),
                  restSeconds: set.restSeconds,
                })),
              },
            };
          }),
        },
      };
    });
}

export async function deleteTrainingWeekForClerkUser(
  clerkUserId: string,
  weekStart: string,
): Promise<boolean> {
  const weekStartDate = toDatabaseDate(weekStart);

  return prisma.$transaction(
    async (transaction) => {
      const week = await transaction.trainingWeek.findFirst({
        where: {
          weekStart: weekStartDate,
          user: { clerkUserId },
        },
        select: {
          id: true,
          days: {
            where: {
              OR: [
                { session: { isNot: null } },
                { status: { not: TrainingDayStatus.PLANNED } },
              ],
            },
            select: { id: true },
            take: 1,
          },
        },
      });

      if (!week) {
        return false;
      }

      if (week.days.length > 0) {
        throw new TrainingWeekConflictError();
      }

      await transaction.trainingWeek.delete({ where: { id: week.id } });
      return true;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
