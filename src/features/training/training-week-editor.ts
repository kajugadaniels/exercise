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

export type TrainingExerciseOption = {
  id: string;
  name: string;
};

export type TrainingExerciseChange = Readonly<{
  availableMinutes?: number;
  exercise: TrainingExerciseOption;
  exerciseIndex?: number;
  plannedDate: string;
  preferredBodyPart?: BodyPartId;
  sets: TrainingSetEditorValue[];
}>;

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

  const storedDayByDate = new Map(
    plan.days.map((day) => [day.plannedDate, day]),
  );

  return {
    weekStart,
    days: getTrainingWeekDates(weekStart).map((plannedDate) => {
      const day = storedDayByDate.get(plannedDate);
      if (!day) {
        return {
          plannedDate,
          kind: "rest" as const,
          availableMinutes: "60",
          preferredBodyPart: null,
          exercises: [],
        };
      }

      return {
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
      };
    }),
  };
}

export function applyTrainingExerciseChange(
  editor: TrainingWeekEditorValue,
  change: TrainingExerciseChange,
): TrainingWeekEditorValue {
  return {
    ...editor,
    days: editor.days.map((day) => {
      if (day.plannedDate !== change.plannedDate) {
        return day;
      }

      const nextExercise: TrainingExerciseEditorValue = {
        exerciseId: change.exercise.id,
        name: change.exercise.name,
        sets: change.sets,
      };
      const exercises = [...day.exercises];

      if (change.exerciseIndex === undefined) {
        exercises.push(nextExercise);
      } else if (exercises[change.exerciseIndex]) {
        exercises[change.exerciseIndex] = nextExercise;
      }

      return {
        ...day,
        kind: "workout",
        availableMinutes: String(
          change.availableMinutes ?? (Number(day.availableMinutes) || 60),
        ),
        preferredBodyPart:
          change.preferredBodyPart ?? day.preferredBodyPart ?? null,
        exercises,
      };
    }),
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
