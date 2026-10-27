import Link from "next/link";
import {
  Dumbbell01Icon,
  JumpersIcon,
  ListFilterIcon,
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
import styles from "./ExerciseCategorySidebar.module.css";

type ExerciseCategorySidebarProps = Readonly<{
  query: ExerciseQuery;
}>;

const categoryIcons: Record<ExerciseCategory, IconSvgElement> = {
  cardio: WorkoutRunIcon,
  plyometrics: JumpersIcon,
  strength: WorkoutBattleRopesIcon,
  stretching: WorkoutStretchingIcon,
};

const categoryOptions = [
  {
    icon: Dumbbell01Icon,
    label: "All exercises",
    value: null,
  },
  ...exerciseCategoryIds.map((value) => ({
    icon: categoryIcons[value],
    label: formatExerciseValue(value),
    value,
  })),
];

export function ExerciseCategorySidebar({
  query,
}: ExerciseCategorySidebarProps) {
  return (
    <aside className={styles.sidebar} aria-labelledby="exercise-categories-title">
      <div className={styles.heading}>
        <span className={styles.headingIcon} aria-hidden="true">
          <Icon icon={ListFilterIcon} size={18} />
        </span>
        <h2 className={styles.title} id="exercise-categories-title">
          Categories
        </h2>
      </div>

      <nav aria-label="Exercise categories">
        <ul className={styles.list}>
          {categoryOptions.map((category) => {
            const isActive = query.category
              ? query.category === category.value
              : category.value === null;

            return (
              <li className={styles.item} key={category.value ?? "all"}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`${styles.link} ${isActive ? styles.active : ""}`}
                  href={buildExerciseLibraryUrl(query, 1, {
                    category: category.value,
                  })}
                  prefetch={false}
                >
                  <span className={styles.categoryIcon} aria-hidden="true">
                    <Icon icon={category.icon} size={20} />
                  </span>
                  <span>{category.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className={styles.hint}>Choose a category to narrow the library.</p>
    </aside>
  );
}
