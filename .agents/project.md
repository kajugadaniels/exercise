# Project Definition and Product Scope

**Purpose:** Define the product mission, users, phased capabilities, exclusions, and unresolved decisions.  
**Scope:** Every task and product decision.  
**Related:** [architecture.md](architecture.md), [exercises.md](exercises.md), [privacy.md](privacy.md)  
**Last reviewed:** 2026-10-27

## 1. Mission and vision

Build a polished, fast, accessible fitness platform that helps people discover exercises, learn safe technique from supported source material, and understand targeted muscles. The platform begins as a responsive Next.js web application, stays mobile-first, and preserves contracts that a future native client could consume.

The working name “GYM Fitness Platform” is temporary. This product is educational and organizational software, not medical advice, diagnosis, rehabilitation guidance, or a substitute for a qualified trainer or clinician.

## 2. Intended users

| Audience | Primary need |
| --- | --- |
| Beginners | Clear discovery, understandable terms, technique guidance, safe limitations |
| Intermediate users | Efficient filtering, muscle/equipment exploration, routine organization later |
| Experienced users | Broad catalog, precise filters, fast navigation, workout planning later |
| Mobile users | Touch-friendly discovery and media on constrained screens/networks |

## 3. Product phases

Status labels are binding: **Implemented**, **MVP**, **Future**, **Pending approval**, and **Blocked**.

| Area | Status | Boundary |
| --- | --- | --- |
| Engineering governance and documentation | Implemented in Phase 0 | No application scaffold or runtime proof yet |
| Next.js responsive web foundation | Phase 1 scaffold present, unverified | Next.js 16.4.3, React 19.3.0, strict TypeScript; no build/test execution claimed |
| Exercise provider adapter and validated catalog | MVP | Read-only catalog from verified provider fields |
| Browse, search, filter, detail pages | MVP | Body part, muscle, equipment, category; graceful missing media |
| Clerk sign-up/sign-in/account | Implemented in code, unverified | Authenticated-first route policy; Clerk tenant and runtime verification remain developer-owned |
| Post-registration profile onboarding | MVP, approved 2026-10-27 | Mandatory gender, height, weight, derived BMI, and country profile before protected product use |
| Muscle highlighter on detail pages | MVP after dependency approval | Local React SVG package; explicit normalization |
| Interactive muscle explorer | Future | Select muscle, filter catalog, open detail |
| Favorites and workout plans | Future | Persist only after their product model is approved |
| Measurement progress/history | MVP, approved 2026-10-27 | Append when height or weight changes; owner-scoped and deleted with the fitness profile |
| Sets, reps, rest, workout history, goals | Next phase | Define the training record before implementation |
| PWA | Future | Separate approval and offline/data policy |
| Native mobile application | Future / pending framework decision | Not supplied by Next.js automatically |
| RapidAPI muscle image generator | Optional / pending approval | Must never be a required dependency |

## 4. Expected MVP journey

1. A visitor opens the application and signs in or creates an account through Clerk.
2. After authentication, they enter the exercise library on a phone or desktop and search or filter verified records.
3. A result shows supported metadata and an animation only when lawful and available.
4. The detail page explains supported instructions and muscles without inventing difficulty or safety claims.
5. An SVG diagram highlights normalized primary/secondary muscles.
6. A first-time authenticated user completes the required profile before accessing the protected product.

## 5. Explicit exclusions until approved

- Persistence beyond the approved user and profile foundation
- Native mobile framework or native app
- Monetization, subscriptions, coaching marketplace, social feed, leaderboards
- AI-generated exercise instructions, medical guidance, or inferred health conclusions
- Unverified difficulty ratings, calories, injury risk, or muscle relationships
- Paid exercise APIs or required RapidAPI usage
- Downloading, self-hosting, redistributing, or commercially using third-party GIFs without verified rights
- Analytics, advertising, notifications, location, wearable, or health-platform integrations
- PWA installation/offline behavior

## 6. Product requirements

- Mobile-first and keyboard-accessible; no core journey depends on hover, color, sound, or animation.
- Separate provider truth from presentation through normalized application models.
- Show unavailable/unsupported values honestly rather than manufacturing defaults.
- Authentication does not replace server authorization.
- Personal data collection must be necessary, explained, and minimized.
- Exercise content requires source attribution and an auditable license decision.
- Fitness language must avoid promising outcomes or presenting generalized content as personalized medical advice.

## 7. Open decisions owned by the developer

| Decision | Current state |
| --- | --- |
| Product identity | Final name and voice remain unresolved; logo mark, Outfit, coral primary, and navy secondary are approved |
| Database and hosting | Neon PostgreSQL approved for separate development and production databases only; deployment account/region remain developer-owned |
| ORM/query layer | Prisma ORM 7 approved; pin the stable major and use migrations without a shadow database |
| Dependency installation | Clerk, Zod, Hugeicons, and React Muscle Highlighter versions are approved; developer installation/output pending |
| Styling architecture | Plain CSS with semantic tokens and colocated CSS Modules is approved; Tailwind/CSS-in-JS/UI kits require a future stack-change approval |
| Account onboarding scope | Mandatory gender, height, weight, country, and derived BMI approved on 2026-10-27; correction and deletion are required |
| Media commercial rights and alternative licensed provider | Blocking public use of ExerciseGymGifsDB GIFs |
| Native framework | Unresolved |
| Monetization | Unresolved |
| Hosting/storage beyond Vercel-compatible web deployment | Unresolved |

## 8. Scope acceptance check

A change is in scope only when it supports the active phase, uses an approved dependency/service, respects data/media rights, does not settle an open decision silently, and does not collect more user data than necessary. Otherwise, document the proposal and request approval.
