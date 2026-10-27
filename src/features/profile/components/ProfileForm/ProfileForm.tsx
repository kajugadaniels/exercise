"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Calculator01Icon,
  Location01Icon,
  RulerIcon,
  WeightScale01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";
import { useToast } from "@/components/ui/Toast/Toast";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import { GenderSelector } from "../GenderSelector/GenderSelector";
import {
  calculateBmi,
  getBmiCategory,
  profileSchema,
  type ProfileInput,
  type ProfileView,
} from "../../profile-schema";
import styles from "./ProfileForm.module.css";

type ProfileFormProps = Readonly<{
  initialProfile?: ProfileView;
  mode: "onboarding" | "settings";
}>;

type FormValues = {
  country: string;
  gender: string;
  heightCentimeters: string;
  weightKilograms: string;
};

type FieldName = keyof ProfileInput;
type FieldErrors = Partial<Record<FieldName, string>>;

function initialValues(profile?: ProfileView): FormValues {
  return {
    country: profile?.country ?? "",
    gender: profile?.gender ?? "",
    heightCentimeters: profile ? String(profile.heightCentimeters) : "",
    weightKilograms: profile ? String(profile.weightKilograms) : "",
  };
}

function firstFieldErrors(
  errors: Record<string, string[] | undefined>,
): FieldErrors {
  return {
    country: errors.country?.[0],
    gender: errors.gender?.[0],
    heightCentimeters: errors.heightCentimeters?.[0],
    weightKilograms: errors.weightKilograms?.[0],
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

export function ProfileForm({ initialProfile, mode }: ProfileFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [values, setValues] = useState(() => initialValues(initialProfile));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const bmi = useMemo(
    () =>
      calculateBmi(
        Number(values.heightCentimeters),
        Number(values.weightKilograms),
      ),
    [values.heightCentimeters, values.weightKilograms],
  );

  function updateValue(name: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const result = profileSchema.safeParse({
      country: values.country,
      gender: values.gender,
      heightCentimeters: Number(values.heightCentimeters),
      weightKilograms: Number(values.weightKilograms),
    });

    if (!result.success) {
      setErrors(firstFieldErrors(result.error.flatten().fieldErrors));
      setFormError("Review the highlighted fields before continuing.");
      return;
    }

    setErrors({});
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          apiErrorMessage(payload) ?? "Your profile could not be saved.",
        );
      }

      showToast({
        tone: "success",
        title: mode === "onboarding" ? "Profile complete" : "Profile updated",
        message:
          mode === "onboarding"
            ? "Your training workspace is ready."
            : "Your latest measurements are now saved.",
      });

      if (mode === "onboarding") {
        router.replace(AUTH_ROUTES.home);
      } else {
        router.refresh();
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Your profile could not be saved.";
      setFormError(message);
      showToast({ tone: "error", title: "Save failed", message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const isConfirmed = window.confirm(
      "Delete your fitness profile? You will need to complete onboarding again before using the platform.",
    );

    if (!isConfirmed) {
      return;
    }

    setFormError(null);
    setIsDeleting(true);

    try {
      const response = await fetch("/api/profile", { method: "DELETE" });
      if (!response.ok) {
        const payload: unknown = await response.json();
        throw new Error(
          apiErrorMessage(payload) ?? "Your profile could not be deleted.",
        );
      }

      showToast({
        tone: "info",
        title: "Profile deleted",
        message: "Complete onboarding when you are ready to continue.",
      });
      router.replace(AUTH_ROUTES.onboarding);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Your profile could not be deleted.";
      setFormError(message);
      showToast({ tone: "error", title: "Delete failed", message });
    } finally {
      setIsDeleting(false);
    }
  }

  const bmiCategory = bmi === null ? null : getBmiCategory(bmi);
  const bmiStatus = bmiCategory
    ? {
        low: "Below range",
        healthy: "Healthy range",
        moderate: "Medium range",
        high: "High range",
      }[bmiCategory]
    : "Add measurements";
  const bmiTone = bmiCategory
    ? ({
        low: "info",
        healthy: "success",
        moderate: "warning",
        high: "danger",
      } as const)[bmiCategory]
    : undefined;

  return (
    <form
      className={styles.form}
      data-mode={mode}
      onSubmit={handleSubmit}
      noValidate
    >
      {formError && (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      )}

      <section className={styles.section} aria-labelledby="about-you-title">
        <h2
          className={
            mode === "onboarding" ? styles.visuallyHidden : styles.legend
          }
          id="about-you-title"
        >
          About you
        </h2>
        {mode === "settings" && (
          <p className={styles.sectionCopy}>
            These details keep your future training records accurate and belong
            only to your account.
          </p>
        )}

        <div className={styles.fieldGrid}>
          <GenderSelector
            value={
              values.gender === "male" || values.gender === "female"
                ? values.gender
                : ""
            }
            error={errors.gender}
            disabled={isSaving || isDeleting}
            onChange={(gender) => updateValue("gender", gender)}
          />

          <Input
            id="country"
            name="country"
            label="Country"
            autoComplete="country-name"
            placeholder="e.g. Rwanda"
            icon={Location01Icon}
            value={values.country}
            error={errors.country}
            disabled={isSaving || isDeleting}
            onChange={(event) => updateValue("country", event.target.value)}
            required
          />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="measurements-title">
        <h2
          className={
            mode === "onboarding" ? styles.visuallyHidden : styles.legend
          }
          id="measurements-title"
        >
          Current measurements
        </h2>
        {mode === "settings" && (
          <p className={styles.sectionCopy}>
            You can update these measurements whenever they change.
          </p>
        )}

        <div className={styles.measurementFields}>
          <Input
            id="height"
            name="heightCentimeters"
            label="Height (cm)"
            inputMode="numeric"
            min={100}
            max={250}
            step={1}
            type="number"
            placeholder="175"
            icon={RulerIcon}
            value={values.heightCentimeters}
            error={errors.heightCentimeters}
            disabled={isSaving || isDeleting}
            onChange={(event) =>
              updateValue("heightCentimeters", event.target.value)
            }
            required
          />

          <Input
            id="weight"
            name="weightKilograms"
            label="Weight (kg)"
            inputMode="decimal"
            min={20}
            max={400}
            step={0.1}
            type="number"
            placeholder="70.0"
            icon={WeightScale01Icon}
            value={values.weightKilograms}
            error={errors.weightKilograms}
            disabled={isSaving || isDeleting}
            onChange={(event) =>
              updateValue("weightKilograms", event.target.value)
            }
            required
          />

          <Input
            id="bmi"
            label="BMI"
            placeholder="—"
            icon={Calculator01Icon}
            value={bmi === null ? "" : String(bmi)}
            tone={bmiTone}
            aria-live="polite"
            readOnly
          />
        </div>

        <p className={styles.bmiNote}>
          BMI status: {bmiStatus}. This is a general screening guide, not a
          medical diagnosis.
        </p>
      </section>

      {mode === "onboarding" && (
        <p className={styles.privacyNote}>
          Your details stay private and can be changed later.
        </p>
      )}

      <div className={styles.actions}>
        <Button
          className={mode === "onboarding" ? styles.primaryAction : undefined}
          type="submit"
          isLoading={isSaving}
          disabled={isDeleting}
        >
          {mode === "onboarding" ? "Complete profile" : "Save changes"}
        </Button>
        {mode === "settings" && (
          <Button
            type="button"
            variant="danger"
            isLoading={isDeleting}
            disabled={isSaving}
            onClick={handleDelete}
          >
            Delete profile
          </Button>
        )}
      </div>
    </form>
  );
}
