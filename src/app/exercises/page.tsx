import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { ExerciseLibrary } from "@/features/exercises/components/ExerciseLibrary/ExerciseLibrary";
import { exerciseGymGifsAdapter } from "@/features/exercises/providers/exercise-gym-gifs/adapter";
import {
  parseExerciseQuery,
  type ExerciseSearchParams,
} from "@/features/exercises/providers/exercise-gym-gifs/filters";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Exercise library",
  description:
    "Search and filter verified exercise metadata by muscle, equipment, body area, and category.",
};

type ExercisesPageProps = {
  searchParams: Promise<ExerciseSearchParams>;
};

export default async function ExercisesPage({
  searchParams,
}: ExercisesPageProps) {
  await auth.protect();

  const query = parseExerciseQuery(await searchParams);
  const [page, facets] = await Promise.all([
    exerciseGymGifsAdapter.list(query),
    exerciseGymGifsAdapter.facets(),
  ]);

  return (
    <main id="main-content" className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.context}>Exercise reference</p>
          <h1>Find the movement you need</h1>
        </div>
        <p>
          Search verified provider metadata, narrow the library by training
          context, and open an exercise to explore its target muscles.
        </p>
      </header>

      <ExerciseLibrary page={page} facets={facets} query={query} />
    </main>
  );
}
