-- Existing scheduled exercises retain NULL to represent an unknown prescription.
ALTER TABLE "TrainingSessionExercise"
ADD COLUMN "plannedSets" INTEGER,
ADD COLUMN "plannedRepetitionsPerSet" INTEGER,
ADD COLUMN "plannedWeightGrams" INTEGER;

ALTER TABLE "TrainingSessionExercise"
ADD CONSTRAINT "TrainingSessionExercise_plannedSets_check"
CHECK ("plannedSets" IS NULL OR "plannedSets" BETWEEN 1 AND 50),
ADD CONSTRAINT "TrainingSessionExercise_plannedRepetitionsPerSet_check"
CHECK (
  "plannedRepetitionsPerSet" IS NULL
  OR "plannedRepetitionsPerSet" BETWEEN 1 AND 1000
),
ADD CONSTRAINT "TrainingSessionExercise_plannedWeightGrams_check"
CHECK (
  "plannedWeightGrams" IS NULL
  OR (
    "plannedWeightGrams" BETWEEN 0 AND 1000000
    AND MOD("plannedWeightGrams", 250) = 0
  )
);
