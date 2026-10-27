# Product Design System

**Purpose:** Define the visual and interaction principles for a polished fitness product.  
**Scope:** All web UI and future shared design decisions.  
**Related:** [accessibility.md](accessibility.md), [performance.md](performance.md), [project.md](project.md)  
**Last reviewed:** 2026-10-27

## 1. Direction

Design a focused fitness guide, not a generic admin dashboard. The visual language should feel energetic and credible without aggression, body-shaming, medicalized imagery, or “before/after” pressure. Exercise motion and anatomy are the product's visual center.

Final branding, fonts, logo, and palette remain unresolved. Phase 1 must establish tokens before screens proliferate.

## 2. Token architecture

Use semantic tokens rather than raw values in feature code:

- Color: canvas, surface, elevated, text, muted text, border, brand, accent, success, warning, danger, focus, primary-muscle, secondary-muscle.
- Typography: display, heading, body, label, caption; readable line lengths and fluid but bounded sizes.
- Space: a small consistent scale for inset, stack, cluster, and page gutters.
- Shape/elevation: restrained radii, borders, and shadows that work in light/dark modes.
- Motion: fast feedback, standard transitions, and deliberate demonstrations; all obey reduced motion.

Every semantic foreground/background pair must meet [accessibility.md](accessibility.md) contrast requirements in every theme.

## 3. Mobile-first composition

- Begin at narrow viewports and enhance progressively.
- Primary controls fit comfortable touch targets and remain reachable without horizontal scrolling.
- Filters use an accessible compact summary plus sheet/drawer or wrapping controls where justified; selected filters stay visible.
- Exercise cards prioritize name, verified category/equipment, target, and media state.
- Detail pages keep animation, essential metadata, instructions, and muscle diagram in a logical reading order; wide screens may use columns without changing DOM meaning.
- Navigation must scale from mobile to desktop without hiding essential destinations.

## 4. Shared component contracts

Likely primitives include Button, LinkButton, Input, Select/Combobox, Chip, Dialog/Sheet, Card, Skeleton, Alert, EmptyState, MediaFrame, and VisuallyHidden. Feature components include ExerciseCard, ExerciseFilters, ExerciseMedia, ExerciseMetadata, InstructionSteps, MuscleDiagram, and MuscleLegend.

Do not create all primitives upfront. Build them as required, with variants driven by semantics instead of one-off classes.

## 5. Required UI states

Every data-driven surface defines loading, empty, error, partial-data, offline/unavailable-provider, missing-media, and retry behavior. Interactive actions define default, hover where applicable, focus-visible, active, disabled, pending, success, and error states.

An unavailable GIF must not collapse the card or show a broken image icon. Use a stable aspect-ratio placeholder with honest copy; never substitute an unrelated exercise.

## 6. Exercise media

- Do not autoplay motion when reduced motion is requested; offer a static poster or explicit play control when technically possible.
- Avoid dense grids of simultaneously animating GIFs. Prefer paused/static previews or controlled loading subject to provider capability and rights.
- Preserve intrinsic aspect ratio and reserve space to prevent layout shift.
- Do not encode primary/secondary muscle meaning by color alone; include labels/legend.

## 7. Content principles

Use direct, neutral language. Distinguish provider-supplied instruction from platform UI copy. Avoid guarantees (“prevent injury,” “perfect form”), judgmental language, fabricated difficulty, and claims of medical/anatomical precision beyond the source.

## 8. Dark mode and themes

Components must rely on semantic tokens and be testable in light, dark, high-contrast, and forced-color contexts. Third-party SVG styles must be adapted without removing accessible focus or relying on a theme-specific hardcoded fill.

