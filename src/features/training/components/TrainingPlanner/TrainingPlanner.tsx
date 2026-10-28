"use client";

import { useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
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
  Edit01Icon,
  PlayIcon,
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
import type { DailyRecommendationView } from "../../daily-recommendation-schema";
import type { TrainingPreferencesView } from "../../training-preferences-schema";
import {
  createEmptyTrainingWeek,
  createTrainingWeekEditor,
  getAdjacentWeekStart,
  toTrainingWeekInput,
  type TrainingDayEditorValue,
  type TrainingWeekEditorValue,
} from "../../training-week-editor";
import { createTrainingWeekInputSchema } from "../../training-week-schema";
import { DailyRecommendation } from "../DailyRecommendation/DailyRecommendation";
import styles from "./TrainingPlanner.module.css";

type TrainingPlannerProps = Readonly<{
  currentCalendarDate: string;
  currentWeekStart: string;
  initialPlan: TrainingWeekPlan | null;
  trainingPreferences: TrainingPreferencesView | null;
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

function buildExerciseSelectionHref(
  day: TrainingDayEditorValue,
  weekStart: string,
): string {
  const searchParams = new URLSearchParams({
    planDate: day.plannedDate,
    planMinutes: String(Number(day.availableMinutes) || 60),
    planWeek: weekStart,
  });

  if (day.preferredBodyPart) {
    searchParams.set("planFocus", day.preferredBodyPart);
  }

  return `/exercises?${searchParams}`;
}

export function TrainingPlanner({
  currentCalendarDate,
  currentWeekStart,
  initialPlan,
  trainingPreferences,
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
  const [formError, setFormError] = useState<string | null>(null);
  const isLocked = initialPlan?.isLocked ?? false;
  const isBusy = isSaving || isDeleting;
  const activeDay =
    editor.days.find((day) => day.plannedDate === activeDate) ?? editor.days[0];
  const storedActiveDay = initialPlan?.days.find(
    (day) => day.plannedDate === activeDate,
  );

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

  function removeExercise(exerciseId: string) {
    updateActiveDay((day) => ({
      ...day,
      exercises: day.exercises.filter(
        (exercise) => exercise.exerciseId !== exerciseId,
      ),
    }));
  }

  function confirmExercisePageNavigation(event: MouseEvent<HTMLAnchorElement>) {
    if (
      isDirty &&
      !window.confirm(
        "Continue to the exercise page? Some unsaved planner changes may not carry over. Save the week first if you want to keep them.",
      )
    ) {
      event.preventDefault();
    }
  }

  function getStoredExercisePosition(
    exerciseId: string,
    fallbackPosition: number,
  ): number {
    return (
      storedActiveDay?.exercises.find(
        (exercise) => exercise.exercise.sourceId === exerciseId,
      )?.position ?? fallbackPosition
    );
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

  function handleRecommendationSaved(
    recommendation: DailyRecommendationView,
  ) {
    setEditor((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.plannedDate === recommendation.plannedDate
          ? {
              availableMinutes: String(recommendation.availableMinutes),
              exercises: recommendation.exercises.map((exercise) => ({
                exerciseId: exercise.id,
                name: exercise.name,
                sets: exercise.sets.map((set) => ({
                  repetitions: String(set.targetRepetitions),
                  restSeconds: String(set.restSeconds),
                  weightKilograms:
                    set.targetWeightKilograms === null
                      ? ""
                      : String(set.targetWeightKilograms),
                })),
              })),
              kind: "workout",
              plannedDate: recommendation.plannedDate,
              preferredBodyPart: recommendation.focusBodyPart,
            }
          : day,
      ),
    }));
    setActiveDate(recommendation.plannedDate);
    setHasSavedPlan(true);
    setIsDirty(false);
    router.refresh();
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

  const exerciseSelectionHref = buildExerciseSelectionHref(
    activeDay,
    weekStart,
  );

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

      <DailyRecommendation
        currentCalendarDate={currentCalendarDate}
        defaultMinutes={trainingPreferences?.preferredSessionMinutes ?? 60}
        disabled={isDirty || isBusy}
        hasPreferences={trainingPreferences !== null}
        weekDates={editor.days
          .filter((day) => {
            const storedDay = initialPlan?.days.find(
              (candidate) => candidate.plannedDate === day.plannedDate,
            );
            return !storedDay || storedDay.status === "planned";
          })
          .map((day) => day.plannedDate)}
        onSaved={handleRecommendationSaved}
      />

      {isLocked && (
        <div className={styles.lockedMessage} role="status">
          <strong>This week contains protected workout history.</strong>
          <span>
            Started, completed, and skipped workout days stay read-only so the
            weekly record remains accurate.
          </span>
        </div>
      )}

      <nav className={styles.dayRail} aria-label="Days in this training week">
        {editor.days.map((day) => {
          const date = toDisplayDate(day.plannedDate);
          const isActive = day.plannedDate === activeDate;
          const storedDay = initialPlan?.days.find(
            (candidate) => candidate.plannedDate === day.plannedDate,
          );
          const dayStatus = day.kind === "rest" ? "rest" : storedDay?.status;
          const daySummary =
            day.kind === "rest"
              ? "Rest"
              : dayStatus === "in-progress"
                ? "In progress"
                : dayStatus === "completed"
                  ? "Completed"
                  : dayStatus === "skipped"
                    ? "Skipped"
                    : `${day.exercises.length} ${
                        day.exercises.length === 1 ? "exercise" : "exercises"
                      }`;

          return (
            <button
              className={styles.dayTab}
              data-kind={day.kind}
              data-status={dayStatus}
              type="button"
              aria-label={`${dayFormatter.format(date)} ${dayNumberFormatter.format(date)}, ${daySummary}`}
              aria-pressed={isActive}
              aria-controls="active-training-day"
              key={day.plannedDate}
              onClick={() => setActiveDate(day.plannedDate)}
            >
              <span>{dayFormatter.format(date)}</span>
              <strong>{dayNumberFormatter.format(date)}</strong>
              <small>{daySummary}</small>
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

        {storedActiveDay?.kind === "workout" && !isDirty && (
          <Link
            className={styles.workoutAction}
            href={`${AUTH_ROUTES.training}/workouts/${storedActiveDay.plannedDate}`}
          >
            <Icon icon={PlayIcon} size={18} />
            {storedActiveDay.status === "planned"
              ? "Start workout"
              : storedActiveDay.status === "in-progress"
                ? "Continue workout"
                : "Review workout"}
          </Link>
        )}

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
                activeDay.exercises.length >= 12 ? (
                  <span className={styles.addExerciseDisabled}>
                    Exercise limit reached
                  </span>
                ) : (
                  <Link
                    className={styles.addExerciseLink}
                    href={exerciseSelectionHref}
                    aria-disabled={isBusy || undefined}
                    onClick={(event) => {
                      if (isBusy) {
                        event.preventDefault();
                        return;
                      }
                      confirmExercisePageNavigation(event);
                    }}
                  >
                    <Icon icon={Add01Icon} size={18} />
                    Add exercise
                  </Link>
                )
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
                      {!isLocked ? (
                        <div className={styles.exerciseActions}>
                          <Link
                            className={styles.editExerciseLink}
                            href={`/training/${weekStart}/${activeDay.plannedDate}/exercises/${getStoredExercisePosition(exercise.exerciseId, exerciseIndex + 1)}/edit`}
                            aria-label={`Edit ${exercise.name}`}
                            onClick={confirmExercisePageNavigation}
                          >
                            <Icon icon={Edit01Icon} size={18} />
                          </Link>
                          <button
                            className={styles.removeButton}
                            type="button"
                            aria-label={`Remove ${exercise.name}`}
                            disabled={isBusy}
                            onClick={() => removeExercise(exercise.exerciseId)}
                          >
                            <Icon icon={Delete02Icon} size={18} />
                          </button>
                        </div>
                      ) : null}
                    </header>

                    <div className={styles.exerciseMetrics}>
                      <span>
                        {exercise.sets.reduce(
                          (total, set) =>
                            total + (Number(set.repetitions) || 0),
                          0,
                        )} total reps
                      </span>
                      <span>
                        {exercise.sets.some(
                          (set) => set.weightKilograms.trim() !== "",
                        )
                          ? "External load planned"
                          : "Bodyweight / no load"}
                      </span>
                    </div>
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
    </section>
  );
}
