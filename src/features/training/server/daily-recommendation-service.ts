import "server-only";
import {
  Prisma,
  TrainingDayKind,
  TrainingDayStatus,
  TrainingPlanSource,
  WorkoutSessionStatus,
} from "@/generated/prisma/client";
import {
  bodyPartIds,
  muscleIds,
  type BodyPartId,
  type EquipmentId,
  type Exercise,
  type MuscleId,
} from "@/features/exercises/domain/exercise";
import { exerciseGymGifsAdapter } from "@/features/exercises/providers/exercise-gym-gifs/adapter";
import { prisma } from "@/server/database/prisma";
import {
  chooseRecommendationFocus,
  createDailyRecommendation,
  type RecentTrainingEntry,
} from "../daily-recommendation";
import {
  DAILY_RECOMMENDATION_ENGINE_VERSION,
  type DailyRecommendationInput,
  type DailyRecommendationView,
} from "../daily-recommendation-schema";
import {
  getCalendarDateInTimeZone,
  getTrainingWeekStartForDate,
} from "../domain/training";
import {
  MAX_EXERCISES_PER_WEEK,
  MAX_PLANNED_SETS_PER_WEEK,
} from "../training-week-schema";
import { getTrainingPreferencesForClerkUser } from "./training-preferences-service";

const HISTORY_LOOKBACK_DAYS = 42;
const MAX_RECENT_SET_LOGS = 500;

export class RecommendationPreferencesRequiredError extends Error {
  constructor() {
    super("Set your training preferences before requesting a recommendation.");
    this.name = "RecommendationPreferencesRequiredError";
  }
}

export class RecommendationUnavailableError extends Error {
  constructor() {
    super("No supported exercises matched this recommendation.");
    this.name = "RecommendationUnavailableError";
  }
}

export class RecommendationDayConflictError extends Error {
  constructor() {
    super("A workout has already been recorded for this day.");
    this.name = "RecommendationDayConflictError";
  }
}

export class RecommendationCapacityError extends Error {
  constructor() {
    super("This recommendation would exceed the supported weekly plan size.");
    this.name = "RecommendationCapacityError";
  }
}

export class RecommendationPastDateError extends Error {
  constructor() {
    super("Recommendations can only be created for today or a future date.");
    this.name = "RecommendationPastDateError";
  }
}

type GeneratedRecommendation = Readonly<{
  exercisesById: ReadonlyMap<string, Exercise>;
  view: DailyRecommendationView;
}>;

function toDatabaseDate(calendarDate: string): Date {
  return new Date(`${calendarDate}T00:00:00.000Z`);
}

function toCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseBodyPart(value: string | null): BodyPartId | null {
  return value === null
    ? null
    : (bodyPartIds.find((candidate) => candidate === value) ?? null);
}

function parseMuscle(value: string): MuscleId | null {
  return muscleIds.find((candidate) => candidate === value) ?? null;
}

async function getRecentTraining(
  clerkUserId: string,
  plannedDate: string,
): Promise<readonly RecentTrainingEntry[]> {
  const plannedTimestamp = Date.parse(`${plannedDate}T00:00:00.000Z`);
  const lookbackDate = new Date(
    plannedTimestamp - HISTORY_LOOKBACK_DAYS * 86_400_000,
  );
  const setLogs = await prisma.workoutSetLog.findMany({
    where: {
      session: {
        status: {
          in: [
            WorkoutSessionStatus.COMPLETED,
            WorkoutSessionStatus.ABANDONED,
          ],
        },
        trainingDay: {
          plannedDate: { gte: lookbackDate, lt: toDatabaseDate(plannedDate) },
          trainingWeek: { user: { clerkUserId } },
        },
      },
    },
    orderBy: { completedAt: "desc" },
    take: MAX_RECENT_SET_LOGS,
    select: {
      repetitions: true,
      weightGrams: true,
      session: { select: { trainingDay: { select: { plannedDate: true } } } },
      workoutExercise: {
        select: {
          exerciseBodyPart: true,
          exercisePrimaryMuscle: true,
          exerciseSourceId: true,
        },
      },
    },
  });
  const entries = new Map<string, RecentTrainingEntry>();

  for (const log of setLogs) {
    if (log.repetitions < 1) {
      continue;
    }

    const primaryMuscle = parseMuscle(
      log.workoutExercise.exercisePrimaryMuscle,
    );
    if (!primaryMuscle) {
      continue;
    }

    const calendarDate = toCalendarDate(log.session.trainingDay.plannedDate);
    const exerciseId = log.workoutExercise.exerciseSourceId;
    const key = `${calendarDate}:${exerciseId}`;
    const existing = entries.get(key);

    entries.set(key, {
      bodyPart: parseBodyPart(log.workoutExercise.exerciseBodyPart),
      exerciseId,
      heaviestWeightGrams:
        existing?.heaviestWeightGrams === null || log.weightGrams === null
          ? (existing?.heaviestWeightGrams ?? log.weightGrams)
          : Math.max(existing?.heaviestWeightGrams ?? 0, log.weightGrams),
      plannedDate: calendarDate,
      primaryMuscle,
      setCount: (existing?.setCount ?? 0) + 1,
    });
  }

  return [...entries.values()];
}

