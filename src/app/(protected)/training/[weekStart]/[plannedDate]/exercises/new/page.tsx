import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { ExerciseProviderError } from "@/features/exercises/providers/exercise-provider";
import {
  buildExerciseLibraryUrl,
  parseExerciseSelectionContext,
} from "@/features/exercises/providers/exercise-gym-gifs/filters";
import { getExerciseCatalogItem } from "@/features/exercises/server/exercise-catalog";
import { ExerciseForm } from "@/features/training/components/ExerciseForm/ExerciseForm";
import { isDateInTrainingWeek } from "@/features/training/domain/training";
import { getTrainingWeekForClerkUser } from "@/features/training/server/training-week-service";
import { createTrainingWeekEditor } from "@/features/training/training-week-editor";
import {
  trainingCalendarDateSchema,
  trainingWeekStartSchema,
} from "@/features/training/training-week-schema";

type NewTrainingExercisePageProps = Readonly<{
  params: Promise<{ plannedDate: string; weekStart: string }>;
  searchParams: Promise<{
    exercise?: string | string[];
    planFocus?: string | string[];
    planMinutes?: string | string[];
  }>;
}>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewTrainingExercisePage({
  params,
  searchParams,
}: NewTrainingExercisePageProps) {
  const routeParams = await params;
  const parsedWeekStart = trainingWeekStartSchema.safeParse(
    routeParams.weekStart,
  );
  const parsedDate = trainingCalendarDateSchema.safeParse(
    routeParams.plannedDate,
  );

  if (
    !parsedWeekStart.success ||
    !parsedDate.success ||
    !isDateInTrainingWeek(parsedDate.data, parsedWeekStart.data)
  ) {
    notFound();
  }

  const query = await searchParams;
  const selectionContext = parseExerciseSelectionContext({
    planWeek: parsedWeekStart.data,
    planDate: parsedDate.data,
    planMinutes: query.planMinutes,
    planFocus: query.planFocus,
  }) ?? {
    availableMinutes: 60,
    plannedDate: parsedDate.data,
    weekStart: parsedWeekStart.data,
  };
  const selectionHref = buildExerciseLibraryUrl(
    { page: 1 },
    1,
    undefined,
    selectionContext,
  );
  const exerciseId = firstValue(query.exercise);

  if (!exerciseId) {
    redirect(selectionHref);
  }

  const { userId } = await auth.protect();
  const plan = await getTrainingWeekForClerkUser(
    userId,
    parsedWeekStart.data,
  );

  if (plan?.isLocked) {
    redirect(`/training?week=${encodeURIComponent(parsedWeekStart.data)}`);
  }

  const plannedDay = plan?.days.find(
    (day) => day.plannedDate === parsedDate.data,
  );
  const duplicateExercise = plannedDay?.exercises.find(
    (plannedExercise) => plannedExercise.exercise.sourceId === exerciseId,
  );

  if (duplicateExercise) {
    redirect(
      `/training/${parsedWeekStart.data}/${parsedDate.data}/exercises/${duplicateExercise.position}/edit`,
    );
  }

  let exercise: Awaited<ReturnType<typeof getExerciseCatalogItem>>;
  try {
    exercise = await getExerciseCatalogItem(exerciseId);
  } catch (error) {
    if (error instanceof ExerciseProviderError) {
      throw new Error("The selected exercise is temporarily unavailable.");
    }
    throw error;
  }

  if (!exercise) {
    notFound();
  }

  return (
    <main id="main-content">
      <ExerciseForm
        availableMinutes={selectionContext.availableMinutes}
        exercise={{ id: exercise.id, name: exercise.name }}
        initialEditor={createTrainingWeekEditor(parsedWeekStart.data, plan)}
        mode="add"
        plannedDate={parsedDate.data}
        preferredBodyPart={selectionContext.preferredBodyPart}
        selectionHref={selectionHref}
        weekStart={parsedWeekStart.data}
      />
    </main>
  );
}
