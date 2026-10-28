import type {
  BodyPartId,
  Exercise,
  MuscleId,
} from "@/features/exercises/domain/exercise";
import {
  bodyPartIds,
  formatExerciseValue,
} from "@/features/exercises/domain/exercise";
import { getTrainingWeekStartForDate } from "./domain/training";
import {
  DAILY_RECOMMENDATION_ENGINE_VERSION,
  type DailyRecommendationInput,
  type DailyRecommendationView,
} from "./daily-recommendation-schema";
import type {
  TrainingExperienceValue,
  TrainingGoalValue,
} from "./training-preferences-schema";

const MILLISECONDS_PER_DAY = 86_400_000;

export type RecentTrainingEntry = Readonly<{
  bodyPart: BodyPartId | null;
  exerciseId: string;
  heaviestWeightGrams: number | null;
  plannedDate: string;
  primaryMuscle: MuscleId;
  setCount: number;
}>;

export type RecommendationPreferences = Readonly<{
  experienceLevel: TrainingExperienceValue;
  goal: TrainingGoalValue;
}>;

export type FocusDecision = Readonly<{
  bodyPart: BodyPartId;
  recovery: DailyRecommendationView["recovery"];
}>;

function daysBetween(earlierDate: string, laterDate: string): number {
  return Math.round(
    (Date.parse(`${laterDate}T00:00:00.000Z`) -
      Date.parse(`${earlierDate}T00:00:00.000Z`)) /
      MILLISECONDS_PER_DAY,
  );
}

function mostRecentBodyPartDate(
  bodyPart: BodyPartId,
  entries: readonly RecentTrainingEntry[],
): string | null {
  return (
    entries
      .filter((entry) => entry.bodyPart === bodyPart)
      .map((entry) => entry.plannedDate)
      .sort((left, right) => right.localeCompare(left))[0] ?? null
  );
}

function bodyPartSetCount(
  bodyPart: BodyPartId,
  weekStart: string,
  entries: readonly RecentTrainingEntry[],
): number {
  return entries
    .filter(
      (entry) =>
        entry.bodyPart === bodyPart && entry.plannedDate >= weekStart,
    )
    .reduce((total, entry) => total + entry.setCount, 0);
}

export function chooseRecommendationFocus(
  input: DailyRecommendationInput,
  goal: TrainingGoalValue,
  recentTraining: readonly RecentTrainingEntry[],
): FocusDecision {
  const weekStart = getTrainingWeekStartForDate(input.plannedDate);
  if (!weekStart) {
    throw new Error("The recommendation date is invalid.");
  }

  const recentBodyParts = bodyPartIds.filter((bodyPart) => {
    const lastDate = mostRecentBodyPartDate(bodyPart, recentTraining);
    return lastDate !== null && daysBetween(lastDate, input.plannedDate) <= 1;
  });
  const bodyPart =
    input.preferredBodyPart ??
    [...bodyPartIds].sort((left, right) => {
      const leftDate = mostRecentBodyPartDate(left, recentTraining);
      const rightDate = mostRecentBodyPartDate(right, recentTraining);
      const leftRecoveryPenalty =
        leftDate && daysBetween(leftDate, input.plannedDate) <= 1 ? 1_000 : 0;
      const rightRecoveryPenalty =
        rightDate && daysBetween(rightDate, input.plannedDate) <= 1 ? 1_000 : 0;
      const leftGoalBonus = goal === "endurance" && left === "cardio" ? -4 : 0;
      const rightGoalBonus = goal === "endurance" && right === "cardio" ? -4 : 0;

      return (
        leftRecoveryPenalty - rightRecoveryPenalty ||
        bodyPartSetCount(left, weekStart, recentTraining) -
          bodyPartSetCount(right, weekStart, recentTraining) ||
        leftGoalBonus - rightGoalBonus ||
        left.localeCompare(right)
      );
    })[0];
  const lastFocusedDate = mostRecentBodyPartDate(bodyPart, recentTraining);
  const trainedTooRecently =
    lastFocusedDate !== null &&
    daysBetween(lastFocusedDate, input.plannedDate) <= 1;

  return {
    bodyPart,
    recovery: {
      message: trainedTooRecently
        ? `${formatExerciseValue(bodyPart)} was trained within the previous day. Keep the load conservative or choose another focus.`
        : recentTraining.length === 0
          ? "No earlier workout records were available, so this plan starts conservatively."
          : `No ${formatExerciseValue(bodyPart).toLocaleLowerCase("en")} session was recorded in the previous day.`,
      recentlyTrainedBodyParts: recentBodyParts,
      status: trainedTooRecently ? "caution" : "ready",
    },
  };
}

function prescriptionForGoal(
  goal: TrainingGoalValue,
  experienceLevel: TrainingExperienceValue,
) {
  const setCountByExperience: Record<TrainingExperienceValue, number> = {
    beginner: 2,
    intermediate: 3,
    advanced: 4,
  };
  const prescriptionByGoal: Record<
    TrainingGoalValue,
    { repetitions: number; restSeconds: number }
  > = {
    "general-fitness": { repetitions: 10, restSeconds: 75 },
    strength: { repetitions: 5, restSeconds: 150 },
    "muscle-gain": { repetitions: 10, restSeconds: 90 },
    endurance: { repetitions: 15, restSeconds: 45 },
  };

  return {
    setCount: setCountByExperience[experienceLevel],
    ...prescriptionByGoal[goal],
  };
}

function recommendedExerciseCount(
  availableMinutes: number,
  setCount: number,
  restSeconds: number,
): number {
  const minutesPerExercise = Math.max(
    5,
    Math.ceil(setCount * (1 + restSeconds / 60)),
  );
  return Math.max(
    1,
    Math.min(8, Math.floor((availableMinutes - 5) / minutesPerExercise)),
  );
}