async function loadCandidates(
  bodyPart: BodyPartId,
  availableEquipment: readonly EquipmentId[],
): Promise<readonly Exercise[]> {
  const pages = await Promise.all(
    availableEquipment.map((equipment) =>
      exerciseGymGifsAdapter.list({
        bodyPart,
        equipment,
        page: 1,
      }),
    ),
  );
  const candidates = new Map<string, Exercise>();

  for (const exercise of pages.flatMap((page) => page.exercises)) {
    if (
      exercise.bodyPart === bodyPart &&
      exercise.category !== "stretching" &&
      exercise.equipment &&
      availableEquipment.includes(exercise.equipment)
    ) {
      candidates.set(exercise.id, exercise);
    }
  }

  return [...candidates.values()];
}

async function generateRecommendation(
  clerkUserId: string,
  input: DailyRecommendationInput,
): Promise<GeneratedRecommendation> {
  const preferences = await getTrainingPreferencesForClerkUser(clerkUserId);
  if (!preferences) {
    throw new RecommendationPreferencesRequiredError();
  }

  if (input.plannedDate < getCalendarDateInTimeZone(preferences.timezone)) {
    throw new RecommendationPastDateError();
  }

  const recentTraining = await getRecentTraining(
    clerkUserId,
    input.plannedDate,
  );
  let focus = chooseRecommendationFocus(
    input,
    preferences.goal,
    recentTraining,
  );
  let candidates = await loadCandidates(
    focus.bodyPart,
    preferences.availableEquipment,
  );

  if (candidates.length === 0 && input.preferredBodyPart === null) {
    const alternatives = bodyPartIds
      .filter((bodyPart) => bodyPart !== focus.bodyPart)
      .map((bodyPart) =>
        chooseRecommendationFocus(
          { ...input, preferredBodyPart: bodyPart },
          preferences.goal,
          recentTraining,
        ),
      )
      .sort((left, right) =>
        left.recovery.status === right.recovery.status
          ? left.bodyPart.localeCompare(right.bodyPart)
          : left.recovery.status === "ready"
            ? -1
            : 1,
      );

    for (const alternative of alternatives) {
      const alternativeCandidates = await loadCandidates(
        alternative.bodyPart,
        preferences.availableEquipment,
      );
      if (alternativeCandidates.length > 0) {
        focus = alternative;
        candidates = alternativeCandidates;
        break;
      }
    }
  }

  if (candidates.length === 0) {
    throw new RecommendationUnavailableError();
  }

  const view = createDailyRecommendation(
    input,
    {
      experienceLevel: preferences.experienceLevel,
      goal: preferences.goal,
    },
    focus,
    candidates,
    recentTraining,
  );

  return {
    exercisesById: new Map(candidates.map((exercise) => [exercise.id, exercise])),
    view,
  };
}

export async function previewDailyRecommendationForClerkUser(
  clerkUserId: string,
  input: DailyRecommendationInput,
): Promise<DailyRecommendationView> {
  return (await generateRecommendation(clerkUserId, input)).view;
}

