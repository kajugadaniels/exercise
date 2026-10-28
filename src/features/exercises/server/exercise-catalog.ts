import "server-only";
import type { ExerciseQuery, ExerciseSummaryPage } from "../domain/exercise";
import { toExerciseSummary } from "../catalog/exercise-summary";
import { exerciseGymGifsAdapter } from "../providers/exercise-gym-gifs/adapter";

export async function getExerciseCatalogPage(
  query: ExerciseQuery,
): Promise<ExerciseSummaryPage> {
  const result = await exerciseGymGifsAdapter.list(query);

  return {
    items: result.exercises.map(toExerciseSummary),
    page: result.page,
    pageCount: result.pageCount,
    pageSize: result.pageSize,
    total: result.total,
  };
}
