"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent,
} from "react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  Cancel01Icon,
  Dumbbell01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { ExerciseThumbnail } from "@/features/exercises/components/ExerciseThumbnail/ExerciseThumbnail";
import {
  createCalendarDays,
  getCalendarMonthKey,
  getLocalCalendarDate,
  getLocalCalendarMonth,
  parseTrainingSessionsPayload,
  shiftCalendarMonth,
  type CalendarMonth,
} from "../../calendar";
import type { TrainingSessionCalendarItem } from "../../session-schema";
import styles from "./TrainingCalendar.module.css";

const weekdays = [
  ["Mon", "Monday"],
  ["Tue", "Tuesday"],
  ["Wed", "Wednesday"],
  ["Thu", "Thursday"],
  ["Fri", "Friday"],
  ["Sat", "Saturday"],
  ["Sun", "Sunday"],
] as const;

type LoadState =
  | Readonly<{ status: "loading" }>
  | Readonly<{
      sessions: readonly TrainingSessionCalendarItem[];
      status: "ready";
    }>
  | Readonly<{ message: string; status: "error" }>;

function subscribeToHydration() {
  return () => undefined;
}

function useIsHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
}

function formatMonth(month: CalendarMonth): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(Date.UTC(month.year, month.monthIndex, 1)));
}

function formatSessionDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function exerciseCountLabel(count: number): string {
  return `${count} ${count === 1 ? "exercise" : "exercises"}`;
}

function plannedValue(value: number | null, suffix = ""): string {
  return value === null ? "Not recorded" : `${value}${suffix}`;
}

function CalendarPlaceholder() {
  return (
    <section className={styles.calendarShell} aria-label="Loading training calendar">
      <div className={styles.calendarHeader} aria-hidden="true">
        <div className={styles.monthPlaceholder} />
        <div className={styles.controlsPlaceholder} />
      </div>
      <div className={styles.calendarPlaceholder} aria-hidden="true" />
    </section>
  );
}

