import Link from "next/link";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import styles from "./page.module.css";

const workspacePreview = [
  {
    id: "catalog",
    title: "Exercise catalog",
    value: "Demo data",
    description: "Preview the catalog layout before verified exercise data is connected.",
  },
  {
    id: "account",
    title: "Account access",
    value: "Connected",
    description: "Use the profile control in the navigation bar to manage your Clerk account.",
  },
] as const;

export default function HomePage() {
  return (
    <main className={styles.page} id="main-content">
      <header className={styles.hero}>
        <p className={styles.context}>Demo workspace</p>
        <h1 className={styles.heroTitle}>Your training space</h1>
        <p className={styles.summary}>
          The protected application shell is ready. Explore the sample catalog
          while the final exercise experience is being prepared.
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
            Static placeholder information for the new protected pages.
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
