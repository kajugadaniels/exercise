# Code Quality

**Purpose:** Establish strict, maintainable implementation standards without hiding uncertainty.  
**Scope:** All source, tests, scripts, and technical documentation.  
**Related:** [architecture.md](architecture.md), [testing.md](testing.md), [folder-structure.md](folder-structure.md)  
**Last reviewed:** 2026-10-27

## 1. TypeScript

- Enable and preserve strict TypeScript settings.
- Do not use `any`, unsafe double casts, non-null assertions, `@ts-ignore`, or disabled diagnostics to force correctness.
- Accept external data as `unknown`, validate it, then normalize it.
- Prefer discriminated unions for states/results and exhaustive switches for provider/media errors.
- Keep domain types independent of provider response types and future persistence records.
- Model optional data as optional; do not replace “unknown” with a fabricated value.

## 2. Functions and modules

- Give every unit one reason to change; keep network fetching, validation, normalization, and presentation separate.
- Prefer pure normalization/filter functions and dependency injection at provider boundaries.
- Use names that describe fitness-domain intent.
- Return early for failure paths and keep nesting shallow.
- Remove dead code and stale comments within the changed scope; do not refactor unrelated files.

## 3. React and Next.js

- Server Components are the default; use Client Components only for browser interactivity.
- Keep render functions pure. Do not fetch in effects when server rendering or a documented framework primitive fits.
- Do not mirror props into state or introduce global state for local UI concerns.
- Use stable semantic keys, not array indices where order can change.
- Follow installed Next.js/React/Clerk APIs, not remembered versions.

## 4. External data accuracy

- Validate provider fields before use.
- Never invent exercises, instructions, categories, difficulty, equipment, muscles, media URLs, or relationships.
- Store source ID, provider, version/ref, attribution, and media provenance where the contract supports them.
- A mapping table must handle unmapped values explicitly and be tested.

## 5. Errors and observability

- Do not catch and ignore errors. Convert expected errors to typed results and unexpected ones to safe failures.
- Logs must be structured, minimal, and free of tokens, raw auth objects, personal profiles, or sensitive fitness data.
- Error copy tells the user what happened and a safe next action without exposing internals.

## 6. Comments and documentation

Comment the reason, constraint, or non-obvious trade-off—not a restatement of code. Document exported contracts only where types/names do not make behavior clear. Update nearby documentation when behavior or a verified provider contract changes.

## 7. Reuse

Do not generalize on first use. Extract shared components or helpers after a real repeated pattern appears and the shared API is smaller than the duplicated complexity. Preserve accessibility behavior when extracting UI.

## 8. Review standard

A change is ready for developer verification when it is scoped, readable, strictly typed, accurate to verified source data, contains applicable tests, respects client/server and license boundaries, and clearly reports everything not executed.

