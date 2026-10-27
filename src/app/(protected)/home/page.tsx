import Link from "next/link";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import styles from "./page.module.css";

const workspacePreview = [
  {
    id: "profile",
    title: "Training profile",
    value: "Complete",
    description: "Your measurements and preferences are securely connected to your account.",
  },
  {
    id: "progress",
    title: "Progress history",
    value: "Tracking",
    description: "Measurement changes are saved as private snapshots you can review over time.",
  },
  {
    id: "catalog",
    title: "Exercise catalog",
    value: "Explore",
    description: "Browse the exercise workspace while the verified catalog is being completed.",
  },
] as const;

export default function HomePage() {
  return (
    <main className={styles.page} id="main-content">
      <header className={styles.hero}>
        <p className={styles.context}>Training workspace</p>
        <h1 className={styles.heroTitle}>Your training space</h1>
        <p className={styles.summary}>
          Your profile, measurements, and progress history now stay connected
          to your private account. Explore exercises or update your latest data.
        </p>
        <Link className={styles.primaryLink} href={AUTH_ROUTES.exercises}>
          Browse exercises
        </Link>
      </header>

      <section className={styles.overview} aria-labelledby="overview-title">
        <div className={styles.sectionHeading}>
          <h2 className={styles.sectionTitle} id="overview-title">
            Workspace overview
          </h2>
          <p className={styles.sectionDescription}>
            The essentials that support your personal training record.
          </p>
        </div>

        <ul className={styles.previewList}>
          {workspacePreview.map((item) => (
            <li className={styles.previewItem} key={item.id}>
              <p className={styles.previewValue}>{item.value}</p>
              <h3 className={styles.previewTitle}>{item.title}</h3>
              <p className={styles.previewDescription}>{item.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
