# Folder Structure and Naming

**Purpose:** Keep the Next.js application feature-oriented, navigable, and compatible with future clients.  
**Scope:** Creating, naming, moving, or importing application files.  
**Related:** [architecture.md](architecture.md), [code-quality.md](code-quality.md)  
**Last reviewed:** 2026-10-27

## 1. Target structure

Create directories only when real files require them; Phase 0 intentionally contains no empty application tree.

```text
src/
  app/                      # route entry points, layouts, metadata, route states
  features/
    exercises/              # domain models, provider interface, adapters, UI, tests
    muscle-explorer/        # mappings and interactive anatomy UI
    auth/                   # Clerk composition and onboarding UI
    workouts/               # future, after persistence approval
  components/
    ui/                     # genuinely cross-feature primitives
  lib/                      # provider-independent utilities and configuration parsing
  server/                   # server-only authorization/data operations
  types/                    # truly cross-domain contracts only
public/                     # approved first-party static assets only
docs/                       # supporting decisions/research when needed
.agents/                    # authoritative engineering rules
```

## 2. Ownership

- Routes compose; features implement.
- Keep a feature's components, domain types, adapter, schemas, and tests together until reuse is demonstrated.
- `src/components/ui` must not know about exercises, muscles, Clerk, or workouts.
- `src/lib` is not a dumping ground. A helper used by one feature stays in that feature.
- `src/types` is for stable contracts shared by multiple domains. Prefer feature-owned types.
- `src/server` may import domain code; client code must never import `src/server`.

## 3. Suggested exercise feature shape

```text
src/features/exercises/
  domain/exercise.ts
  providers/exercise-provider.ts
  providers/exercise-gym-gifs/
    adapter.ts
    schema.ts
    mapping.ts
  components/
  queries/
  tests/
```

This is a direction, not permission to create placeholders. Add only files needed by the task.

## 4. Naming

- Routes and directories: lowercase kebab-case.
- React components and exported types: PascalCase.
- Functions, variables, and non-component modules: camelCase; filenames use kebab-case.
- Hooks begin with `use`; booleans begin with `is`, `has`, `can`, or `should`.
- Tests use `*.test.ts(x)` near the feature test boundary.
- Provider-specific names are explicit (`exerciseGymGifsAdapter`), not generic (`apiService`).
- Avoid `utils.ts`, `helpers.ts`, `common.ts`, and catch-all barrel files.

## 5. Imports

- Use the approved source alias for cross-feature imports once configured.
- Use relative imports within a small feature neighborhood.
- Import through a feature's intentional public module when one exists; do not reach into another feature's internals.
- Do not create circular dependencies or import route files into features.
- Keep server-only modules visibly separate and guarded using the installed framework's documented mechanism.

## 6. File design

One file should have one clear responsibility. Split when a file mixes domain mapping, fetching, rendering, and user interaction—not at an arbitrary line count. Avoid barrels that obscure client/server boundaries or pull large modules into bundles.

## 7. Static assets

Only first-party or clearly licensed assets belong in `public/`. Do not copy Exercise Gym GIFs DB media into the repository. Record creator, source, license, and required attribution for every added third-party asset.

