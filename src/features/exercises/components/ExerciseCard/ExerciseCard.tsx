import Link from "next/link";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/Badge/Badge";
import { Icon } from "@/components/ui/Icon/Icon";
import {
  formatExerciseValue,
  type Exercise,
} from "../../domain/exercise";
import { ExerciseMedia } from "../ExerciseMedia/ExerciseMedia";
import styles from "./ExerciseCard.module.css";

type ExerciseCardProps = {
  exercise: Exercise;
};

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const href = `/exercises/${exercise.primaryMuscle}/${exercise.slug}`;

  return (
    <article className={styles.card}>
      <ExerciseMedia
        compact
        exerciseName={exercise.name}
        media={exercise.media}
      />
      <div className={styles.content}>
        <div className={styles.tags}>
          {exercise.category && (
            <Badge tone="primary">
              {formatExerciseValue(exercise.category)}
            </Badge>
          )}
          <Badge>{formatExerciseValue(exercise.primaryMuscle)}</Badge>
        </div>

        <h2 className={styles.title}>
          <Link href={href}>{exercise.name}</Link>
        </h2>

        <dl className={styles.metadata}>
          <div>
            <dt>Equipment</dt>
            <dd>
              {exercise.equipment
                ? formatExerciseValue(exercise.equipment)
                : "Not provided"}
            </dd>
          </div>
          <div>
            <dt>Body area</dt>
            <dd>
              {exercise.bodyPart
                ? formatExerciseValue(exercise.bodyPart)
                : "Not provided"}
            </dd>
          </div>
        </dl>

        <Link className={styles.detailsLink} href={href}>
          View exercise
          <Icon icon={ArrowRight02Icon} size={18} />
        </Link>
      </div>
    </article>
  );
}
