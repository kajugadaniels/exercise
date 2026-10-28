"use client";

import {
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import {
  Calendar03Icon,
  CalendarAdd01Icon,
  Cancel01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { Input } from "@/components/ui/Input/Input";
import { useToast } from "@/components/ui/Toast/Toast";
import styles from "./ScheduleExerciseDialog.module.css";

type ScheduleExerciseDialogProps = Readonly<{
  exerciseId: string;
  exerciseName: string;
}>;

type ErrorPayload = Readonly<{
  error?: Readonly<{ code?: string; message?: string }>;
}>;

function localCalendarDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCalendarDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function ScheduleExerciseDialog({
  exerciseId,
  exerciseName,
}: ScheduleExerciseDialogProps) {
  const { showToast } = useToast();
  const generatedId = useId().replaceAll(":", "");
  const dialogId = `schedule-exercise-${generatedId}`;
  const titleId = `${dialogId}-title`;
  const descriptionId = `${dialogId}-description`;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [scheduledDate, setScheduledDate] = useState(localCalendarDate);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openDialog() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    if (!isSubmitting) {
      dialogRef.current?.close();
    }
  }

  function handleClose() {
    setError(null);
    setScheduledDate(localCalendarDate());
    triggerRef.current?.focus();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      closeDialog();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!scheduledDate || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/training/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId, scheduledDate }),
      });
      const payload = (await response.json().catch(() => null)) as
        | ErrorPayload
        | null;

      if (!response.ok) {
        throw new Error(
          payload?.error?.message ?? "The exercise could not be scheduled.",
        );
      }

      dialogRef.current?.close();
      showToast({
        tone: "success",
        title: "Exercise scheduled",
        message: `${exerciseName} was added to ${formatCalendarDate(scheduledDate)}.`,
      });
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "The exercise could not be scheduled.";
      setError(message);
      showToast({ tone: "error", title: "Scheduling failed", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        className={styles.trigger}
        onClick={openDialog}
        ref={triggerRef}
        type="button"
        aria-controls={dialogId}
        aria-haspopup="dialog"
      >
        <Icon icon={CalendarAdd01Icon} size={18} />
        <span>Add to session</span>
      </button>

      <dialog
        className={styles.dialog}
        id={dialogId}
        onCancel={(event) => {
          if (isSubmitting) event.preventDefault();
        }}
        onClick={handleBackdropClick}
        onClose={handleClose}
        ref={dialogRef}
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <header className={styles.header}>
            <span className={styles.headerIcon} aria-hidden="true">
              <Icon icon={CalendarAdd01Icon} size={22} />
            </span>
            <div className={styles.headingGroup}>
              <h2 className={styles.title} id={titleId}>
                Add to training session
              </h2>
              <p className={styles.description} id={descriptionId}>
                Choose when you plan to do {exerciseName}.
              </p>
            </div>
            <button
              className={styles.closeButton}
              disabled={isSubmitting}
              onClick={closeDialog}
              type="button"
              aria-label="Close scheduling dialog"
            >
              <Icon icon={Cancel01Icon} size={20} />
            </button>
          </header>

          <div className={styles.content}>
            <Input
              icon={Calendar03Icon}
              id={`${dialogId}-date`}
              label="Training date"
              onChange={(event) => setScheduledDate(event.target.value)}
              required
              type="date"
              value={scheduledDate}
              disabled={isSubmitting}
            />
            {error ? (
              <p className={styles.formError} role="alert">
                {error}
              </p>
            ) : null}
            <p className={styles.ruleNote}>
              <span className={styles.noteIcon} aria-hidden="true">
                <Icon icon={InformationCircleIcon} size={18} />
              </span>
              <span>
                The same exercise can appear only once in a session on the same
                date.
              </span>
            </p>
          </div>

          <footer className={styles.footer}>
            <Button
              disabled={isSubmitting}
              onClick={closeDialog}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button isLoading={isSubmitting} type="submit">
              {isSubmitting ? "Adding exercise" : "Add to session"}
            </Button>
          </footer>
        </form>
      </dialog>
    </>
  );
}
