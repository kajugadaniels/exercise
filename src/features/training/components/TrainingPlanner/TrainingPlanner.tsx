"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Add01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BedIcon,
  BodyPartMuscleIcon,
  Clock01Icon,
  Delete02Icon,
  Dumbbell01Icon,
  RepeatIcon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { Input } from "@/components/ui/Input/Input";
import { useToast } from "@/components/ui/Toast/Toast";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import {
  bodyPartIds,
  formatExerciseValue,
} from "@/features/exercises/domain/exercise";
import type { TrainingWeekPlan } from "../../domain/training";
import {
  createDefaultSet,
  createEmptyTrainingWeek,
  createTrainingWeekEditor,
  getAdjacentWeekStart,
  toTrainingWeekInput,
  type ExercisePickerValue,
  type TrainingDayEditorValue,
  type TrainingWeekEditorValue,
} from "../../training-week-editor";
import { createTrainingWeekInputSchema } from "../../training-week-schema";
import { ExercisePicker } from "../ExercisePicker/ExercisePicker";
import styles from "./TrainingPlanner.module.css";

type TrainingPlannerProps = Readonly<{
  currentWeekStart: string;
  initialPlan: TrainingWeekPlan | null;
  weekStart: string;
}>;

const dayFormatter = new Intl.DateTimeFormat("en", {
  timeZone: "UTC",
  weekday: "short",
});
const dayNumberFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  timeZone: "UTC",
});
const fullDateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  weekday: "long",
});
const rangeDateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function toDisplayDate(value: string): Date {
  return new Date(`${value}T12:00:00.000Z`);
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

export function TrainingPlanner({
  currentWeekStart,
  initialPlan,
  weekStart,
}: TrainingPlannerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editor, setEditor] = useState<TrainingWeekEditorValue>(() =>
    createTrainingWeekEditor(weekStart, initialPlan),
  );
  const [activeDate, setActiveDate] = useState(editor.days[0]?.plannedDate ?? "");
  const [hasSavedPlan, setHasSavedPlan] = useState(initialPlan !== null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isLocked = initialPlan?.isLocked ?? false;
  const isBusy = isSaving || isDeleting;
  const activeDay =
    editor.days.find((day) => day.plannedDate === activeDate) ?? editor.days[0];

  const summary = useMemo(() => {
    const workoutDays = editor.days.filter((day) => day.kind === "workout");
    return {
      workoutDays: workoutDays.length,
      exercises: workoutDays.reduce(
        (total, day) => total + day.exercises.length,
        0,
      ),
      minutes: workoutDays.reduce(
        (total, day) => total + (Number(day.availableMinutes) || 0),
        0,
      ),
    };
  }, [editor.days]);

  const weekEnd = editor.days.at(-1)?.plannedDate ?? weekStart;
  const selectedExerciseIds = activeDay?.exercises.map(
    (exercise) => exercise.exerciseId,
  ) ?? [];

  function updateActiveDay(
    update: (day: TrainingDayEditorValue) => TrainingDayEditorValue,
  ) {
    setEditor((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.plannedDate === activeDate ? update(day) : day,
      ),
    }));
    setIsDirty(true);
    setFormError(null);
  }

  function setDayKind(kind: "rest" | "workout") {
    if (!activeDay || activeDay.kind === kind) {
      return;
    }

    if (
      kind === "rest" &&
      activeDay.exercises.length > 0 &&
      !window.confirm(
        "Mark this as a rest day? Its planned exercises will be removed.",
      )
    ) {
      return;
    }

    updateActiveDay((day) => ({
      ...day,
      kind,
      exercises: kind === "rest" ? [] : day.exercises,
    }));
  }

  function addExercise(exercise: ExercisePickerValue) {
    updateActiveDay((day) => ({
      ...day,
      exercises: [
        ...day.exercises,
        {
          exerciseId: exercise.id,
          name: exercise.name,
          sets: [createDefaultSet()],
        },
      ],
    }));
    setIsPickerOpen(false);
  }

  function removeExercise(exerciseId: string) {
    updateActiveDay((day) => ({
      ...day,
      exercises: day.exercises.filter(
        (exercise) => exercise.exerciseId !== exerciseId,
      ),
    }));
  }

  function addSet(exerciseId: string) {
    updateActiveDay((day) => ({
      ...day,
      exercises: day.exercises.map((exercise) => {
        if (exercise.exerciseId !== exerciseId) {
          return exercise;
        }

        const previousSet = exercise.sets.at(-1);
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            previousSet ? { ...previousSet } : createDefaultSet(),
          ],
        };
      }),
    }));
  }

  function removeSet(exerciseId: string, setIndex: number) {
    updateActiveDay((day) => ({
      ...day,
      exercises: day.exercises.map((exercise) =>
        exercise.exerciseId === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.filter((_, index) => index !== setIndex),
            }
          : exercise,
      ),
    }));
  }

  function updateSet(
    exerciseId: string,
    setIndex: number,
    field: "repetitions" | "restSeconds" | "weightKilograms",
    value: string,
  ) {
    updateActiveDay((day) => ({
      ...day,
      exercises: day.exercises.map((exercise) =>
        exercise.exerciseId === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set, index) =>
                index === setIndex ? { ...set, [field]: value } : set,
              ),
            }
          : exercise,
      ),
    }));
  }

  function navigateToWeek(nextWeekStart: string) {
    if (
      isDirty &&
      !window.confirm("Leave this week without saving your changes?")
    ) {
      return;
    }

    router.push(
      `${AUTH_ROUTES.training}?week=${encodeURIComponent(nextWeekStart)}`,
    );
  }

  async function saveWeek() {
    const input = toTrainingWeekInput(editor);
    const result = createTrainingWeekInputSchema(weekStart).safeParse(input);

    if (!result.success) {
      setFormError(
        result.error.issues[0]?.message ??
          "Review the training week before saving.",
      );
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const response = await fetch(`/api/training/weeks/${weekStart}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          apiErrorMessage(payload) ?? "Your training week could not be saved.",
        );
      }

      setHasSavedPlan(true);
      setIsDirty(false);
      showToast({
        tone: "success",
        title: "Training week saved",
        message: "Your Monday through Sunday plan is ready.",
      });
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Your training week could not be saved.";
      setFormError(message);
      showToast({ tone: "error", title: "Save failed", message });
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteWeek() {
    if (
      !window.confirm(
        "Delete this weekly plan? Recorded workout history will remain protected.",
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setFormError(null);

    try {
      const response = await fetch(`/api/training/weeks/${weekStart}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload: unknown = await response.json();
        throw new Error(
          apiErrorMessage(payload) ??
            "Your training week could not be deleted.",
        );
      }

      const emptyWeek = createEmptyTrainingWeek(weekStart);
      setEditor(emptyWeek);
      setActiveDate(emptyWeek.days[0]?.plannedDate ?? "");
      setHasSavedPlan(false);
      setIsDirty(false);
      showToast({
        tone: "info",
        title: "Training week deleted",
        message: "The week is ready for a new plan.",
      });
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Your training week could not be deleted.";
      setFormError(message);
      showToast({ tone: "error", title: "Delete failed", message });
    } finally {
      setIsDeleting(false);
    }
  }

  if (!activeDay) {
    return (
      <div className={styles.formError} role="alert">
        This week could not be prepared. Choose another week and try again.
      </div>
    );
  }

  return (
    <section className={styles.planner} aria-labelledby="planner-title">
      <header className={styles.toolbar}>
        <div className={styles.weekIdentity}>
          <p className={styles.kicker}>Weekly plan</p>
          <h2 id="planner-title">
            {rangeDateFormatter.format(toDisplayDate(weekStart))} –{" "}
            {rangeDateFormatter.format(toDisplayDate(weekEnd))}
          </h2>
          <p>
            {summary.workoutDays} workout days · {summary.exercises} exercises ·{" "}
            {summary.minutes} planned minutes
          </p>
        </div>

        <div className={styles.weekNavigation} aria-label="Choose training week">
          <button
            className={styles.iconButton}
            type="button"
            aria-label="Previous week"
            onClick={() =>
              navigateToWeek(getAdjacentWeekStart(weekStart, "previous"))
            }
          >
            <Icon icon={ArrowLeft01Icon} size={20} />
          </button>
          <button
            className={styles.todayButton}
            type="button"
            aria-current={weekStart === currentWeekStart ? "date" : undefined}
            onClick={() => navigateToWeek(currentWeekStart)}
          >
            This week
          </button>
          <button
            className={styles.iconButton}
            type="button"
            aria-label="Next week"
            onClick={() =>
              navigateToWeek(getAdjacentWeekStart(weekStart, "next"))
            }
          >
            <Icon icon={ArrowRight01Icon} size={20} />
          </button>
        </div>
      </header>

      {isLocked && (
        <div className={styles.lockedMessage} role="status">
          <strong>This week contains recorded activity.</strong>
          <span>The plan is read-only so your workout history stays intact.</span>
        </div>
      )}

      <nav className={styles.dayRail} aria-label="Days in this training week">
        {editor.days.map((day) => {
          const date = toDisplayDate(day.plannedDate);
          const isActive = day.plannedDate === activeDate;

          return (
            <button
              className={styles.dayTab}
              data-kind={day.kind}
              type="button"
              aria-pressed={isActive}
              aria-controls="active-training-day"
              key={day.plannedDate}
              onClick={() => setActiveDate(day.plannedDate)}
            >
              <span>{dayFormatter.format(date)}</span>
              <strong>{dayNumberFormatter.format(date)}</strong>
              <small>
                {day.kind === "rest"
                  ? "Rest"
                  : `${day.exercises.length} ${
                      day.exercises.length === 1 ? "exercise" : "exercises"
                    }`}
              </small>
            </button>
          );
        })}
      </nav>

      <div
        className={styles.editor}
        id="active-training-day"
      >
        <div className={styles.dayHeader}>
          <div>
            <p>{fullDateFormatter.format(toDisplayDate(activeDay.plannedDate))}</p>
            <h3>{activeDay.kind === "rest" ? "Recovery day" : "Workout plan"}</h3>
          </div>

          <fieldset className={styles.kindSelector} disabled={isLocked || isBusy}>
            <legend className={styles.visuallyHidden}>Day type</legend>
            <label>
              <input
                type="radio"
                name={`day-kind-${activeDay.plannedDate}`}
                value="workout"
                checked={activeDay.kind === "workout"}
                onChange={() => setDayKind("workout")}
              />
              <Icon icon={Dumbbell01Icon} size={18} />
              Workout
            </label>
            <label>
              <input
                type="radio"
                name={`day-kind-${activeDay.plannedDate}`}
                value="rest"
                checked={activeDay.kind === "rest"}
                onChange={() => setDayKind("rest")}
              />
              <Icon icon={BedIcon} size={18} />
              Rest
            </label>
          </fieldset>
        </div>

        {activeDay.kind === "rest" ? (
          <div className={styles.restState}>
            <span aria-hidden="true">
              <Icon icon={BedIcon} size={24} />
            </span>
            <div>
              <h4>Recovery is part of the plan</h4>
              <p>
                This day will be saved without exercises. Switch to workout if
                you want to schedule training.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.daySettings}>
              <Input
                id={`duration-${activeDay.plannedDate}`}
                label="Available minutes"
                icon={Clock01Icon}
                type="number"
                inputMode="numeric"
                min={15}
                max={480}
                value={activeDay.availableMinutes}
                disabled={isLocked || isBusy}
                onChange={(event) =>
                  updateActiveDay((day) => ({
                    ...day,
                    availableMinutes: event.target.value,
                  }))
                }
              />

              <label className={styles.selectField}>
                <span>Focus area</span>
                <span className={styles.selectControl}>
                  <Icon icon={BodyPartMuscleIcon} size={20} />
                  <select
                    value={activeDay.preferredBodyPart ?? ""}
                    disabled={isLocked || isBusy}
                    onChange={(event) =>
                      updateActiveDay((day) => ({
                        ...day,
                        preferredBodyPart:
                          bodyPartIds.find(
                            (bodyPart) => bodyPart === event.target.value,
                          ) ?? null,
                      }))
                    }
                  >
                    <option value="">No specific focus</option>
                    {bodyPartIds.map((bodyPart) => (
                      <option value={bodyPart} key={bodyPart}>
                        {formatExerciseValue(bodyPart)}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            </div>

            <div className={styles.exerciseHeading}>
              <div>
                <h4>Exercises</h4>
                <p>Sets are performed in the order shown.</p>
              </div>
              {!isLocked && (
                <Button
                  type="button"
                  size="compact"
                  variant="secondary"
                  disabled={isBusy || activeDay.exercises.length >= 12}
                  onClick={() => setIsPickerOpen(true)}
                >
                  <Icon icon={Add01Icon} size={18} />
                  Add exercise
                </Button>
              )}
            </div>

            {activeDay.exercises.length === 0 ? (
              <div className={styles.exerciseEmpty}>
                <Icon icon={Dumbbell01Icon} size={24} />
                <div>
                  <h4>No exercises yet</h4>
                  <p>Add at least one exercise before saving this workout day.</p>
                </div>
              </div>
            ) : (
              <ol className={styles.exerciseList}>
                {activeDay.exercises.map((exercise, exerciseIndex) => (
                  <li className={styles.exerciseCard} key={exercise.exerciseId}>
                    <header className={styles.exerciseCardHeader}>
                      <span className={styles.exercisePosition}>
                        {exerciseIndex + 1}
                      </span>
                      <div>
                        <h4>{exercise.name}</h4>
                        <p>
                          {exercise.sets.length}{" "}
                          {exercise.sets.length === 1 ? "set" : "sets"}
                        </p>
                      </div>
                      {!isLocked && (
                        <button
                          className={styles.removeButton}
                          type="button"
                          aria-label={`Remove ${exercise.name}`}
                          disabled={isBusy}
                          onClick={() => removeExercise(exercise.exerciseId)}
                        >
                          <Icon icon={Delete02Icon} size={18} />
                        </button>
                      )}
                    </header>

                    <div className={styles.setList}>
                      {exercise.sets.map((set, setIndex) => (
                        <fieldset className={styles.setRow} key={setIndex}>
                          <legend>Set {setIndex + 1}</legend>
                          <Input
                            id={`${activeDay.plannedDate}-${exerciseIndex}-${setIndex}-reps`}
                            label="Reps"
                            icon={RepeatIcon}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={1000}
                            value={set.repetitions}
                            disabled={isLocked || isBusy}
                            onChange={(event) =>
                              updateSet(
                                exercise.exerciseId,
                                setIndex,
                                "repetitions",
                                event.target.value,
                              )
                            }
                          />
                          <Input
                            id={`${activeDay.plannedDate}-${exerciseIndex}-${setIndex}-weight`}
                            label="Weight (kg)"
                            icon={WeightScale01Icon}
                            type="number"
                            inputMode="decimal"
                            min={0}
                            max={1000}
                            step="0.001"
                            placeholder="Bodyweight"
                            value={set.weightKilograms}
                            disabled={isLocked || isBusy}
                            onChange={(event) =>
                              updateSet(
                                exercise.exerciseId,
                                setIndex,
                                "weightKilograms",
                                event.target.value,
                              )
                            }
                          />
                          <Input
                            id={`${activeDay.plannedDate}-${exerciseIndex}-${setIndex}-rest`}
                            label="Rest (seconds)"
                            icon={Clock01Icon}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={3600}
                            value={set.restSeconds}
                            disabled={isLocked || isBusy}
                            onChange={(event) =>
                              updateSet(
                                exercise.exerciseId,
                                setIndex,
                                "restSeconds",
                                event.target.value,
                              )
                            }
                          />
                          {!isLocked && exercise.sets.length > 1 && (
                            <button
                              className={styles.removeSetButton}
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                removeSet(exercise.exerciseId, setIndex)
                              }
                            >
                              Remove set
                            </button>
                          )}
                        </fieldset>
                      ))}
                    </div>

                    {!isLocked && exercise.sets.length < 20 && (
                      <button
                        className={styles.addSetButton}
                        type="button"
                        disabled={isBusy}
                        onClick={() => addSet(exercise.exerciseId)}
                      >
                        <Icon icon={Add01Icon} size={18} />
                        Add set
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>

      {formError && (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      )}

      {!isLocked && (
        <footer className={styles.actions}>
          {hasSavedPlan && (
            <Button
              type="button"
              variant="ghost"
              disabled={isBusy}
              isLoading={isDeleting}
              onClick={deleteWeek}
            >
              Delete plan
            </Button>
          )}
          <Button
            type="button"
            disabled={isBusy || !isDirty}
            isLoading={isSaving}
            onClick={saveWeek}
          >
            Save training week
          </Button>
        </footer>
      )}

      <ExercisePicker
        isOpen={isPickerOpen}
        selectedExerciseIds={selectedExerciseIds}
        onClose={() => setIsPickerOpen(false)}
        onSelect={addExercise}
      />
    </section>
  );
}
