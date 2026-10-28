-- CreateTable
CREATE TABLE "TrainingSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "scheduledDate" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSessionExercise" (
  "id" TEXT NOT NULL,
  "trainingSessionId" TEXT NOT NULL,
  "exerciseProvider" VARCHAR(50) NOT NULL,
  "exerciseSourceId" VARCHAR(200) NOT NULL,
  "exerciseSourceVersion" VARCHAR(50) NOT NULL,
  "exerciseAttributionUrl" VARCHAR(500) NOT NULL,
  "exerciseName" VARCHAR(180) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TrainingSessionExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingSession_userId_scheduledDate_key"
ON "TrainingSession"("userId", "scheduledDate");

-- CreateIndex
CREATE INDEX "TrainingSession_userId_scheduledDate_idx"
ON "TrainingSession"("userId", "scheduledDate");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingSessionExercise_trainingSessionId_exerciseProvider_exerciseSourceId_key"
ON "TrainingSessionExercise"(
  "trainingSessionId",
  "exerciseProvider",
  "exerciseSourceId"
);

-- CreateIndex
CREATE INDEX "TrainingSessionExercise_trainingSessionId_createdAt_idx"
ON "TrainingSessionExercise"("trainingSessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "TrainingSession"
ADD CONSTRAINT "TrainingSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSessionExercise"
ADD CONSTRAINT "TrainingSessionExercise_trainingSessionId_fkey"
FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
