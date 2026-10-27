import type { ComponentPropsWithoutRef } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "@/components/ui/Icon/Icon";
import styles from "./Input.module.css";

type InputProps = Omit<ComponentPropsWithoutRef<"input">, "size"> & {
  error?: string;
  hint?: string;
  icon: IconSvgElement;
  id: string;
  label: string;
  tone?: "danger" | "info" | "success" | "warning";
};

function describedBy(
  existing: string | undefined,
  hintId: string | undefined,
  errorId: string | undefined,
): string | undefined {
  const ids = [existing, hintId, errorId].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export function Input({
  "aria-describedby": ariaDescribedBy,
  error,
  hint,
  icon,
  id,
  label,
  tone,
  ...props
}: InputProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <label className={styles.field} htmlFor={id}>
      <span className={styles.label}>{label}</span>
      <span
        className={styles.control}
        data-invalid={Boolean(error)}
        data-tone={tone}
      >
        <span className={styles.icon} aria-hidden="true">
          <Icon icon={icon} size={20} />
        </span>
        <input
          {...props}
          id={id}
          className={styles.input}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy(
            ariaDescribedBy,
            hintId,
            errorId,
          )}
        />
      </span>
      {hint && (
        <span className={styles.hint} id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className={styles.error} id={errorId}>
          {error}
        </span>
      )}
    </label>
  );
}
