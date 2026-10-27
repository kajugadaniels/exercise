import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ExerciseDetails } from "@/features/exercises/components/ExerciseDetails/ExerciseDetails";
import { exerciseGymGifsAdapter } from "@/features/exercises/providers/exercise-gym-gifs/adapter";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Exercise details",
};

type ExerciseDetailsPageProps = {
  params: Promise<{
    muscle: string;
    slug: string;
  }>;
};

export default async function ExerciseDetailsPage({
  params,
}: ExerciseDetailsPageProps) {
  await auth.protect();

  const { muscle, slug } = await params;
  const exercise = await exerciseGymGifsAdapter.getById(`${muscle}/${slug}`);

  if (!exercise) {
    notFound();
  }

  return (
    <main id="main-content" className={styles.page}>
      <ExerciseDetails exercise={exercise} />
    </main>
  );
}
