import type { MuscleId } from "@/features/exercises/domain/exercise";
import { getTrainingWeekDates } from "./domain/training";
import type {
  ProgressionRecommendation,
  TrainingHistoryView,
  WorkoutHistorySession,
} from "./training-history-schema";

export type TrainingHistorySourceSet = Readonly<{
  completedAt: string;
  effortRir: number | null;
  repetitions: number;
  setNumber: number;
  targetRepetitions: number;
  weightGrams: number | null;
}>;

export type TrainingHistorySourceExercise = Readonly<{
  exerciseKey: string;
  name: string;
  position: number;
  primaryMuscle: MuscleId;
  sets: readonly TrainingHistorySourceSet[];
}>;

export type TrainingHistorySourceSession = Readonly<{
  endedAt: string;
  exercises: readonly TrainingHistorySourceExercise[];
  plannedDate: string;
  startedAt: string;
  status: "completed" | "abandoned";
}>;

export type ScheduledWorkoutDay = Readonly<{
  date: string;
  status: "planned" | "in-progress" | "skipped";
}>;

function roundKilograms(value: number): number {
  return Math.round(value * 10) / 10;
}

function sessionVolumeKilograms(
  session: TrainingHistorySourceSession,
): number {
  const grams = session.exercises.reduce(
    (exerciseTotal, exercise) =>
      exerciseTotal +
      exercise.sets.reduce(
        (setTotal, set) =>
          setTotal + set.repetitions * (set.weightGrams ?? 0),
        0,
      ),
    0,
  );

  return roundKilograms(grams / 1_000);
}

function sessionRepetitions(session: TrainingHistorySourceSession): number {
  return session.exercises.reduce(
    (exerciseTotal, exercise) =>
      exerciseTotal +
      exercise.sets.reduce(
        (setTotal, set) => setTotal + set.repetitions,
        0,
      ),
    0,
  );
}

function sessionSetCount(session: TrainingHistorySourceSession): number {
  return session.exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0,
  );
}

function sessionDurationMinutes(
  session: TrainingHistorySourceSession,
): number {
  const durationMilliseconds =
    new Date(session.endedAt).getTime() -
    new Date(session.startedAt).getTime();

  return Math.max(0, Math.round(durationMilliseconds / 60_000));
}

export function toWorkoutHistorySession(
  session: TrainingHistorySourceSession,
): WorkoutHistorySession {
  return {
    durationMinutes: sessionDurationMinutes(session),
    endedAt: session.endedAt,
    exercises: session.exercises.map((exercise) => ({
      name: exercise.name,
      position: exercise.position,
      primaryMuscle: exercise.primaryMuscle,
      sets: exercise.sets.map((set) => ({
        completedAt: set.completedAt,
        effortRir: set.effortRir,
        repetitions: set.repetitions,
        setNumber: set.setNumber,
        targetRepetitions: set.targetRepetitions,
        weightKilograms:
          set.weightGrams === null ? null : set.weightGrams / 1_000,
      })),
    })),
    plannedDate: session.plannedDate,
    startedAt: session.startedAt,
    status: session.status,
    totalRepetitions: sessionRepetitions(session),
    totalSets: sessionSetCount(session),
    volumeKilograms: sessionVolumeKilograms(session),
  };
}

export function buildWeeklyReport(
  weekStart: string,
  scheduledWorkoutDays: readonly ScheduledWorkoutDay[],
  sessions: readonly TrainingHistorySourceSession[],
): TrainingHistoryView["weeklyReport"] {
  const weekDates = getTrainingWeekDates(weekStart);
  const weekDateSet = new Set(weekDates);
  const weekSessions = sessions.filter((session) =>
    weekDateSet.has(session.plannedDate),
  );
  const scheduledStatusByDate = new Map(
    scheduledWorkoutDays.map((day) => [day.date, day.status]),
  );
  const sessionByDate = new Map(
    weekSessions.map((session) => [session.plannedDate, session]),
  );
  const muscleSets = new Map<string, number>();

  for (const session of weekSessions) {
    for (const exercise of session.exercises) {
      muscleSets.set(
        exercise.primaryMuscle,
        (muscleSets.get(exercise.primaryMuscle) ?? 0) + exercise.sets.length,
      );
    }
  }

  return {
    abandonedWorkouts: weekSessions.filter(
      (session) => session.status === "abandoned",
    ).length,
    activeMinutes: weekSessions.reduce(
      (total, session) => total + sessionDurationMinutes(session),
      0,
    ),
    completedWorkouts: weekSessions.filter(
      (session) => session.status === "completed",
    ).length,
    days: weekDates.map((date) => {
      const session = sessionByDate.get(date);
      return {
        date,
        status:
          session?.status ?? scheduledStatusByDate.get(date) ?? "rest",
      };
    }),
    muscleFocus: [...muscleSets.entries()]
      .sort(
        ([leftMuscle, leftCount], [rightMuscle, rightCount]) =>
          rightCount - leftCount || leftMuscle.localeCompare(rightMuscle),
      )
      .map(([muscle, setCount]) => ({ muscle, setCount })),
    scheduledWorkouts: scheduledWorkoutDays.length,
    totalRepetitions: weekSessions.reduce(
      (total, session) => total + sessionRepetitions(session),
      0,
    ),
    totalSets: weekSessions.reduce(
      (total, session) => total + sessionSetCount(session),
      0,
    ),
    volumeKilograms: roundKilograms(
      weekSessions.reduce(
        (total, session) => total + sessionVolumeKilograms(session),
        0,
      ),
    ),
    weekEnd: weekDates.at(-1) ?? weekStart,
    weekStart,
  };
}

