import type { BodyPartId } from "@/features/exercises/domain/exercise";
import {
  getTrainingWeekDates,
  type TrainingWeekPlan,
} from "./domain/training";
import type { TrainingWeekInput } from "./training-week-schema";

export type TrainingSetEditorValue = {
  repetitions: string;
  restSeconds: string;
  weightKilograms: string;
};

export type TrainingExerciseEditorValue = {
  exerciseId: string;
  name: string;
  sets: TrainingSetEditorValue[];
};

export type TrainingDayEditorValue = {
  availableMinutes: string;
  exercises: TrainingExerciseEditorValue[];
  kind: "rest" | "workout";
  plannedDate: string;
  preferredBodyPart: BodyPartId | null;
};

export type TrainingWeekEditorValue = {
  days: TrainingDayEditorValue[];
  weekStart: string;
};

export type ExercisePickerValue = {
  id: string;
  name: string;
};

export function createDefaultSet(): TrainingSetEditorValue {
  return {
    repetitions: "10",
    weightKilograms: "",
    restSeconds: "60",
  };
}

export function createEmptyTrainingWeek(
  weekStart: string,
): TrainingWeekEditorValue {
  return {
    weekStart,
    days: getTrainingWeekDates(weekStart).map((plannedDate) => ({
      plannedDate,
      kind: "rest",
      availableMinutes: "60",
      preferredBodyPart: null,
      exercises: [],
    })),
  };
}

export function createTrainingWeekEditor(
  weekStart: string,
  plan: TrainingWeekPlan | null,
): TrainingWeekEditorValue {
  if (!plan) {
    return createEmptyTrainingWeek(weekStart);
  }

  return {
    weekStart,
    days: plan.days.map((day) => ({
      plannedDate: day.plannedDate,
      kind: day.kind,
      availableMinutes:
        day.availableMinutes === null ? "60" : String(day.availableMinutes),
      preferredBodyPart: day.preferredBodyPart,
      exercises: day.exercises.map((exercise) => ({
        exerciseId: exercise.exercise.sourceId,
        name: exercise.exercise.name,
        sets: exercise.sets.map((set) => ({
          repetitions: String(set.targetRepetitions),
          weightKilograms:
            set.targetWeightGrams === null
              ? ""
              : String(set.targetWeightGrams / 1_000),
          restSeconds:
            set.restSeconds === null ? "" : String(set.restSeconds),
        })),
      })),
    })),
  };
}

export function toTrainingWeekInput(
  editor: TrainingWeekEditorValue,
): TrainingWeekInput {
  const days: TrainingWeekInput["days"] = editor.days.map((day) => {
    if (day.kind === "rest") {
      return { kind: "rest", plannedDate: day.plannedDate };
    }

    return {
      kind: "workout",
      plannedDate: day.plannedDate,
      availableMinutes: Number(day.availableMinutes),
      preferredBodyPart: day.preferredBodyPart,
      exercises: day.exercises.map((exercise) => ({
        exerciseId: exercise.exerciseId,
        sets: exercise.sets.map((set) => ({
          targetRepetitions: Number(set.repetitions),
          targetWeightKilograms:
            set.weightKilograms.trim() === ""
              ? null
              : Number(set.weightKilograms),
          restSeconds:
            set.restSeconds.trim() === "" ? null : Number(set.restSeconds),
        })),
      })),
    };
  });

  return { days };
}

export function getAdjacentWeekStart(
  weekStart: string,
  direction: "next" | "previous",
): string {
  const timestamp = Date.parse(`${weekStart}T00:00:00.000Z`);
  const offset = direction === "next" ? 7 : -7;

  return new Date(timestamp + offset * 86_400_000)
    .toISOString()
    .slice(0, 10);
}
