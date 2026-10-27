import { BodyPartMuscleIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/Icon/Icon";
import type { ExerciseMedia as ExerciseMediaModel } from "../../domain/exercise";
import { ApprovedExerciseMedia } from "./ApprovedExerciseMedia";
import styles from "./ExerciseMedia.module.css";

type ExerciseMediaProps = {
  exerciseName: string;
  media?: ExerciseMediaModel;
  compact?: boolean;
};

export function ExerciseMedia({
  exerciseName,
  media,
  compact = false,
}: ExerciseMediaProps) {
  if (media?.displayStatus === "available") {
    return (
      <ApprovedExerciseMedia
        compact={compact}
        exerciseName={exerciseName}
        media={media}
      />
    );
  }

  const hasRestrictedMedia = media?.rightsStatus === "restricted";

  return (
    <div className={`${styles.frame} ${compact ? styles.compact : ""}`}>
      <div className={styles.mark} aria-hidden="true">
        <Icon icon={BodyPartMuscleIcon} size={compact ? 20 : 24} />
      </div>
      <div className={styles.copy}>
        <p className={styles.title}>Demonstration unavailable</p>
        {!compact && (
          <p className={styles.description}>
            {exerciseName}: {hasRestrictedMedia
              ? "The provider has media, but display is blocked until usage rights are approved."
              : "No approved demonstration is available for this exercise."}
          </p>
        )}
      </div>
    </div>
  );
}
