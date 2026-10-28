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
- Required post-registration onboarding for the approved platform profile.
- Future saved content scoped to the authenticated application user after persistence approval.

Do not collect age, diagnoses, injuries, medical history, or additional body measurements. Gender, height, weight, country, and derived BMI are the specifically approved onboarding fields.

## 3. Route policy

The developer confirmed an authenticated-first application on 2026-10-27. The route matrix is:

| Surface | Access |
| --- | --- |
| Root `/` | Session gate; signed-out users go to `/sign-in`, signed-in users enter the profile gate |
| Sign-in/sign-up | Public Clerk catch-all routes; authenticated users redirect safely |
| Exercise browse/detail | Authenticated |
| Profile/account/onboarding | Authenticated |
| Future saved content | Authenticated and owner-scoped after feature approval |
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

Onboarding state is the existence of a valid persisted profile for the current Clerk-linked application user. The protected route-group layout checks it on the server and redirects incomplete users to `/onboarding`; the onboarding route redirects completed users to `/home`. Profile writes are idempotent, editable, and deletable.

BMI is calculated from the current height and weight and is not stored as an independent value. It is displayed as informational fitness context, not a diagnosis, score, or eligibility decision.

## 7. Webhooks and synchronization

If future database records synchronize from Clerk, verify webhook signatures against the raw body using the installed official procedure, handle replay/idempotency, and tolerate out-of-order delivery. A webhook never accepts an actor ID or role without signature verification.

## 8. Session and account events

Sign-out must clear private cached UI. Account deletion requires a defined deletion policy for future application data before launch. Never log tokens, session objects, headers, or webhook secrets.

