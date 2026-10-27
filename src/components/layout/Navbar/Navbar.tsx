import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import { primaryNavigationLinks } from "./navigation-links";
import styles from "./Navbar.module.css";

export function Navbar() {
  return (
    <>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <header className={styles.header}>
        <div className={styles.navbar}>
          <Link
            className={styles.brand}
            href={AUTH_ROUTES.home}
            aria-label="GYM Fitness home"
          >
            <Image
              className={styles.brandMark}
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              priority
            />
          </Link>

          <nav className={styles.navigation} aria-label="Primary navigation">
            {primaryNavigationLinks.map((link) => (
              <Link className={styles.link} href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className={styles.account}>
            <UserButton />
          </div>
        </div>
      </header>
    </>
  );
}
