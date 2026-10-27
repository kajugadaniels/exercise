import type { ComponentPropsWithoutRef } from "react";
import styles from "./Field.module.css";

type SharedFieldProps = {
  error?: string;
  hint?: string;
  id: string;
  label: string;
};

type SelectProps = ComponentPropsWithoutRef<"select"> & SharedFieldProps;

function describedBy(
  existing: string | undefined,
  hintId: string | undefined,
  errorId: string | undefined,
): string | undefined {
  const ids = [existing, hintId, errorId].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export function Select({
  "aria-describedby": ariaDescribedBy,
  children,
  error,
  hint,
  id,
  label,
  ...props
}: SelectProps) {
  const controlId = id;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  return (
    <label className={styles.field} htmlFor={controlId}>
      <span className={styles.label}>{label}</span>
      <span className={styles.selectControl} data-invalid={Boolean(error)}>
        <select
          {...props}
          id={controlId}
          className={styles.select}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy(
            ariaDescribedBy,
            hintId,
            errorId,
          )}
        >
          {children}
        </select>
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
