# Authentication and Authorization

**Purpose:** Define the Clerk account, session, onboarding, and authorization architecture.  
**Scope:** Sign-up, sign-in, account UI, protected routes, profiles, and private operations.  
**Related:** [security.md](security.md), [privacy.md](privacy.md), [api.md](api.md)  
**Last reviewed:** 2026-10-27

## 1. Provider and boundaries

Clerk is the approved authentication provider. Use the installed Clerk version's official Next.js App Router documentation before implementation. Do not add another auth provider, custom password system, or hand-rolled session cookie.

Authentication answers “who has a valid session?” Authorization answers “may this actor perform this operation on this resource?” Every private server operation must do both.

## 2. Planned account journeys

- Sign up and sign in through Clerk-supported components or documented custom flows.
- Account/session management through Clerk-supported UI where it fits product design.
- Post-registration onboarding for a minimal platform profile.
- Future saved exercises, workouts, and history scoped to the authenticated user after persistence approval.

Do not implement profile persistence until a database is approved. Do not collect age, body measurements, diagnoses, injuries, or health history merely to complete onboarding.

## 3. Route policy

The developer confirmed an authenticated-first application on 2026-10-27. The route matrix is:

| Surface | Access |
| --- | --- |
| Root `/` | Session gate; signed-out users go to `/sign-in`, signed-in users go to `/exercises` |
| Sign-in/sign-up | Public Clerk catch-all routes; authenticated users redirect safely |
| Exercise browse/detail | Authenticated |
| Profile/account/onboarding | Authenticated |
| Favorites, plans, history, progress | Authenticated and owner-scoped |
| Internal callbacks/webhooks | Signature-verified server endpoints, not user sessions |

Keep `clerkMiddleware()` configured for Clerk request integration, but do not treat proxy redirects as authorization. Each protected page, Server Action, Route Handler, and server data function enforces its own policy with the installed Clerk server API.

## 4. Server-side identity

- Obtain the actor from Clerk's documented server API for the installed version.
- Reject absent/invalid sessions before private data access.
- Derive the owner ID from the session, never from a client-submitted user ID.
- Scope every query and mutation to that owner; a guessed resource ID must not cross accounts.
- Use Clerk metadata only for data documented as suitable and small. Do not use public metadata for sensitive authorization unless the verified Clerk model supports the exact use.

## 5. Client behavior

Client auth state may improve navigation and presentation but never authorizes a server action. Show useful pending states during Clerk loading and avoid flashing private content. Return URLs must be allowlisted same-origin paths to prevent open redirects.

## 6. Onboarding

Onboarding state must be explicit, server-derived, resumable, and idempotent. Collect only fields required by an approved feature. Fitness goals/preferences are future and require a privacy review; use non-medical wording and allow editing/deletion.

## 7. Webhooks and synchronization

If future database records synchronize from Clerk, verify webhook signatures against the raw body using the installed official procedure, handle replay/idempotency, and tolerate out-of-order delivery. A webhook never accepts an actor ID or role without signature verification.

## 8. Session and account events

Sign-out must clear private cached UI. Account deletion requires a defined deletion policy for future application data before launch. Never log tokens, session objects, headers, or webhook secrets.

