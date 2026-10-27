"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertCircleIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/Icon/Icon";
import styles from "./Toast.module.css";

export type ToastTone = "success" | "error" | "info";

export type ToastInput = {
  duration?: number | null;
  message: string;
  title?: string;
  tone: ToastTone;
};

type ToastItem = ToastInput & {
  id: number;
};

type ToastContextValue = {
  dismissToast: (id: number) => void;
  showToast: (toast: ToastInput) => number;
};

const MAX_VISIBLE_TOASTS = 3;
const DEFAULT_DURATION_MS = 5_000;
const ToastContext = createContext<ToastContextValue | null>(null);

const toastIcons = {
  success: CheckmarkCircle02Icon,
  error: AlertCircleIcon,
  info: InformationCircleIcon,
} as const;

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = ++nextId.current;
      const item: ToastItem = { ...toast, id };
      setToasts((current) => [...current, item].slice(-MAX_VISIBLE_TOASTS));

      const duration =
        toast.duration === undefined
          ? toast.tone === "error"
            ? null
            : DEFAULT_DURATION_MS
          : toast.duration;

      if (duration !== null && duration > 0) {
        const timer = setTimeout(() => dismissToast(id), duration);
        timers.current.set(id, timer);
      }

      return id;
    },
    [dismissToast],
  );

  useEffect(() => {
    const activeTimers = timers.current;

    return () => {
      for (const timer of activeTimers.values()) {
        clearTimeout(timer);
      }
      activeTimers.clear();
    };
  }, []);

  useEffect(() => {
    const visibleIds = new Set(toasts.map((toast) => toast.id));

    for (const [id, timer] of timers.current.entries()) {
      if (!visibleIds.has(id)) {
        clearTimeout(timer);
        timers.current.delete(id);
      }
    }
  }, [toasts]);

  const value = useMemo(
    () => ({ dismissToast, showToast }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={styles.viewport}
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <section
            className={styles.toast}
            data-tone={toast.tone}
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            aria-atomic="true"
          >
            <span className={styles.toneIcon} aria-hidden="true">
              <Icon icon={toastIcons[toast.tone]} size={20} />
            </span>
            <div className={styles.copy}>
              {toast.title && <p className={styles.title}>{toast.title}</p>}
              <p className={styles.message}>{toast.message}</p>
            </div>
            <button
              className={styles.dismiss}
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismissToast(toast.id)}
            >
              <Icon icon={Cancel01Icon} size={18} />
            </button>
          </section>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}
