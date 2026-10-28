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
import {
  buildExerciseLibraryUrl,
  type ExerciseSelectionContext,
} from "../../providers/exercise-gym-gifs/filters";
import styles from "./ExerciseFilterSheet.module.css";

type ExerciseFilterSheetProps = Readonly<{
  query: ExerciseQuery;
  selectionContext?: ExerciseSelectionContext;
}>;

type FilterGroupProps<TValue extends string> = Readonly<{
  legend: string;
  name: string;
  options: readonly TValue[];
  selectedValue?: TValue;
}>;

const ALL_FILTERS_VALUE = "all";

function FilterGroup<TValue extends string>({
  legend,
  name,
  options,
  selectedValue,
}: FilterGroupProps<TValue>) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        <label className={styles.choice}>
          <input
            className={styles.radio}
            defaultChecked={!selectedValue}
            name={name}
            type="radio"
            value={ALL_FILTERS_VALUE}
          />
          <span className={styles.option}>
            <span className={styles.radioMark} aria-hidden="true" />
            All
          </span>
        </label>

        {options.map((option) => (
          <label className={styles.choice} key={option}>
            <input
              className={styles.radio}
              defaultChecked={selectedValue === option}
              name={name}
              type="radio"
              value={option}
            />
            <span className={styles.option}>
              <span className={styles.radioMark} aria-hidden="true" />
              {formatExerciseValue(option)}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function readSelectedFilter<TValue extends string>(
  formData: FormData,
  name: string,
  allowedValues: readonly TValue[],
): TValue | undefined {
  const submittedValue = formData.get(name);

  if (typeof submittedValue !== "string") {
    return undefined;
  }

  return allowedValues.find((value) => value === submittedValue);
}

export function ExerciseFilterSheet({
  query,
  selectionContext,
}: ExerciseFilterSheetProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const activeFilterCount = [
    query.bodyPart,
    query.category,
    query.muscle,
    query.equipment,
  ].filter(Boolean).length;

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
    const bodyPart = readSelectedFilter(formData, "bodyPart", bodyPartIds);
    const category = readSelectedFilter(
      formData,
      "category",
      exerciseCategoryIds,
    );
    const equipment = readSelectedFilter(
      formData,
      "equipment",
      equipmentIds,
    );
    const muscle = readSelectedFilter(formData, "muscle", muscleIds);
    const nextQuery: ExerciseQuery = {
      ...(bodyPart ? { bodyPart } : {}),
      ...(category ? { category } : {}),
      ...(equipment ? { equipment } : {}),
      ...(muscle ? { muscle } : {}),
      page: 1,
      ...(query.search ? { search: query.search } : {}),
    };

    closeSheet();
    router.push(
      buildExerciseLibraryUrl(nextQuery, 1, undefined, selectionContext),
      { scroll: false },
    );
  }

  function clearFilters() {
    const nextQuery: ExerciseQuery = {
      page: 1,
      ...(query.search ? { search: query.search } : {}),
    };

    closeSheet();
    router.push(
      buildExerciseLibraryUrl(nextQuery, 1, undefined, selectionContext),
      { scroll: false },
    );
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
            ? `Exercise filters, ${activeFilterCount} active`
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
                Choose one option from each group.
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
              selectedValue={query.bodyPart}
            />
            <FilterGroup
              legend="Categories"
              name="category"
              options={exerciseCategoryIds}
              selectedValue={query.category}
            />
            <FilterGroup
              legend="Muscles"
              name="muscle"
              options={muscleIds}
              selectedValue={query.muscle}
            />
            <FilterGroup
              legend="Equipment"
              name="equipment"
              options={equipmentIds}
              selectedValue={query.equipment}
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
