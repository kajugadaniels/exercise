import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExerciseThumbnail } from "@/features/exercises/components/ExerciseThumbnail/ExerciseThumbnail";
import { toExerciseSummary } from "@/features/exercises/catalog/exercise-summary";
import {
  formatExerciseValue,
  type Exercise,
} from "@/features/exercises/domain/exercise";
import { exerciseGymGifsAdapter } from "@/features/exercises/providers/exercise-gym-gifs/adapter";
import styles from "./page.module.css";

type ExerciseDetailPageProps = Readonly<{
  params: Promise<{
    muscle: string;
    slug: string;
  }>;
}>;

function DetailFallback() {
  return (
    <div className={styles.loading} aria-label="Loading exercise details">
      <div className={styles.loadingMedia} />
      <div className={styles.loadingContent} />
    </div>
  );
}

async function ExerciseDetail({ params }: ExerciseDetailPageProps) {
  const { muscle, slug } = await params;
  let exercise: Exercise | null;

  try {
    exercise = await exerciseGymGifsAdapter.getById(`${muscle}/${slug}`);
  } catch {
    return (
      <section className={styles.errorState} role="alert">
        <h1>Exercise details are temporarily unavailable</h1>
        <p>The provider could not be reached. Return to the exercise library.</p>
        <Link className={styles.primaryLink} href="/exercises">
          Back to exercises
        </Link>
      </section>
    );
  }

  if (!exercise) {
    notFound();
  }

  const summary = toExerciseSummary(exercise);
  const facts = [
    ["Primary muscle", formatExerciseValue(exercise.primaryMuscle)],
    exercise.bodyPart
      ? ["Body part", formatExerciseValue(exercise.bodyPart)]
      : null,
    exercise.equipment
      ? ["Equipment", formatExerciseValue(exercise.equipment)]
      : null,
    exercise.category
      ? ["Category", formatExerciseValue(exercise.category)]
      : null,
  ].filter((fact): fact is [string, string] => fact !== null);

  return (
    <article className={styles.detail}>
      <header className={styles.header}>
        <Link className={styles.backLink} href="/exercises">
          Exercise library
        </Link>
        <h1 className={styles.title}>{exercise.name}</h1>
      </header>

      <div className={styles.overview}>
        <div className={styles.mediaColumn}>
          <ExerciseThumbnail image={summary.image} size="detail" />
          <p className={styles.mediaNote}>
            Animated preview supplied by the source catalog.
          </p>
        </div>

        <section className={styles.facts} aria-labelledby="exercise-facts-title">
          <h2 className={styles.sectionTitle} id="exercise-facts-title">
            Exercise details
          </h2>
          <dl className={styles.factList}>
            {facts.map(([label, value]) => (
              <div className={styles.fact} key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className={styles.instructions} aria-labelledby="instructions-title">
        <h2 className={styles.sectionTitle} id="instructions-title">
          Instructions
        </h2>
        {exercise.instructions.length > 0 ? (
          <ol className={styles.instructionList}>
            {exercise.instructions.map((instruction, index) => (
              <li key={`${exercise.id}-instruction-${index + 1}`}>
                {instruction}
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.missingCopy}>
            Written instructions are not available for this exercise.
          </p>
        )}
      </section>

      <footer className={styles.source}>
        <span>Source: Exercise Gym GIFs DB, version {exercise.source.version}</span>
        <a
          href={exercise.source.attributionUrl}
          rel="noreferrer"
          target="_blank"
        >
          View provider
        </a>
      </footer>
    </article>
  );
}

export default function ExerciseDetailPage(props: ExerciseDetailPageProps) {
  return (
    <main id="main-content">
      <Suspense fallback={<DetailFallback />}>
        <ExerciseDetail params={props.params} />
      </Suspense>
    </main>
  );
}
