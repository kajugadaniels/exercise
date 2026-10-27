"use client";

import { useState } from "react";
import Body, { type ExtendedBodyPart } from "react-muscle-highlighter";
import type { MuscleId } from "@/features/exercises/domain/exercise";
import {
  getMuscleLabel,
  mapMuscleToHighlighter,
} from "../../muscle-mapping";
import styles from "./ExerciseMuscleVisual.module.css";

type BodySide = "front" | "back";

type ExerciseMuscleVisualProps = Readonly<{
  primaryMuscle: MuscleId;
  secondaryMuscles: MuscleId[];
}>;

export function ExerciseMuscleVisual({
  primaryMuscle,
  secondaryMuscles,
}: ExerciseMuscleVisualProps) {
  const [side, setSide] = useState<BodySide>("front");
  const uniqueSecondaryMuscles = secondaryMuscles.filter(
    (muscle, index, muscles) =>
      muscle !== primaryMuscle && muscles.indexOf(muscle) === index,
  );

  const primarySlug = mapMuscleToHighlighter(primaryMuscle);
  const primaryPart: ExtendedBodyPart[] = primarySlug
    ? [{ slug: primarySlug, color: "var(--color-muscle-primary)" }]
    : [];
  const secondaryParts: ExtendedBodyPart[] = uniqueSecondaryMuscles.flatMap(
    (muscle) => {
      const slug = mapMuscleToHighlighter(muscle);

      return slug
        ? [{ slug, color: "var(--color-muscle-secondary)" }]
        : [];
    },
  );
  const bodyData = [...primaryPart, ...secondaryParts];

  const hasMappedMuscle = bodyData.length > 0;

  return (
    <section className={styles.root} aria-labelledby="muscles-worked-title">
      <div className={styles.headingRow}>
        <div>
          <h2 className={styles.title} id="muscles-worked-title">
            Muscles worked
          </h2>
          <p className={styles.description}>
            An illustrative view of the muscle data supplied for this exercise.
          </p>
        </div>

        {hasMappedMuscle && (
          <div
            className={styles.viewSwitch}
            aria-label="Anatomy view"
            role="group"
          >
            {(["front", "back"] as const).map((view) => (
              <button
                className={styles.viewButton}
                type="button"
                aria-pressed={side === view}
                key={view}
                onClick={() => setSide(view)}
              >
                {view === "front" ? "Front" : "Back"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.visual}>
          {hasMappedMuscle ? (
            <div
              className={styles.diagram}
              role="img"
              aria-label={`${side === "front" ? "Front" : "Back"} anatomy view. Primary muscle: ${getMuscleLabel(primaryMuscle)}. Secondary muscles: ${
                uniqueSecondaryMuscles.length > 0
                  ? uniqueSecondaryMuscles.map(getMuscleLabel).join(", ")
                  : "none supplied"
              }.`}
            >
              <div aria-hidden="true">
                <Body
                  border="var(--color-glass-border-strong)"
                  data={bodyData}
                  defaultFill="var(--color-surface-soft)"
                  gender="male"
                  side={side}
                />
              </div>
            </div>
          ) : (
            <div className={styles.unavailable}>
              <span className={styles.unavailableMark} aria-hidden="true" />
              <p>A diagram is not available for these muscle groups.</p>
            </div>
          )}
        </div>

        <div className={styles.legend} aria-label="Muscle legend" role="group">
          <div className={styles.legendGroup}>
            <div className={styles.legendLabel}>
              <span className={styles.primaryDot} aria-hidden="true" />
              <span>Primary</span>
            </div>
            <strong>{getMuscleLabel(primaryMuscle)}</strong>
          </div>

          <div className={styles.legendGroup}>
            <div className={styles.legendLabel}>
              <span className={styles.secondaryDot} aria-hidden="true" />
              <span>Secondary</span>
            </div>
            {uniqueSecondaryMuscles.length > 0 ? (
              <ul className={styles.muscleList}>
                {uniqueSecondaryMuscles.map((muscle) => (
                  <li key={muscle}>{getMuscleLabel(muscle)}</li>
                ))}
              </ul>
            ) : (
              <span className={styles.missing}>Not supplied</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
