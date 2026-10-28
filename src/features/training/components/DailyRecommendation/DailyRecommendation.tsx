"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Alert02Icon,
  Calendar03Icon,
  Clock01Icon,
  Dumbbell01Icon,
  Target02Icon,
  Tick02Icon,
  WandSparklesIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { Input } from "@/components/ui/Input/Input";
import { useToast } from "@/components/ui/Toast/Toast";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import {
  bodyPartIds,
  formatExerciseValue,
  type BodyPartId,
} from "@/features/exercises/domain/exercise";
import {
  dailyRecommendationResponseSchema,
  type DailyRecommendationInput,
  type DailyRecommendationView,
} from "../../daily-recommendation-schema";
import styles from "./DailyRecommendation.module.css";

type DailyRecommendationProps = Readonly<{
  currentCalendarDate: string;
  defaultMinutes: number;
  disabled: boolean;
  hasPreferences: boolean;
  onSaved: (recommendation: DailyRecommendationView) => void;
  weekDates: readonly string[];
}>;

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  weekday: "short",
});

function displayDate(value: string): string {
  return dateFormatter.format(new Date(`${value}T12:00:00.000Z`));
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

export function DailyRecommendation({
  currentCalendarDate,
  defaultMinutes,
  disabled,
  hasPreferences,
  onSaved,
  weekDates,
}: DailyRecommendationProps) {
  const { showToast } = useToast();
  const eligibleDates = weekDates.filter((date) => date >= currentCalendarDate);
  const [choice, setChoice] = useState<"yes" | "no" | null>(null);
  const [plannedDate, setPlannedDate] = useState(
    eligibleDates[0] ?? weekDates.at(-1) ?? currentCalendarDate,
  );
  const [availableMinutes, setAvailableMinutes] = useState(
    String(defaultMinutes),
  );
  const [preferredBodyPart, setPreferredBodyPart] =
    useState<BodyPartId | null>(null);
  const [recommendation, setRecommendation] =
    useState<DailyRecommendationView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function clearPreview() {
    setRecommendation(null);
    setError(null);
  }

  function getInput(): DailyRecommendationInput | null {
    const minutes = Number(availableMinutes);
    if (!Number.isInteger(minutes) || minutes < 15 || minutes > 240) {
      setError("Choose a session length between 15 and 240 minutes.");
      return null;
    }

    return { availableMinutes: minutes, plannedDate, preferredBodyPart };
  }

  async function requestRecommendation(method: "POST" | "PUT") {
    const input = getInput();
    if (!input) {
      return;
    }

    const isSave = method === "PUT";
    if (isSave) {
      setIsSaving(true);
    } else {
      setIsPreviewing(true);
    }
    setError(null);

    try {
      const response = await fetch("/api/training/recommendations", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          apiErrorMessage(payload) ??
            "Your recommendation could not be prepared.",
        );
      }

      const result = dailyRecommendationResponseSchema.safeParse(payload);
      if (!result.success) {
        throw new Error("The recommendation response could not be verified.");
      }

      setRecommendation(result.data.data);
      if (isSave) {
        onSaved(result.data.data);
        showToast({
          tone: "success",
          title: "Workout added",
          message: `${displayDate(result.data.data.plannedDate)} is ready in your weekly plan.`,
        });
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Your recommendation could not be prepared.";
      setError(message);
      if (isSave) {
        showToast({ tone: "error", title: "Workout not added", message });
      }
    } finally {
      if (isSave) {
        setIsSaving(false);
      } else {
        setIsPreviewing(false);
      }
    }
  }

  return (
    <section className={styles.coach} aria-labelledby="daily-coach-title">
      <header className={styles.intro}>
        <span className={styles.coachIcon} aria-hidden="true">
          <Icon icon={WandSparklesIcon} size={22} />
        </span>
        <div>
          <p className={styles.eyebrow}>Daily coach</p>
          <h2 id="daily-coach-title">Need a workout recommendation?</h2>
          <p>
            Build today around your available time, equipment, goal, and recent
            recovery—not a generic routine.
          </p>
        </div>
        <div className={styles.answerButtons} aria-label="Choose planning method">
          <button
            type="button"
            aria-pressed={choice === "yes"}
            onClick={() => setChoice("yes")}
          >
            Yes, guide me
          </button>
          <button
            type="button"
            aria-pressed={choice === "no"}
            onClick={() => setChoice("no")}
          >
            I’ll plan it
          </button>
        </div>
      </header>

      {choice === "no" && (
        <div className={styles.manualMessage} role="status">
          <Icon icon={Tick02Icon} size={18} />
          <span>
            Use the weekly editor below to build each workout or rest day.
          </span>
        </div>
      )}

      {choice === "yes" && !hasPreferences && (
        <div className={styles.preferencesMessage}>
          <div>
            <strong>One quick setup first</strong>
            <p>
              Add your goal, experience, and available equipment so the coach
              can make a safe recommendation.
            </p>
          </div>
          <Link href={AUTH_ROUTES.profile}>Set training preferences</Link>
        </div>
      )}

      {choice === "yes" && hasPreferences && eligibleDates.length === 0 && (
        <div className={styles.manualMessage} role="status">
          <Icon icon={Calendar03Icon} size={18} />
          <span>
            Open this week or a future week to request a recommendation.
          </span>
        </div>
      )}

      {choice === "yes" && hasPreferences && eligibleDates.length > 0 && (
        <div className={styles.workspace}>
          <form
            className={styles.controls}
            onSubmit={(event) => {
              event.preventDefault();
              void requestRecommendation("POST");
            }}
          >
            <div className={styles.primaryFields}>
              <label className={styles.selectField}>
                <span>Training date</span>
                <span className={styles.selectControl}>
                  <Icon icon={Calendar03Icon} size={20} />
                  <select
                    value={plannedDate}
                    disabled={disabled || isPreviewing || isSaving}
                    onChange={(event) => {
                      setPlannedDate(event.target.value);
                      clearPreview();
                    }}
                  >
                    {eligibleDates.map((date) => (
                      <option key={date} value={date}>
                        {displayDate(date)}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <Input
                id="recommendation-minutes"
                label="Time available"
                icon={Clock01Icon}
                type="number"
                inputMode="numeric"
                min={15}
                max={240}
                value={availableMinutes}
                disabled={disabled || isPreviewing || isSaving}
                onChange={(event) => {
                  setAvailableMinutes(event.target.value);
                  clearPreview();
                }}
              />
            </div>

            <fieldset
              className={styles.focusFieldset}
              disabled={disabled || isPreviewing || isSaving}
            >
              <legend>Choose a focus, or let recovery decide</legend>
              <div className={styles.focusOptions}>
                <label>
                  <input
                    type="radio"
                    name="recommendation-focus"
                    checked={preferredBodyPart === null}
                    onChange={() => {
                      setPreferredBodyPart(null);
                      clearPreview();
                    }}
                  />
                  <Icon icon={Target02Icon} size={16} />
                  Balanced
                </label>
                {bodyPartIds.map((bodyPart) => (
                  <label key={bodyPart}>
                    <input
                      type="radio"
                      name="recommendation-focus"
                      checked={preferredBodyPart === bodyPart}
                      onChange={() => {
                        setPreferredBodyPart(bodyPart);
                        clearPreview();
                      }}
                    />
                    {formatExerciseValue(bodyPart)}
                  </label>
                ))}
              </div>
            </fieldset>

            {disabled && (
              <p className={styles.disabledHint}>
                Save or discard your unsaved weekly edits before generating a
                workout.
              </p>
            )}
            <Button
              type="submit"
              size="compact"
              disabled={disabled || isSaving}
              isLoading={isPreviewing}
            >
              <Icon icon={WandSparklesIcon} size={18} />
              Build recommendation
            </Button>
          </form>

          {recommendation && (
            <div className={styles.preview} aria-live="polite">
              <header className={styles.previewHeader}>
                <div>
                  <p>{displayDate(recommendation.plannedDate)}</p>
                  <h3>
                    {formatExerciseValue(recommendation.focusBodyPart)} session
                  </h3>
                </div>
                <span data-status={recommendation.recovery.status}>
                  <Icon
                    icon={
                      recommendation.recovery.status === "ready"
                        ? Tick02Icon
                        : Alert02Icon
                    }
                    size={16}
                  />
                  {recommendation.recovery.status === "ready"
                    ? "Recovery ready"
                    : "Recovery caution"}
                </span>
              </header>
              <p className={styles.recoveryMessage}>
                {recommendation.recovery.message}
              </p>

              <ol className={styles.recommendationList}>
                {recommendation.exercises.map((exercise, index) => (
                  <li key={exercise.id}>
                    <span className={styles.exerciseNumber}>{index + 1}</span>
                    <div className={styles.exerciseDetails}>
                      <div>
                        <h4>{exercise.name}</h4>
                        <p>
                          {exercise.sets.length} sets ·{" "}
                          {exercise.sets[0]?.targetRepetitions} reps ·{" "}
                          {exercise.sets[0]?.restSeconds}s rest
                        </p>
                      </div>
                      <div className={styles.exerciseTags}>
                        <span>{formatExerciseValue(exercise.primaryMuscle)}</span>
                        {exercise.equipment && (
                          <span>{formatExerciseValue(exercise.equipment)}</span>
                        )}
                      </div>
                      <ul
                        className={styles.reasonList}
                        aria-label="Why this exercise"
                      >
                        {exercise.reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ol>

              <footer className={styles.previewFooter}>
                <p>
                  <Icon icon={Dumbbell01Icon} size={16} />
                  Saving replaces only this unrecorded day. You can edit the
                  plan afterward.
                </p>
                <Button
                  type="button"
                  size="compact"
                  disabled={disabled || isPreviewing}
                  isLoading={isSaving}
                  onClick={() => void requestRecommendation("PUT")}
                >
                  Add to this week
                </Button>
              </footer>
            </div>
          )}

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
