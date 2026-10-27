import Link from "next/link";
import { ArrowUpRight02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/Icon/Icon";
import type { ExerciseSummary } from "../../domain/exercise";
import { ExerciseThumbnail } from "../ExerciseThumbnail/ExerciseThumbnail";
import styles from "./ExerciseCard.module.css";

type ExerciseCardProps = Readonly<{
  exercise: ExerciseSummary;
}>;

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <article className={styles.card}>
      <Link
        className={styles.link}
        href={`/exercises/${exercise.id}`}
        prefetch={false}
      >
        <ExerciseThumbnail image={exercise.image} />
        <span className={styles.identity}>
          <span className={styles.name}>{exercise.name}</span>
          <span className={styles.openIcon} aria-hidden="true">
            <Icon icon={ArrowUpRight02Icon} size={20} />
          </span>
        </span>
      </Link>
    </article>
  );
}
