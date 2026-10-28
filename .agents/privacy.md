# Privacy and Fitness Information

**Purpose:** Minimize collection and protect account, preference, workout, and activity information.  
**Scope:** Profiles, saved content, workout history, goals, telemetry, support, and third-party disclosure.  
**Related:** [security.md](security.md), [authentication.md](authentication.md), [project.md](project.md)  
**Last reviewed:** 2026-10-28

## 1. Data minimization

Collect only data required for an approved user-visible feature. On 2026-10-27, the developer explicitly approved a mandatory profile containing a male/female gender selection, height, weight, and country. On 2026-10-28, the developer approved owner-scoped weekly plans, execution history, and optional training preferences. BMI is derived on demand and not stored. Do not collect birth date, photos, injury/medical history, disability, precise location, contacts, wearable data, or additional measurements without a new review.

## 2. Data classes

| Data | Treatment |
| --- | --- |
| Clerk account/session identifiers | Private; server access only as needed |
| Gender, height, weight, country | Sensitive profile data; required for the approved profile, owner-scoped, editable, and deletable |
| BMI | Derived in application code from height and weight; never stored independently or used diagnostically |
| Display name/avatar | Personal; optional where possible |
| Fitness preferences/goals | Potentially sensitive; optional, owner-scoped, purpose-limited, editable, and independently deletable; includes goal, experience, session duration, timezone, equipment, and preferred days |
| Favorites/workout plans | Private user content |
| Measurement history | Sensitive profile history; owner-scoped, retained with the fitness profile, deleted with it |
| Sets/reps/workout history/frequency | Sensitive behavioral fitness data; weekly training foundation approved 2026-10-28, owner-scoped, purpose-limited, and never disclosed to exercise providers |
| Medical/injury information | Out of scope |
| Search/filter events | Do not retain by default; analytics requires approval |

## 3. Purpose and transparency

Before collection, explain what is collected, why, where it is stored, who receives it, and how to delete it. Do not reuse workout data for advertising, profiling, model training, or unrelated recommendations without a new explicit decision and lawful basis.

## 4. Access and deletion

Private data is owner-scoped. Profile correction and profile deletion are part of the initial implementation. A deleted profile returns the account to mandatory onboarding. Profile records are retained until the user deletes the profile or local application data. Training preferences can be cleared independently without deleting the profile or workout history. A planned week can be deleted independently until workout activity is recorded; after that point, the planning API protects the history from accidental replacement or deletion. An authenticated user can explicitly delete one ended workout record or delete all locally stored profile and training data after a strong confirmation. A portable JSON export contains the user's application-owned fitness data but omits internal owner identifiers. Training records attach to the internal user rather than the editable profile so profile correction does not rewrite history.

Local deletion does not delete the external Clerk identity. Verified Clerk account-deletion synchronization, Neon backup expiry, and operational deletion verification remain release gates before public release.

## 5. Third parties

Do not send Clerk identity, profile data, workout data, IP-derived context, or search history to the public exercise CDN or optional RapidAPI provider. Review vendor privacy terms and data flow before adding analytics, crash reporting, storage, email, or video services.

## 6. Logs, caches, and testing

Exclude tokens, raw auth objects, personal profiles, workout details, and sensitive queries from logs. Use synthetic fixtures in tests and screenshots. Personalized responses must never enter a public/shared cache.

## 7. Health and safety posture

The platform provides general fitness information, not medical advice. Do not infer health conditions or risk scores. Avoid unnecessary “sensitive health” classification claims while still treating fitness behavior conservatively as potentially sensitive personal data.

## 8. Future decision gate

Neon PostgreSQL is approved for development and production. Before public release, document and verify the selected Neon regions, encryption posture, backup retention and deletion behavior, Clerk account-deletion synchronization, export runtime behavior, and incident response. These are release blockers, not inferred guarantees.
