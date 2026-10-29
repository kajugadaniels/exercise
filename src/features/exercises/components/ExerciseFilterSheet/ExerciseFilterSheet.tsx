"use client";

import {
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Cancel01Icon, FilterIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import {
  bodyPartIds,
  equipmentIds,
  exerciseCategoryIds,
  formatExerciseValue,
  muscleIds,
  type ExerciseQuery,
} from "../../domain/exercise";
import { buildExerciseLibraryUrl } from "../../providers/exercise-gym-gifs/filters";
import styles from "./ExerciseFilterSheet.module.css";

type ExerciseFilterSheetProps = Readonly<{
  query: ExerciseQuery;
}>;

type FilterGroupProps<TValue extends string> = Readonly<{
  legend: string;
  name: string;
  options: readonly TValue[];
  selectedValues?: readonly TValue[];
}>;

function FilterGroup<TValue extends string>({
  legend,
  name,
  options,
  selectedValues = [],
}: FilterGroupProps<TValue>) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label className={styles.choice} key={option}>
            <input
              className={styles.checkbox}
              defaultChecked={selectedValues.includes(option)}
              name={name}
              type="checkbox"
              value={option}
            />
            <span className={styles.option}>
              <span className={styles.checkMark} aria-hidden="true" />
              {formatExerciseValue(option)}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function readSelectedFilters<TValue extends string>(
  formData: FormData,
  name: string,
  allowedValues: readonly TValue[],
): TValue[] | undefined {
  const submittedValues = new Set(formData.getAll(name));
  const selectedValues = allowedValues.filter((value) =>
    submittedValues.has(value),
  );

  return selectedValues.length > 0 ? selectedValues : undefined;
}

export function ExerciseFilterSheet({ query }: ExerciseFilterSheetProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const activeFilterCount =
    (query.bodyParts?.length ?? 0) +
    (query.categories?.length ?? 0) +
    (query.muscles?.length ?? 0) +
    (query.equipment?.length ?? 0);

  function openSheet() {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {
      dialog.showModal();
      setIsOpen(true);
    }
  }

  function closeSheet() {
    dialogRef.current?.close();
  }

  function handleDialogClose() {
    formRef.current?.reset();
    setIsOpen(false);
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      closeSheet();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const bodyParts = readSelectedFilters(formData, "bodyPart", bodyPartIds);
    const categories = readSelectedFilters(
      formData,
      "category",
      exerciseCategoryIds,
    );
    const equipment = readSelectedFilters(
      formData,
      "equipment",
      equipmentIds,
    );
    const muscles = readSelectedFilters(formData, "muscle", muscleIds);
    const nextQuery: ExerciseQuery = {
      ...(bodyParts ? { bodyParts } : {}),
      ...(categories ? { categories } : {}),
      ...(equipment ? { equipment } : {}),
      ...(muscles ? { muscles } : {}),
      page: 1,
      ...(query.search ? { search: query.search } : {}),
    };

    closeSheet();
    router.push(buildExerciseLibraryUrl(nextQuery, 1), { scroll: false });
  }

  function clearFilters() {
    const nextQuery: ExerciseQuery = {
      page: 1,
      ...(query.search ? { search: query.search } : {}),
    };
    const clearFiltersHref = query.search
      ? buildExerciseLibraryUrl(nextQuery, 1)
      : "/exercises?page=1";

    closeSheet();
    router.push(clearFiltersHref, { scroll: false });
  }

  return (
    <>
      <button
        className={styles.trigger}
        data-active={activeFilterCount > 0 ? "true" : "false"}
        onClick={openSheet}
        title="Exercise filters"
        type="button"
        aria-controls="exercise-filter-sheet"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={
          activeFilterCount > 0
            ? `Exercise filters, ${activeFilterCount} selected`
            : "Exercise filters"
        }
      >
        <Icon icon={FilterIcon} size={20} />
      </button>

      <dialog
        className={styles.dialog}
        id="exercise-filter-sheet"
        onClick={handleBackdropClick}
        onClose={handleDialogClose}
        ref={dialogRef}
        aria-labelledby="exercise-filter-title"
      >
        <form className={styles.sheet} onSubmit={handleSubmit} ref={formRef}>
          <header className={styles.header}>
            <div className={styles.headingGroup}>
              <h2 className={styles.title} id="exercise-filter-title">
                Filter exercises
              </h2>
              <p className={styles.description}>
                Select one or more options. Empty groups include everything.
              </p>
            </div>
            <button
              className={styles.closeButton}
              onClick={closeSheet}
              title="Close filters"
              type="button"
              aria-label="Close exercise filters"
            >
              <Icon icon={Cancel01Icon} size={20} />
            </button>
          </header>

          <div className={styles.body}>
            <FilterGroup
              legend="Body parts"
              name="bodyPart"
              options={bodyPartIds}
              selectedValues={query.bodyParts}
            />
            <FilterGroup
              legend="Categories"
              name="category"
              options={exerciseCategoryIds}
              selectedValues={query.categories}
            />
            <FilterGroup
              legend="Muscles"
              name="muscle"
              options={muscleIds}
              selectedValues={query.muscles}
            />
            <FilterGroup
              legend="Equipment"
              name="equipment"
              options={equipmentIds}
              selectedValues={query.equipment}
            />
          </div>

          <footer className={styles.footer}>
            <button
              className={styles.clearButton}
              onClick={clearFilters}
              type="button"
            >
              Clear all
            </button>
            <Button className={styles.applyButton} type="submit">
              Apply filters
            </Button>
          </footer>
        </form>
      </dialog>
    </>
  );
}
