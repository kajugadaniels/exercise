import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import styles from "./layout.module.css";

type ExercisesLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function ExercisesLayout({
  children,
}: ExercisesLayoutProps) {
  await auth.protect();

  return (
    <>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href={AUTH_ROUTES.home}>
            <Image
              className={styles.brandMark}
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              priority
            />
            <span>GYM Fitness</span>
          </Link>
          <nav className={styles.navigation} aria-label="Primary navigation">
            <Link href="/">Home</Link>
            <Link href={AUTH_ROUTES.home}>Exercises</Link>
          </nav>
          <div className={styles.account}>
            <UserButton />
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
