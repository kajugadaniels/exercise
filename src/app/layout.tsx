import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Outfit } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast/Toast";
import "./globals.css";
import styles from "./layout.module.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GYM Fitness Platform",
    template: "%s | GYM Fitness Platform",
  },
  description:
    "Discover exercises, learn proper technique, and understand the muscles they target.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>
        <ToastProvider>
          <a className={styles.skipLink} href="#main-content">
            Skip to main content
          </a>
          <header className={styles.header}>
            <div className={styles.headerInner}>
              <Link className={styles.brand} href="/exercises">
                <Image
                  src="/logo.png"
                  alt=""
                  width={40}
                  height={40}
                  priority
                />
                <span>GYM Fitness</span>
              </Link>
              <nav aria-label="Primary navigation">
                <Link href="/exercises">Exercise library</Link>
              </nav>
            </div>
          </header>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
