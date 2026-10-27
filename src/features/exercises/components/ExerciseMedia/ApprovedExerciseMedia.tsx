"use client";

import { useState } from "react";
import Image from "next/image";
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
          <button
            className={styles.mediaControl}
            type="button"
            onClick={() => setIsVisible(false)}
          >
            Hide demonstration
          </button>
        </>
      ) : (
        <div className={styles.mediaPrompt}>
          <p>
            An approved {media.kind === "video" ? "video" : "animation"} is
            available. It will play only after you choose to show it.
          </p>
          <button
            className={styles.mediaControl}
            type="button"
            onClick={() => setIsVisible(true)}
          >
            Show demonstration
          </button>
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
