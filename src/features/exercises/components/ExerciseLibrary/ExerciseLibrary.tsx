import Link from "next/link";
import type {
  ExerciseFacets,
  ExercisePage,
  ExerciseQuery,
} from "../../domain/exercise";
import { buildExerciseLibraryUrl } from "../../providers/exercise-gym-gifs/filters";
import { ExerciseCard } from "../ExerciseCard/ExerciseCard";
import { ExerciseFilters } from "../ExerciseFilters/ExerciseFilters";
import styles from "./ExerciseLibrary.module.css";

type ExerciseLibraryProps = {
  page: ExercisePage;
  facets: ExerciseFacets;
  query: ExerciseQuery;
};

export function ExerciseLibrary({
  page,
  facets,
  query,
}: ExerciseLibraryProps) {
  const resultLabel = `${page.total.toLocaleString("en")} ${
    page.total === 1 ? "exercise" : "exercises"
  }`;

  return (
    <>
      <ExerciseFilters facets={facets} query={query} />

      <section className={styles.results} aria-labelledby="exercise-results-title">
        <div className={styles.resultsHeading}>
          <h2 id="exercise-results-title">Exercise library</h2>
          <p aria-live="polite">{resultLabel}</p>
        </div>

        {page.exercises.length > 0 ? (
          <div className={styles.grid}>
            {page.exercises.map((exercise) => (
              <ExerciseCard exercise={exercise} key={exercise.id} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <h3>No exercises match these filters</h3>
            <p>
              Clear a filter or use a shorter exercise name to broaden the
              results.
            </p>
            <Link href="/exercises">Clear all filters</Link>
          </div>
        )}

        {page.pageCount > 1 && (
          <nav className={styles.pagination} aria-label="Exercise pages">
            {page.page > 1 ? (
              <Link href={buildExerciseLibraryUrl(query, page.page - 1)}>
                Previous
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
            <p>
              Page {page.page} of {page.pageCount}
            </p>
            {page.page < page.pageCount ? (
              <Link href={buildExerciseLibraryUrl(query, page.page + 1)}>
                Next
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
          </nav>
        )}
      </section>
    </>
  );
}
