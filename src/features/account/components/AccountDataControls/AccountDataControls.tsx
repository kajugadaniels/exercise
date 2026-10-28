"use client";

import { useState } from "react";
import {
  DatabaseIcon,
  Delete02Icon,
  Download02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { Input } from "@/components/ui/Input/Input";
import { useToast } from "@/components/ui/Toast/Toast";
import { AUTH_ROUTES } from "@/features/auth/config/routes";
import { ACCOUNT_DATA_DELETE_CONFIRMATION } from "../../account-data-schema";
import styles from "./AccountDataControls.module.css";

type ErrorPayload = { error?: { message?: string } };

function downloadName(response: Response): string {
  const disposition = response.headers.get("content-disposition") ?? "";
  return disposition.match(/filename="([^"]+)"/)?.[1] ?? "fitness-data.json";
}

export function AccountDataControls() {
  const { showToast } = useToast();
  const [confirmation, setConfirmation] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const canDelete = confirmation === ACCOUNT_DATA_DELETE_CONFIRMATION;

  async function downloadData() {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/account/data");
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | ErrorPayload
          | null;
        throw new Error(
          payload?.error?.message ?? "Your fitness data could not be exported.",
        );
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      try {
        link.href = objectUrl;
        link.download = downloadName(response);
        document.body.append(link);
        link.click();
      } finally {
        link.remove();
        URL.revokeObjectURL(objectUrl);
      }
      showToast({
        tone: "success",
        title: "Export ready",
        message: "Your private fitness data was downloaded as JSON.",
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Export failed",
        message:
          error instanceof Error
            ? error.message
            : "Your fitness data could not be exported.",
      });
    } finally {
      setIsDownloading(false);
    }
  }

  async function deleteData() {
    if (!canDelete || isDeleting) {
      return;
    }
    if (
      !window.confirm(
        "Permanently delete your profile data? Your Clerk sign-in account will remain.",
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/account/data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | ErrorPayload
          | null;
        throw new Error(
          payload?.error?.message ?? "Your fitness data could not be deleted.",
        );
      }
      window.location.assign(AUTH_ROUTES.onboarding);
    } catch (error) {
      showToast({
        tone: "error",
        title: "Deletion failed",
        message:
          error instanceof Error
            ? error.message
            : "Your fitness data could not be deleted.",
      });
      setIsDeleting(false);
    }
  }

  return (
    <div className={styles.controls}>
      <div className={styles.exportRow}>
        <div>
          <h3>Download your fitness data</h3>
          <p>
            Export your stored profile details as a readable JSON file.
          </p>
        </div>
        <Button
          disabled={isDeleting}
          isLoading={isDownloading}
          onClick={downloadData}
          variant="secondary"
        >
          <span className={styles.buttonContent}>
            <Icon icon={Download02Icon} size={18} />
            {isDownloading ? "Preparing export" : "Download data"}
          </span>
        </Button>
      </div>

      <div className={styles.dangerZone}>
        <div className={styles.dangerCopy}>
          <span aria-hidden="true">
            <Icon icon={Delete02Icon} size={20} />
          </span>
          <div>
            <h3>Delete all fitness data</h3>
            <p>
              Permanently removes this app&apos;s profile data. It does not delete
              your Clerk sign-in account.
            </p>
          </div>
        </div>
        <Input
          autoComplete="off"
          icon={DatabaseIcon}
          id="delete-fitness-data-confirmation"
          label={`Type ${ACCOUNT_DATA_DELETE_CONFIRMATION} to confirm`}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder={ACCOUNT_DATA_DELETE_CONFIRMATION}
          disabled={isDeleting || isDownloading}
          value={confirmation}
        />
        <Button
          disabled={!canDelete || isDownloading}
          isLoading={isDeleting}
          onClick={deleteData}
          variant="danger"
        >
          {isDeleting ? "Deleting fitness data" : "Delete fitness data"}
        </Button>
      </div>
    </div>
  );
}
