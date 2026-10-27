-- CreateEnum
CREATE TYPE "Gender" AS ENUM (
  'WOMAN',
  'MAN',
  'NON_BINARY',
  'SELF_DESCRIBED',
  'PREFER_NOT_TO_SAY'
);

-- CreateTable
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "clerkUserId" VARCHAR(64) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "gender" "Gender" NOT NULL,
  "genderDescription" VARCHAR(80),
  "heightCentimeters" INTEGER NOT NULL,
  "weightGrams" INTEGER NOT NULL,
  "country" VARCHAR(80) NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeasurementSnapshot" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "heightCentimeters" INTEGER NOT NULL,
  "weightGrams" INTEGER NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MeasurementSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "UserProfile_updatedAt_idx" ON "UserProfile"("updatedAt");

-- CreateIndex
CREATE INDEX "MeasurementSnapshot_userId_recordedAt_idx"
ON "MeasurementSnapshot"("userId", "recordedAt");

-- AddForeignKey
ALTER TABLE "UserProfile"
ADD CONSTRAINT "UserProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeasurementSnapshot"
ADD CONSTRAINT "MeasurementSnapshot_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
