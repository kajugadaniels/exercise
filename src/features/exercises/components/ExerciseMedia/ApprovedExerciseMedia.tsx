"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button/Button";
import type { ExerciseMedia } from "../../domain/exercise";
import styles from "./ExerciseMedia.module.css";

type ApprovedMedia = Extract<ExerciseMedia, { displayStatus: "available" }>;

type ApprovedExerciseMediaProps = {
  compact: boolean;
  exerciseName: string;
  media: ApprovedMedia;
};

export function ApprovedExerciseMedia({
  compact,
  exerciseName,
  media,
}: ApprovedExerciseMediaProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <figure className={`${styles.approvedFrame} ${compact ? styles.compact : ""}`}>
      {isVisible ? (
        <>
          {media.kind === "video" ? (
            <video
              className={styles.approvedMedia}
              controls
              playsInline
              preload="metadata"
              poster={media.posterUrl}
              aria-label={`${exerciseName} demonstration`}
            >
              <source src={media.displayUrl} />
              Your browser does not support this exercise video.
            </video>
          ) : (
            <Image
              className={styles.approvedMedia}
              src={media.displayUrl}
              alt={`${exerciseName} demonstration`}
              width={640}
              height={640}
              loading="lazy"
              unoptimized
            />
          )}
          <Button
            className={styles.mediaAction}
            size="compact"
            variant="secondary"
            onClick={() => setIsVisible(false)}
          >
            Hide demonstration
          </Button>
        </>
      ) : (
        <div className={styles.mediaPrompt}>
          <p>
            An approved {media.kind === "video" ? "video" : "animation"} is
            available. It will play only after you choose to show it.
          </p>
          <Button
            className={styles.mediaAction}
            size="compact"
            variant="secondary"
            onClick={() => setIsVisible(true)}
          >
            Show demonstration
          </Button>
        </div>
      )}
      {media.attribution && (
        <figcaption className={styles.attribution}>
          {media.attribution}
        </figcaption>
      )}
    </figure>
  );
}
