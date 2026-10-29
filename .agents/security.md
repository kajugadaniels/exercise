# Security

**Purpose:** Define non-negotiable trust, validation, authorization, secret, and external-integration boundaries.  
**Scope:** All code, configuration, user data, and third-party connections.  
**Related:** [authentication.md](authentication.md), [api.md](api.md), [privacy.md](privacy.md)  
**Last reviewed:** 2026-10-29

## 1. Trust model

Treat browser input, URLs, query parameters, provider JSON, remote media, webhook payloads, and cached data as untrusted. Validate at each boundary. TypeScript types are not runtime validation.

## 2. Authentication and authorization

- The confirmed route matrix requires authentication for catalog pages. Any future public read exception requires an explicit route-policy change and must not expose private or personalized data.
- Private operations authenticate server-side and authorize against the specific resource.
- Actor and ownership identifiers come from the verified session/server record, not request bodies.
- Deny by default. Client route hiding, Clerk UI state, and middleware redirects are defense-in-depth only.
- Prevent object-level authorization failures by owner-scoping the data access itself.

## 3. Input and output

- Apply runtime schemas with length, format, enum, and collection limits.
- Normalize search/filter input without constructing executable queries or arbitrary upstream URLs.
- Escape by default through React; never inject provider HTML. Do not use `dangerouslySetInnerHTML` for exercise instructions.
- Return stable safe errors, not stack traces, provider bodies, internal paths, or account existence details.

## 4. Secrets and environment variables

Secrets are server-only, never prefixed/exposed as public values, committed, printed, or embedded in browser bundles. `DATABASE_URL` and `DIRECT_URL` are server secrets; the browser receives neither. The application validates the runtime database connection before constructing Prisma. Public CDN URLs are configuration, not secrets; still allowlist their origin and protocol.

Profile mutation endpoints require a verified Clerk session, same-origin request, JSON content type, a 16 KiB body limit, and strict runtime validation. Profile queries scope through the session-derived Clerk ID. Personalized data is never publicly cached.

Training-session mutations require the same verified-session and same-origin protections, a completed profile, a bounded JSON body, strict date/exercise validation, bounded integer sets and repetitions, bounded quarter-kilogram weight, and server-side provider resolution. The database—not client state—enforces exercise uniqueness and prescription bounds for each owner-scoped session date.

Training-calendar reads require a verified Clerk session and completed profile, accept exactly one bounded `YYYY-MM` query, scope the database query through the session-derived owner, return no internal identifiers, and use `Cache-Control: private, no-store`.

## 5. External providers and SSRF

- Use fixed HTTPS origins and version-pinned paths for Exercise Gym GIFs DB.
- Build paths from validated identifiers; never fetch an arbitrary user-provided URL.
- Set timeouts, response-size expectations, content-type checks, and bounded retries where runtime support permits.
- Do not forward cookies, authorization headers, or personal data to the exercise CDN.
- RapidAPI is disabled unless approved; any future key remains server-side.

## 6. Remote media and browser policy

Allowlist only approved image/media hosts in Next.js configuration. Apply restrictive Content Security Policy and referrer policy during implementation. Remote media availability is not permission to embed it; [exercises.md](exercises.md) licensing rules are a release gate.

## 7. Abuse and availability

Bound search terms, filters, pagination, and parallel fetches. Cache public immutable/versioned data appropriately, fail gracefully during provider outage, and do not create an open proxy. Add rate limiting only with an approved service and a documented threat/retention model.

## 8. Dependencies

Before approval, check the dependency's exact version, license, maintenance, transitive surface, browser/server behavior, and known advisories using authoritative sources. Lockfiles are developer-generated. Do not add a package for a small safe helper.

## 9. Security review gates

Require focused review for auth changes, new server endpoints, remote URL handling, persistence/schema choices, uploads, webhooks, payment/monetization, health-related data, or deployment headers. Do not weaken this document without developer approval.