function latestEntryByExercise(
  recentTraining: readonly RecentTrainingEntry[],
): Map<string, RecentTrainingEntry> {
  const result = new Map<string, RecentTrainingEntry>();
  const newestFirst = [...recentTraining].sort((left, right) =>
    right.plannedDate.localeCompare(left.plannedDate),
  );

  for (const entry of newestFirst) {
    if (!result.has(entry.exerciseId)) {
      result.set(entry.exerciseId, entry);
    }
  }

  return result;
}

function categoryPenalty(
  exercise: Exercise,
  goal: TrainingGoalValue,
): number {
  if (goal === "endurance") {
    return exercise.category === "cardio"
      ? 0
      : exercise.category === "plyometrics"
        ? 1
        : 2;
  }

  return exercise.category === "strength"
    ? 0
    : exercise.category === "plyometrics"
      ? 1
      : 2;
}

export function createDailyRecommendation(
  input: DailyRecommendationInput,
  preferences: RecommendationPreferences,
  focus: FocusDecision,
  candidates: readonly Exercise[],
  recentTraining: readonly RecentTrainingEntry[],
): DailyRecommendationView {
  const weekStart = getTrainingWeekStartForDate(input.plannedDate);
  if (!weekStart) {
    throw new Error("The recommendation date is invalid.");
  }

  const basePrescription = prescriptionForGoal(
    preferences.goal,
    preferences.experienceLevel,
  );
  const maximumTimeBoundSetCount = Math.max(
    1,
    Math.floor(
      (input.availableMinutes - 5) /
        (1 + basePrescription.restSeconds / 60),
    ),
  );
  const prescription = {
    ...basePrescription,
    setCount: Math.min(
      basePrescription.setCount,
      maximumTimeBoundSetCount,
    ),
  };
  const exerciseCount = recommendedExerciseCount(
    input.availableMinutes,
    prescription.setCount,
    prescription.restSeconds,
  );
  const latestByExercise = latestEntryByExercise(recentTraining);
  const weeklySetsByMuscle = new Map<MuscleId, number>();

  for (const entry of recentTraining) {
    if (entry.plannedDate >= weekStart) {
      weeklySetsByMuscle.set(
        entry.primaryMuscle,
        (weeklySetsByMuscle.get(entry.primaryMuscle) ?? 0) + entry.setCount,
      );
    }
  }

  const rankedCandidates = [...candidates].sort((left, right) => {
    const leftRecent = latestByExercise.get(left.id);
    const rightRecent = latestByExercise.get(right.id);
    const leftRepeatPenalty =
      leftRecent && daysBetween(leftRecent.plannedDate, input.plannedDate) <= 7
        ? 100
        : 0;
    const rightRepeatPenalty =
      rightRecent && daysBetween(rightRecent.plannedDate, input.plannedDate) <= 7
        ? 100
        : 0;

    return (
      categoryPenalty(left, preferences.goal) -
        categoryPenalty(right, preferences.goal) ||
      leftRepeatPenalty - rightRepeatPenalty ||
      (weeklySetsByMuscle.get(left.primaryMuscle) ?? 0) -
        (weeklySetsByMuscle.get(right.primaryMuscle) ?? 0) ||
      left.name.localeCompare(right.name)
    );
  });
  const selected: Exercise[] = [];
  const selectedMuscleCounts = new Map<MuscleId, number>();

  for (const exercise of rankedCandidates) {
    if ((selectedMuscleCounts.get(exercise.primaryMuscle) ?? 0) >= 2) {
      continue;
    }

    selected.push(exercise);
    selectedMuscleCounts.set(
      exercise.primaryMuscle,
      (selectedMuscleCounts.get(exercise.primaryMuscle) ?? 0) + 1,
    );

    if (selected.length >= exerciseCount) {
      break;
    }
  }

  if (selected.length === 0) {
    throw new Error("No supported exercises matched this recommendation.");
  }

  return {
    availableMinutes: input.availableMinutes,
    engineVersion: DAILY_RECOMMENDATION_ENGINE_VERSION,
    exercises: selected.map((exercise) => {
      const latest = latestByExercise.get(exercise.id);
      const targetWeightKilograms =
        latest?.heaviestWeightGrams === null ||
        latest?.heaviestWeightGrams === undefined
          ? null
          : latest.heaviestWeightGrams / 1_000;
      const reasons = [
        input.preferredBodyPart
          ? `Matches your ${formatExerciseValue(focus.bodyPart).toLocaleLowerCase("en")} focus.`
          : `Selected ${formatExerciseValue(focus.bodyPart).toLocaleLowerCase("en")} from your recent training balance.`,
        `${formatExerciseValue(exercise.primaryMuscle)} has ${weeklySetsByMuscle.get(exercise.primaryMuscle) ?? 0} recorded sets this week.`,
        latest
          ? "Uses your last recorded load as a conservative starting point."
          : "Starts without an assumed equipment load.",
      ];

      return {
        bodyPart: exercise.bodyPart ?? focus.bodyPart,
        equipment: exercise.equipment ?? null,
        id: exercise.id,
        name: exercise.name,
        primaryMuscle: exercise.primaryMuscle,
        reasons,
        sets: Array.from({ length: prescription.setCount }, (_, index) => ({
          restSeconds: prescription.restSeconds,
          setNumber: index + 1,
          targetRepetitions: prescription.repetitions,
          targetWeightKilograms,
        })),
      };
    }),
    focusBodyPart: focus.bodyPart,
    goal: preferences.goal,
    plannedDate: input.plannedDate,
    recovery: focus.recovery,
    weekStart,
  };
}
