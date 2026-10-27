-- Refuse to guess how legacy values should map to the new binary profile field.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "UserProfile"
    WHERE "gender"::text NOT IN ('WOMAN', 'MAN')
  ) THEN
    RAISE EXCEPTION 'Resolve non-binary legacy profile values before applying this migration.';
  END IF;
END $$;

ALTER TABLE "UserProfile" DROP COLUMN "genderDescription";

-- Replace the enum while preserving the two supported legacy values.
ALTER TYPE "Gender" RENAME TO "Gender_old";

CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE');

ALTER TABLE "UserProfile"
ALTER COLUMN "gender" TYPE "Gender"
USING (
  CASE "gender"::text
    WHEN 'WOMAN' THEN 'FEMALE'
    WHEN 'MAN' THEN 'MALE'
  END
)::"Gender";

DROP TYPE "Gender_old";
