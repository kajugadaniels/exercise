import Link from "next/link";
import styles from "./not-found.module.css";

export default function ExerciseNotFound() {
  return (
    <main id="main-content" className={styles.page}>
      <section className={styles.message}>
        <h1>Exercise not found</h1>
        <p>
          This exercise identifier is invalid or is not available in the pinned
          provider version.
        </p>
        <Link href="/exercises">Return to the exercise library</Link>
      </section>
    </main>
  );
}