type ExerciseExposure = Readonly<{
  completedAt: string;
  exercise: TrainingHistorySourceExercise;
}>;

function heaviestWeightGrams(
  exercise: TrainingHistorySourceExercise,
): number | null {
  const weights = exercise.sets.flatMap((set) =>
    set.weightGrams === null || set.weightGrams <= 0 ? [] : [set.weightGrams],
  );
  return weights.length > 0 ? Math.max(...weights) : null;
}

function nextConservativeWeight(currentKilograms: number): number {
  const percentageIncrease = Math.ceil((currentKilograms * 1.025) * 2) / 2;
  return Math.min(
    1_000,
    currentKilograms + 5,
    Math.max(currentKilograms + 0.5, percentageIncrease),
  );
}

function recommendationForExercise(
  exposures: readonly ExerciseExposure[],
): ProgressionRecommendation | null {
  const latest = exposures[0];
  const latestWeightGrams = latest
    ? heaviestWeightGrams(latest.exercise)
    : null;

  if (!latest || latestWeightGrams === null) {
    return null;
  }

  const currentWeightKilograms = latestWeightGrams / 1_000;
  const base = {
    currentWeightKilograms,
    exerciseId: latest.exercise.exerciseKey,
    exerciseName: latest.exercise.name,
    latestCompletedAt: latest.completedAt,
  };
  const previous = exposures[1];

  if (!previous) {
    return {
      ...base,
      previousWeightKilograms: null,
      reason: "Repeat this load in one more completed workout before increasing it.",
      status: "hold",
      suggestedWeightKilograms: currentWeightKilograms,
    };
  }

  const previousWeightGrams = heaviestWeightGrams(previous.exercise);
  const previousWeightKilograms =
    previousWeightGrams === null ? null : previousWeightGrams / 1_000;
  const targetsMet = [latest, previous].every((exposure) =>
    exposure.exercise.sets.every(
      (set) => set.repetitions >= set.targetRepetitions,
    ),
  );

  if (!targetsMet) {
    return {
      ...base,
      previousWeightKilograms,
      reason: "Keep this load until every planned repetition is completed twice.",
      status: "hold",
      suggestedWeightKilograms: currentWeightKilograms,
    };
  }

  const effortSupportsIncrease = latest.exercise.sets.every(
    (set) => set.effortRir !== null && set.effortRir >= 2,
  );

  if (!effortSupportsIncrease) {
    return {
      ...base,
      previousWeightKilograms,
      reason: "Keep this load and record at least two reps in reserve before increasing it.",
      status: "hold",
      suggestedWeightKilograms: currentWeightKilograms,
    };
  }

  if (
    previousWeightGrams === null ||
    latestWeightGrams < previousWeightGrams
  ) {
    return {
      ...base,
      previousWeightKilograms,
      reason: "Repeat the current load once more to confirm consistent performance.",
      status: "hold",
      suggestedWeightKilograms: currentWeightKilograms,
    };
  }

  const suggestedWeightKilograms = nextConservativeWeight(
    currentWeightKilograms,
  );

  return {
    ...base,
    previousWeightKilograms,
    reason: "Targets were met in two completed workouts with at least two reps in reserve.",
    status: "increase",
    suggestedWeightKilograms,
  };
}

export function buildProgressionRecommendations(
  sessions: readonly TrainingHistorySourceSession[],
): readonly ProgressionRecommendation[] {
  const completedSessions = sessions
    .filter((session) => session.status === "completed")
    .sort((left, right) => right.endedAt.localeCompare(left.endedAt));
  const exposuresByExercise = new Map<string, ExerciseExposure[]>();

  for (const session of completedSessions) {
    for (const exercise of session.exercises) {
      const exposures = exposuresByExercise.get(exercise.exerciseKey) ?? [];
      exposures.push({ completedAt: session.endedAt, exercise });
      exposuresByExercise.set(exercise.exerciseKey, exposures);
    }
  }

  return [...exposuresByExercise.values()]
    .map(recommendationForExercise)
    .filter(
      (recommendation): recommendation is ProgressionRecommendation =>
        recommendation !== null,
    )
    .sort((left, right) =>
      right.latestCompletedAt.localeCompare(left.latestCompletedAt),
    )
    .slice(0, 6);
}
