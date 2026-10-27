import {
  Female02Icon,
  Male02Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/Icon/Icon";
import type { ProfileGender } from "../../profile-schema";
import styles from "./GenderSelector.module.css";

type GenderSelectorProps = Readonly<{
  disabled?: boolean;
  error?: string;
  onChange: (gender: ProfileGender) => void;
  value: ProfileGender | "";
}>;

const options = [
  { icon: Male02Icon, label: "Male", value: "male" },
  { icon: Female02Icon, label: "Female", value: "female" },
] as const;

export function GenderSelector({
  disabled = false,
  error,
  onChange,
  value,
}: GenderSelectorProps) {
  const errorId = error ? "gender-error" : undefined;

  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend className={styles.legend}>Gender</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label className={styles.option} key={option.value}>
            <input
              className={styles.radio}
              type="radio"
              name="gender"
              value={option.value}
              checked={value === option.value}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={errorId}
              onChange={() => onChange(option.value)}
            />
            <span className={styles.optionContent}>
              <span className={styles.optionIcon} aria-hidden="true">
                <Icon icon={option.icon} size={24} />
              </span>
              <span>{option.label}</span>
              <span className={styles.indicator} aria-hidden="true" />
            </span>
          </label>
        ))}
      </div>
      {error && (
        <span className={styles.error} id={errorId}>
          {error}
        </span>
      )}
    </fieldset>
  );
}
