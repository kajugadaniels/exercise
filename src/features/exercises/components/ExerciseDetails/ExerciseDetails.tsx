import Link from "next/link";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/Icon/Icon";
import { MuscleDiagram } from "@/features/muscle-explorer/components/MuscleDiagram/MuscleDiagram";
import {
  formatExerciseValue,
  type Exercise,
} from "../../domain/exercise";
import { ExerciseMedia } from "../ExerciseMedia/ExerciseMedia";
import styles from "./ExerciseDetails.module.css";

type ExerciseDetailsProps = {
  exercise: Exercise;
};

export function ExerciseDetails({ exercise }: ExerciseDetailsProps) {
  return (
    <article className={styles.root}>
      <Link className={styles.backLink} href="/exercises">
        <Icon icon={ArrowLeft02Icon} size={18} />
        Back to exercise library
      </Link>

      <header className={styles.header}>
        <div className={styles.identity}>
          <p className={styles.category}>
            {exercise.category
              ? formatExerciseValue(exercise.category)
              : "Exercise"}
          </p>
          <h1>{exercise.name}</h1>
          <p>
            Review the provider&apos;s exercise details and see its mapped target
            muscles.
          </p>
        </div>

        <dl className={styles.metadata}>
          <div>
            <dt>Primary muscle</dt>
            <dd>{formatExerciseValue(exercise.primaryMuscle)}</dd>
          </div>
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
          <div>
            <dt>Secondary muscles</dt>
            <dd>
              {exercise.secondaryMuscles.length > 0
                ? exercise.secondaryMuscles
                    .map(formatExerciseValue)
                    .join(", ")
                : "Not provided"}
            </dd>
          </div>
        </dl>
      </header>

      <div className={styles.learningGrid}>
        <section className={styles.demonstration} aria-labelledby="demo-title">
          <h2 id="demo-title">Exercise demonstration</h2>
          <ExerciseMedia
            exerciseName={exercise.name}
            media={exercise.media}
          />
        </section>

        <section className={styles.instructions} aria-labelledby="steps-title">
          <h2 id="steps-title">Movement instructions</h2>
          {exercise.instructions.length > 0 ? (
            <ol>
              {exercise.instructions.map((instruction, index) => (
                <li key={`${exercise.id}-instruction-${index + 1}`}>
                  {instruction}
                </li>
              ))}
            </ol>
          ) : (
            <p>
              Written instructions were not provided for this exercise. Use a
              qualified trainer when you need technique guidance.
            </p>
          )}
        </section>
      </div>

      <MuscleDiagram
        primaryMuscle={exercise.primaryMuscle}
        secondaryMuscles={exercise.secondaryMuscles}
      />

      <footer className={styles.source}>
        <p>
          Exercise metadata source: Exercise Gym GIFs DB, version{" "}
          {exercise.source.version}. Media display is restricted pending rights
          approval. Source ID: {exercise.source.sourceId}.
        </p>
        <a
          href={exercise.source.attributionUrl}
          target="_blank"
          rel="noreferrer noopener"
        >
          View provider attribution
        </a>
      </footer>
    </article>
  );
}
