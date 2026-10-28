# API and Provider Boundaries

**Purpose:** Define validated external adapters and consistent server HTTP contracts.  
**Scope:** Exercise providers, Route Handlers, Server Actions, future native APIs, and webhooks.  
**Related:** [architecture.md](architecture.md), [security.md](security.md), [exercises.md](exercises.md)  
**Last reviewed:** 2026-10-28

## 1. Provider adapter contract

UI components consume application-owned `Exercise`, `ExerciseSummary`, `ExerciseFacets`, and typed result models—never raw provider JSON. A provider adapter owns:

1. Version-pinned URL construction.
2. Fetch timeout/cache policy.
3. Runtime response validation.
4. Field-by-field normalization.
5. Provider error translation.
6. Source/version/attribution metadata.
7. Safe media references and license status.

Keep fetch, schema, mapping, and domain types separate enough to test independently.

## 2. Proposed normalized model

```ts
type Exercise = {
  id: string;
  name: string;
  category?: ExerciseCategory;
  primaryMuscle?: MuscleId;
  secondaryMuscles: MuscleId[];
  bodyPart?: BodyPartId;
  equipment?: EquipmentId;
  instructions: string[];
  media?: ExerciseMedia;
  source: {
    provider: "exercise-gym-gifs-db" | string;
    sourceId: string;
    version: string;
    attributionUrl: string;
  };
};

type ExerciseMedia = {
  kind: "gif" | "video" | "image";
  url: string;
  rightsStatus: "verified" | "unverified" | "restricted";
  attribution?: string;
};
```

Optional internal fields are not claims that a provider supplies them. Only validated present fields are mapped. Difficulty is excluded until supported by a verified approved source.

## 3. Search and filtering

Normalize case and whitespace with locale-aware, deterministic rules. Filter on canonical enums while displaying localized labels. Combine filters with documented AND/OR semantics and preserve them in URL search parameters. Bound query length, selected values, and page size. Unknown values produce validation errors or are safely ignored only where the UI contract explicitly says so.

## 4. Route Handlers

Create a Route Handler only for a real HTTP consumer or security/caching boundary. Each handler:

- validates method, params, query, headers, and body;
- authenticates/authorizes when private;
- calls application/provider code rather than embedding business logic;
- returns consistent JSON and correct status codes;
- sets cache and content-type intentionally;
- does not expose upstream bodies or internal errors.

Recommended error shape:

```json
{ "error": { "code": "PROVIDER_UNAVAILABLE", "message": "Exercises are temporarily unavailable." } }
```

No stack, secret, raw provider payload, or private identifier appears in client errors.

## 5. Server Actions

Use actions only for UI mutations. Validate arguments, obtain the actor server-side, authorize the target, perform one bounded use case, and return a typed serializable result. Revalidate/cache-invalidate only the data affected. Actions are not implicitly safe because they live in server files.

## 6. Profile and progress contracts

The initial private HTTP surface is:

| Endpoint | Purpose | Access |
| --- | --- | --- |
| `GET /api/profile` | Return the current actor's profile or `null` | Authenticated |
| `PUT /api/profile` | Validate and upsert the current actor's profile; append a snapshot only when measurements change | Authenticated, same-origin |
| `DELETE /api/profile` | Delete the current actor's profile and measurement history | Authenticated, same-origin |
| `GET /api/progress` | Return up to 100 of the current actor's newest measurement snapshots | Authenticated, completed profile |
| `GET /api/training/analytics?weeks={4|8|12}` | Return bounded completed-workout trends, exercise progression, and muscle distribution | Authenticated, completed profile |
| `GET /api/account/data` | Download the current actor's local fitness data as JSON | Authenticated |
| `DELETE /api/account/data` | Permanently delete the current actor's local application user and cascaded fitness data | Authenticated, same-origin, exact confirmation phrase |

The server derives the Clerk user ID; none of these contracts accepts an owner ID. Personalized responses use `Cache-Control: private, no-store`. Mutation bodies are strict JSON and limited to 16 KiB. Errors use lowercase stable codes and user-safe messages. The export omits internal database and Clerk identifiers and expresses stored weights in kilograms. Local data deletion does not delete the external Clerk sign-in account; Clerk synchronization remains a separate release gate.

Training analytics accept only 4, 8, or 12 weeks. They query a bounded calendar range, count only completed sessions as performance, treat loaded volume as external weight only, and never manufacture bodyweight load. Scheduled workouts are used only as the completion-rate denominator.

## 7. Training preference contracts

The optional training-preference HTTP surface is:

