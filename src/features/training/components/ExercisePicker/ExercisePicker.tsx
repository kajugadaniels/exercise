"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import {
  Add01Icon,
  Cancel01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { z } from "zod";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { Input } from "@/components/ui/Input/Input";
import type { ExercisePickerValue } from "../../training-week-editor";
import styles from "./ExercisePicker.module.css";

const catalogResponseSchema = z.object({
  data: z.object({
    items: z.array(
      z.object({
        id: z.string().min(1).max(200),
        name: z.string().min(1).max(180),
      }),
    ),
    page: z.number().int().min(1),
    pageCount: z.number().int().min(1),
    total: z.number().int().nonnegative(),
  }),
});

type ExercisePickerProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: ExercisePickerValue) => void;
  selectedExerciseIds: readonly string[];
}>;

export function ExercisePicker({
  isOpen,
  onClose,
  onSelect,
  selectedExerciseIds,
}: ExercisePickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [searchValue, setSearchValue] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<ExercisePickerValue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() =>
        dialog.querySelector<HTMLInputElement>("input")?.focus(),
      );
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const controller = new AbortController();

    async function loadExercises() {
      setIsLoading(true);
      setError(null);

      const searchParams = new URLSearchParams({ page: String(page) });
      if (query) {
        searchParams.set("search", query);
      }

      try {
        const response = await fetch(`/api/exercises?${searchParams}`, {
          signal: controller.signal,
        });
        const payload: unknown = await response.json();

        if (!response.ok) {
          throw new Error("Exercises could not be loaded.");
        }

        const result = catalogResponseSchema.safeParse(payload);
        if (!result.success) {
          throw new Error("Exercises returned an unexpected response.");
        }

        setItems(result.data.data.items);
        setPage(result.data.data.page);
        setPageCount(result.data.data.pageCount);
        setTotal(result.data.data.total);
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }

        setItems([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Exercises could not be loaded.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadExercises();
    return () => controller.abort();
  }, [isOpen, page, query, reloadKey]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = searchValue.trim();

    if (nextQuery.length > 0 && nextQuery.length < 3) {
      setError("Enter at least three characters to search.");
      return;
    }

    setPage(1);
    setQuery(nextQuery);
    setReloadKey((current) => current + 1);
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) {
      onClose();
    }
  }

  return (
    <dialog
      className={styles.dialog}
      ref={dialogRef}
      aria-labelledby="exercise-picker-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className={styles.sheet}>
        <header className={styles.header}>
          <div>
            <h2 id="exercise-picker-title">Choose an exercise</h2>
            <p>Search the verified catalog and add one movement at a time.</p>
          </div>
          <button
            className={styles.closeButton}
            type="button"
            aria-label="Close exercise picker"
            onClick={onClose}
          >
            <Icon icon={Cancel01Icon} size={20} />
          </button>
        </header>

        <form className={styles.search} onSubmit={handleSearch}>
          <Input
            id="exercise-picker-search"
            name="search"
            label="Search exercises"
            placeholder="At least 3 characters"
            icon={Search01Icon}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
          />
          <Button type="submit" size="compact" disabled={isLoading}>
            Search
          </Button>
        </form>

        <div className={styles.resultSummary} aria-live="polite">
          {isLoading ? "Loading exercises…" : `${total} exercises found`}
        </div>

        {error ? (
          <div className={styles.message} role="alert">
            <p>{error}</p>
            <Button
              type="button"
              size="compact"
              variant="secondary"
              onClick={() => {
                setError(null);
                setQuery("");
                setSearchValue("");
                setPage(1);
                setReloadKey((current) => current + 1);
              }}
            >
              View all exercises
            </Button>
          </div>
        ) : (
          <ul className={styles.results} aria-busy={isLoading}>
            {!isLoading && items.length === 0 && (
              <li className={styles.emptyResult}>
                <Icon icon={Search01Icon} size={32} />
                <strong>No matching exercises</strong>
                <span>Try another search term or view the full catalog.</span>
              </li>
            )}
            {items.map((exercise) => {
              const isSelected = selectedExerciseIds.includes(exercise.id);

              return (
                <li key={exercise.id}>
                  <button
                    className={styles.exerciseButton}
                    type="button"
                    disabled={isLoading || isSelected}
                    onClick={() => onSelect(exercise)}
                  >
                    <span>{exercise.name}</span>
                    <span className={styles.addLabel}>
                      {isSelected ? "Added" : "Add"}
                      {!isSelected && <Icon icon={Add01Icon} size={18} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <footer className={styles.pagination}>
          <Button
            type="button"
            size="compact"
            variant="ghost"
            disabled={isLoading || page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <span>
            Page {page} of {pageCount}
          </span>
          <Button
            type="button"
            size="compact"
            variant="ghost"
            disabled={isLoading || page >= pageCount}
            onClick={() =>
              setPage((current) => Math.min(pageCount, current + 1))
            }
          >
            Next
          </Button>
        </footer>
      </div>
    </dialog>
  );
}
