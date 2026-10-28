"use client";

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import {
  Activity01Icon,
  ArrowLeft01Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Dumbbell01Icon,
  RepeatIcon,
  Timer02Icon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { Input } from "@/components/ui/Input/Input";
import { useToast } from "@/components/ui/Toast/Toast";
import { formatExerciseValue } from "@/features/exercises/domain/exercise";
import {
  workoutExecutionResponseSchema,
  workoutSessionActionSchema,
  type WorkoutExecutionView,
  type WorkoutSetAction,
} from "../../workout-session-schema";
import {
  getNextIncompleteSet,
  getWorkoutProgress,
} from "../../workout-progress";
import styles from "./WorkoutSession.module.css";

type WorkoutSessionProps = Readonly<{
  initialWorkout: WorkoutExecutionView;
  planHref: string;
}>;

type SetDraft = {
  effortRir: string;
  repetitions: string;
  weightKilograms: string;
};

type SetDrafts = Record<string, SetDraft>;

function getSetKey(exercisePosition: number, setNumber: number): string {
  return `${exercisePosition}:${setNumber}`;
}

function createSetDrafts(workout: WorkoutExecutionView): SetDrafts {
  const shouldUsePlannedDefaults =
    workout.session === null || workout.session.status === "in-progress";

  return Object.fromEntries(
    workout.exercises.flatMap((exercise) =>
      exercise.sets.map((set) => [
        getSetKey(exercise.position, set.setNumber),
        {
          repetitions: String(
            set.actual?.repetitions ??
              (shouldUsePlannedDefaults ? set.targetRepetitions : ""),
          ),
          weightKilograms:
            set.actual?.weightGrams !== null &&
            set.actual?.weightGrams !== undefined
              ? String(set.actual.weightGrams / 1_000)
              : set.targetWeightGrams === null || !shouldUsePlannedDefaults
                ? ""
                : String(set.targetWeightGrams / 1_000),
          effortRir:
            set.actual?.effortRir === null ||
            set.actual?.effortRir === undefined
              ? ""
              : String(set.actual.effortRir),
        },
      ]),
    ),
  );
}

function apiErrorMessage(payload: unknown): string | null {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("error" in payload) ||
    typeof payload.error !== "object" ||
    payload.error === null ||
    !("message" in payload.error) ||
    typeof payload.error.message !== "string"
  ) {
    return null;
  }

  return payload.error.message;
}

