-- CreateEnum
CREATE TYPE "TrainingDayKind" AS ENUM ('WORKOUT', 'REST');

-- CreateEnum
CREATE TYPE "TrainingPlanSource" AS ENUM ('MANUAL', 'RECOMMENDED');

-- CreateEnum
CREATE TYPE "TrainingDayStatus" AS ENUM (
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'SKIPPED'
);

-- CreateEnum
CREATE TYPE "WorkoutSessionStatus" AS ENUM (
  'IN_PROGRESS',
  'COMPLETED',
  'ABANDONED'
);

-- CreateTable
CREATE TABLE "TrainingWeek" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "weekStart" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TrainingWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingDay" (
  "id" TEXT NOT NULL,
  "trainingWeekId" TEXT NOT NULL,
  "plannedDate" DATE NOT NULL,
  "kind" "TrainingDayKind" NOT NULL,
  "source" "TrainingPlanSource" NOT NULL,
  "status" "TrainingDayStatus" NOT NULL DEFAULT 'PLANNED',
  "availableMinutes" INTEGER,
  "preferredBodyPart" VARCHAR(50),
  "recommendationEngineVersion" VARCHAR(50),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TrainingDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutExercise" (
  "id" TEXT NOT NULL,
  "trainingDayId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "exerciseProvider" VARCHAR(50) NOT NULL,
  "exerciseSourceId" VARCHAR(200) NOT NULL,
  "exerciseSourceVersion" VARCHAR(50) NOT NULL,
  "exerciseAttributionUrl" VARCHAR(500) NOT NULL,
  "exerciseName" VARCHAR(160) NOT NULL,
  "exerciseCategory" VARCHAR(50),
  "exercisePrimaryMuscle" VARCHAR(50) NOT NULL,
  "exerciseSecondaryMuscles" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "exerciseBodyPart" VARCHAR(50),
  "exerciseEquipment" VARCHAR(50),
  "recommendationReasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkoutExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedSet" (
  "id" TEXT NOT NULL,
  "workoutExerciseId" TEXT NOT NULL,
  "setNumber" INTEGER NOT NULL,
  "targetRepetitions" INTEGER NOT NULL,
  "targetWeightGrams" INTEGER,
  "restSeconds" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PlannedSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
  "id" TEXT NOT NULL,
  "trainingDayId" TEXT NOT NULL,
  "status" "WorkoutSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSetLog" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "workoutExerciseId" TEXT NOT NULL,
  "plannedSetId" TEXT,
  "setNumber" INTEGER NOT NULL,
  "repetitions" INTEGER NOT NULL,
  "weightGrams" INTEGER,
  "effortRir" INTEGER,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkoutSetLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingWeek_userId_weekStart_key"
ON "TrainingWeek"("userId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingDay_trainingWeekId_plannedDate_key"
ON "TrainingDay"("trainingWeekId", "plannedDate");

-- CreateIndex
CREATE INDEX "TrainingDay_trainingWeekId_status_idx"
ON "TrainingDay"("trainingWeekId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutExercise_trainingDayId_position_key"
ON "WorkoutExercise"("trainingDayId", "position");

-- CreateIndex
CREATE INDEX "WorkoutExercise_exerciseProvider_exerciseSourceId_idx"
ON "WorkoutExercise"("exerciseProvider", "exerciseSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "PlannedSet_workoutExerciseId_setNumber_key"
ON "PlannedSet"("workoutExerciseId", "setNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSession_trainingDayId_key"
ON "WorkoutSession"("trainingDayId");

-- CreateIndex
CREATE INDEX "WorkoutSession_status_startedAt_idx"
ON "WorkoutSession"("status", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSetLog_plannedSetId_key"
ON "WorkoutSetLog"("plannedSetId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSetLog_sessionId_workoutExerciseId_setNumber_key"
ON "WorkoutSetLog"("sessionId", "workoutExerciseId", "setNumber");

-- CreateIndex
CREATE INDEX "WorkoutSetLog_sessionId_completedAt_idx"
ON "WorkoutSetLog"("sessionId", "completedAt");

-- CreateIndex
CREATE INDEX "WorkoutSetLog_workoutExerciseId_completedAt_idx"
ON "WorkoutSetLog"("workoutExerciseId", "completedAt");

-- AddForeignKey
ALTER TABLE "TrainingWeek"
ADD CONSTRAINT "TrainingWeek_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingDay"
ADD CONSTRAINT "TrainingDay_trainingWeekId_fkey"
FOREIGN KEY ("trainingWeekId") REFERENCES "TrainingWeek"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise"
ADD CONSTRAINT "WorkoutExercise_trainingDayId_fkey"
FOREIGN KEY ("trainingDayId") REFERENCES "TrainingDay"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedSet"
ADD CONSTRAINT "PlannedSet_workoutExerciseId_fkey"
FOREIGN KEY ("workoutExerciseId") REFERENCES "WorkoutExercise"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession"
ADD CONSTRAINT "WorkoutSession_trainingDayId_fkey"
FOREIGN KEY ("trainingDayId") REFERENCES "TrainingDay"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSetLog"
ADD CONSTRAINT "WorkoutSetLog_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSetLog"
ADD CONSTRAINT "WorkoutSetLog_workoutExerciseId_fkey"
FOREIGN KEY ("workoutExerciseId") REFERENCES "WorkoutExercise"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSetLog"
ADD CONSTRAINT "WorkoutSetLog_plannedSetId_fkey"
FOREIGN KEY ("plannedSetId") REFERENCES "PlannedSet"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
