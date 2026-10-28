import type {
  BodyPartId,
  EquipmentId,
  ExerciseCategory,
  MuscleId,
} from "@/features/exercises/domain/exercise";

export const TRAINING_WEEK_DAY_COUNT = 7;

export const trainingDayKinds = ["workout", "rest"] as const;
export const trainingPlanSources = ["manual", "recommended"] as const;
export const trainingDayStatuses = [
  "planned",
  "in-progress",
  "completed",
  "skipped",
] as const;
export const workoutSessionStatuses = [
  "in-progress",
  "completed",
  "abandoned",
] as const;

export type TrainingDayKind = (typeof trainingDayKinds)[number];
export type TrainingPlanSource = (typeof trainingPlanSources)[number];
export type TrainingDayStatus = (typeof trainingDayStatuses)[number];
export type WorkoutSessionStatus = (typeof workoutSessionStatuses)[number];

export type TrainingExerciseSnapshot = Readonly<{
  attributionUrl: string;
  bodyPart?: BodyPartId;
  category?: ExerciseCategory;
  equipment?: EquipmentId;
  name: string;
  primaryMuscle: MuscleId;
  provider: string;
  secondaryMuscles: readonly MuscleId[];
  sourceId: string;
  sourceVersion: string;
}>;

export type PlannedTrainingSet = Readonly<{
  restSeconds: number | null;
  setNumber: number;
  targetRepetitions: number;
  targetWeightGrams: number | null;
}>;

export type PlannedWorkoutExercise = Readonly<{
  exercise: TrainingExerciseSnapshot;
  position: number;
  recommendationReasons: readonly string[];
  sets: readonly PlannedTrainingSet[];
}>;

export type TrainingDayPlan = Readonly<{
  availableMinutes: number | null;
  exercises: readonly PlannedWorkoutExercise[];
  kind: TrainingDayKind;
  plannedDate: string;
  preferredBodyPart: BodyPartId | null;
  source: TrainingPlanSource;
  status: TrainingDayStatus;
}>;

export type TrainingWeekPlan = Readonly<{
  createdAt: string;
  days: readonly TrainingDayPlan[];
  isLocked: boolean;
  updatedAt: string;
  weekStart: string;
}>;

export type CompletedWorkoutSet = Readonly<{
  completedAt: string;
  effortRir: number | null;
  repetitions: number;
  setNumber: number;
  weightGrams: number | null;
}>;

export type WorkoutSessionRecord = Readonly<{
  completedAt: string | null;
  sets: readonly CompletedWorkoutSet[];
  startedAt: string;
  status: WorkoutSessionStatus;
}>;

export type PlannedSetIssue =
  | "set-number-invalid"
  | "repetitions-invalid"
  | "weight-invalid"
  | "rest-invalid";

const calendarDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const millisecondsPerDay = 86_400_000;

function getCalendarDateTimestamp(value: string): number | null {
  if (!calendarDatePattern.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const normalizedValue = new Date(timestamp).toISOString().slice(0, 10);

  return normalizedValue === value ? timestamp : null;
}

export function getCalendarDateInTimeZone(
  timeZone: string,
  instant: Date = new Date(),
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(instant);
  const partByType = new Map(parts.map((part) => [part.type, part.value]));
  const year = partByType.get("year");
  const month = partByType.get("month");
  const day = partByType.get("day");

  if (!year || !month || !day) {
    throw new Error("The calendar date could not be determined.");
  }

  return `${year}-${month}-${day}`;
}

export function isMondayCalendarDate(value: string): boolean {
  const timestamp = getCalendarDateTimestamp(value);

  return timestamp !== null && new Date(timestamp).getUTCDay() === 1;
}

export function getTrainingWeekDates(weekStart: string): readonly string[] {
  const startTimestamp = getCalendarDateTimestamp(weekStart);

  if (startTimestamp === null || !isMondayCalendarDate(weekStart)) {
    return [];
  }

  return Array.from({ length: TRAINING_WEEK_DAY_COUNT }, (_, index) =>
    new Date(startTimestamp + index * millisecondsPerDay)
      .toISOString()
      .slice(0, 10),
  );
}

export function getTrainingWeekStartForDate(
  calendarDate: string,
): string | null {
  const timestamp = getCalendarDateTimestamp(calendarDate);

  if (timestamp === null) {
    return null;
  }

  const dayOfWeek = new Date(timestamp).getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % TRAINING_WEEK_DAY_COUNT;

  return new Date(timestamp - daysSinceMonday * millisecondsPerDay)
    .toISOString()
    .slice(0, 10);
}

export function isDateInTrainingWeek(
  plannedDate: string,
  weekStart: string,
): boolean {
  const plannedTimestamp = getCalendarDateTimestamp(plannedDate);
  const startTimestamp = getCalendarDateTimestamp(weekStart);

  if (
    plannedTimestamp === null ||
    startTimestamp === null ||
    !isMondayCalendarDate(weekStart)
  ) {
    return false;
  }

  const endTimestamp =
    startTimestamp + TRAINING_WEEK_DAY_COUNT * millisecondsPerDay;

  return plannedTimestamp >= startTimestamp && plannedTimestamp < endTimestamp;
}

export function getPlannedSetIssues(
  plannedSet: PlannedTrainingSet,
): readonly PlannedSetIssue[] {
  const issues: PlannedSetIssue[] = [];

  if (!Number.isInteger(plannedSet.setNumber) || plannedSet.setNumber < 1) {
    issues.push("set-number-invalid");
  }

  if (
    !Number.isInteger(plannedSet.targetRepetitions) ||
    plannedSet.targetRepetitions < 1
  ) {
    issues.push("repetitions-invalid");
  }

  if (
    plannedSet.targetWeightGrams !== null &&
    (!Number.isInteger(plannedSet.targetWeightGrams) ||
      plannedSet.targetWeightGrams < 0)
  ) {
    issues.push("weight-invalid");
  }

  if (
    plannedSet.restSeconds !== null &&
    (!Number.isInteger(plannedSet.restSeconds) || plannedSet.restSeconds < 0)
  ) {
    issues.push("rest-invalid");
  }

  return issues;
}
