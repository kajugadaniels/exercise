import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import { NavbarLinks } from "./NavbarLinks";
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

          <NavbarLinks />

          <div className={styles.account}>
            <UserButton />
          </div>
        </div>
      </header>
    </>
  );
}
