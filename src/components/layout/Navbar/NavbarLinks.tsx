"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isNavigationLinkActive,
  primaryNavigationLinks,
} from "./navigation-links";
import styles from "./Navbar.module.css";

export function NavbarLinks() {
  const pathname = usePathname();

  return (
    <nav className={styles.navigation} aria-label="Primary navigation">
      {primaryNavigationLinks.map((link) => {
        const isActive = isNavigationLinkActive(pathname, link.href);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={styles.link}
            href={link.href}
            key={link.href}
          >
            <span className={styles.linkSignal} aria-hidden="true" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
