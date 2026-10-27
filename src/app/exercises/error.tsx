"use client";

import { Button } from "@/components/ui/Button/Button";
import styles from "./error.module.css";

type ExercisesErrorProps = {
  reset: () => void;
};

export default function ExercisesError({ reset }: ExercisesErrorProps) {
  return (
    <main id="main-content" className={styles.page}>
      <section className={styles.message} aria-labelledby="exercise-error-title">
        <h1 id="exercise-error-title">Exercises are temporarily unavailable</h1>
        <p>
          The exercise source could not be loaded or returned unsupported data.
          Try the request again.
        </p>
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </section>
    </main>
  );
}
