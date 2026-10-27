import { auth } from "@clerk/nextjs/server";
import { Navbar } from "@/components/layout/Navbar/Navbar";

type ExercisesLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function ExercisesLayout({
  children,
}: ExercisesLayoutProps) {
  await auth.protect();

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
