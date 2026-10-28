-- CreateEnum
CREATE TYPE "TrainingGoal" AS ENUM (
  'GENERAL_FITNESS',
  'STRENGTH',
  'MUSCLE_GAIN',
  'ENDURANCE'
);

-- CreateEnum
CREATE TYPE "TrainingExperienceLevel" AS ENUM (
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED'
);

-- CreateTable
CREATE TABLE "TrainingPreferences" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "goal" "TrainingGoal" NOT NULL,
  "experienceLevel" "TrainingExperienceLevel" NOT NULL,
  "preferredSessionMinutes" INTEGER NOT NULL,
  "timezone" VARCHAR(64) NOT NULL,
  "availableEquipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "preferredTrainingDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TrainingPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingPreferences_userId_key"
ON "TrainingPreferences"("userId");

-- AddForeignKey
ALTER TABLE "TrainingPreferences"
ADD CONSTRAINT "TrainingPreferences_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
