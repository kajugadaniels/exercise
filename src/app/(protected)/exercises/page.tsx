import { Suspense } from "react";
import Link from "next/link";
import { ExerciseCard } from "@/features/exercises/components/ExerciseCard/ExerciseCard";
import { ExerciseFilterSheet } from "@/features/exercises/components/ExerciseFilterSheet/ExerciseFilterSheet";
import { ExercisePagination } from "@/features/exercises/components/ExercisePagination/ExercisePagination";
import { ExerciseSearch } from "@/features/exercises/components/ExerciseSearch/ExerciseSearch";
import type { ExerciseQuery } from "@/features/exercises/domain/exercise";
import {
  buildExerciseLibraryUrl,
  parseExerciseQuery,
  type ExerciseSearchParams,
} from "@/features/exercises/providers/exercise-gym-gifs/filters";
import { getExerciseCatalogPage } from "@/features/exercises/server/exercise-catalog";
import styles from "./page.module.css";

type ExercisesPageProps = Readonly<{
  searchParams: Promise<ExerciseSearchParams>;
}>;

async function loadExerciseCatalogPage(query: ExerciseQuery) {
  try {
    return await getExerciseCatalogPage(query);
  } catch {
    return null;
  }
}

function CatalogFallback() {
  return (
    <section className={styles.catalog} aria-label="Loading exercises">
      <div className={styles.controlBar} aria-hidden="true">
        <div className={styles.searchPlaceholder} />
        <div className={styles.filterTriggerPlaceholder} />
      </div>
      <div className={styles.results}>
        <div className={styles.toolbarPlaceholder} />
        <div className={styles.exerciseGrid} aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <div className={styles.cardPlaceholder} key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

async function ExerciseCatalog({
  searchParams,
}: Pick<ExercisesPageProps, "searchParams">) {
  const query = parseExerciseQuery(await searchParams);
  const result = await loadExerciseCatalogPage(query);

  if (!result) {
    return (
      <section className={styles.errorState} role="alert">
        <h2>Exercises are temporarily unavailable</h2>
        <p>The provider could not be reached. Try loading the catalog again.</p>
        <Link className={styles.stateAction} href="/exercises">
          Try again
        </Link>
      </section>
    );
  }

  const firstResult =
    result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const lastResult = Math.min(result.page * result.pageSize, result.total);

  return (
    <section className={styles.catalog} aria-labelledby="catalog-title">
      <h2 className={styles.visuallyHidden} id="catalog-title">
        Exercise catalog
      </h2>

      <div className={styles.controlBar}>
        <ExerciseSearch
          clearSearchHref={buildExerciseLibraryUrl(query, 1, { search: null })}
          key={query.search ?? "closed"}
          query={query}
        />
        <ExerciseFilterSheet
          key={[
            query.bodyPart,
            query.category,
            query.muscle,
            query.equipment,
          ].join(":")}
          query={query}
        />
      </div>

      <div className={styles.results}>
        <div className={styles.toolbar}>
          <p className={styles.resultCount} aria-live="polite">
            {result.total === 0
              ? "No exercises found"
              : `Showing ${firstResult}–${lastResult} of ${result.total}`}
          </p>
          <p className={styles.pageStatus}>
            Page {result.page} of {result.pageCount}
          </p>
        </div>

        {result.items.length > 0 ? (
          <>
            <ul className={styles.exerciseGrid}>
              {result.items.map((exercise) => (
                <li key={exercise.id}>
                  <ExerciseCard exercise={exercise} />
                </li>
              ))}
            </ul>
            <ExercisePagination
              page={result.page}
              pageCount={result.pageCount}
              query={query}
            />
          </>
        ) : (
          <div className={styles.emptyState}>
            <h3>No matching exercises</h3>
            <p>Try a shorter name or choose another filter.</p>
            <Link className={styles.stateAction} href="/exercises">
              View all exercises
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default function ExercisesPage({ searchParams }: ExercisesPageProps) {
  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <div className={styles.headingGroup}>
          <h1 className={styles.pageTitle}>Exercise library</h1>
          <p className={styles.summary}>
            Find a movement by name, then open it for verified instructions and
            training details.
          </p>
        </div>
        <p className={styles.dataNote}>
          Animated previews are loaded from the source catalog when available.
        </p>
      </header>

      <Suspense fallback={<CatalogFallback />}>
        <ExerciseCatalog searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
