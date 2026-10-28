import type { WorkoutExecutionView } from "./workout-session-schema";

export type WorkoutSetPointer = Readonly<{
  exercisePosition: number;
  setNumber: number;
}>;

export type WorkoutProgress = Readonly<{
  completedSets: number;
  percentage: number;
  totalSets: number;
}>;

export function getWorkoutProgress(
  workout: WorkoutExecutionView,
): WorkoutProgress {
  const sets = workout.exercises.flatMap((exercise) => exercise.sets);
  const completedSets = sets.filter((set) => set.actual !== null).length;
  const totalSets = sets.length;

  return {
    completedSets,
    totalSets,
    percentage:
      totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100),
  };
}

export function getNextIncompleteSet(
  workout: WorkoutExecutionView,
): WorkoutSetPointer | null {
  for (const exercise of workout.exercises) {
    const set = exercise.sets.find((candidate) => candidate.actual === null);

    if (set) {
      return {
        exercisePosition: exercise.position,
        setNumber: set.setNumber,
      };
    }
  }

  return null;
}
