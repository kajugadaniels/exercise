"use client";

import { useId, useMemo, useState } from "react";
import Body, {
  type ExtendedBodyPart,
  type Slug,
} from "react-muscle-highlighter";
import type { MuscleId } from "@/features/exercises/domain/exercise";
import {
  getMuscleLabel,
  mapMuscleToHighlighter,
} from "../../muscle-mapping";
import styles from "./MuscleDiagram.module.css";

type MuscleDiagramProps = {
  primaryMuscle: MuscleId;
  secondaryMuscles: MuscleId[];
};

type DiagramView = "front" | "back";

const diagramViews: readonly DiagramView[] = ["front", "back"];

type MappedMuscle = {
  muscle: MuscleId;
  label: string;
  role: "primary" | "secondary";
  slug: Slug | null;
};

export function MuscleDiagram({
  primaryMuscle,
  secondaryMuscles,
}: MuscleDiagramProps) {
  const titleId = useId();
  const [view, setView] = useState<DiagramView>("front");
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleId | null>(null);

  const muscles = useMemo<MappedMuscle[]>(() => {
    const uniqueSecondaryMuscles = Array.from(
      new Set(secondaryMuscles.filter((muscle) => muscle !== primaryMuscle)),
    );

    return [
      {
        muscle: primaryMuscle,
        label: getMuscleLabel(primaryMuscle),
        role: "primary",
        slug: mapMuscleToHighlighter(primaryMuscle),
      },
      ...uniqueSecondaryMuscles.map<MappedMuscle>((muscle) => ({
        muscle,
        label: getMuscleLabel(muscle),
        role: "secondary",
        slug: mapMuscleToHighlighter(muscle),
      })),
    ];
  }, [primaryMuscle, secondaryMuscles]);

  const bodyData = useMemo<ExtendedBodyPart[]>(
    () =>
      muscles.flatMap((muscle) => {
        if (!muscle.slug) {
          return [];
        }

        return [
          {
            slug: muscle.slug,
            color:
              muscle.role === "primary"
                ? "var(--color-muscle-primary)"
                : "var(--color-muscle-secondary)",
            ...(selectedMuscle === muscle.muscle
              ? {
                  styles: {
                    stroke: "var(--color-text)",
                    strokeWidth: 2,
                  },
                }
              : {}),
          },
        ];
      }),
    [muscles, selectedMuscle],
  );

  return (
    <section className={styles.root} aria-labelledby={titleId}>
      <div className={styles.headingRow}>
        <div>
          <h2 id={titleId} className={styles.title}>
            Muscles worked
          </h2>
          <p className={styles.description}>
            Based on the exercise provider&apos;s target-muscle metadata.
          </p>
        </div>

        <div
          className={styles.viewControls}
          role="group"
          aria-label="Anatomy view"
        >
          {diagramViews.map((option) => (
            <button
              className={styles.viewButton}
              type="button"
              aria-pressed={view === option}
              key={option}
              onClick={() => setView(option)}
            >
              {option === "front" ? "Front" : "Back"}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.viewAnnouncement} aria-live="polite">
        {view === "front" ? "Front" : "Back"} anatomy view selected
      </p>

      <div className={styles.content}>
        <div className={styles.diagramFrame} aria-hidden="true">
          <Body
            data={bodyData}
            side={view}
            gender="male"
            scale={1}
            border="var(--color-border-strong)"
            defaultFill="var(--color-surface-soft)"
            defaultStroke="var(--color-border)"
            defaultStrokeWidth={1}
          />
        </div>

        <div className={styles.textPanel}>
          <ul className={styles.legend} aria-label="Muscle highlight legend">
            <li>
              <span className={styles.primarySwatch} aria-hidden="true" />
              Primary muscle
            </li>
            <li>
              <span className={styles.secondarySwatch} aria-hidden="true" />
              Secondary muscle
            </li>
          </ul>

          <ul className={styles.muscleList} aria-label="Target muscles">
            {muscles.map((muscle) => (
              <li className={styles.muscleItem} key={muscle.muscle}>
                {muscle.slug ? (
                  <button
                    type="button"
                    className={styles.muscleButton}
                    aria-pressed={selectedMuscle === muscle.muscle}
                    onClick={() =>
                      setSelectedMuscle((current) =>
                        current === muscle.muscle ? null : muscle.muscle,
                      )
                    }
                  >
                    <span>{muscle.label}</span>
                    <span className={styles.muscleRole}>{muscle.role}</span>
                  </button>
                ) : (
                  <div className={styles.unsupportedMuscle}>
                    <span>{muscle.label}</span>
                    <span className={styles.muscleRole}>
                      {muscle.role}; diagram unavailable
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>

          <p className={styles.disclaimer}>
            The illustration is a general visual guide, not a measure of muscle
            activation or medical advice.
          </p>
        </div>
      </div>
    </section>
  );
}
