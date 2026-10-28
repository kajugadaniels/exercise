"use client";

import { Alert02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import styles from "./page.module.css";

type ProgressErrorProps = Readonly<{
  reset: () => void;
}>;

export default function ProgressError({ reset }: ProgressErrorProps) {
  return (
    <main className={styles.page} id="main-content">
      <div className={styles.routeError} role="alert">
        <span aria-hidden="true"><Icon icon={Alert02Icon} size={24} /></span>
        <h1>Progress could not be loaded</h1>
        <p>
          Your records were not changed. Check your connection and try loading
          the dashboard again.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
