import styles from "./loading.module.css";

export default function ExercisesLoading() {
  return (
    <main id="main-content" className={styles.page} aria-busy="true">
      <p className={styles.status} role="status">
        Loading exercise library…
      </p>
      <div className={styles.heading} aria-hidden="true" />
      <div className={styles.filters} aria-hidden="true" />
      <div className={styles.grid} aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div className={styles.card} key={index} />
        ))}
      </div>
    </main>
  );
}
