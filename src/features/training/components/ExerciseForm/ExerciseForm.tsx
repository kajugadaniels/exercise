"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Add01Icon,
  ArrowLeft01Icon,
  Calendar03Icon,
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
import {
  applyTrainingExerciseChange,
  createDefaultSet,
  toTrainingWeekInput,
  type TrainingExerciseOption,
  type TrainingSetEditorValue,
  type TrainingWeekEditorValue,
} from "../../training-week-editor";
import {
  createTrainingWeekInputSchema,
  MAX_PLANNED_SETS_PER_EXERCISE,
} from "../../training-week-schema";
import styles from "./ExerciseForm.module.css";

type ExerciseFormProps = Readonly<{
  availableMinutes?: number;
  exercise: TrainingExerciseOption;
  exerciseIndex?: number;
  initialEditor: TrainingWeekEditorValue;
  mode: "add" | "edit";
  plannedDate: string;
  preferredBodyPart?: TrainingWeekEditorValue["days"][number]["preferredBodyPart"];
  selectionHref: string;
  weekStart: string;
}>;

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  weekday: "long",
  year: "numeric",
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

export function ExerciseForm({
  availableMinutes,
  exercise,
  exerciseIndex,
  initialEditor,
  mode,
  plannedDate,
  preferredBodyPart,
  selectionHref,
  weekStart,
}: ExerciseFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const existingExercise =
    exerciseIndex === undefined
      ? undefined
      : initialEditor.days
          .find((day) => day.plannedDate === plannedDate)
          ?.exercises.at(exerciseIndex);
  const [sets, setSets] = useState<TrainingSetEditorValue[]>(() =>
    existingExercise?.sets.map((set) => ({ ...set })) ?? [createDefaultSet()],
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = mode === "edit";
  const trainingHref = `/training?week=${encodeURIComponent(weekStart)}`;

  function updateSet(
    setIndex: number,
    field: keyof TrainingSetEditorValue,
    value: string,
  ) {
    setSets((current) =>
      current.map((set, index) =>
        index === setIndex ? { ...set, [field]: value } : set,
      ),
    );
    setFormError(null);
  }

  function addSet() {
    setSets((current) => {
      const previousSet = current.at(-1);
      return [
        ...current,
        previousSet ? { ...previousSet } : createDefaultSet(),
      ];
    });
  }

  function removeSet(setIndex: number) {
    setSets((current) => current.filter((_, index) => index !== setIndex));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextEditor = applyTrainingExerciseChange(initialEditor, {
      ...(availableMinutes === undefined ? {} : { availableMinutes }),
      exercise,
      ...(exerciseIndex === undefined ? {} : { exerciseIndex }),
      plannedDate,
      ...(preferredBodyPart ? { preferredBodyPart } : {}),
      sets,
    });
    const result = createTrainingWeekInputSchema(weekStart).safeParse(
      toTrainingWeekInput(nextEditor),
    );

    if (!result.success) {
      setFormError(
        result.error.issues[0]?.message ??
          "Review the exercise details before saving.",
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
          apiErrorMessage(payload) ?? "The exercise could not be saved.",
        );
      }

      showToast({
        tone: "success",
        title: isEditing ? "Exercise updated" : "Exercise added",
        message: `${exercise.name} is saved in your weekly plan.`,
      });
      router.push(trainingHref);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The exercise could not be saved.";
      setFormError(message);
      showToast({ tone: "error", title: "Save failed", message });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className={styles.page} aria-labelledby="exercise-form-title">
      <header className={styles.header}>
        <Link className={styles.backLink} href={trainingHref}>
          <Icon icon={ArrowLeft01Icon} size={18} />
          Back to weekly plan
        </Link>
        <div className={styles.heading}>
          <p>{isEditing ? "Edit planned exercise" : "Add to workout"}</p>
          <h1 id="exercise-form-title">{exercise.name}</h1>
          <span>
            Configure the repetitions, load, and recovery time for each set.
          </span>
        </div>
      </header>

      <div className={styles.workspace}>
        <aside className={styles.context} aria-label="Workout context">
          <span className={styles.exerciseIcon} aria-hidden="true">
            <Icon icon={Dumbbell01Icon} size={24} />
          </span>
          <div className={styles.contextCopy}>
            <span>Selected exercise</span>
            <strong>{exercise.name}</strong>
          </div>
          <dl className={styles.metadata}>
            <div>
              <dt>
                <Icon icon={Calendar03Icon} size={18} /> Date
              </dt>
              <dd>{dateFormatter.format(toDisplayDate(plannedDate))}</dd>
            </div>
            <div>
              <dt>
                <Icon icon={RepeatIcon} size={18} /> Planned sets
              </dt>
              <dd>{sets.length}</dd>
            </div>
          </dl>
          {!isEditing ? (
            <Link className={styles.changeLink} href={selectionHref}>
              Choose another exercise
            </Link>
          ) : null}
        </aside>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formHeader}>
            <div>
              <h2>Set plan</h2>
              <p>Use bodyweight by leaving the weight field empty.</p>
            </div>
            <span className={styles.setCount}>
              {sets.length} {sets.length === 1 ? "set" : "sets"}
            </span>
          </div>

          <div className={styles.setList}>
            {sets.map((set, setIndex) => (
              <fieldset className={styles.setCard} key={setIndex}>
                <legend>Set {setIndex + 1}</legend>
                <div className={styles.fields}>
                  <Input
                    id={`exercise-set-${setIndex}-repetitions`}
                    label="Repetitions"
                    icon={RepeatIcon}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={1000}
                    value={set.repetitions}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateSet(setIndex, "repetitions", event.target.value)
                    }
                  />
                  <Input
                    id={`exercise-set-${setIndex}-weight`}
                    label="Weight (kg)"
                    icon={WeightScale01Icon}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={1000}
                    step="0.001"
                    placeholder="Bodyweight"
                    value={set.weightKilograms}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateSet(
                        setIndex,
                        "weightKilograms",
                        event.target.value,
                      )
                    }
                  />
                  <Input
                    id={`exercise-set-${setIndex}-rest`}
                    label="Rest (seconds)"
                    icon={Clock01Icon}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={3600}
                    value={set.restSeconds}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateSet(setIndex, "restSeconds", event.target.value)
                    }
                  />
                </div>
                {sets.length > 1 ? (
                  <button
                    className={styles.removeSet}
                    type="button"
                    disabled={isSaving}
                    onClick={() => removeSet(setIndex)}
                  >
                    <Icon icon={Delete02Icon} size={18} />
                    Remove set
                  </button>
                ) : null}
              </fieldset>
            ))}
          </div>

          {sets.length < MAX_PLANNED_SETS_PER_EXERCISE ? (
            <button
              className={styles.addSet}
              type="button"
              disabled={isSaving}
              onClick={addSet}
            >
              <Icon icon={Add01Icon} size={18} />
              Add another set
            </button>
          ) : null}

          {formError ? (
            <p className={styles.error} role="alert">
              {formError}
            </p>
          ) : null}

          <footer className={styles.actions}>
            <Link className={styles.cancelLink} href={trainingHref}>
              Cancel
            </Link>
            <Button type="submit" isLoading={isSaving} disabled={isSaving}>
              {isEditing ? "Save exercise" : "Add exercise"}
            </Button>
          </footer>
        </form>
      </div>
    </section>
  );
}
