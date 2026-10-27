# Privacy and Fitness Information

**Purpose:** Minimize collection and protect account, preference, workout, and activity information.  
**Scope:** Profiles, saved content, workout history, goals, telemetry, support, and third-party disclosure.  
**Related:** [security.md](security.md), [authentication.md](authentication.md), [project.md](project.md)  
**Last reviewed:** 2026-10-27

## 1. Data minimization

Collect only data required for an approved user-visible feature. On 2026-10-27, the developer explicitly approved a mandatory profile containing gender, height, weight, and country so future progress and training records can be personalized and owned. BMI is derived on demand and not stored. Do not collect birth date, photos, injury/medical history, disability, precise location, contacts, wearable data, or additional measurements without a new review.

## 2. Data classes

| Data | Treatment |
| --- | --- |
| Clerk account/session identifiers | Private; server access only as needed |
| Gender, height, weight, country | Sensitive profile data; required for the approved profile, owner-scoped, editable, and deletable |
| BMI | Derived in application code from height and weight; never stored independently or used diagnostically |
| Display name/avatar | Personal; optional where possible |
| Fitness preferences/goals | Potentially sensitive; optional, purpose-limited, editable |
| Favorites/workout plans | Private user content |
| Measurement history | Sensitive profile history; owner-scoped, retained with the fitness profile, deleted with it |
| Sets/reps/workout history/frequency | Sensitive behavioral fitness data; future only |
| Medical/injury information | Out of scope |
| Search/filter events | Do not retain by default; analytics requires approval |

## 3. Purpose and transparency

Before collection, explain what is collected, why, where it is stored, who receives it, and how to delete it. Do not reuse workout data for advertising, profiling, model training, or unrelated recommendations without a new explicit decision and lawful basis.

## 4. Access and deletion

Private data is owner-scoped. Profile correction and profile deletion are part of the initial implementation. A deleted profile returns the account to mandatory onboarding. Profile records are retained until the user deletes the profile or application account deletion is processed. Full account deletion synchronization and export remain release gates.

## 5. Third parties

Do not send Clerk identity, profile data, workout data, IP-derived context, or search history to the public exercise CDN or optional RapidAPI provider. Review vendor privacy terms and data flow before adding analytics, crash reporting, storage, email, or video services.

## 6. Logs, caches, and testing

Exclude tokens, raw auth objects, personal profiles, workout details, and sensitive queries from logs. Use synthetic fixtures in tests and screenshots. Personalized responses must never enter a public/shared cache.

## 7. Health and safety posture

The platform provides general fitness information, not medical advice. Do not infer health conditions or risk scores. Avoid unnecessary “sensitive health” classification claims while still treating fitness behavior conservatively as potentially sensitive personal data.

## 8. Future decision gate

Neon PostgreSQL is approved for development and production. Before public release, document and verify the selected Neon regions, encryption posture, backup retention and deletion behavior, Clerk account-deletion synchronization, export process, and incident response. These are release blockers, not inferred guarantees.
