import Image from "next/image";
import styles from "./loading.module.css";

export default function ApplicationLoading() {
  return (
    <main className={styles.page} aria-busy="true">
      <Image
        className={styles.logo}
        src="/logo.png"
        alt=""
        width={48}
        height={48}
        priority
      />
      <p role="status">Checking your session…</p>
    </main>
  );
}