function HydratedTrainingCalendar() {
  const [visibleMonth, setVisibleMonth] = useState(getLocalCalendarMonth);
  const [today] = useState(getLocalCalendarDate);
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedSession, setSelectedSession] =
    useState<TrainingSessionCalendarItem | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement>(null);
  const monthKey = getCalendarMonthKey(visibleMonth);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSessions() {
      try {
        const response = await fetch(
          `/api/training/sessions?month=${encodeURIComponent(monthKey)}`,
          {
            cache: "no-store",
            headers: { Accept: "application/json" },
            signal: controller.signal,
          },
        );
        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error("Your training calendar could not be loaded.");
        }

        const sessions = parseTrainingSessionsPayload(payload);
        if (!sessions) {
          throw new Error("The training calendar returned an invalid response.");
        }

        setLoadState({ sessions, status: "ready" });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setLoadState({
          message:
            error instanceof Error
              ? error.message
              : "Your training calendar could not be loaded.",
          status: "error",
        });
      }
    }

    void loadSessions();
    return () => controller.abort();
  }, [monthKey, reloadKey]);

  const sessions = loadState.status === "ready" ? loadState.sessions : [];
  const sessionsByDate = new Map(sessions.map((session) => [session.date, session]));
  const calendarDays = createCalendarDays(visibleMonth);
  const weeks = Array.from({ length: 6 }, (_, index) =>
    calendarDays.slice(index * 7, index * 7 + 7),
  );

  function changeMonth(month: CalendarMonth) {
    setLoadState({ status: "loading" });
    setVisibleMonth(month);
  }

  function showCurrentMonth() {
    changeMonth(getLocalCalendarMonth());
  }

  function retryLoading() {
    setLoadState({ status: "loading" });
    setReloadKey((current) => current + 1);
  }

  function openSession(
    session: TrainingSessionCalendarItem,
    trigger: HTMLButtonElement,
  ) {
    lastTriggerRef.current = trigger;
    setSelectedSession(session);
    requestAnimationFrame(() => dialogRef.current?.showModal());
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  function handleDialogClose() {
    setSelectedSession(null);
    lastTriggerRef.current?.focus();
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      closeDialog();
    }
  }

  return (
    <section className={styles.calendarShell} aria-labelledby="calendar-month">
      <header className={styles.calendarHeader}>
        <div className={styles.monthIdentity}>
          <span className={styles.calendarIcon} aria-hidden="true">
            <Icon icon={Calendar03Icon} size={24} />
          </span>
          <div>
            <h2 className={styles.monthTitle} id="calendar-month">
              {formatMonth(visibleMonth)}
            </h2>
            <p className={styles.monthSummary} aria-live="polite">
              {loadState.status === "loading"
                ? "Loading scheduled training…"
                : loadState.status === "error"
                  ? "Training is unavailable"
                  : sessions.length === 0
                    ? "No training scheduled this month"
                    : `${sessions.length} scheduled ${sessions.length === 1 ? "day" : "days"}`}
            </p>
          </div>
        </div>

        <div className={styles.calendarControls} aria-label="Calendar controls">
          <button
            className={styles.iconButton}
            onClick={() => changeMonth(shiftCalendarMonth(visibleMonth, -1))}
            type="button"
            aria-label="Previous month"
          >
            <Icon icon={ArrowLeft01Icon} size={20} />
          </button>
          <Button onClick={showCurrentMonth} size="compact" variant="secondary">
            Today
          </Button>
          <button
            className={styles.iconButton}
            onClick={() => changeMonth(shiftCalendarMonth(visibleMonth, 1))}
            type="button"
            aria-label="Next month"
          >
            <Icon icon={ArrowRight01Icon} size={20} />
          </button>
        </div>
      </header>

      {loadState.status === "error" ? (
        <div className={styles.errorState} role="alert">
          <p>{loadState.message}</p>
          <Button onClick={retryLoading} size="compact" variant="secondary">
            <Icon icon={RefreshIcon} size={18} />
            Retry
          </Button>
        </div>
      ) : null}

      <p className={styles.scrollHint}>Scroll horizontally to see the full week.</p>
      <div
        className={styles.calendarViewport}
        role="region"
        aria-label={`${formatMonth(visibleMonth)} training calendar`}
        tabIndex={0}
      >
        <table className={styles.calendar}>
          <thead>
            <tr>
              {weekdays.map(([shortLabel, fullLabel]) => (
                <th className={styles.weekday} key={fullLabel} scope="col">
                  <abbr title={fullLabel}>{shortLabel}</abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week[0]?.date}>
                {week.map((day) => {
                  const session = sessionsByDate.get(day.date);
                  const isToday = day.date === today;

                  return (
                    <td
                      className={styles.dayCell}
                      data-outside={!day.isCurrentMonth || undefined}
                      key={day.date}
                    >
                      {session && day.isCurrentMonth ? (
                        <button
                          className={styles.sessionDay}
                          onClick={(event) =>
                            openSession(session, event.currentTarget)
                          }
                          type="button"
                          aria-current={isToday ? "date" : undefined}
                          aria-label={`${formatSessionDate(day.date)}, ${exerciseCountLabel(session.exercises.length)}`}
                        >
                          <span className={styles.dayHeader} aria-hidden="true">
                            <time
                              className={styles.dayNumber}
                              data-today={isToday || undefined}
                              dateTime={day.date}
                            >
                              {day.dayNumber}
                            </time>
                            <span className={styles.sessionCount}>
                              <Icon icon={Dumbbell01Icon} size={18} />
                              {session.exercises.length}
                            </span>
                          </span>
                          <span className={styles.sessionPreview} aria-hidden="true">
                            <span>{session.exercises[0]?.name}</span>
                            {session.exercises.length > 1 ? (
                              <span className={styles.sessionPreviewMeta}>
                                +{session.exercises.length - 1} more
                              </span>
                            ) : null}
                          </span>
                        </button>
                      ) : (
                        <div className={styles.emptyDay}>
                          <time
                            className={styles.dayNumber}
                            data-today={isToday || undefined}
                            dateTime={day.date}
                            aria-current={isToday ? "date" : undefined}
                          >
                            {day.dayNumber}
                          </time>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dialog
        className={styles.dialog}
        onClick={handleBackdropClick}
        onClose={handleDialogClose}
        ref={dialogRef}
        aria-labelledby="training-session-title"
      >
        {selectedSession ? (
          <div className={styles.dialogContent}>
            <header className={styles.dialogHeader}>
              <div className={styles.dialogHeading}>
                <p className={styles.dialogContext}>Training session</p>
                <h2 className={styles.dialogTitle} id="training-session-title">
                  {formatSessionDate(selectedSession.date)}
                </h2>
                <p className={styles.dialogSummary}>
                  {exerciseCountLabel(selectedSession.exercises.length)} planned
                </p>
              </div>
              <button
                className={styles.closeButton}
                onClick={closeDialog}
                type="button"
                aria-label="Close training session"
              >
                <Icon icon={Cancel01Icon} size={20} />
              </button>
            </header>

            <ul className={styles.exerciseList}>
              {selectedSession.exercises.map((exercise) => (
                <li className={styles.exerciseItem} key={exercise.exerciseId}>
                  <div className={styles.exerciseMedia}>
                    <ExerciseThumbnail image={exercise.image} />
                  </div>
                  <div className={styles.exerciseDetails}>
                    <div className={styles.exerciseIdentity}>
                      <span className={styles.exerciseIcon} aria-hidden="true">
                        <Icon icon={Dumbbell01Icon} size={18} />
                      </span>
                      <h3>{exercise.name}</h3>
                    </div>
                    <dl className={styles.prescription}>
                      <div>
                        <dt>Sets</dt>
                        <dd>{plannedValue(exercise.sets)}</dd>
                      </div>
                      <div>
                        <dt>Reps</dt>
                        <dd>{plannedValue(exercise.repetitionsPerSet)}</dd>
                      </div>
                      <div>
                        <dt>Weight</dt>
                        <dd>{plannedValue(exercise.weightKilograms, " kg")}</dd>
                      </div>
                    </dl>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}

export function TrainingCalendar() {
  const isHydrated = useIsHydrated();

  return isHydrated ? <HydratedTrainingCalendar /> : <CalendarPlaceholder />;
}
