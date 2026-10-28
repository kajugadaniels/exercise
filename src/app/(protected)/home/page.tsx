import Link from "next/link";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import styles from "./page.module.css";

const workspacePreview = [
  {
    id: "profile",
    title: "Personal profile",
    value: "Complete",
    description: "Your physical details are securely connected to your account.",
  },
  {
    id: "catalog",
    title: "Exercise catalog",
    value: "Explore",
    description: "Search and filter movements, then open each exercise for detailed guidance.",
  },
] as const;

export default function HomePage() {
  return (
    <main className={styles.page} id="main-content">
      <header className={styles.hero}>
        <p className={styles.context}>Fitness workspace</p>
        <h1 className={styles.heroTitle}>Move with clarity</h1>
        <p className={styles.summary}>
          Explore the exercise library and keep your personal profile current in
          one private workspace.
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
            The essentials available in your private account.
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