function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3_600);
  const minutes = Math.floor((safeSeconds % 3_600) / 60);
  const seconds = safeSeconds % 60;

  return hours > 0
    ? [hours, minutes, seconds]
        .map((value) => String(value).padStart(2, "0"))
        .join(":")
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function WorkoutSession({
  initialWorkout,
  planHref,
}: WorkoutSessionProps) {
  const { showToast } = useToast();
  const [workout, setWorkout] = useState(initialWorkout);
  const initialPointer = getNextIncompleteSet(initialWorkout);
  const [selectedExercisePosition, setSelectedExercisePosition] = useState(
    initialPointer?.exercisePosition ?? initialWorkout.exercises[0].position,
  );
  const [drafts, setDrafts] = useState<SetDrafts>(() =>
    createSetDrafts(initialWorkout),
  );
  const [isStarting, setIsStarting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [savingSetKey, setSavingSetKey] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(0);
  const [clockTime, setClockTime] = useState(() => {
    const initialTime =
      initialWorkout.session?.completedAt ??
      initialWorkout.session?.startedAt ??
      "1970-01-01T00:00:00.000Z";
    return new Date(initialTime).getTime();
  });

  const progress = useMemo(() => getWorkoutProgress(workout), [workout]);
  const selectedExercise =
    workout.exercises.find(
      (exercise) => exercise.position === selectedExercisePosition,
    ) ?? workout.exercises[0];
  const isActive = workout.session?.status === "in-progress";
  const hasEnded =
    workout.session?.status === "completed" ||
    workout.session?.status === "abandoned";
  const sessionEndTime = workout.session?.completedAt
    ? new Date(workout.session.completedAt).getTime()
    : clockTime;
  const elapsedSeconds = workout.session
    ? (sessionEndTime - new Date(workout.session.startedAt).getTime()) / 1_000
    : 0;

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const timer = window.setInterval(() => setClockTime(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [isActive]);

  useEffect(() => {
    if (restSecondsRemaining <= 0) {
      return;
    }

    const timer = window.setInterval(
      () => setRestSecondsRemaining((current) => Math.max(0, current - 1)),
      1_000,
    );
    return () => window.clearInterval(timer);
  }, [restSecondsRemaining]);

  async function requestWorkout(
    method: "POST" | "PATCH",
    body?: unknown,
  ): Promise<WorkoutExecutionView> {
    const response = await fetch(
      `/api/training/workouts/${workout.plannedDate}`,
      {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    const payload: unknown = await response.json();

    if (!response.ok) {
      throw new Error(
        apiErrorMessage(payload) ?? "Your workout could not be updated.",
      );
    }

    const result = workoutExecutionResponseSchema.safeParse(payload);
    if (!result.success) {
      throw new Error("The workout returned an unexpected response.");
    }

    return result.data.data;
  }

  function applyWorkout(nextWorkout: WorkoutExecutionView) {
    setWorkout(nextWorkout);
    setDrafts(createSetDrafts(nextWorkout));

    const nextSet = getNextIncompleteSet(nextWorkout);
    if (nextSet) {
      setSelectedExercisePosition(nextSet.exercisePosition);
    }
  }

  function updateDraft(
    exercisePosition: number,
    setNumber: number,
    field: keyof SetDraft,
    value: string,
  ) {
    const key = getSetKey(exercisePosition, setNumber);
    setDrafts((current) => ({
      ...current,
      [key]: { ...current[key], [field]: value },
    }));
    setFormError(null);
  }

  async function startWorkout() {
    setIsStarting(true);
    setFormError(null);

    try {
      const nextWorkout = await requestWorkout("POST");
      applyWorkout(nextWorkout);
      setClockTime(Date.now());
      showToast({
        tone: "success",
        title: "Workout started",
        message: "Record each set as you complete it.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The workout could not start.";
      setFormError(message);
      showToast({ tone: "error", title: "Start failed", message });
    } finally {
      setIsStarting(false);
    }
  }

  async function recordSet(
    exercisePosition: number,
    setNumber: number,
    restSeconds: number | null,
  ) {
    const key = getSetKey(exercisePosition, setNumber);
    const draft = drafts[key];
    const action: WorkoutSetAction = {
      action: "record-set",
      exercisePosition,
      setNumber,
      repetitions: Number(draft?.repetitions),
      weightKilograms:
        draft?.weightKilograms.trim() === ""
          ? null
          : Number(draft?.weightKilograms),
      effortRir:
        draft?.effortRir.trim() === "" ? null : Number(draft?.effortRir),
    };
    const result = workoutSessionActionSchema.safeParse(action);

    if (!result.success) {
      setFormError(
        result.error.issues[0]?.message ?? "Review this set and try again.",
      );
      return;
    }

    if (result.data.action !== "record-set") {
      setFormError("Review this set and try again.");
      return;
    }

    setSavingSetKey(key);
    setFormError(null);

    try {
      const nextWorkout = await requestWorkout("PATCH", result.data);
      applyWorkout(nextWorkout);
      setRestSecondsRemaining(restSeconds ?? 0);
      showToast({
        tone: "success",
        title: "Set recorded",
        message: `Set ${setNumber} is saved in your workout history.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "This set could not be saved.";
      setFormError(message);
      showToast({ tone: "error", title: "Set not saved", message });
    } finally {
      setSavingSetKey(null);
    }
  }

  async function finishWorkout(outcome: "complete" | "abandon") {
    if (
      outcome === "abandon" &&
      !window.confirm(
        "End this workout early? Recorded sets will remain in your history.",
      )
    ) {
      return;
    }

    setIsFinishing(true);
    setFormError(null);

    try {
      const nextWorkout = await requestWorkout("PATCH", { action: outcome });
      applyWorkout(nextWorkout);
      setRestSecondsRemaining(0);
      showToast({
        tone: outcome === "complete" ? "success" : "info",
        title: outcome === "complete" ? "Workout completed" : "Workout ended",
        message:
          outcome === "complete"
            ? "Every recorded set is now part of your history."
            : "Your completed sets were kept in your history.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The workout could not be finished.";
      setFormError(message);
      showToast({ tone: "error", title: "Update failed", message });
    } finally {
      setIsFinishing(false);
    }
  }

  return (
    <section className={styles.session} aria-labelledby="workout-session-title">
      <header className={styles.sessionHeader}>
        <div>
          <p>{hasEnded ? "Workout record" : "Workout session"}</p>
          <h2 id="workout-session-title">
            {workout.session?.status === "completed"
              ? "Workout completed"
              : workout.session?.status === "abandoned"
                ? "Workout ended early"
                : workout.session
                  ? "Workout in progress"
                  : "Ready when you are"}
          </h2>
        </div>

        <div className={styles.sessionStats} aria-label="Workout summary">
          <span>
            <Icon icon={Clock01Icon} size={18} />
            {workout.session
              ? formatDuration(elapsedSeconds)
              : `${workout.availableMinutes ?? "—"} min`}
          </span>
          <span>
            <Icon icon={Activity01Icon} size={18} />
            {progress.completedSets}/{progress.totalSets} sets
          </span>
        </div>
      </header>

      <div className={styles.progressTrack} aria-hidden="true">
        <span
          style={
            {
              "--workout-progress": `${progress.percentage}%`,
            } as CSSProperties
          }
        />
      </div>
      <p className={styles.progressText} aria-live="polite">
        {progress.percentage}% complete
      </p>

      {!workout.session && (
        <div className={styles.readyState}>
          <span className={styles.readyIcon} aria-hidden="true">
            <Icon icon={Dumbbell01Icon} size={24} />
          </span>
          <div>
            <h3>{workout.exercises.length} planned exercises</h3>
            <p>
              Starting locks this weekly plan and begins the session timer.
              Actual sets are saved one at a time.
            </p>
          </div>
          <Button isLoading={isStarting} onClick={startWorkout}>
            Start workout
          </Button>
        </div>
      )}

      {restSecondsRemaining > 0 && isActive && (
        <section
          className={styles.restTimer}
          role="timer"
          aria-label={`Recovery time remaining: ${formatDuration(restSecondsRemaining)}`}
        >
          <Icon icon={Timer02Icon} size={24} />
          <div>
            <span>Recovery timer</span>
            <strong>{formatDuration(restSecondsRemaining)}</strong>
          </div>
          <button type="button" onClick={() => setRestSecondsRemaining(0)}>
            Skip rest
          </button>
        </section>
      )}

      <nav className={styles.exerciseRail} aria-label="Workout exercises">
        {workout.exercises.map((exercise) => {
          const completedSets = exercise.sets.filter(
            (set) => set.actual !== null,
          ).length;

          return (
            <button
              type="button"
              aria-pressed={exercise.position === selectedExercise.position}
              key={exercise.position}
              onClick={() => setSelectedExercisePosition(exercise.position)}
            >
              <span>{exercise.position}</span>
              <strong>{exercise.name}</strong>
              <small>
                {completedSets}/{exercise.sets.length} sets
              </small>
            </button>
          );
        })}
      </nav>

      <article className={styles.exerciseLane}>
        <header className={styles.exerciseHeader}>
          <div>
            <p>Exercise {selectedExercise.position}</p>
            <h3>{selectedExercise.name}</h3>
          </div>
          {selectedExercise.equipment && (
            <span>{formatExerciseValue(selectedExercise.equipment)}</span>
          )}
        </header>

        <ol className={styles.sets}>
          {selectedExercise.sets.map((set) => {
            const key = getSetKey(selectedExercise.position, set.setNumber);
            const draft = drafts[key];
            const isRecorded = set.actual !== null;

            return (
              <li className={styles.set} data-recorded={isRecorded} key={key}>
                <div className={styles.setIdentity}>
                  <span aria-hidden="true">
                    {isRecorded ? (
                      <Icon icon={CheckmarkCircle02Icon} size={20} />
                    ) : (
                      set.setNumber
                    )}
                  </span>
                  <div>
                    <h4>Set {set.setNumber}</h4>
                    <p>
                      Target {set.targetRepetitions} reps
                      {set.targetWeightGrams === null
                        ? " · bodyweight"
                        : ` · ${set.targetWeightGrams / 1_000} kg`}
                    </p>
                    <span className={styles.setStatus}>
                      {isRecorded ? "Recorded" : "Not recorded"}
                    </span>
                  </div>
                </div>

                <div className={styles.setFields}>
                  <Input
                    id={`${key}-repetitions`}
                    label="Actual reps"
                    icon={RepeatIcon}
                    inputMode="numeric"
                    min={1}
                    max={1_000}
                    type="number"
                    value={draft?.repetitions ?? ""}
                    disabled={!isActive || savingSetKey === key}
                    onChange={(event) =>
                      updateDraft(
                        selectedExercise.position,
                        set.setNumber,
                        "repetitions",
                        event.target.value,
                      )
                    }
                  />
                  <Input
                    id={`${key}-weight`}
                    label="Actual weight (kg)"
                    icon={WeightScale01Icon}
                    inputMode="decimal"
                    min={0}
                    max={1_000}
                    step="0.001"
                    placeholder="Bodyweight"
                    type="number"
                    value={draft?.weightKilograms ?? ""}
                    disabled={!isActive || savingSetKey === key}
                    onChange={(event) =>
                      updateDraft(
                        selectedExercise.position,
                        set.setNumber,
                        "weightKilograms",
                        event.target.value,
                      )
                    }
                  />
                  <Input
                    id={`${key}-effort`}
                    label="Reps left in reserve"
                    icon={Activity01Icon}
                    inputMode="numeric"
                    min={0}
                    max={10}
                    placeholder="Optional"
                    type="number"
                    value={draft?.effortRir ?? ""}
                    disabled={!isActive || savingSetKey === key}
                    onChange={(event) =>
                      updateDraft(
                        selectedExercise.position,
                        set.setNumber,
                        "effortRir",
                        event.target.value,
                      )
                    }
                  />
                </div>

                {isActive && (
                  <Button
                    size="compact"
                    variant={isRecorded ? "secondary" : "primary"}
                    isLoading={savingSetKey === key}
                    disabled={savingSetKey !== null || isFinishing}
                    onClick={() =>
                      recordSet(
                        selectedExercise.position,
                        set.setNumber,
                        set.restSeconds,
                      )
                    }
                  >
                    {isRecorded ? "Update set" : "Record set"}
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
      </article>

      {formError && (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      )}

      <footer className={styles.actions}>
        <Link href={planHref}>
          <Icon icon={ArrowLeft01Icon} size={18} />
          Back to plan
        </Link>
        {isActive && (
          <div>
            <Button
              variant="ghost"
              disabled={savingSetKey !== null || isFinishing}
              onClick={() => finishWorkout("abandon")}
            >
              <Icon icon={CancelCircleIcon} size={18} />
              End early
            </Button>
            <Button
              disabled={
                progress.completedSets !== progress.totalSets ||
                savingSetKey !== null ||
                isFinishing
              }
              isLoading={isFinishing}
              onClick={() => finishWorkout("complete")}
            >
              <Icon icon={CheckmarkCircle02Icon} size={18} />
              Complete workout
            </Button>
          </div>
        )}
      </footer>
    </section>
  );
}
