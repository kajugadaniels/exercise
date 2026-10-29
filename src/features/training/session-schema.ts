import { z } from "zod";

const calendarDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const exerciseIdPattern =
  /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

const setsSchema = z.number().int().min(1).max(50);
const repetitionsSchema = z.number().int().min(1).max(1_000);
const weightKilogramsSchema = z.number().min(0).max(1_000).multipleOf(0.25);

function isCalendarDate(value: string): boolean {
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);

  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
  );
}

export const scheduleExerciseSchema = z
  .object({
    exerciseId: z.string().trim().max(200).regex(exerciseIdPattern),
    repetitionsPerSet: repetitionsSchema,
    scheduledDate: z
      .string()
      .regex(calendarDatePattern, "Choose a valid date.")
      .refine(isCalendarDate, "Choose a valid date."),
    sets: setsSchema,
    weightKilograms: weightKilogramsSchema,
  })
  .strict();

export type ScheduleExerciseInput = z.infer<typeof scheduleExerciseSchema>;
