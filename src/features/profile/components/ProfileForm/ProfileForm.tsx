"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button/Button";
import { Input, Select } from "@/components/ui/Field/Field";
import { useToast } from "@/components/ui/Toast/Toast";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import {
  calculateBmi,
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
  genderDescription: string;
  heightCentimeters: string;
  weightKilograms: string;
};

type FieldName = keyof ProfileInput;
type FieldErrors = Partial<Record<FieldName, string>>;

function initialValues(profile?: ProfileView): FormValues {
  return {
    country: profile?.country ?? "",
    gender: profile?.gender ?? "",
    genderDescription: profile?.genderDescription ?? "",
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
    genderDescription: errors.genderDescription?.[0],
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
      genderDescription: values.genderDescription || undefined,
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

  const isSelfDescribed = values.gender === "self-described";

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {formError && (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      )}

      <fieldset className={styles.fieldset} disabled={isSaving || isDeleting}>
        <legend className={styles.legend}>About you</legend>
        <p className={styles.sectionCopy}>
          These details keep your future training records accurate and belong
          only to your account.
        </p>

        <div className={styles.fieldGrid}>
          <Select
            id="gender"
            name="gender"
            label="Gender"
            value={values.gender}
            error={errors.gender}
            onChange={(event) => updateValue("gender", event.target.value)}
            required
          >
            <option value="" disabled>
              Select an option
            </option>
            <option value="woman">Woman</option>
            <option value="man">Man</option>
            <option value="non-binary">Non-binary</option>
            <option value="self-described">Self-described</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </Select>

          <Input
            id="country"
            name="country"
            label="Country"
            autoComplete="country-name"
            placeholder="e.g. Rwanda"
            value={values.country}
            error={errors.country}
            onChange={(event) => updateValue("country", event.target.value)}
            required
          />
        </div>

        {isSelfDescribed && (
          <Input
            id="gender-description"
            name="genderDescription"
            label="How do you describe your gender?"
            autoComplete="off"
            maxLength={80}
            value={values.genderDescription}
            error={errors.genderDescription}
            onChange={(event) =>
              updateValue("genderDescription", event.target.value)
            }
            required
          />
        )}
      </fieldset>

      <fieldset className={styles.fieldset} disabled={isSaving || isDeleting}>
        <legend className={styles.legend}>Current measurements</legend>
        <p className={styles.sectionCopy}>
          You can update these measurements whenever they change.
        </p>

        <div className={styles.measurementLayout}>
          <div className={styles.fieldGrid}>
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
              value={values.heightCentimeters}
              error={errors.heightCentimeters}
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
              value={values.weightKilograms}
              error={errors.weightKilograms}
              onChange={(event) =>
                updateValue("weightKilograms", event.target.value)
              }
              required
            />
          </div>

          <aside className={styles.bmiCard} aria-live="polite">
            <span className={styles.bmiLabel}>Calculated BMI</span>
            <strong className={styles.bmiValue}>{bmi ?? "—"}</strong>
            <p className={styles.bmiCopy}>
              Calculated from your current height and weight. It is not stored
              separately and is not medical advice.
            </p>
          </aside>
        </div>
      </fieldset>

      <div className={styles.actions}>
        <Button type="submit" isLoading={isSaving} disabled={isDeleting}>
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
