"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Alert02Icon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import styles from "./page.module.css";

type TrainingExerciseErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function TrainingExerciseError({
  reset,
}: TrainingExerciseErrorProps) {
  const params = useParams<{ weekStart?: string | string[] }>();
  const weekStart = Array.isArray(params.weekStart)
    ? params.weekStart[0]
    : params.weekStart;
  const trainingHref = weekStart
    ? `/training?week=${encodeURIComponent(weekStart)}`
    : "/training";

  return (
    <main className={styles.statePage} id="main-content">
      <section className={styles.errorState} role="alert">
        <span className={styles.errorIcon} aria-hidden="true">
          <Icon icon={Alert02Icon} size={24} />
        </span>
        <div>
          <h1>The exercise editor could not be loaded</h1>
          <p>
            Your weekly plan was not changed. Try loading the page again or
            return to training.
          </p>
        </div>
        <div className={styles.stateActions}>
          <Link className={styles.returnLink} href={trainingHref}>
            <Icon icon={ArrowLeft01Icon} size={18} />
            Return to training
          </Link>
          <Button type="button" variant="secondary" onClick={reset}>
            Try again
          </Button>
        </div>
      </section>
    </main>
  );
}
