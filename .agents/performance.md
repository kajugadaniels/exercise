# Performance and Mobile Efficiency

**Purpose:** Keep the catalog fast on mobile devices and constrained networks without violating provider or privacy rules.  
**Scope:** Rendering, data fetching, caching, JavaScript, images/GIFs/video, and interactions.  
**Related:** [architecture.md](architecture.md), [exercises.md](exercises.md), [deployment.md](deployment.md)  
**Last reviewed:** 2026-10-27

## 1. Principles

- Server-render useful initial content; hydrate only interactive islands.
- Measure before adding performance complexity.
- Optimize the exercise list and media first: they are the likely network/rendering bottlenecks.
- Performance work must not bypass licensing, accessibility, privacy, or data validation.

## 2. Targets for Phase 1 validation

Use Core Web Vitals “good” thresholds at the 75th percentile as release goals: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1. These are measurement targets, not claims. Define a mobile network/device test profile when tooling is selected.

## 3. Data loading

- Fetch on the server where it improves first render and does not expose secrets.
- Use provider facet endpoints rather than repeatedly downloading the full catalog when verified to be more efficient.
- Bound result/page sizes and concurrent requests.
- Deduplicate requests through framework-supported mechanisms verified for the installed Next.js version.
- Give provider calls timeouts and useful stale/error behavior.

## 4. Caching

The `v1.1.0` CDN path is immutable in intent, but cache directives and provider behavior must be inspected before policy is finalized. Public versioned metadata may be cached; personalized data may not use shared caching. Cache invalidation changes when the pinned provider version changes.

Do not persistently cache or proxy third-party media until rights explicitly allow it.

## 5. Media

- Reserve dimensions/aspect ratios and lazy-load below the fold.
- Avoid simultaneous autoplay across result grids.
- Prefer a licensed optimized video/poster pipeline when approved; GIFs are often bandwidth-heavy and lack controls.
- Do not download or transcode unlicensed provider media.
- Provide error fallback and prevent retry loops.

## 6. Browser JavaScript

Keep catalog presentation server-rendered. Load the muscle highlighter and complex filter interaction only where used; evaluate dynamic loading after measuring. Avoid broad barrel imports and heavy global state. A future UI dependency needs a bundle-impact rationale.

## 7. Rendering and interaction

Virtualize only when measured list size requires it and accessibility is preserved. Debounce expensive client filtering thoughtfully, keep input responsive, and prefer URL/server pagination for large datasets. Skeletons reserve final layout space.

## 8. Monitoring

Analytics/performance monitoring services are not approved. If proposed, document collected data, sampling, cost, retention, consent impact, CSP changes, and bundle/runtime overhead before installation.

