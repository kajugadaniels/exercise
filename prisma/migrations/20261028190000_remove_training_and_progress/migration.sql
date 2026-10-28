-- This migration intentionally removes the retired training and progress data.
DROP TABLE IF EXISTS "WorkoutSetLog";
DROP TABLE IF EXISTS "WorkoutSession";
DROP TABLE IF EXISTS "PlannedSet";
DROP TABLE IF EXISTS "WorkoutExercise";
DROP TABLE IF EXISTS "TrainingDay";
DROP TABLE IF EXISTS "TrainingWeek";
DROP TABLE IF EXISTS "TrainingPreferences";
DROP TABLE IF EXISTS "MeasurementSnapshot";

DROP TYPE IF EXISTS "WorkoutSessionStatus";
DROP TYPE IF EXISTS "TrainingDayStatus";
DROP TYPE IF EXISTS "TrainingPlanSource";
DROP TYPE IF EXISTS "TrainingDayKind";
DROP TYPE IF EXISTS "TrainingExperienceLevel";
DROP TYPE IF EXISTS "TrainingGoal";
