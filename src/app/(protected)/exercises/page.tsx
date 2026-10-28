import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import {
  ArrowLeft01Icon,
  RefreshIcon,
  SearchRemoveIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/Icon/Icon";
import { ExerciseCard } from "@/features/exercises/components/ExerciseCard/ExerciseCard";
import { ExerciseFilterSheet } from "@/features/exercises/components/ExerciseFilterSheet/ExerciseFilterSheet";
import { ExercisePagination } from "@/features/exercises/components/ExercisePagination/ExercisePagination";
import { ExerciseSearch } from "@/features/exercises/components/ExerciseSearch/ExerciseSearch";
import type { ExerciseQuery } from "@/features/exercises/domain/exercise";
import {
  buildExerciseLibraryUrl,
  parseExerciseQuery,
  parseExerciseSelectionContext,
  type ExerciseSearchParams,
} from "@/features/exercises/providers/exercise-gym-gifs/filters";
import { getExerciseCatalogPage } from "@/features/exercises/server/exercise-catalog";
import { getTrainingWeekForClerkUser } from "@/features/training/server/training-week-service";
import type { TrainingWeekPlan } from "@/features/training/domain/training";
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
  const resolvedSearchParams = await searchParams;
  const query = parseExerciseQuery(resolvedSearchParams);
  const selectionContext = parseExerciseSelectionContext(resolvedSearchParams);
  const result = await loadExerciseCatalogPage(query);

  if (!result) {
    return (
      <section className={styles.errorState} role="alert">
        <h2>Exercises are temporarily unavailable</h2>
        <p>The provider could not be reached. Try loading the catalog again.</p>
        <Link
          className={styles.stateAction}
          href={buildExerciseLibraryUrl(
            { page: 1 },
            1,
            undefined,
            selectionContext ?? undefined,
          )}
        >
          Try again
        </Link>
      </section>
    );
  }

  const firstResult =
    result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const lastResult = Math.min(result.page * result.pageSize, result.total);
  let selectionPlan: TrainingWeekPlan | null = null;
  if (selectionContext) {
    const { userId } = await auth.protect();
    selectionPlan = await getTrainingWeekForClerkUser(
      userId,
      selectionContext.weekStart,
    );
  }
  const selectionDay = selectionPlan?.days.find(
    (day) => day.plannedDate === selectionContext?.plannedDate,
  );

  if (selectionContext && selectionPlan?.isLocked) {
    return (
      <section className={styles.errorState} role="alert">
        <h2>This training week can no longer be edited</h2>
        <p>
          Started, completed, or skipped workouts protect the week from plan
          changes.
        </p>
        <Link
          className={styles.stateAction}
          href={`/training?week=${encodeURIComponent(selectionContext.weekStart)}`}
        >
          Return to training
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.catalog} aria-labelledby="catalog-title">
      <h2 className={styles.visuallyHidden} id="catalog-title">
        Exercise catalog
      </h2>

      {selectionContext ? (
        <div className={styles.selectionBanner}>
          <Link
            className={styles.selectionBack}
            href={`/training?week=${encodeURIComponent(selectionContext.weekStart)}`}
          >
            <Icon icon={ArrowLeft01Icon} size={18} />
            Weekly plan
          </Link>
          <div>
            <p>Add an exercise</p>
            <h3>Choose from the full library</h3>
            <span>
              Search or filter the catalog, then select a movement to configure
              its sets.
            </span>
          </div>
        </div>
      ) : null}

      <div className={styles.controlBar}>
        <ExerciseSearch
          clearSearchHref={buildExerciseLibraryUrl(
            query,
            1,
            { search: null },
            selectionContext ?? undefined,
          )}
          key={query.search ?? "closed"}
          query={query}
          selectionContext={selectionContext ?? undefined}
        />
        <ExerciseFilterSheet
          key={[
            query.bodyPart,
            query.category,
            query.muscle,
            query.equipment,
          ].join(":")}
          query={query}
          selectionContext={selectionContext ?? undefined}
        />
      </div>

      <div className={styles.results}>
        {result.total > 0 ? (
          <div className={styles.toolbar}>
            <p className={styles.resultCount} aria-live="polite">
              Showing {firstResult}–{lastResult} of {result.total}
            </p>
            <p className={styles.pageStatus}>
              Page {result.page} of {result.pageCount}
            </p>
          </div>
        ) : null}

        {result.items.length > 0 ? (
          <>
            <ul className={styles.exerciseGrid}>
              {result.items.map((exercise) => {
                const plannedExercise = selectionDay?.exercises.find(
                  (item) => item.exercise.sourceId === exercise.id,
                );
                const selectionSearch = new URLSearchParams({
                  exercise: exercise.id,
                  planMinutes: String(
                    selectionContext?.availableMinutes ?? 60,
                  ),
                });
                if (selectionContext?.preferredBodyPart) {
                  selectionSearch.set(
                    "planFocus",
                    selectionContext.preferredBodyPart,
                  );
                }
                const href =
                  selectionContext && plannedExercise
                    ? `/training/${selectionContext.weekStart}/${selectionContext.plannedDate}/exercises/${plannedExercise.position}/edit`
                    : selectionContext
                      ? `/training/${selectionContext.weekStart}/${selectionContext.plannedDate}/exercises/new?${selectionSearch}`
                      : undefined;

                return (
                  <li key={exercise.id}>
                    <ExerciseCard
                      action={
                        selectionContext
                          ? plannedExercise
                            ? "edit"
                            : "add"
                          : "open"
                      }
                      exercise={exercise}
                      href={href}
                    />
                  </li>
                );
              })}
            </ul>
            <ExercisePagination
              page={result.page}
              pageCount={result.pageCount}
              query={query}
              selectionContext={selectionContext ?? undefined}
            />
          </>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden="true">
              <Icon icon={SearchRemoveIcon} size={64} />
            </div>
            <div className={styles.emptyCopy} role="status">
              <h3>No matching exercises</h3>
              <p>
                No exercise matches your current search and filters. Reset them
                to explore the full library.
              </p>
            </div>
            <Link
              className={styles.stateAction}
              href={buildExerciseLibraryUrl(
                { page: 1 },
                1,
                undefined,
                selectionContext ?? undefined,
              )}
            >
              <Icon icon={RefreshIcon} size={18} />
              <span>Reset filters</span>
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
