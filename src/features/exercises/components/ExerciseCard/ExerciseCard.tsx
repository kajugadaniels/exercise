import Link from "next/link";
import {
  Add01Icon,
  ArrowUpRight02Icon,
  Edit01Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/Icon/Icon";
import type { ExerciseSummary } from "../../domain/exercise";
import { ExerciseThumbnail } from "../ExerciseThumbnail/ExerciseThumbnail";
import styles from "./ExerciseCard.module.css";

type ExerciseCardProps = Readonly<{
  action?: "add" | "edit" | "open";
  exercise: ExerciseSummary;
  href?: string;
}>;

const actionIcon = {
  add: Add01Icon,
  edit: Edit01Icon,
  open: ArrowUpRight02Icon,
} as const;

const actionLabel = {
  add: "Add to workout",
  edit: "Edit planned exercise",
  open: "Open exercise details",
} as const;

export function ExerciseCard({
  action = "open",
  exercise,
  href = `/exercises/${exercise.id}`,
}: ExerciseCardProps) {
  return (
    <article className={styles.card}>
      <Link
        className={styles.link}
        aria-label={`${actionLabel[action]}: ${exercise.name}`}
        href={href}
        prefetch={false}
      >
        <ExerciseThumbnail image={exercise.image} />
        <span className={styles.identity}>
          <span className={styles.name}>{exercise.name}</span>
          <span className={styles.openIcon} aria-hidden="true">
            <Icon icon={actionIcon[action]} size={20} />
          </span>
        </span>
      </Link>
    </article>
  );
}
