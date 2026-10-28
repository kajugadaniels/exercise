import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { buildExerciseLibraryUrl } from "@/features/exercises/providers/exercise-gym-gifs/filters";
import { ExerciseForm } from "@/features/training/components/ExerciseForm/ExerciseForm";
import { isDateInTrainingWeek } from "@/features/training/domain/training";
import { getTrainingWeekForClerkUser } from "@/features/training/server/training-week-service";
import { createTrainingWeekEditor } from "@/features/training/training-week-editor";
import {
  MAX_EXERCISES_PER_DAY,
  trainingCalendarDateSchema,
  trainingWeekStartSchema,
} from "@/features/training/training-week-schema";

type EditTrainingExercisePageProps = Readonly<{
  params: Promise<{
    plannedDate: string;
    position: string;
    weekStart: string;
  }>;
}>;

export default async function EditTrainingExercisePage({
  params,
}: EditTrainingExercisePageProps) {
  const routeParams = await params;
  const parsedWeekStart = trainingWeekStartSchema.safeParse(
    routeParams.weekStart,
  );
  const parsedDate = trainingCalendarDateSchema.safeParse(
    routeParams.plannedDate,
  );
  const position = Number(routeParams.position);

  if (
    !parsedWeekStart.success ||
    !parsedDate.success ||
    !isDateInTrainingWeek(parsedDate.data, parsedWeekStart.data) ||
    !Number.isInteger(position) ||
    position < 1 ||
    position > MAX_EXERCISES_PER_DAY
  ) {
    notFound();
  }

  const { userId } = await auth.protect();
  const plan = await getTrainingWeekForClerkUser(
    userId,
    parsedWeekStart.data,
  );

  if (!plan) {
    notFound();
  }

  if (plan.isLocked) {
    redirect(`/training?week=${encodeURIComponent(parsedWeekStart.data)}`);
  }

  const plannedDay = plan.days.find(
    (day) => day.plannedDate === parsedDate.data,
  );
  const plannedExercise = plannedDay?.exercises.find(
    (exercise) => exercise.position === position,
  );

  if (!plannedDay || plannedDay.kind !== "workout" || !plannedExercise) {
    notFound();
  }

  const editor = createTrainingWeekEditor(parsedWeekStart.data, plan);
  const editorDay = editor.days.find(
    (day) => day.plannedDate === parsedDate.data,
  );
  const exerciseIndex = editorDay?.exercises.findIndex(
    (exercise) =>
      exercise.exerciseId === plannedExercise.exercise.sourceId,
  );

  if (exerciseIndex === undefined || exerciseIndex < 0) {
    notFound();
  }

  const selectionHref = buildExerciseLibraryUrl(
    { page: 1 },
    1,
    undefined,
    {
      availableMinutes: plannedDay.availableMinutes ?? 60,
      plannedDate: parsedDate.data,
      ...(plannedDay.preferredBodyPart
        ? { preferredBodyPart: plannedDay.preferredBodyPart }
        : {}),
      weekStart: parsedWeekStart.data,
    },
  );

  return (
    <main id="main-content">
      <ExerciseForm
        exercise={{
          id: plannedExercise.exercise.sourceId,
          name: plannedExercise.exercise.name,
        }}
        exerciseIndex={exerciseIndex}
        initialEditor={editor}
        mode="edit"
        plannedDate={parsedDate.data}
        selectionHref={selectionHref}
        weekStart={parsedWeekStart.data}
      />
    </main>
  );
}
