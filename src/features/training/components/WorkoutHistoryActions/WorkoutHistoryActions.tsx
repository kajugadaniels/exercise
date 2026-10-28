"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { useToast } from "@/components/ui/Toast/Toast";
import styles from "./WorkoutHistoryActions.module.css";

type WorkoutHistoryActionsProps = Readonly<{
  plannedDate: string;
}>;

type ErrorPayload = {
  error?: { message?: string };
};

export function WorkoutHistoryActions({
  plannedDate,
}: WorkoutHistoryActionsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  async function deleteRecord() {
    if (
      !window.confirm(
        "Delete this workout record? Its logged sets and performance will be permanently removed.",
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/training/workouts/${encodeURIComponent(plannedDate)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | ErrorPayload
          | null;
        throw new Error(
          payload?.error?.message ?? "The workout record could not be deleted.",
        );
      }
      showToast({
        tone: "success",
        title: "Workout deleted",
        message: "The workout and its logged sets were permanently removed.",
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Delete failed",
        message:
          error instanceof Error
            ? error.message
            : "The workout record could not be deleted.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className={styles.actions}>
      <Button
        isLoading={isDeleting}
        onClick={deleteRecord}
        size="compact"
        variant="ghost"
      >
        <span className={styles.buttonContent}>
          <Icon icon={Delete02Icon} size={18} />
          {isDeleting ? "Deleting" : "Delete workout record"}
        </span>
      </Button>
    </div>
  );
}