export async function saveDailyRecommendationForClerkUser(
  clerkUserId: string,
  input: DailyRecommendationInput,
): Promise<DailyRecommendationView> {
  const generated = await generateRecommendation(clerkUserId, input);
  const weekStart = getTrainingWeekStartForDate(input.plannedDate);
  if (!weekStart) {
    throw new RecommendationUnavailableError();
  }

  await prisma.$transaction(
    async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { clerkUserId },
        select: { id: true },
      });
      if (!user) {
        throw new RecommendationPreferencesRequiredError();
      }

      const week = await transaction.trainingWeek.upsert({
        where: {
          userId_weekStart: {
            userId: user.id,
            weekStart: toDatabaseDate(weekStart),
          },
        },
        create: {
          userId: user.id,
          weekStart: toDatabaseDate(weekStart),
        },
        update: { updatedAt: new Date() },
        select: { id: true },
      });
      const existingDay = await transaction.trainingDay.findUnique({
        where: {
          trainingWeekId_plannedDate: {
            trainingWeekId: week.id,
            plannedDate: toDatabaseDate(input.plannedDate),
          },
        },
        select: { id: true, session: { select: { id: true } }, status: true },
      });

      if (
        existingDay?.session ||
        (existingDay && existingDay.status !== TrainingDayStatus.PLANNED)
      ) {
        throw new RecommendationDayConflictError();
      }

      const dayExclusion = existingDay
        ? { id: { not: existingDay.id } }
        : undefined;
      const [otherExerciseCount, otherSetCount] = await Promise.all([
        transaction.workoutExercise.count({
          where: {
            trainingDay: {
              trainingWeekId: week.id,
              ...(dayExclusion ? dayExclusion : {}),
            },
          },
        }),
        transaction.plannedSet.count({
          where: {
            workoutExercise: {
              trainingDay: {
                trainingWeekId: week.id,
                ...(dayExclusion ? dayExclusion : {}),
              },
            },
          },
        }),
      ]);
      const recommendedSetCount = generated.view.exercises.reduce(
        (total, exercise) => total + exercise.sets.length,
        0,
      );

      if (
        otherExerciseCount + generated.view.exercises.length >
          MAX_EXERCISES_PER_WEEK ||
        otherSetCount + recommendedSetCount > MAX_PLANNED_SETS_PER_WEEK
      ) {
        throw new RecommendationCapacityError();
      }

      const exercises = generated.view.exercises.map(
        (recommended, position) => {
          const exercise = generated.exercisesById.get(recommended.id);
          if (!exercise) {
            throw new RecommendationUnavailableError();
          }

          return {
            position: position + 1,
            exerciseProvider: exercise.source.provider,
            exerciseSourceId: exercise.source.sourceId,
            exerciseSourceVersion: exercise.source.version,
            exerciseAttributionUrl: exercise.source.attributionUrl,
            exerciseName: exercise.name,
            exerciseCategory: exercise.category ?? null,
            exercisePrimaryMuscle: exercise.primaryMuscle,
            exerciseSecondaryMuscles: exercise.secondaryMuscles,
            exerciseBodyPart: exercise.bodyPart ?? null,
            exerciseEquipment: exercise.equipment ?? null,
            recommendationReasons: recommended.reasons,
            plannedSets: {
              create: recommended.sets.map((set) => ({
                setNumber: set.setNumber,
                targetRepetitions: set.targetRepetitions,
                targetWeightGrams:
                  set.targetWeightKilograms === null
                    ? null
                    : Math.round(set.targetWeightKilograms * 1_000),
                restSeconds: set.restSeconds,
              })),
            },
          };
        },
      );
      const dayValues = {
        availableMinutes: input.availableMinutes,
        kind: TrainingDayKind.WORKOUT,
        preferredBodyPart: generated.view.focusBodyPart,
        recommendationEngineVersion: DAILY_RECOMMENDATION_ENGINE_VERSION,
        source: TrainingPlanSource.RECOMMENDED,
        status: TrainingDayStatus.PLANNED,
      };

      if (existingDay) {
        await transaction.trainingDay.update({
          where: { id: existingDay.id },
          data: {
            ...dayValues,
            exercises: { deleteMany: {}, create: exercises },
          },
        });
      } else {
        await transaction.trainingDay.create({
          data: {
            ...dayValues,
            plannedDate: toDatabaseDate(input.plannedDate),
            trainingWeekId: week.id,
            exercises: { create: exercises },
          },
        });
      }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return generated.view;
}
