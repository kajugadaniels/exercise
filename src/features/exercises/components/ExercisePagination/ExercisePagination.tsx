import Link from "next/link";
import type { ExerciseQuery } from "../../domain/exercise";
import {
  buildExerciseLibraryUrl,
  type ExerciseSelectionContext,
} from "../../providers/exercise-gym-gifs/filters";
import styles from "./ExercisePagination.module.css";

type ExercisePaginationProps = Readonly<{
  page: number;
  pageCount: number;
  query: ExerciseQuery;
  selectionContext?: ExerciseSelectionContext;
}>;

type PageItem = number | "end-gap" | "start-gap";

function getPageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const visiblePages = Array.from(pages)
    .filter((item) => item >= 1 && item <= pageCount)
    .sort((left, right) => left - right);
  const items: PageItem[] = [];

  visiblePages.forEach((item, index) => {
    const previous = visiblePages[index - 1];
    if (previous && item - previous > 1) {
      items.push(previous === 1 ? "start-gap" : "end-gap");
    }
    items.push(item);
  });

  return items;
}

export function ExercisePagination({
  page,
  pageCount,
  query,
  selectionContext,
}: ExercisePaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <nav className={styles.pagination} aria-label="Exercise pages">
      {page > 1 ? (
        <Link
          className={styles.direction}
          href={buildExerciseLibraryUrl(
            query,
            page - 1,
            undefined,
            selectionContext,
          )}
          prefetch={false}
          rel="prev"
        >
          Previous
        </Link>
      ) : (
        <span className={styles.disabled}>Previous</span>
      )}

      <span className={styles.pages}>
        {getPageItems(page, pageCount).map((item) =>
          typeof item === "number" ? (
            <Link
              aria-current={item === page ? "page" : undefined}
              className={styles.page}
              href={buildExerciseLibraryUrl(
                query,
                item,
                undefined,
                selectionContext,
              )}
              key={item}
              prefetch={false}
            >
              <span className={styles.visuallyHidden}>Page </span>
              {item}
            </Link>
          ) : (
            <span aria-hidden="true" className={styles.gap} key={item}>
              …
            </span>
          ),
        )}
      </span>

      {page < pageCount ? (
        <Link
          className={styles.direction}
          href={buildExerciseLibraryUrl(
            query,
            page + 1,
            undefined,
            selectionContext,
          )}
          prefetch={false}
          rel="next"
        >
          Next
        </Link>
      ) : (
        <span className={styles.disabled}>Next</span>
      )}
    </nav>
  );
}
