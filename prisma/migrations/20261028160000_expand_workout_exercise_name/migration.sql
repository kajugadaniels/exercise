-- Match the validated provider exercise-name boundary used for snapshots.
ALTER TABLE "WorkoutExercise"
ALTER COLUMN "exerciseName" TYPE VARCHAR(180);
