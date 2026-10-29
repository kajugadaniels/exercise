import assert from "node:assert/strict";
import test from "node:test";
import {
  createCalendarDays,
  getCalendarMonthKey,
  parseTrainingSessionsPayload,
  shiftCalendarMonth,
} from "./calendar";

test("creates a six-week Monday-first calendar grid", () => {
  const days = createCalendarDays({ monthIndex: 9, year: 2026 });

  assert.equal(days.length, 42);
  assert.equal(days[0]?.date, "2026-09-28");
  assert.equal(days[3]?.date, "2026-10-01");
  assert.equal(days[41]?.date, "2026-11-08");
});

test("shifts calendar months across year boundaries", () => {
  const january = shiftCalendarMonth({ monthIndex: 11, year: 2026 }, 1);

  assert.deepEqual(january, { monthIndex: 0, year: 2027 });
  assert.equal(getCalendarMonthKey(january), "2027-01");
});

test("parses a bounded calendar response shape", () => {
  const sessions = parseTrainingSessionsPayload({
    data: {
      sessions: [
        {
          date: "2026-10-29",
          exercises: [
            {
              exerciseId: "biceps/barbell-curl",
              image: {
                alt: "Barbell curl animated exercise preview",
                kind: "gif",
                url: "https://cdn.jsdelivr.net/exercise.gif",
              },
              name: "Barbell curl",
              repetitionsPerSet: 8,
              sets: 3,
              weightKilograms: 12.5,
            },
          ],
        },
      ],
    },
  });

  assert.equal(sessions?.[0]?.exercises[0]?.name, "Barbell curl");
  assert.equal(parseTrainingSessionsPayload({ data: { sessions: [{}] } }), null);
  assert.equal(
    parseTrainingSessionsPayload({
      data: { sessions: [{ date: "2026-02-30", exercises: [] }] },
    }),
    null,
  );
  assert.equal(
    parseTrainingSessionsPayload({
      data: {
        sessions: [
          {
            date: "2026-10-29",
            exercises: [
              {
                exerciseId: "biceps/barbell-curl",
                image: null,
                name: "Barbell curl",
                repetitionsPerSet: 8.5,
                sets: 3,
                weightKilograms: 12.5,
              },
            ],
          },
        ],
      },
    }),
    null,
  );
  assert.equal(
    parseTrainingSessionsPayload({
      data: {
        sessions: [
          {
            date: "2026-10-29",
            exercises: [
              {
                exerciseId: "biceps/barbell-curl",
                image: {
                  alt: "Untrusted preview",
                  kind: "gif",
                  url: "javascript:alert(1)",
                },
                name: "Barbell curl",
                repetitionsPerSet: 8,
                sets: 3,
                weightKilograms: 12.5,
              },
            ],
          },
        ],
      },
    }),
    null,
  );
});
