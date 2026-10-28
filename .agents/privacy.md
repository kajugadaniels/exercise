# Privacy and Fitness Information

**Purpose:** Minimize collection and protect account and profile information.
**Scope:** Profiles, saved content, telemetry, support, and third-party disclosure.
**Related:** [security.md](security.md), [authentication.md](authentication.md), [project.md](project.md)  
**Last reviewed:** 2026-10-28

## 1. Data minimization

Collect only data required for an approved user-visible feature. The approved mandatory profile contains a male/female gender selection, height, weight, and country. BMI is derived on demand and not stored. On 2026-10-28, the developer approved owner-scoped calendar dates and provider exercise snapshots for dated training sessions. Training preferences, workout execution, performance history, and progress history remain removed and must not be collected without a new review. Do not collect birth date, photos, injury/medical history, disability, precise location, contacts, wearable data, or additional measurements without a new review.

## 2. Data classes

| Data | Treatment |
| --- | --- |
| Clerk account/session identifiers | Private; server access only as needed |
| Gender, height, weight, country | Sensitive profile data; required for the approved profile, owner-scoped, editable, and deletable |
| BMI | Derived in application code from height and weight; never stored independently or used diagnostically |
| Display name/avatar | Personal; optional where possible |
| Scheduled training date and exercises | Potentially sensitive fitness-planning data; owner-scoped, purpose-limited, included in export, and deleted with local application data |
| Future saved content | Private user content; requires approval before collection |
| Medical/injury information | Out of scope |
| Search/filter events | Do not retain by default; analytics requires approval |

## 3. Purpose and transparency

Before collection, explain what is collected, why, where it is stored, who receives it, and how to delete it. Do not reuse profile data for advertising, profiling, model training, or unrelated recommendations without a new explicit decision and lawful basis.

## 4. Access and deletion

Private data is owner-scoped. Profile correction and profile deletion are part of the initial implementation. Deleting the profile transactionally deletes its scheduled sessions and returns the account to mandatory onboarding. Profile and session records are otherwise retained until local-data deletion. An authenticated user can delete all locally stored application, profile, and session data after a strong confirmation. A portable JSON export contains the user's stored profile and scheduled sessions but omits internal owner identifiers.

Local deletion does not delete the external Clerk identity. Verified Clerk account-deletion synchronization, Neon backup expiry, and operational deletion verification remain release gates before public release.

## 5. Third parties

Do not send Clerk identity, profile data, scheduled dates, IP-derived context, or search history to the public exercise CDN or optional RapidAPI provider. The scheduling service sends only a validated source exercise ID through the existing provider adapter. Review vendor privacy terms and data flow before adding analytics, crash reporting, storage, email, or video services.

## 6. Logs, caches, and testing

Exclude tokens, raw auth objects, personal profiles, and sensitive queries from logs. Use synthetic fixtures in tests and screenshots. Personalized responses must never enter a public/shared cache.

## 7. Health and safety posture

The platform provides general fitness information, not medical advice. Do not infer health conditions or risk scores. Avoid unnecessary “sensitive health” classification claims while still treating fitness behavior conservatively as potentially sensitive personal data.

## 8. Future decision gate

Neon PostgreSQL is approved for development and production. Before public release, document and verify the selected Neon regions, encryption posture, backup retention and deletion behavior, Clerk account-deletion synchronization, export runtime behavior, and incident response. These are release blockers, not inferred guarantees.
