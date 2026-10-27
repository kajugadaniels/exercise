import { auth } from "@clerk/nextjs/server";
import { Navbar } from "@/components/layout/Navbar/Navbar";
import styles from "./layout.module.css";

type ProtectedLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  await auth.protect();

  return (
    <>
      <Navbar />
      <div className={styles.content}>{children}</div>
    </>
  );
}