| Endpoint | Purpose | Access |
| --- | --- | --- |
| `GET /api/training/preferences` | Return the current actor's preferences or `null` | Authenticated, completed profile |
| `PUT /api/training/preferences` | Strictly validate and upsert the current actor's preferences | Authenticated, completed profile, same-origin |
| `DELETE /api/training/preferences` | Clear only the current actor's preferences | Authenticated, same-origin |

The server derives ownership from the Clerk session and never accepts a user ID. Responses are private and non-cacheable. Mutation bodies are JSON, bounded to 16 KiB, and return stable user-safe errors. Clearing preferences does not delete the profile or workout history.

## 8. Weekly training plan contracts

The private weekly planning surface is:

| Endpoint | Purpose | Access |
| --- | --- | --- |
| `GET /api/training/weeks/{weekStart}` | Return the current actor's Monday–Sunday plan or `null` | Authenticated, completed profile |
| `PUT /api/training/weeks/{weekStart}` | Strictly validate and atomically create or replace one complete Monday–Sunday plan | Authenticated, completed profile, same-origin |
| `DELETE /api/training/weeks/{weekStart}` | Delete an unstarted weekly plan | Authenticated, completed profile, same-origin |

`weekStart` is a valid Monday in `YYYY-MM-DD` format. A write contains exactly seven unique calendar days, each marked as a workout or rest day. Workout days contain bounded exercises and planned sets; weights enter the API in kilograms and are persisted as integer grams. The server reloads each exercise from the normalized provider before snapshotting supported metadata, assigns order and set numbers, and records the plan as manual. The browser cannot submit ownership, provider metadata, recommendation provenance, lifecycle status, or history.

The server derives ownership from the Clerk session. A week with any workout session or skipped workout day is immutable through the planning contract, preventing replacement or deletion of its lifecycle history. Writes are limited to 64 KiB, personalized responses are private and non-cacheable, and provider failures return safe errors.

## 9. Workout execution contracts

The private workout-execution surface is:

| Endpoint | Purpose | Access |
| --- | --- | --- |
| `GET /api/training/workouts/{plannedDate}` | Return the current actor's planned workout and recorded set state | Authenticated, completed profile |
| `POST /api/training/workouts/{plannedDate}` | Idempotently start the planned workout session | Authenticated, completed profile, same-origin |
| `PATCH /api/training/workouts/{plannedDate}` | Record one planned set, complete or abandon an active workout, or skip an unstarted workout | Authenticated, completed profile, same-origin |
| `DELETE /api/training/workouts/{plannedDate}` | Permanently delete an ended workout session and its logged sets, then return the planned day to a reusable planned state | Authenticated, completed profile, same-origin |
| `GET /api/training/history?week={weekStart}&page={page}` | Return an owner-scoped weekly report, ended-session page, and deterministic progression guidance | Authenticated, completed profile |

`plannedDate` is a valid calendar date in `YYYY-MM-DD` format. Set actions identify only the planned exercise position and set number; ownership, internal IDs, planned targets, and lifecycle state are resolved server-side. Actual repetitions, optional weight, and optional reps-in-reserve are strictly bounded. Completing a workout requires every planned set to have a record. Abandoning retains completed sets and ends the session without manufacturing missing performance. Skipping is allowed only before a session starts, creates no performance record, appears in the weekly report, and locks the affected week against replacement or deletion.

One session is permitted per planned day. Normal execution updates cannot rewrite ended sessions or set logs. The explicit deletion contract is the privacy exception: it owner-scopes the date, rejects active sessions, removes the ended session and cascaded logs transactionally, and resets only that planned day. Responses are private and non-cacheable, request bodies are limited to 16 KiB, and the server never sends workout data to the exercise provider.

Training history pages contain at most ten ended sessions, and page numbers are bounded. Weekly reports include only the selected Monday–Sunday boundary. Loaded volume includes external weight only and never invents a bodyweight value. Progression guidance uses a bounded window of completed sessions and never uses abandoned workouts. A load increase requires two completed exposures with every repetition target met, a non-decreasing latest load, and at least two recorded reps in reserve on every latest set. The response explains whether to hold or increase; it is training guidance, not medical advice.

## 10. Caching and availability

Version-pinned catalog data may use long-lived/revalidated caching after provider update behavior is verified. Never cache personalized results publicly. Define stale/fallback behavior explicitly; do not silently show a partial result as complete. Provider failure should preserve the application shell and offer retry.

## 11. Future provider composition

If a licensed MP4 provider is added, compose by stable application identity with documented matching confidence. Never join records solely by display name without review. Metadata conflicts retain provenance; do not overwrite verified data silently.

## 12. Contract evolution

Native-client APIs require explicit versioning and compatibility policy. Provider schema changes are contained within adapters; domain contract changes receive tests and documentation. Do not expose a provider's URL shape as the application's public contract.

