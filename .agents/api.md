# API and Provider Boundaries

**Purpose:** Define validated external adapters and consistent server HTTP contracts.  
**Scope:** Exercise providers, Route Handlers, Server Actions, future native APIs, and webhooks.  
**Related:** [architecture.md](architecture.md), [security.md](security.md), [exercises.md](exercises.md)  
**Last reviewed:** 2026-10-27

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

The server derives the Clerk user ID; none of these contracts accepts an owner ID. Personalized responses use `Cache-Control: no-store`. Mutation bodies are strict JSON and limited to 16 KiB. Errors use lowercase stable codes and user-safe messages.

## 7. Caching and availability

Version-pinned catalog data may use long-lived/revalidated caching after provider update behavior is verified. Never cache personalized results publicly. Define stale/fallback behavior explicitly; do not silently show a partial result as complete. Provider failure should preserve the application shell and offer retry.

## 8. Future provider composition

If a licensed MP4 provider is added, compose by stable application identity with documented matching confidence. Never join records solely by display name without review. Metadata conflicts retain provenance; do not overwrite verified data silently.

## 9. Contract evolution

Native-client APIs require explicit versioning and compatibility policy. Provider schema changes are contained within adapters; domain contract changes receive tests and documentation. Do not expose a provider's URL shape as the application's public contract.

