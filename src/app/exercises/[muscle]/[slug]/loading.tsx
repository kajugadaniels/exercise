import styles from "./loading.module.css";

export default function ExerciseDetailsLoading() {
  return (
    <main id="main-content" className={styles.page} aria-busy="true">
      <p className={styles.status} role="status">
        Loading exercise details…
      </p>
      <div className={styles.identity} aria-hidden="true" />
      <div className={styles.content} aria-hidden="true">
        <div />
        <div />
      </div>
      <div className={styles.anatomy} aria-hidden="true" />
    </main>
  );
}
