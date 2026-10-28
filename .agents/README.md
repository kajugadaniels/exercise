# GYM Fitness Platform Engineering Rules — Index

**Purpose:** Provide the authoritative rule index and precedence for every human and coding agent working on the platform.  
**Scope:** Every task, without exception.  
**Last reviewed:** 2026-10-28

These documents are project policy. Read this file first, then the documents required for the task.

## 1. Rule documents

| Document | Authority | Read when |
| --- | --- | --- |
| [workflow.md](workflow.md) | Execution restrictions, lifecycle, reporting | **Every task** |
| [project.md](project.md) | Mission, users, phases, boundaries, open decisions | **Every task** |
| [architecture.md](architecture.md) | Application layers and rendering/integration boundaries | Any code or architecture work |
| [folder-structure.md](folder-structure.md) | Feature organization, naming, imports, and stylesheet placement | Creating or moving files |
| [code-quality.md](code-quality.md) | Strict typing, maintainability, and documentation | Any code change |
| [design.md](design.md) | Design system, CSS architecture, page/component modules, responsive behavior | Any UI or CSS work |
| [accessibility.md](accessibility.md) | WCAG, keyboard, screen reader, and motion requirements | Any UI work |
| [authentication.md](authentication.md) | Clerk sessions, onboarding, and authorization | Auth, profiles, protected areas |
| [security.md](security.md) | Validation, secrets, authorization, and external resources | Server, data, auth, integrations |
| [api.md](api.md) | Provider adapters, schemas, handlers, and errors | External data or server entry points |
| [exercises.md](exercises.md) | Exercise truth, filtering, media, licensing, attribution | Exercise catalog or media |
| [muscle-visualization.md](muscle-visualization.md) | Anatomy map, client boundary, muscle normalization | Muscle diagrams and explorer |
| [privacy.md](privacy.md) | Data minimization and fitness information | Personal or activity data |
| [testing.md](testing.md) | Test strategy and manual verification | Logic/UI changes; task completion |
| [performance.md](performance.md) | Rendering, caching, media, mobile budgets | UI, data, media, integrations |
| [git.md](git.md) | One-file commit planning and protected operations | End of every task |
| [deployment.md](deployment.md) | Environments, configuration, release gates | Configuration or release work |

## 2. Rules for every task

1. Read [workflow.md](workflow.md) and [project.md](project.md).
2. Read [code-quality.md](code-quality.md) before code changes, plus every relevant topic document.
3. Inspect current files and nearby patterns before editing. If dependencies exist, read their installed README, types, and version-matched official documentation.
4. Do not introduce features, dependencies, services, persistence, or stack changes without developer approval.
5. Never inspect secret values in `.env*` files. Safe example templates may contain placeholders only.
6. End with the report in [workflow.md §7](workflow.md#7-completion-report).

## 3. Required reading by task type

| Task | Additional documents |
| --- | --- |
| Frontend or shared UI | architecture, folder-structure, design, accessibility, performance, testing |
| Server logic or Route Handler | architecture, folder-structure, api, security, performance, testing |
| Authentication or profile | authentication, security, privacy, api, testing |
| Exercise catalog or search | exercises, api, architecture, performance, testing |
| GIF/video media | exercises, security, performance, accessibility |
| Muscle explorer | muscle-visualization, exercises, design, accessibility, testing |
| Workout or progress planning | project, privacy, security; weekly training persistence approved 2026-10-28 |
| Deployment/configuration | deployment, security, performance |
| Rulebook/documentation | workflow, project, and each edited document's owner topic |

## 4. Rule precedence

Apply the first matching level:

1. [workflow.md](workflow.md) execution restrictions and [security.md](security.md) security boundaries. Only the developer can change these by editing the owning document.
2. Explicit developer instructions for the current task.
3. The most specific `.agents/` topic document. `exercises.md` owns exercise/media truth; `authentication.md` owns Clerk flows; `security.md` owns security questions.
4. Official documentation matching the installed version. Installed package types and docs win over memory.
5. General knowledge.

A chat request alone does not relax level-one restrictions. Give the developer the command instead.

## 5. Conflicts and outdated guidance

- If two rule documents conflict, stop and ask; do not choose silently.
- If installed APIs contradict a rule, preserve the rule's intent, follow the verified API, and flag the rule for developer review.
- If a requested feature expands the active phase or settles an open decision, state the conflict and ask for approval before implementing it.
- If a rule is unsuitable, implement the compliant choice and propose a focused rule change separately.

## 6. Changing rules

- Change the single owning document; link to it elsewhere instead of copying policy.
- Update its **Last reviewed** date.
- Do not mix governance changes into unrelated feature work.
- Rule changes take effect after developer acceptance.
- Agents never weaken workflow or security boundaries on their own.

## 7. Project vocabulary

| Term | Meaning |
| --- | --- |
| Exercise provider | External source that supplies exercise metadata/media references. |
| Normalized exercise | Validated application-owned record produced by a provider adapter. |
| Primary muscle | Provider-supported main target, not a medical claim. |
| Secondary muscle | Provider-supported supporting target; may be absent. |
| Muscle slug | Application identifier mapped explicitly to visualization identifiers. |
| Exercise media | Third-party GIF/video referenced by a normalized record. Availability is not a usage license. |
| Protected catalog | Exercise discovery pages that require a verified Clerk session under the confirmed authenticated-first route policy. |
| Personal workout | User-owned Monday–Sunday training plan. Its owner-scoped planning API and weekly calendar UI are implemented in code; execution and recommendation behavior remain separate tasks. |
| Training preferences | Optional owner-scoped goal, experience, session duration, timezone, equipment, and preferred training days used as future recommendation inputs. |

## 8. Changelog

| Date | Change |
| --- | --- |
| 2026-10-27 | Created the Phase 0 rulebook, adapted from CareBasket governance for the fitness domain. |
| 2026-10-27 | Adopted plain CSS with colocated CSS Modules and added page, layout, component, token, cascade, and responsive styling rules. |
| 2026-10-27 | Approved Outfit, the logo coral/navy palette, compact accessible type, Hugeicons, responsive foundation, light/dark themes, and safe environment templates. |
| 2026-10-28 | Approved the owner-scoped weekly training persistence foundation. |
| 2026-10-28 | Approved optional owner-scoped training preferences and their protected API boundary. |
| 2026-10-28 | Approved the protected Monday–Sunday weekly planning API and immutable-history boundary. |
| 2026-10-28 | Added the protected, responsive Monday–Sunday manual planning calendar. |

