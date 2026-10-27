import Link from "next/link";
import {
  BackMuscleBodyIcon,
  BodyPartLegIcon,
  BodyPartMuscleIcon,
  BodyPartSixPackIcon,
  Dumbbell01Icon,
  JumpersIcon,
  ListFilterIcon,
  ShoulderIcon,
  WorkoutBattleRopesIcon,
  WorkoutRunIcon,
  WorkoutStretchingIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "@/components/ui/Icon/Icon";
import {
  bodyPartIds,
  exerciseCategoryIds,
  formatExerciseValue,
  type BodyPartId,
  type ExerciseCategory,
  type ExerciseQuery,
} from "../../domain/exercise";
import { buildExerciseLibraryUrl } from "../../providers/exercise-gym-gifs/filters";
import styles from "./ExerciseFilterSidebar.module.css";

type ExerciseFilterSidebarProps = Readonly<{
  query: ExerciseQuery;
}>;

type FilterOption<TValue extends string> = Readonly<{
  icon: IconSvgElement;
  label: string;
  value: TValue | null;
}>;

type FilterListProps<TValue extends string> = Readonly<{
  activeValue?: TValue;
  ariaLabel: string;
  getHref: (value: TValue | null) => string;
  options: readonly FilterOption<TValue>[];
}>;

const bodyPartIcons: Record<BodyPartId, IconSvgElement> = {
  arms: BodyPartMuscleIcon,
  back: BackMuscleBodyIcon,
  cardio: WorkoutRunIcon,
  chest: BodyPartMuscleIcon,
  core: BodyPartSixPackIcon,
  legs: BodyPartLegIcon,
  shoulders: ShoulderIcon,
};

const categoryIcons: Record<ExerciseCategory, IconSvgElement> = {
  cardio: WorkoutRunIcon,
  plyometrics: JumpersIcon,
  strength: WorkoutBattleRopesIcon,
  stretching: WorkoutStretchingIcon,
};

const bodyPartOptions: readonly FilterOption<BodyPartId>[] = [
  {
    icon: BodyPartMuscleIcon,
    label: "All body parts",
    value: null,
  },
  ...bodyPartIds.map((value) => ({
    icon: bodyPartIcons[value],
    label: formatExerciseValue(value),
    value,
  })),
];

const categoryOptions: readonly FilterOption<ExerciseCategory>[] = [
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

function FilterList<TValue extends string>({
  activeValue,
  ariaLabel,
  getHref,
  options,
}: FilterListProps<TValue>) {
  return (
    <nav aria-label={ariaLabel}>
      <ul className={styles.list}>
        {options.map((option) => {
          const isActive = activeValue
            ? activeValue === option.value
            : option.value === null;

          return (
            <li className={styles.item} key={option.value ?? "all"}>
              <Link
                aria-current={isActive ? "true" : undefined}
                className={`${styles.link} ${isActive ? styles.active : ""}`}
                href={getHref(option.value)}
                prefetch={false}
              >
                <span className={styles.optionIcon} aria-hidden="true">
                  <Icon icon={option.icon} size={20} />
                </span>
                <span>{option.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function ExerciseFilterSidebar({ query }: ExerciseFilterSidebarProps) {
  return (
    <aside
      className={styles.sidebar}
      id="exercise-filters"
      aria-label="Exercise filters"
    >
      <section
        className={styles.filterGroup}
        aria-labelledby="exercise-body-parts-title"
      >
        <div className={styles.heading}>
          <span className={styles.headingIcon} aria-hidden="true">
            <Icon icon={BodyPartMuscleIcon} size={18} />
          </span>
          <h2 className={styles.title} id="exercise-body-parts-title">
            Body parts
          </h2>
        </div>
        <FilterList
          activeValue={query.bodyPart}
          ariaLabel="Exercise body parts"
          getHref={(bodyPart) =>
            buildExerciseLibraryUrl(query, 1, {
              bodyPart,
            })
          }
          options={bodyPartOptions}
        />
      </section>

      <section
        className={styles.filterGroup}
        aria-labelledby="exercise-categories-title"
      >
        <div className={styles.heading}>
          <span className={styles.headingIcon} aria-hidden="true">
            <Icon icon={ListFilterIcon} size={18} />
          </span>
          <h2 className={styles.title} id="exercise-categories-title">
            Categories
          </h2>
        </div>
        <FilterList
          activeValue={query.category}
          ariaLabel="Exercise categories"
          getHref={(category) =>
            buildExerciseLibraryUrl(query, 1, {
              category,
            })
          }
          options={categoryOptions}
        />
      </section>

      <p className={styles.hint}>Combine filters to narrow the library.</p>
    </aside>
  );
}
