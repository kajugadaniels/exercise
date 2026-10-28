import "server-only";
import {
  Prisma,
  TrainingDayKind,
  TrainingDayStatus,
  WorkoutSessionStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/server/database/prisma";
import type {
  TrainingDayStatus as TrainingDayStatusValue,
  WorkoutSessionStatus as WorkoutSessionStatusValue,
} from "../domain/training";
import {
  workoutExecutionViewSchema,
  type WorkoutExecutionView,
  type WorkoutSetAction,
} from "../workout-session-schema";

const workoutDayInclude = {
  exercises: {
    orderBy: { position: "asc" },
    include: {
      plannedSets: {
        orderBy: { setNumber: "asc" },
        include: { setLog: true },
      },
    },
  },
  session: true,
} satisfies Prisma.TrainingDayInclude;

type StoredWorkoutDay = Prisma.TrainingDayGetPayload<{
  include: typeof workoutDayInclude;
}>;

const dayStatusValueByDatabaseStatus: Record<
  TrainingDayStatus,
  TrainingDayStatusValue
> = {
  [TrainingDayStatus.PLANNED]: "planned",
  [TrainingDayStatus.IN_PROGRESS]: "in-progress",
  [TrainingDayStatus.COMPLETED]: "completed",
  [TrainingDayStatus.SKIPPED]: "skipped",
};

const sessionStatusValueByDatabaseStatus: Record<
  WorkoutSessionStatus,
  WorkoutSessionStatusValue
> = {
  [WorkoutSessionStatus.IN_PROGRESS]: "in-progress",
  [WorkoutSessionStatus.COMPLETED]: "completed",
  [WorkoutSessionStatus.ABANDONED]: "abandoned",
};

export class WorkoutNotFoundError extends Error {
  constructor() {
    super("The planned training day was not found.");
    this.name = "WorkoutNotFoundError";
  }
}

export class WorkoutDayUnavailableError extends Error {
  constructor() {
    super("Only a planned workout day can start a workout session.");
    this.name = "WorkoutDayUnavailableError";
  }
}

export class WorkoutSessionNotStartedError extends Error {
  constructor() {
    super("Start the workout before recording activity.");
    this.name = "WorkoutSessionNotStartedError";
  }
}

export class WorkoutSessionConflictError extends Error {
  constructor() {
    super("This workout session has already ended.");
    this.name = "WorkoutSessionConflictError";
  }
}

export class WorkoutSetNotFoundError extends Error {
  constructor() {
    super("The planned workout set was not found.");
    this.name = "WorkoutSetNotFoundError";
  }
}

export class WorkoutIncompleteError extends Error {
  constructor() {
    super("Record every planned set before completing the workout.");
    this.name = "WorkoutIncompleteError";
  }
}

function toDatabaseDate(calendarDate: string): Date {
  return new Date(`${calendarDate}T00:00:00.000Z`);
}

function toCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Validate stored snapshots before they cross the server boundary.
function toWorkoutExecutionView(
  day: StoredWorkoutDay,
): WorkoutExecutionView {
  return workoutExecutionViewSchema.parse({
    availableMinutes: day.availableMinutes,
    plannedDate: toCalendarDate(day.plannedDate),
    status: dayStatusValueByDatabaseStatus[day.status],
    session: day.session
      ? {
          status: sessionStatusValueByDatabaseStatus[day.session.status],
          startedAt: day.session.startedAt.toISOString(),
          completedAt: day.session.completedAt?.toISOString() ?? null,
        }
      : null,
    exercises: day.exercises.map((exercise) => ({
      equipment: exercise.exerciseEquipment,
      name: exercise.exerciseName,
      position: exercise.position,
      sets: exercise.plannedSets.map((set) => ({
        setNumber: set.setNumber,
        targetRepetitions: set.targetRepetitions,
        targetWeightGrams: set.targetWeightGrams,
        restSeconds: set.restSeconds,
        actual: set.setLog
          ? {
              repetitions: set.setLog.repetitions,
              weightGrams: set.setLog.weightGrams,
              effortRir: set.setLog.effortRir,
              completedAt: set.setLog.completedAt.toISOString(),
            }
          : null,
      })),
    })),
  });
}

async function loadWorkoutDay(
  clerkUserId: string,
  plannedDate: string,
): Promise<StoredWorkoutDay | null> {
  return prisma.trainingDay.findFirst({
    where: {
      plannedDate: toDatabaseDate(plannedDate),
      kind: TrainingDayKind.WORKOUT,
      trainingWeek: { user: { clerkUserId } },
    },
    include: workoutDayInclude,
  });
}

async function requireWorkoutView(
  clerkUserId: string,
  plannedDate: string,
): Promise<WorkoutExecutionView> {
  const workout = await getWorkoutForClerkUser(clerkUserId, plannedDate);

  if (!workout) {
    throw new WorkoutNotFoundError();
  }

  return workout;
}

export async function getWorkoutForClerkUser(
  clerkUserId: string,
  plannedDate: string,
): Promise<WorkoutExecutionView | null> {
  const day = await loadWorkoutDay(clerkUserId, plannedDate);
  return day ? toWorkoutExecutionView(day) : null;
}

export async function startWorkoutForClerkUser(
  clerkUserId: string,
  plannedDate: string,
): Promise<WorkoutExecutionView> {
  const plannedDateValue = toDatabaseDate(plannedDate);

  await prisma.$transaction(
    async (transaction) => {
      const day = await transaction.trainingDay.findFirst({
        where: {
          plannedDate: plannedDateValue,
          trainingWeek: { user: { clerkUserId } },
        },
        select: {
          id: true,
          kind: true,
          status: true,
          exercises: { select: { id: true }, take: 1 },
        },
      });

      if (!day) {
        throw new WorkoutNotFoundError();
      }

      if (
        day.kind !== TrainingDayKind.WORKOUT ||
        day.exercises.length === 0
      ) {
        throw new WorkoutDayUnavailableError();
      }

      if (
        day.status === TrainingDayStatus.COMPLETED ||
        day.status === TrainingDayStatus.SKIPPED
      ) {
        throw new WorkoutSessionConflictError();
      }

      const session = await transaction.workoutSession.upsert({
        where: { trainingDayId: day.id },
        create: { trainingDayId: day.id },
        update: {},
        select: { status: true },
      });

      if (session.status !== WorkoutSessionStatus.IN_PROGRESS) {
        throw new WorkoutSessionConflictError();
      }

      await transaction.trainingDay.update({
        where: { id: day.id },
        data: { status: TrainingDayStatus.IN_PROGRESS },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return requireWorkoutView(clerkUserId, plannedDate);
}

export async function skipWorkoutForClerkUser(
  clerkUserId: string,
  plannedDate: string,
): Promise<WorkoutExecutionView> {
  const plannedDateValue = toDatabaseDate(plannedDate);

  await prisma.$transaction(
    async (transaction) => {
      const day = await transaction.trainingDay.findFirst({
        where: {
          plannedDate: plannedDateValue,
          trainingWeek: { user: { clerkUserId } },
        },
        select: {
          id: true,
          kind: true,
          status: true,
          session: { select: { id: true } },
        },
      });

      if (!day) {
        throw new WorkoutNotFoundError();
      }

      if (day.kind !== TrainingDayKind.WORKOUT) {
        throw new WorkoutDayUnavailableError();
      }

      if (day.status === TrainingDayStatus.SKIPPED && !day.session) {
        return;
      }

      if (day.status !== TrainingDayStatus.PLANNED || day.session) {
        throw new WorkoutSessionConflictError();
      }

      await transaction.trainingDay.update({
        where: { id: day.id },
        data: { status: TrainingDayStatus.SKIPPED },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return requireWorkoutView(clerkUserId, plannedDate);
}

export async function recordWorkoutSetForClerkUser(
  clerkUserId: string,
  plannedDate: string,
  input: WorkoutSetAction,
): Promise<WorkoutExecutionView> {
  const plannedDateValue = toDatabaseDate(plannedDate);

  await prisma.$transaction(
    async (transaction) => {
      const session = await transaction.workoutSession.findFirst({
        where: {
          trainingDay: {
            plannedDate: plannedDateValue,
            trainingWeek: { user: { clerkUserId } },
          },
        },
        select: { id: true, status: true, trainingDayId: true },
      });

      if (!session) {
        throw new WorkoutSessionNotStartedError();
      }

      if (session.status !== WorkoutSessionStatus.IN_PROGRESS) {
        throw new WorkoutSessionConflictError();
      }

      const plannedSet = await transaction.plannedSet.findFirst({
        where: {
          setNumber: input.setNumber,
          workoutExercise: {
            position: input.exercisePosition,
            trainingDayId: session.trainingDayId,
          },
        },
        select: { id: true, workoutExerciseId: true },
      });

      if (!plannedSet) {
        throw new WorkoutSetNotFoundError();
      }

      await transaction.workoutSetLog.upsert({
        where: { plannedSetId: plannedSet.id },
        create: {
          sessionId: session.id,
          workoutExerciseId: plannedSet.workoutExerciseId,
          plannedSetId: plannedSet.id,
          setNumber: input.setNumber,
          repetitions: input.repetitions,
          weightGrams:
            input.weightKilograms === null
              ? null
              : Math.round(input.weightKilograms * 1_000),
          effortRir: input.effortRir,
        },
        update: {
          repetitions: input.repetitions,
          weightGrams:
            input.weightKilograms === null
              ? null
              : Math.round(input.weightKilograms * 1_000),
          effortRir: input.effortRir,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return requireWorkoutView(clerkUserId, plannedDate);
}

export async function finishWorkoutForClerkUser(
  clerkUserId: string,
  plannedDate: string,
  outcome: "complete" | "abandon",
): Promise<WorkoutExecutionView> {
  const plannedDateValue = toDatabaseDate(plannedDate);
  const targetSessionStatus =
    outcome === "complete"
      ? WorkoutSessionStatus.COMPLETED
      : WorkoutSessionStatus.ABANDONED;
  const targetDayStatus =
    outcome === "complete"
      ? TrainingDayStatus.COMPLETED
      : TrainingDayStatus.SKIPPED;

  await prisma.$transaction(
    async (transaction) => {
      const session = await transaction.workoutSession.findFirst({
        where: {
          trainingDay: {
            plannedDate: plannedDateValue,
            trainingWeek: { user: { clerkUserId } },
          },
        },
        select: { id: true, status: true, trainingDayId: true },
      });

      if (!session) {
        throw new WorkoutSessionNotStartedError();
      }

      if (session.status === targetSessionStatus) {
        return;
      }

      if (session.status !== WorkoutSessionStatus.IN_PROGRESS) {
        throw new WorkoutSessionConflictError();
      }

      if (outcome === "complete") {
        const [plannedSetCount, recordedSetCount] = await Promise.all([
          transaction.plannedSet.count({
            where: {
              workoutExercise: { trainingDayId: session.trainingDayId },
            },
          }),
          transaction.workoutSetLog.count({
            where: {
              sessionId: session.id,
              plannedSetId: { not: null },
            },
          }),
        ]);

        if (
          plannedSetCount === 0 ||
          recordedSetCount !== plannedSetCount
        ) {
          throw new WorkoutIncompleteError();
        }
      }

      const endedAt = new Date();
      await transaction.workoutSession.update({
        where: { id: session.id },
        data: { status: targetSessionStatus, completedAt: endedAt },
      });
      await transaction.trainingDay.update({
        where: { id: session.trainingDayId },
        data: { status: targetDayStatus },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return requireWorkoutView(clerkUserId, plannedDate);
}

export async function deleteWorkoutRecordForClerkUser(
  clerkUserId: string,
  plannedDate: string,
): Promise<void> {
  const plannedDateValue = toDatabaseDate(plannedDate);

  await prisma.$transaction(
    async (transaction) => {
      const session = await transaction.workoutSession.findFirst({
        where: {
          trainingDay: {
            plannedDate: plannedDateValue,
            trainingWeek: { user: { clerkUserId } },
          },
        },
        select: { id: true, status: true, trainingDayId: true },
      });

      if (!session) {
        throw new WorkoutNotFoundError();
      }

      if (session.status === WorkoutSessionStatus.IN_PROGRESS) {
        throw new WorkoutSessionConflictError();
      }

      await transaction.workoutSession.delete({ where: { id: session.id } });
      await transaction.trainingDay.update({
        where: { id: session.trainingDayId },
        data: { status: TrainingDayStatus.PLANNED },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
