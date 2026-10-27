export const clerkAppearance = {
  elements: {
    card: {
      backgroundColor: "transparent",
      boxShadow: "none",
    },
    cardBox: {
      boxShadow: "none",
      width: "100%",
    },
    userButtonTrigger: {
      height: "var(--control-height)",
      width: "var(--control-height)",
    },
  },
  variables: {
    borderRadius: "var(--radius-md)",
    colorBackground: "var(--color-glass-strong)",
    colorDanger: "var(--color-danger)",
    colorInputBackground: "var(--color-glass-surface)",
    colorInputText: "var(--color-text)",
    colorPrimary: "var(--color-primary)",
    colorText: "var(--color-text)",
    colorTextOnPrimaryBackground: "var(--color-on-primary)",
    colorTextSecondary: "var(--color-text-muted)",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-sm)",
    spacingUnit: "var(--space-4)",
  },
} as const;
