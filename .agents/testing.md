# Testing and Verification

**Purpose:** Define proportional automated and manual confidence for the platform.  
**Scope:** All behavior changes, integrations, UI, and release verification.  
**Related:** [workflow.md](workflow.md), [accessibility.md](accessibility.md), [git.md](git.md)  
**Last reviewed:** 2026-10-29

## 1. Execution policy

Agents may write and review tests but must not execute tests, lint, type checks, builds, coverage, or formatters. The completion report gives exact developer-run commands based on scripts that actually exist. Do not invent package scripts before the project is scaffolded.

## 2. Testing layers

| Layer | Focus |
| --- | --- |
| Unit | Provider schemas/mappings, muscle mapping, profile validation/BMI, filter semantics, URL construction, error translation |
| Component | Exercise states, filter controls, diagram wrapper, keyboard behavior, missing media |
| Integration | Route rendering with provider success/failure, Clerk protection, owner-scoped operations |
| End-to-end | Core browse→filter→detail, exercise scheduling with planned sets/reps/weight, and sign-in/onboarding/profile journeys |
| Manual | Visual quality, mobile/touch, real assistive tech, reduced motion, remote-media behavior |

Prefer behavior assertions over implementation details. Tests should remain deterministic and independent of live providers.

## 3. Provider fixtures and contracts

- Keep small sanitized fixtures representing valid, missing-optional, unknown-enum, malformed, empty, and oversized responses.
- Do not copy the entire third-party dataset or GIFs into tests.
- Contract tests target a pinned provider version and are developer-run deliberately; routine tests use fixtures.
- Assert provenance and rights status as well as normalized exercise fields.
- Every provider-to-highlighter mapping has a positive or explicit unsupported test.

## 4. UI coverage

Cover loading, populated, empty, filtered-empty, provider failure, malformed record, missing media, image error, long names/instructions, keyboard interaction, reduced motion, and narrow viewports. Confirm text equivalents for anatomy and motion content.

## 5. Auth and security coverage

For private operations, test unauthenticated access, completed/incomplete profiles, owner scoping, invalid payloads and origins, stale/missing records, deletion, and malicious input. Scheduling coverage includes missing, fractional, and out-of-range sets, repetitions, and weight plus the valid zero-kilogram bodyweight case. Mock Clerk only at the documented boundary. A client visibility test is not an authorization test. Database integration tests remain pending because no test database is approved.

## 6. Accessibility verification

Automated checks supplement, not replace, manual keyboard navigation, focus order, zoom/reflow, forced colors, contrast, screen-reader smoke testing, and motion preference review. Do not accept snapshot-only coverage for interactive SVGs.

## 7. Performance and resilience

Include tests for bounded pagination/filter input, cancellation/timeouts where implemented, cache policy, partial/unavailable provider states, and media fallback. Measure real pages during developer verification instead of asserting performance from code structure alone.

## 8. Completion evidence

Reports distinguish tests written from tests executed. If the developer supplies results, state the exact command and outcome; never generalize one passing test into full-project verification.

