import type {
  TrainingSessionCalendarExercise,
  TrainingSessionCalendarItem,
} from "./session-schema";

export type CalendarMonth = Readonly<{
  monthIndex: number;
  year: number;
}>;

export type CalendarDay = Readonly<{
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
}>;

const calendarDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCalendarDate(value: string): boolean {
  if (!calendarDatePattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isNullableIntegerInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number | null {
  return (
    value === null ||
    (typeof value === "number" &&
      Number.isInteger(value) &&
      value >= minimum &&
      value <= maximum)
  );
}

function isNullableWeight(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 1_000 &&
      Number.isInteger(value * 4))
  );
}

function parseExercise(
  value: unknown,
): TrainingSessionCalendarExercise | null {
  if (
    !isRecord(value) ||
    typeof value.exerciseId !== "string" ||
    value.exerciseId.length < 3 ||
    value.exerciseId.length > 200 ||
    typeof value.name !== "string" ||
    value.name.length < 1 ||
    value.name.length > 180 ||
    !isNullableIntegerInRange(value.repetitionsPerSet, 1, 1_000) ||
    !isNullableIntegerInRange(value.sets, 1, 50) ||
    !isNullableWeight(value.weightKilograms)
  ) {
    return null;
  }

  return {
    exerciseId: value.exerciseId,
    name: value.name,
    repetitionsPerSet: value.repetitionsPerSet,
    sets: value.sets,
    weightKilograms: value.weightKilograms,
  };
}

export function getLocalCalendarMonth(date = new Date()): CalendarMonth {
  return { monthIndex: date.getMonth(), year: date.getFullYear() };
}

export function getLocalCalendarDate(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getCalendarMonthKey(month: CalendarMonth): string {
  return `${month.year}-${pad(month.monthIndex + 1)}`;
}

export function shiftCalendarMonth(
  month: CalendarMonth,
  amount: number,
): CalendarMonth {
  const date = new Date(Date.UTC(month.year, month.monthIndex + amount, 1));
  return { monthIndex: date.getUTCMonth(), year: date.getUTCFullYear() };
}

export function createCalendarDays(month: CalendarMonth): CalendarDay[] {
  const firstDay = new Date(Date.UTC(month.year, month.monthIndex, 1));
  const mondayOffset = (firstDay.getUTCDay() + 6) % 7;
  const firstCell = new Date(
    Date.UTC(month.year, month.monthIndex, 1 - mondayOffset),
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCell);
    date.setUTCDate(firstCell.getUTCDate() + index);

    return {
      date: date.toISOString().slice(0, 10),
      dayNumber: date.getUTCDate(),
      isCurrentMonth: date.getUTCMonth() === month.monthIndex,
    };
  });
}

export function parseTrainingSessionsPayload(
  payload: unknown,
): readonly TrainingSessionCalendarItem[] | null {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    return null;
  }

  const { sessions } = payload.data;
  if (!Array.isArray(sessions) || sessions.length > 31) {
    return null;
  }

  const parsedSessions: TrainingSessionCalendarItem[] = [];
  const seenDates = new Set<string>();

  for (const session of sessions) {
    if (
      !isRecord(session) ||
      typeof session.date !== "string" ||
      !isCalendarDate(session.date) ||
      seenDates.has(session.date) ||
      !Array.isArray(session.exercises) ||
      session.exercises.length > 2_000
    ) {
      return null;
    }

    seenDates.add(session.date);

    const exercises: TrainingSessionCalendarExercise[] = [];
    for (const value of session.exercises) {
      const exercise = parseExercise(value);
      if (!exercise) {
        return null;
      }
      exercises.push(exercise);
    }

    parsedSessions.push({
      date: session.date,
      exercises,
    });
  }

  return parsedSessions;
}
