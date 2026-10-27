# Exercise Catalog, Accuracy, Media, and Licensing

**Purpose:** Govern exercise data truth, provider mapping, filtering, media use, attribution, and licensing.  
**Scope:** Every exercise record, instruction, category, muscle, equipment value, GIF/video, and related-exercise feature.  
**Related:** [api.md](api.md), [muscle-visualization.md](muscle-visualization.md), [performance.md](performance.md)  
**Last reviewed:** 2026-10-27

## 1. Verified primary source

The proposed primary source is [Exercise Gym GIFs DB](https://github.com/JahelCuadrado/ExerciseGymGifsDB). Its README was reviewed on 2026-10-27.

Verified repository claims for stable tag `v1.1.0`:

- Static JSON/GIF delivery via `https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0`.
- English and Spanish API trees.
- 19 muscle groups and 1,323 exercises (provider claim; counts may change in future releases).
- Documented fields: `id`, `slug`, `name`, `muscle`, `bodyPart`, `equipment`, `category`, `secondaryMuscles`, `instructions`, `file`, and `gifUrl`.
- Documented categories: `strength`, `stretching`, `cardio`, `plyometrics`.
- Documented facets for muscles, equipment, body parts, and categories.

These facts describe the inspected version only. Runtime schemas must verify actual payloads. Pin an approved tag; never use the moving `main` branch in production.

## 2. Mandatory licensing gate

The provider README states that its images/GIFs were collected from the internet, that the maintainer does not own their copyrights, and that the maintainer cannot grant third-party rights. The repository root did not present a license file in the inspected listing; its README says GIFs belong to their respective authors.

Therefore:

- **Public or commercial deployment of these GIFs is blocked until each media asset's provenance, license, redistribution/embedding rights, attribution, territory, and commercial-use terms are verified and approved.**
- Do not download, commit, self-host, transform, proxy, cache persistently, redistribute, or market the GIF collection as licensed.
- A CDN URL being public/free does not grant copyright permission.
- During development, prefer metadata fixtures and clearly licensed/first-party placeholder media. Any temporary remote evaluation must remain developer-approved and non-public.
- Preserve source/attribution metadata and provide takedown procedures before launch.

Metadata/code rights also need legal review before public use because no clear repository-wide license was found. This document is engineering policy, not legal advice.

## 3. Accuracy rules

- Never invent an exercise, instruction, difficulty, safety warning, muscle relationship, equipment, category, image, or URL.
- Map only fields validated from the selected provider version.
- Treat missing instructions and secondary muscles as missing, not empty claims of “none.”
- Do not derive difficulty from equipment/category or infer muscles from the GIF.
- Provider instructions must be attributed and must not be rewritten into stronger medical/safety claims without an approved editorial source.
- Report provider inconsistencies for review; do not silently “correct” anatomy.

## 4. Canonical values

Application-owned enums decouple UI from provider values. The adapter maps every known provider value explicitly. Unknown values remain traceable and either become `unknown`/omitted under the domain contract or reject the record if required for identity. Never cast arbitrary strings to an enum.

Category and facet labels are presentation/localization data. Search indexes normalized names and supported aliases, not invented metadata.

## 5. Media behavior

- Validate HTTPS origin/path against the pinned provider configuration.
- Reserve aspect ratio; lazy-load offscreen media; avoid dozens of simultaneously animating GIFs.
- Supply a stable missing/unavailable state and textual instructions where available.
- Respect reduced motion; an animated GIF that cannot be paused must not be the only way to learn the movement.
- Never substitute one exercise's media for another.
- Keep media availability separate from exercise record availability.

## 6. Search, filters, and related exercises

Search/filter normalized records only. Define result order and combination semantics. Related exercises may use shared verified facets (for example primary muscle and equipment) with a documented deterministic rule; label them as related by metadata, not personalized recommendations.

## 7. Future licensed video provider

The domain media union supports GIF/image/video without changing core exercise records. A future provider adapter must document licensing, stable identity matching, encoding/streaming, captions or equivalent instruction, poster images, costs, uptime, and privacy. Do not replace source attribution when combining metadata and media from different providers.

## 8. Release checklist

- [ ] Exact provider tag and payload schemas verified.
- [ ] Record counts/facets treated as versioned, not hardcoded marketing truth.
- [ ] Rights review approves every deployed metadata/media use.
- [ ] Attribution and notices are visible as required.
- [ ] Missing media, provider outage, reduced motion, and invalid records are tested.
- [ ] Takedown/contact and provider-change process is documented.

