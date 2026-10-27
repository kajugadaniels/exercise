import { Suspense } from "react";
import Link from "next/link";
import { Search02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { ExerciseCard } from "@/features/exercises/components/ExerciseCard/ExerciseCard";
import { ExerciseFilterSidebar } from "@/features/exercises/components/ExerciseFilterSidebar/ExerciseFilterSidebar";
import { ExercisePagination } from "@/features/exercises/components/ExercisePagination/ExercisePagination";
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
      <div className={styles.searchPlaceholder} />
      <div className={styles.libraryLayout}>
        <div className={styles.filterPlaceholder} />
        <div className={styles.results}>
          <div className={styles.toolbarPlaceholder} />
          <div className={styles.exerciseGrid} aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => (
              <div className={styles.cardPlaceholder} key={index} />
            ))}
          </div>
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

      <form className={styles.searchForm} action="/exercises">
        <label className={styles.visuallyHidden} htmlFor="exercise-search">
          Search exercises by name
        </label>
        <span className={styles.searchControl}>
          <span className={styles.searchIcon} aria-hidden="true">
            <Icon icon={Search02Icon} size={20} />
          </span>
          <input
            className={styles.searchInput}
            defaultValue={query.search ?? ""}
            id="exercise-search"
            maxLength={80}
            name="search"
            placeholder="Search by exercise name"
            type="search"
          />
        </span>
        {query.category ? (
          <input name="category" type="hidden" value={query.category} />
        ) : null}
        {query.bodyPart ? (
          <input name="bodyPart" type="hidden" value={query.bodyPart} />
        ) : null}
        <Button size="compact" type="submit">
          Search
        </Button>
        {query.search ? (
          <Link
            className={styles.clearSearch}
            href={buildExerciseLibraryUrl(query, 1, { search: null })}
          >
            Clear
          </Link>
        ) : null}
      </form>

      <div className={styles.libraryLayout}>
        <ExerciseFilterSidebar query={query} />

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
