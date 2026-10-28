import styles from "./page.module.css";

export default function ProgressLoading() {
  return (
    <main className={styles.page} id="main-content" aria-busy="true">
      <header className={styles.pageHeader}>
        <div>
          <p>Your training signal</p>
          <h1>Loading progress</h1>
        </div>
        <p>Your completed workouts and measurements are being prepared.</p>
      </header>
      <div className={styles.loadingPanel} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <p className={styles.loadingStatus} role="status">
        Loading your private progress…
      </p>
    </main>
  );
}
