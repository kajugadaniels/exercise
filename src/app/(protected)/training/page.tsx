import { TrainingCalendar } from "@/features/training/components/TrainingCalendar/TrainingCalendar";
import styles from "./page.module.css";

export default function TrainingPage() {
  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <div className={styles.headingGroup}>
          <h1 className={styles.title}>Training calendar</h1>
          <p className={styles.summary}>
            Review the exercises you scheduled for each day and the work you
            planned for them.
          </p>
        </div>
        <p className={styles.guidance}>
          Select a marked date to see its sets, repetitions, and weight.
        </p>
      </header>

      <TrainingCalendar />
    </main>
  );
}
