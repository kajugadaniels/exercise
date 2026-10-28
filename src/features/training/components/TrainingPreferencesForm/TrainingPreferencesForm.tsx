"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Clock01Icon,
  Globe02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { useToast } from "@/components/ui/Toast/Toast";
import {
  equipmentIds,
  formatExerciseValue,
  type EquipmentId,
} from "@/features/exercises/domain/exercise";
import {
  trainingPreferencesSchema,
  type TrainingPreferencesInput,
  type TrainingPreferencesView,
} from "../../training-preferences-schema";
import styles from "./TrainingPreferencesForm.module.css";

type TrainingPreferencesFormProps = Readonly<{
  initialPreferences: TrainingPreferencesView | null;
}>;

type FormValues = {
  availableEquipment: EquipmentId[];
  experienceLevel: string;
  goal: string;
  preferredSessionMinutes: string;
  preferredTrainingDays: number[];
  timezone: string;
};

type FieldName = keyof TrainingPreferencesInput;
type FieldErrors = Partial<Record<FieldName, string>>;

const goalOptions = [
  {
    value: "general-fitness",
    label: "General fitness",
    description: "Build a balanced and consistent routine.",
  },
  {
    value: "strength",
    label: "Strength",
    description: "Prioritize progressively heavier resistance work.",
  },
  {
    value: "muscle-gain",
    label: "Muscle gain",
    description: "Prioritize weekly resistance-training volume.",
  },
  {
    value: "endurance",
    label: "Endurance",
    description: "Build capacity for longer training sessions.",
  },
] as const;

const experienceOptions = [
  {
    value: "beginner",
    label: "Beginner",
    description: "I am learning movements and building consistency.",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "I train consistently and understand common movements.",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "I have sustained training experience and track performance.",
  },
] as const;

const trainingDayOptions = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
] as const;

function getInitialValues(
  preferences: TrainingPreferencesView | null,
): FormValues {
  return {
    availableEquipment: preferences?.availableEquipment ?? [],
    experienceLevel: preferences?.experienceLevel ?? "",
    goal: preferences?.goal ?? "",
    preferredSessionMinutes: preferences
      ? String(preferences.preferredSessionMinutes)
      : "60",
    preferredTrainingDays: preferences?.preferredTrainingDays ?? [],
    timezone: preferences?.timezone ?? "",
  };
}

function getDeviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function firstFieldErrors(
  errors: Record<string, string[] | undefined>,
): FieldErrors {
  return {
    availableEquipment: errors.availableEquipment?.[0],
    experienceLevel: errors.experienceLevel?.[0],
    goal: errors.goal?.[0],
    preferredSessionMinutes: errors.preferredSessionMinutes?.[0],
    preferredTrainingDays: errors.preferredTrainingDays?.[0],
    timezone: errors.timezone?.[0],
  };
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

function toggleValue<T>(values: readonly T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((current) => current !== value)
    : [...values, value];
}

export function TrainingPreferencesForm({
  initialPreferences,
}: TrainingPreferencesFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [values, setValues] = useState(() =>
    getInitialValues(initialPreferences),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [hasSavedPreferences, setHasSavedPreferences] = useState(
    Boolean(initialPreferences),
  );
  const isBusy = isSaving || isClearing;

  function clearFieldError(name: FieldName) {
    setErrors((current) => ({ ...current, [name]: undefined }));
    setFormError(null);
  }

  function setTextValue(
    name: "experienceLevel" | "goal" | "preferredSessionMinutes" | "timezone",
    value: string,
  ) {
    setValues((current) => ({ ...current, [name]: value }));
    clearFieldError(name);
  }

  function toggleEquipment(equipment: EquipmentId) {
    setValues((current) => ({
      ...current,
      availableEquipment: toggleValue(
        current.availableEquipment,
        equipment,
      ),
    }));
    clearFieldError("availableEquipment");
  }

  function toggleTrainingDay(day: number) {
    setValues((current) => ({
      ...current,
      preferredTrainingDays: toggleValue(
        current.preferredTrainingDays,
        day,
      ),
    }));
    clearFieldError("preferredTrainingDays");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const timezone = values.timezone.trim() || getDeviceTimeZone();
    const result = trainingPreferencesSchema.safeParse({
      goal: values.goal,
      experienceLevel: values.experienceLevel,
      preferredSessionMinutes: Number(values.preferredSessionMinutes),
      timezone,
      availableEquipment: values.availableEquipment,
      preferredTrainingDays: values.preferredTrainingDays,
    });

    if (!result.success) {
      setErrors(firstFieldErrors(result.error.flatten().fieldErrors));
      setFormError("Review the highlighted preferences before saving.");
      return;
    }

    setErrors({});
    setIsSaving(true);

    try {
      const response = await fetch("/api/training/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        throw new Error(
          apiErrorMessage(payload) ??
            "Your training preferences could not be saved.",
        );
      }

      setValues((current) => ({ ...current, timezone: result.data.timezone }));
      setHasSavedPreferences(true);
      showToast({
        tone: "success",
        title: "Preferences saved",
        message: "Future training plans can now use your routine preferences.",
      });
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Your training preferences could not be saved.";
      setFormError(message);
      showToast({ tone: "error", title: "Save failed", message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClear() {
    const isConfirmed = window.confirm(
      "Clear your training preferences? Your profile and workout history will not be deleted.",
    );

    if (!isConfirmed) {
      return;
    }

    setFormError(null);
    setIsClearing(true);

    try {
      const response = await fetch("/api/training/preferences", {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload: unknown = await response.json();
        throw new Error(
          apiErrorMessage(payload) ??
            "Your training preferences could not be cleared.",
        );
      }

      setValues(getInitialValues(null));
      setErrors({});
      setHasSavedPreferences(false);
      showToast({
        tone: "info",
        title: "Preferences cleared",
        message: "Your profile and workout history were left unchanged.",
      });
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Your training preferences could not be cleared.";
      setFormError(message);
      showToast({ tone: "error", title: "Clear failed", message });
    } finally {
      setIsClearing(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {formError && (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      )}

      <fieldset
        className={styles.group}
        disabled={isBusy}
        aria-describedby={errors.goal ? "training-goal-error" : undefined}
      >
        <legend className={styles.legend}>Main training goal</legend>
        <p className={styles.groupHint}>
          Choose the outcome that should guide future recommendations.
        </p>
        <div className={styles.goalGrid}>
          {goalOptions.map((option) => (
            <label className={styles.choiceCard} key={option.value}>
              <input
                className={styles.nativeControl}
                type="radio"
                name="goal"
                value={option.value}
                checked={values.goal === option.value}
                onChange={() => setTextValue("goal", option.value)}
              />
              <span className={styles.choiceMarker} aria-hidden="true" />
              <span className={styles.choiceCopy}>
                <span className={styles.choiceTitle}>{option.label}</span>
                <span className={styles.choiceDescription}>
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>
        {errors.goal && (
          <span className={styles.fieldError} id="training-goal-error">
            {errors.goal}
          </span>
        )}
      </fieldset>

      <fieldset
        className={styles.group}
        disabled={isBusy}
        aria-describedby={
          errors.experienceLevel ? "experience-level-error" : undefined
        }
      >
        <legend className={styles.legend}>Experience level</legend>
        <p className={styles.groupHint}>
          Pick the description that best matches your current training.
        </p>
        <div className={styles.experienceGrid}>
          {experienceOptions.map((option) => (
            <label className={styles.choiceCard} key={option.value}>
              <input
                className={styles.nativeControl}
                type="radio"
                name="experienceLevel"
                value={option.value}
                checked={values.experienceLevel === option.value}
                onChange={() =>
                  setTextValue("experienceLevel", option.value)
                }
              />
              <span className={styles.choiceMarker} aria-hidden="true" />
              <span className={styles.choiceCopy}>
                <span className={styles.choiceTitle}>{option.label}</span>
                <span className={styles.choiceDescription}>
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>
        {errors.experienceLevel && (
          <span className={styles.fieldError} id="experience-level-error">
            {errors.experienceLevel}
          </span>
        )}
      </fieldset>

      <div className={styles.inputGrid}>
        <Input
          id="preferred-session-minutes"
          name="preferredSessionMinutes"
          label="Preferred session (minutes)"
          type="number"
          inputMode="numeric"
          min={15}
          max={240}
          step={5}
          icon={Clock01Icon}
          value={values.preferredSessionMinutes}
          error={errors.preferredSessionMinutes}
          disabled={isBusy}
          onChange={(event) =>
            setTextValue("preferredSessionMinutes", event.target.value)
          }
          required
        />

        <Input
          id="training-timezone"
          name="timezone"
          label="Timezone"
          placeholder="Uses your device timezone"
          hint="Enter an IANA timezone such as Africa/Kigali, or leave blank to use this device."
          autoComplete="off"
          icon={Globe02Icon}
          value={values.timezone}
          error={errors.timezone}
          disabled={isBusy}
          onChange={(event) => setTextValue("timezone", event.target.value)}
        />
      </div>

      <fieldset
        className={styles.group}
        disabled={isBusy}
        aria-describedby={
          errors.availableEquipment ? "available-equipment-error" : undefined
        }
      >
        <legend className={styles.legend}>Available equipment</legend>
        <p className={styles.groupHint}>
          Select everything you can reliably use. Choose bodyweight if you do
          not need equipment.
        </p>
        <div className={styles.chipGrid}>
          {equipmentIds.map((equipment) => (
            <label className={styles.chip} key={equipment}>
              <input
                className={styles.nativeControl}
                type="checkbox"
                name="availableEquipment"
                value={equipment}
                checked={values.availableEquipment.includes(equipment)}
                onChange={() => toggleEquipment(equipment)}
              />
              <span>{formatExerciseValue(equipment)}</span>
            </label>
          ))}
        </div>
        {errors.availableEquipment && (
          <span className={styles.fieldError} id="available-equipment-error">
            {errors.availableEquipment}
          </span>
        )}
      </fieldset>

      <fieldset
        className={styles.group}
        disabled={isBusy}
        aria-describedby={
          errors.preferredTrainingDays ? "preferred-days-error" : undefined
        }
      >
        <legend className={styles.legend}>Preferred training days</legend>
        <p className={styles.groupHint}>
          Optional. Leave every day clear if your schedule changes each week.
        </p>
        <div className={styles.week}>
          {trainingDayOptions.map((day) => (
            <label className={styles.day} key={day.value}>
              <input
                className={styles.nativeControl}
                type="checkbox"
                name="preferredTrainingDays"
                value={day.value}
                checked={values.preferredTrainingDays.includes(day.value)}
                onChange={() => toggleTrainingDay(day.value)}
              />
              <span>{day.label}</span>
            </label>
          ))}
        </div>
        {errors.preferredTrainingDays && (
          <span className={styles.fieldError} id="preferred-days-error">
            {errors.preferredTrainingDays}
          </span>
        )}
      </fieldset>

      <p className={styles.privacyNote}>
        These preferences stay private to your account and are not sent to the
        exercise provider.
      </p>

      <div className={styles.actions}>
        {hasSavedPreferences && (
          <Button
            type="button"
            variant="ghost"
            disabled={isBusy}
            isLoading={isClearing}
            onClick={handleClear}
          >
            Clear preferences
          </Button>
        )}
        <Button type="submit" isLoading={isSaving} disabled={isBusy}>
          Save training preferences
        </Button>
      </div>
    </form>
  );
}
