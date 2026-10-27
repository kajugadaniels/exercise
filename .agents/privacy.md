# Privacy and Fitness Information

**Purpose:** Minimize collection and protect account, preference, workout, and activity information.  
**Scope:** Profiles, saved content, workout history, goals, telemetry, support, and third-party disclosure.  
**Related:** [security.md](security.md), [authentication.md](authentication.md), [project.md](project.md)  
**Last reviewed:** 2026-10-27

## 1. Data minimization

Collect only data required for an approved user-visible feature. Requiring a Clerk session does not justify collecting an additional application profile: the exercise catalog must work without fitness or demographic profile fields. Do not collect birth date, sex/gender, height, weight, photos, injury/medical history, disability, location, contacts, or wearable data unless a later approved feature cannot work without it and receives a specific privacy review.

## 2. Data classes

| Data | Treatment |
| --- | --- |
| Clerk account/session identifiers | Private; server access only as needed |
| Display name/avatar | Personal; optional where possible |
| Fitness preferences/goals | Potentially sensitive; optional, purpose-limited, editable |
| Favorites/workout plans | Private user content |
| Sets/reps/history/frequency | Sensitive behavioral fitness data; future only |
| Medical/injury information | Out of scope |
| Search/filter events | Do not retain by default; analytics requires approval |

## 3. Purpose and transparency

Before collection, explain what is collected, why, where it is stored, who receives it, and how to delete it. Do not reuse workout data for advertising, profiling, model training, or unrelated recommendations without a new explicit decision and lawful basis.

## 4. Access and deletion

Future private data is owner-scoped. Users need reasonable export/correction/deletion paths before public launch. Define retention and account-deletion behavior alongside the chosen database; do not promise deletion mechanics before implementation is verified.

## 5. Third parties

Do not send Clerk identity, profile data, workout data, IP-derived context, or search history to the public exercise CDN or optional RapidAPI provider. Review vendor privacy terms and data flow before adding analytics, crash reporting, storage, email, or video services.

## 6. Logs, caches, and testing

Exclude tokens, raw auth objects, personal profiles, workout details, and sensitive queries from logs. Use synthetic fixtures in tests and screenshots. Personalized responses must never enter a public/shared cache.

## 7. Health and safety posture

The platform provides general fitness information, not medical advice. Do not infer health conditions or risk scores. Avoid unnecessary “sensitive health” classification claims while still treating fitness behavior conservatively as potentially sensitive personal data.

## 8. Future decision gate

Before persistence, document the data inventory, field purposes, retention, access/deletion, backup behavior, vendor regions, encryption, account deletion, and incident response. Database selection is not only a technical decision.
