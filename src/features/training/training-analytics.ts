import { getTrainingWeekStartForDate } from "./domain/training";
import type { TrainingHistorySourceSession } from "./training-history";
import {
  trainingAnalyticsViewSchema,
  type TrainingAnalyticsView,
} from "./training-analytics-schema";

export type ScheduledAnalyticsWorkout = Readonly<{
  plannedDate: string;
}>;

function shiftCalendarDate(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function roundKilograms(value: number): number {
  return Math.round(value * 10) / 10;
}

function sessionMetrics(session: TrainingHistorySourceSession) {
  let totalRepetitions = 0;
  let totalSets = 0;
  let volumeGrams = 0;

  for (const exercise of session.exercises) {
    for (const set of exercise.sets) {
      totalSets += 1;
      totalRepetitions += set.repetitions;
      volumeGrams += set.repetitions * (set.weightGrams ?? 0);
    }
  }

  return {
    activeMinutes: Math.max(
      0,
      Math.round(
        (new Date(session.endedAt).getTime() -
          new Date(session.startedAt).getTime()) /
          60_000,
      ),
    ),
    totalRepetitions,
    totalSets,
    volumeKilograms: roundKilograms(volumeGrams / 1_000),
  };
}

function maxWeightKilograms(
  exercise: TrainingHistorySourceSession["exercises"][number],
): number | null {
  const weights = exercise.sets.flatMap((set) =>
    set.weightGrams === null ? [] : [set.weightGrams / 1_000],
  );
  return weights.length > 0 ? Math.max(...weights) : null;
}

export function getTrainingAnalyticsStartDate(
  endDate: string,
  weeks: 4 | 8 | 12,
): string {
  const currentWeekStart = getTrainingWeekStartForDate(endDate);
  if (!currentWeekStart) {
    throw new Error("The analytics date range is invalid.");
  }
  return shiftCalendarDate(currentWeekStart, -(weeks - 1) * 7);
}

export function buildTrainingAnalytics(
  endDate: string,
  weeks: 4 | 8 | 12,
  scheduledWorkouts: readonly ScheduledAnalyticsWorkout[],
  sessions: readonly TrainingHistorySourceSession[],
): TrainingAnalyticsView {
  const startDate = getTrainingAnalyticsStartDate(endDate, weeks);
  const completedSessions = sessions
    .filter(
      (session) =>
        session.status === "completed" &&
        session.plannedDate >= startDate &&
        session.plannedDate <= endDate,
    )
    .sort((left, right) => left.plannedDate.localeCompare(right.plannedDate));
  const weekStarts = Array.from({ length: weeks }, (_, index) =>
    shiftCalendarDate(startDate, index * 7),
  );
  const muscleSets = new Map<string, number>();
  const exerciseExposures = new Map<
    string,
    Array<{
      exercise: TrainingHistorySourceSession["exercises"][number];
      plannedDate: string;
    }>
  >();

  for (const session of completedSessions) {
    for (const exercise of session.exercises) {
      muscleSets.set(
        exercise.primaryMuscle,
        (muscleSets.get(exercise.primaryMuscle) ?? 0) + exercise.sets.length,
      );
      const exposures = exerciseExposures.get(exercise.exerciseKey) ?? [];
      exposures.push({ exercise, plannedDate: session.plannedDate });
      exerciseExposures.set(exercise.exerciseKey, exposures);
    }
  }

  const weeklySignals = weekStarts.map((weekStart) => {
    const weekEnd = shiftCalendarDate(weekStart, 6);
    const weekSessions = completedSessions.filter(
      (session) =>
        session.plannedDate >= weekStart && session.plannedDate <= weekEnd,
    );
    const metrics = weekSessions.map(sessionMetrics);

    return {
      activeMinutes: metrics.reduce(
        (total, item) => total + item.activeMinutes,
        0,
      ),
      completedWorkouts: weekSessions.length,
      scheduledWorkouts: scheduledWorkouts.filter(
        (workout) =>
          workout.plannedDate >= weekStart && workout.plannedDate <= weekEnd,
      ).length,
      totalRepetitions: metrics.reduce(
        (total, item) => total + item.totalRepetitions,
        0,
      ),
      totalSets: metrics.reduce((total, item) => total + item.totalSets, 0),
      volumeKilograms: roundKilograms(
        metrics.reduce((total, item) => total + item.volumeKilograms, 0),
      ),
      weekStart,
    };
  });
  const summary = weeklySignals.reduce(
    (total, week) => ({
      activeMinutes: total.activeMinutes + week.activeMinutes,
      completedWorkouts: total.completedWorkouts + week.completedWorkouts,
      scheduledWorkouts: total.scheduledWorkouts + week.scheduledWorkouts,
      totalRepetitions: total.totalRepetitions + week.totalRepetitions,
      totalSets: total.totalSets + week.totalSets,
      volumeKilograms: roundKilograms(
        total.volumeKilograms + week.volumeKilograms,
      ),
    }),
    {
      activeMinutes: 0,
      completedWorkouts: 0,
      scheduledWorkouts: 0,
      totalRepetitions: 0,
      totalSets: 0,
      volumeKilograms: 0,
    },
  );
  const totalMuscleSets = [...muscleSets.values()].reduce(
    (total, count) => total + count,
    0,
  );

  return trainingAnalyticsViewSchema.parse({
    exerciseProgress: [...exerciseExposures.entries()]
      .map(([exerciseId, exposures]) => {
        const first = exposures[0];
        const latest = exposures.at(-1);
        if (!first || !latest) {
          throw new Error("Exercise analytics are incomplete.");
        }
        const startingMaxWeightKilograms = maxWeightKilograms(first.exercise);
        const currentMaxWeightKilograms = maxWeightKilograms(latest.exercise);
        const allWeights = exposures.flatMap(({ exercise }) =>
          exercise.sets.flatMap((set) =>
            set.weightGrams === null ? [] : [set.weightGrams / 1_000],
          ),
        );

        return {
          appearances: exposures.length,
          bestWeightKilograms:
            allWeights.length > 0 ? Math.max(...allWeights) : null,
          currentBestRepetitions: Math.max(
            ...latest.exercise.sets.map((set) => set.repetitions),
          ),
          currentMaxWeightKilograms,
          exerciseId,
          exerciseName: latest.exercise.name,
          firstCompletedDate: first.plannedDate,
          latestCompletedDate: latest.plannedDate,
          primaryMuscle: latest.exercise.primaryMuscle,
          startingBestRepetitions: Math.max(
            ...first.exercise.sets.map((set) => set.repetitions),
          ),
          startingMaxWeightKilograms,
          totalSets: exposures.reduce(
            (total, exposure) => total + exposure.exercise.sets.length,
            0,
          ),
          weightChangeKilograms:
            startingMaxWeightKilograms === null ||
            currentMaxWeightKilograms === null
              ? null
              : roundKilograms(
                  currentMaxWeightKilograms - startingMaxWeightKilograms,
                ),
        };
      })
      .sort(
        (left, right) =>
          right.appearances - left.appearances ||
          right.latestCompletedDate.localeCompare(left.latestCompletedDate),
      )
      .slice(0, 8),
    muscleDistribution: [...muscleSets.entries()]
      .sort(
        ([leftMuscle, leftCount], [rightMuscle, rightCount]) =>
          rightCount - leftCount || leftMuscle.localeCompare(rightMuscle),
      )
      .map(([muscle, setCount]) => ({
        muscle,
        percentage:
          totalMuscleSets === 0
            ? 0
            : Math.round((setCount / totalMuscleSets) * 100),
        setCount,
      })),
    range: { endDate, startDate, weeks },
    summary: {
      ...summary,
      completionRate:
        summary.scheduledWorkouts === 0
          ? 0
          : Math.round(
              (summary.completedWorkouts / summary.scheduledWorkouts) * 100,
            ),
    },
    weeklySignals,
  });
}
