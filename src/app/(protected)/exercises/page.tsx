import styles from "./page.module.css";

const demoExercises = [
  {
    id: "demo-movement-01",
    name: "Sample movement 01",
    category: "Strength placeholder",
    equipment: "Equipment pending",
  },
  {
    id: "demo-movement-02",
    name: "Sample movement 02",
    category: "Mobility placeholder",
    equipment: "Equipment pending",
  },
  {
    id: "demo-movement-03",
    name: "Sample movement 03",
    category: "Conditioning placeholder",
    equipment: "Equipment pending",
  },
] as const;

export default function ExercisesPage() {
  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <div className={styles.headingGroup}>
          <p className={styles.context}>Demo catalog</p>
          <h1 className={styles.pageTitle}>Exercises</h1>
        </div>
        <p className={styles.summary}>
          These entries are interface placeholders, not provider-backed exercise
          guidance. Verified content will replace them later.
        </p>
      </header>

      <section aria-labelledby="demo-exercises-title">
        <h2 className={styles.visuallyHidden} id="demo-exercises-title">
          Sample exercise entries
        </h2>
        <ul className={styles.exerciseList}>
          {demoExercises.map((exercise) => (
            <li className={styles.exerciseItem} key={exercise.id}>
              <div className={styles.exerciseAccent} aria-hidden="true" />
              <div className={styles.exerciseContent}>
                <h3 className={styles.exerciseTitle}>{exercise.name}</h3>
                <dl className={styles.metadata}>
                  <div className={styles.metadataGroup}>
                    <dt className={styles.metadataTerm}>Category</dt>
                    <dd className={styles.metadataDescription}>
                      {exercise.category}
                    </dd>
                  </div>
                  <div className={styles.metadataGroup}>
                    <dt className={styles.metadataTerm}>Equipment</dt>
                    <dd className={styles.metadataDescription}>
                      {exercise.equipment}
                    </dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
