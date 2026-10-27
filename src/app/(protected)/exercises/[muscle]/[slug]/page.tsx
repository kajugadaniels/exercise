import { Suspense } from "react";
import {
  Activity03Icon,
  ArrowLeft01Icon,
  BodyPartMuscleIcon,
  EquipmentGym01Icon,
  ExternalLinkIcon,
  Target01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon/Icon";
import { ExerciseThumbnail } from "@/features/exercises/components/ExerciseThumbnail/ExerciseThumbnail";
import { toExerciseSummary } from "@/features/exercises/catalog/exercise-summary";
import {
  formatExerciseValue,
  type Exercise,
} from "@/features/exercises/domain/exercise";
import { exerciseGymGifsAdapter } from "@/features/exercises/providers/exercise-gym-gifs/adapter";
import { ExerciseMuscleVisual } from "@/features/muscle-explorer/components/ExerciseMuscleVisual/ExerciseMuscleVisual";
import styles from "./page.module.css";

type ExerciseDetailPageProps = Readonly<{
  params: Promise<{
    muscle: string;
    slug: string;
  }>;
}>;

function DetailFallback() {
  return (
    <div
      className={styles.loading}
      aria-label="Loading exercise details"
      role="status"
    >
      <div className={styles.loadingHeader} aria-hidden="true" />
      <div className={styles.loadingOverview} aria-hidden="true">
        <div className={styles.loadingMedia} />
        <div className={styles.loadingContent} />
      </div>
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
        <span className={styles.errorIcon} aria-hidden="true">
          <Icon icon={Activity03Icon} size={24} />
        </span>
        <h1>Exercise details are temporarily unavailable</h1>
        <p>The source catalog could not be reached. Try the library again.</p>
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
  const primaryMuscle = formatExerciseValue(exercise.primaryMuscle);

  return (
    <article className={styles.detail}>
      <nav className={styles.contextNav} aria-label="Exercise context">
        <Link className={styles.backLink} href="/exercises">
          <Icon icon={ArrowLeft01Icon} size={18} />
          <span>Exercise library</span>
        </Link>
      </nav>

      <header className={styles.header}>
        <div className={styles.headingCopy}>
          <h1 className={styles.title}>{exercise.name}</h1>
          <p className={styles.summary}>
            Review the movement, target muscles, and source instructions before
            training.
          </p>
        </div>
      </header>

      <div className={styles.overview}>
        <figure className={styles.mediaPanel}>
          <div className={styles.mediaFrame}>
            <ExerciseThumbnail image={summary.image} size="detail" />
            <ul className={styles.mediaBadges} aria-label="Training overview">
              <li className={styles.mediaBadge}>
                <span className={styles.badgeIcon} aria-hidden="true">
                  <Icon icon={Target01Icon} size={18} />
                </span>
                <span className={styles.badgeContent}>
                  <span className={styles.badgeLabel}>Primary muscle</span>
                  <strong className={styles.badgeValue}>{primaryMuscle}</strong>
                </span>
              </li>

              {exercise.bodyPart && (
                <li className={styles.mediaBadge}>
                  <span className={styles.badgeIcon} aria-hidden="true">
                    <Icon icon={BodyPartMuscleIcon} size={18} />
                  </span>
                  <span className={styles.badgeContent}>
                    <span className={styles.badgeLabel}>Body part</span>
                    <strong className={styles.badgeValue}>
                      {formatExerciseValue(exercise.bodyPart)}
                    </strong>
                  </span>
                </li>
              )}

              {exercise.equipment && (
                <li className={styles.mediaBadge}>
                  <span className={styles.badgeIcon} aria-hidden="true">
                    <Icon icon={EquipmentGym01Icon} size={18} />
                  </span>
                  <span className={styles.badgeContent}>
                    <span className={styles.badgeLabel}>Equipment</span>
                    <strong className={styles.badgeValue}>
                      {formatExerciseValue(exercise.equipment)}
                    </strong>
                  </span>
                </li>
              )}

              {exercise.category && (
                <li className={styles.mediaBadge}>
                  <span className={styles.badgeIcon} aria-hidden="true">
                    <Icon icon={Activity03Icon} size={18} />
                  </span>
                  <span className={styles.badgeContent}>
                    <span className={styles.badgeLabel}>Category</span>
                    <strong className={styles.badgeValue}>
                      {formatExerciseValue(exercise.category)}
                    </strong>
                  </span>
                </li>
              )}
            </ul>
          </div>
          <figcaption className={styles.mediaCaption}>
            <span className={styles.captionDot} aria-hidden="true" />
            Exercise preview supplied by the source catalog when available.
          </figcaption>
        </figure>

        <ExerciseMuscleVisual
          primaryMuscle={exercise.primaryMuscle}
          secondaryMuscles={exercise.secondaryMuscles}
        />
      </div>

      <section
        className={styles.instructions}
        aria-labelledby="instructions-title"
      >
        <div className={styles.instructionsHeading}>
          <div>
            <h2 className={styles.sectionTitle} id="instructions-title">
              How to perform it
            </h2>
            <p>Follow the available source instructions in order.</p>
          </div>
          {exercise.instructions.length > 0 && (
            <span className={styles.stepCount}>
              {exercise.instructions.length}{" "}
              {exercise.instructions.length === 1 ? "step" : "steps"}
            </span>
          )}
        </div>

        {exercise.instructions.length > 0 ? (
          <ol className={styles.instructionList}>
            {exercise.instructions.map((instruction, index) => (
              <li key={`${exercise.id}-instruction-${index + 1}`}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p>{instruction}</p>
              </li>
            ))}
          </ol>
        ) : (
          <div className={styles.missingInstructions}>
            <p>Written instructions are not available for this exercise.</p>
          </div>
        )}
      </section>

      <footer className={styles.source}>
        <div>
          <span className={styles.sourceLabel}>Exercise source</span>
          <span>
            Exercise Gym GIFs DB, version {exercise.source.version}
          </span>
        </div>
        <a
          className={styles.providerLink}
          href={exercise.source.attributionUrl}
          rel="noreferrer"
          target="_blank"
        >
          <span>View provider</span>
          <Icon icon={ExternalLinkIcon} size={18} />
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
