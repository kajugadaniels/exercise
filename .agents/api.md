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

## 2. Normalized exercise model

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

Optional internal fields are not claims that a provider supplies them. Map only validated fields that are present. Difficulty stays excluded until a verified, approved source supports it.

## 3. Search and filtering

Normalize case and whitespace with locale-aware deterministic rules. Filter on canonical enums while displaying readable labels. Repeated values within one facet use OR semantics; different active facets and search use AND semantics. Preserve selections as repeated URL search parameters. Bound query length, selected values, and page size. Unknown values produce validation errors or are safely ignored only where the UI contract explicitly permits it.

## 4. Route Handlers

Create a Route Handler only for a real HTTP consumer or security/caching boundary. Each handler:

- validates method, params, query, headers, and body;
- authenticates and authorizes private requests;
- calls application/provider code instead of embedding business logic;
- returns consistent JSON and correct status codes;
- sets cache and content type intentionally;
- never exposes upstream bodies or internal errors.

Recommended error shape:

```json
{ "error": { "code": "PROVIDER_UNAVAILABLE", "message": "Exercises are temporarily unavailable." } }
```

No stack, secret, raw provider payload, or private identifier appears in client errors.

## 5. Server Actions

Use actions only for UI mutations. Validate arguments, obtain the actor server-side, authorize the target, perform one bounded use case, and return a typed serializable result. Revalidate only affected data. Actions are not implicitly safe because they live in server files.

## 6. Profile and account-data contracts

The private HTTP surface is:

| Endpoint | Purpose | Access |
| --- | --- | --- |
| `GET /api/profile` | Return the current actor's profile or `null` | Authenticated |
| `PUT /api/profile` | Validate and upsert the current actor's profile | Authenticated, same-origin |
| `DELETE /api/profile` | Delete the current actor's profile and scheduled sessions | Authenticated, same-origin |
| `POST /api/training/sessions` | Add one verified exercise to the current actor's session on a calendar date | Authenticated, completed profile, same-origin |
| `GET /api/account/data` | Download the current actor's stored profile and scheduled sessions as JSON | Authenticated |
| `DELETE /api/account/data` | Delete the current actor's local application user and cascaded profile/sessions | Authenticated, same-origin, exact confirmation phrase |

The server derives the Clerk user ID; no contract accepts an owner ID. Personalized responses use `Cache-Control: private, no-store`. Mutation bodies are strict, bounded JSON. Errors use lowercase stable codes and user-safe messages. The scheduling endpoint accepts only a validated provider exercise ID and valid `YYYY-MM-DD` date, reloads exercise identity from the normalized provider, and relies on a database unique constraint to reject the same exercise twice for one owner and date. The export omits internal database and Clerk identifiers, expresses stored weight in kilograms, and includes scheduled exercise provenance. Local data deletion does not delete the external Clerk sign-in account.

Workout execution, recommendation, history, analytics, and progress endpoints remain removed. Reintroducing them requires a new product, privacy, schema, and API decision.

## 7. Caching and availability

Version-pinned catalog data may use long-lived or revalidated caching after provider update behavior is verified. Never cache personalized results publicly. Define stale and fallback behavior explicitly; do not silently show partial results as complete. Provider failure should preserve the application shell and offer recovery.

## 8. Future provider composition

If a licensed MP4 provider is added, compose by stable application identity with documented matching confidence. Never join records solely by display name without review. Metadata conflicts retain provenance; do not overwrite verified data silently.

## 9. Contract evolution

Native-client APIs require explicit versioning and compatibility policy. Provider schema changes stay inside adapters; domain contract changes receive tests and documentation. Do not expose a provider's URL shape as the application's public contract.
