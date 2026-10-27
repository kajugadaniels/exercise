import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./AuthPage.module.css";

type AuthPageProps = {
  children: ReactNode;
  description: string;
  title: string;
};

type AuthLoadingProps = {
  label: string;
};

export function AuthPage({
  children,
  description,
  title,
}: AuthPageProps) {
  return (
    <main id="main-content" className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.story} aria-labelledby="auth-page-title">
          <div className={styles.brand}>
            <Image
              className={styles.brandMark}
              src="/logo.png"
              alt=""
              width={64}
              height={64}
              priority
            />
            <span>GYM Fitness</span>
          </div>
          <div className={styles.copy}>
            <p className={styles.context}>Exercise knowledge, organized</p>
            <h1 className={styles.title} id="auth-page-title">
              {title}
            </h1>
            <p className={styles.description}>{description}</p>
          </div>
          <p className={styles.privacyNote}>
            Your account secures access. Fitness and medical details are not
            collected during authentication.
          </p>
        </section>

        <section className={styles.authPanel} aria-label="Account access">
          {children}
        </section>
      </div>
    </main>
  );
}

export function AuthLoading({ label }: AuthLoadingProps) {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.loadingMark} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
