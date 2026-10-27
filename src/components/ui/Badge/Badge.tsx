import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./Badge.module.css";

type BadgeTone = "neutral" | "primary" | "secondary" | "success" | "danger";

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  children: ReactNode;
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: styles.neutral,
  primary: styles.primary,
  secondary: styles.secondary,
  success: styles.success,
  danger: styles.danger,
};

export function Badge({
  children,
  className,
  tone = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={[styles.badge, toneClasses[tone], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
