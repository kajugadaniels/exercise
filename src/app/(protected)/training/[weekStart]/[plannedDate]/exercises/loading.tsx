import styles from "./page.module.css";

export default function TrainingExerciseLoading() {
  return (
    <main className={styles.statePage} id="main-content">
      <section
        className={styles.loadingState}
        aria-label="Loading exercise editor"
        aria-busy="true"
      >
        <div className={styles.loadingHeading} />
        <div className={styles.loadingWorkspace}>
          <div />
          <div />
        </div>
      </section>
    </main>
  );
}
