"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dumbbell01Icon,
  JumpersIcon,
  PauseIcon,
  PlayIcon,
  WorkoutBattleRopesIcon,
  WorkoutRunIcon,
  WorkoutStretchingIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "@/components/ui/Icon/Icon";
import {
  exerciseCategoryIds,
  formatExerciseValue,
  type ExerciseCategory,
  type ExerciseQuery,
} from "../../domain/exercise";
import { buildExerciseLibraryUrl } from "../../providers/exercise-gym-gifs/filters";
import styles from "./ExerciseCategoryRail.module.css";

type ExerciseCategoryRailProps = Readonly<{
  query: ExerciseQuery;
}>;

type CategoryOption = Readonly<{
  icon: IconSvgElement;
  label: string;
  value: ExerciseCategory | null;
}>;

const categoryIcons: Record<ExerciseCategory, IconSvgElement> = {
  cardio: WorkoutRunIcon,
  plyometrics: JumpersIcon,
  strength: WorkoutBattleRopesIcon,
  stretching: WorkoutStretchingIcon,
};

const categoryOptions: readonly CategoryOption[] = [
  {
    icon: Dumbbell01Icon,
    label: "All categories",
    value: null,
  },
  ...exerciseCategoryIds.map((value) => ({
    icon: categoryIcons[value],
    label: formatExerciseValue(value),
    value,
  })),
];

type CategoryListProps = Readonly<{
  isDuplicate?: boolean;
  query: ExerciseQuery;
}>;

function CategoryList({ isDuplicate = false, query }: CategoryListProps) {
  return (
    <ul
      aria-hidden={isDuplicate ? "true" : undefined}
      className={`${styles.list} ${isDuplicate ? styles.duplicate : ""}`}
    >
      {categoryOptions.map((option) => {
        const isActive = query.category
          ? query.category === option.value
          : option.value === null;
        const linkClassName = `${styles.link} ${
          isActive ? styles.active : ""
        }`;

        return (
          <li className={styles.item} key={option.value ?? "all"}>
            {isDuplicate ? (
              <span className={linkClassName}>
                <Icon icon={option.icon} size={18} />
                <span>{option.label}</span>
              </span>
            ) : (
              <Link
                aria-current={isActive ? "true" : undefined}
                className={linkClassName}
                href={buildExerciseLibraryUrl(query, 1, {
                  category: option.value,
                })}
                prefetch={false}
              >
                <Icon icon={option.icon} size={18} />
                <span>{option.label}</span>
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ExerciseCategoryRail({ query }: ExerciseCategoryRailProps) {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <nav
      className={styles.rail}
      aria-label="Exercise categories"
      data-paused={isPaused ? "true" : "false"}
    >
      <div className={styles.viewport}>
        <div className={styles.track}>
          <CategoryList query={query} />
          <CategoryList isDuplicate query={query} />
          <CategoryList isDuplicate query={query} />
          <CategoryList isDuplicate query={query} />
        </div>
      </div>
      <button
        className={styles.motionToggle}
        type="button"
        aria-label={isPaused ? "Resume category movement" : "Pause categories"}
        aria-pressed={isPaused}
        onClick={() => setIsPaused((currentValue) => !currentValue)}
      >
        <Icon icon={isPaused ? PlayIcon : PauseIcon} size={18} />
      </button>
    </nav>
  );
}
