# Deployment and Environments

**Purpose:** Define Vercel-compatible environment and release considerations without assuming deployment is configured.  
**Scope:** Local, preview, production, environment configuration, headers, and release gates.  
**Related:** [security.md](security.md), [performance.md](performance.md), [exercises.md](exercises.md)  
**Last reviewed:** 2026-10-27

## 1. Status

A Next.js scaffold and safe environment templates exist. No Vercel project, approved domain, database, live Clerk instance, or verified deployment is configured. Agents do not deploy.

## 2. Environments

Use distinct local, preview, and production Clerk/configuration environments. Never use production secrets in previews. Preview URLs and Clerk redirect/origin settings must be explicitly allowlisted. A future database must separate preview and production data.

## 3. Configuration classes

| Class | Examples | Exposure |
| --- | --- | --- |
| Public browser config | Clerk publishable key, explicitly public app URL | May be public only when vendor documents it |
| Server secrets | Clerk secret/webhook keys, future database URL, RapidAPI key | Server only |
| Non-secret server config | Pinned exercise provider base/ref | Prefer server-owned; safe to document |

The committed templates are `.env.local.example` and `.env.production.example`. They define `NEXT_PUBLIC_APP_URL`, Clerk publishable/server/webhook placeholders, and the pinned exercise-provider base/version. Copy names—not example values—into the intended environment. Hosting dashboards hold production secrets; real `.env*` files remain ignored.

Do not add database, RapidAPI, analytics, or storage variables until those integrations are approved. When a vendor version changes, re-check its official variable names and update both templates together.

## 4. Release gates

- [ ] Developer-run lint, type check, tests, and production build pass.
- [ ] Clerk production configuration and route protection are verified.
- [ ] Environment values exist in the correct scope; no secrets are exposed in client bundles/logs.
- [ ] Exercise metadata and every deployed media asset have approved rights and attribution.
- [ ] Security headers, CSP, HTTPS, allowed image/media origins, and referrer policy are reviewed.
- [ ] Accessibility and mobile manual checks pass.
- [ ] Provider outage, missing media, error pages, and rollback are tested.
- [ ] Privacy notice, deletion/retention behavior, and third-party disclosures match implemented features.
- [ ] Monitoring/analytics, if any, are approved and documented.

The media-rights gate currently blocks public deployment using ExerciseGymGifsDB GIFs.

## 5. Caching and provider versions

Production configuration pins an approved provider tag rather than `main`. A version upgrade is a reviewed data migration: validate schema/count/facets, mapping changes, content quality, licensing, caching, and regressions before changing the ref.

## 6. Rollback and incidents

Keep the last known-good deployment available. A release plan identifies rollback, credential rotation, provider disable/fallback, and media takedown actions. Do not expose detailed incident data publicly or leave a compromised integration enabled.

## 7. Future decisions

Hosting/storage beyond the initial Vercel-compatible application, region/data residency, database, observability, custom domain, CDN/media pipeline, and backup/restore remain pending developer approval.
