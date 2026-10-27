# Product Design and CSS Architecture

**Purpose:** Define the visual direction, design-system behavior, and ownership rules for global, page, feature, and component CSS.  
**Scope:** Every user-facing page, component, interaction, stylesheet, and theme decision.  
**Related:** [accessibility.md](accessibility.md) (wins on accessibility conflicts), [folder-structure.md](folder-structure.md), [performance.md](performance.md), [project.md](project.md)  
**Last reviewed:** 2026-10-27

## 1. Product direction

Design a focused fitness guide, not a generic admin dashboard. The experience should feel energetic, precise, and credible without aggression, body-shaming, medicalized imagery, or “before/after” pressure. Exercise motion, technique, and anatomy are the visual center.

Final branding, fonts, logo, and palette remain developer decisions. Until approved, build structure with semantic tokens and clearly licensed assets rather than cementing a temporary brand into component styles.

### 1.1 Principles

1. **Movement is the subject.** Composition should help users understand an exercise, not decorate around it.
2. **Clarity before intensity.** A fitness interface may be energetic without becoming loud, dense, or intimidating.
3. **One visual lead per page.** Spend boldness on the exercise demonstration, anatomy, or one deliberate editorial composition; keep supporting UI quiet.
4. **Structure carries meaning.** Borders, cards, labels, numbering, and badges exist only when they communicate grouping, state, hierarchy, or sequence.
5. **Same pattern, same meaning.** Shared components do not change behavior or status meaning between features.
6. **Mobile is a complete design.** Desktop rearranges and enriches; it does not merely stretch the phone layout.

### 1.2 Avoid generic generated UI

- Do not turn every section into an identical rounded card.
- Do not use decorative gradients, glow, glass effects, huge statistics, tracked all-caps eyebrows, monospace metadata, or arrow-suffixed links as default styling.
- Do not emphasize one random word in every headline with color or italics.
- Do not add numbered markers unless the content is actually ordered.
- Do not scatter fade-and-slide animations across every section or hover-lift every card.
- Do not use “fitness” clichés—neon-on-black, warning-tape diagonals, metallic textures, or aggressive condensed type—without an approved brand rationale.

## 2. Required design plan before a new page family

Before implementing a new page family or materially reshaping one, record a compact plan in the task notes or relevant design document:

- **Purpose:** the user's main job and one primary action.
- **Content hierarchy:** what is first, supporting, optional, and disclosed later.
- **Visual lead:** the single memorable subject-specific element.
- **Tokens:** proposed semantic additions for color, type, space, layout, or motion.
- **Responsive composition:** narrow and wide layouts, including reading order.
- **States:** loading, empty, partial, error, unavailable media, success, and reduced motion.
- **Accessibility:** semantics, keyboard path, focus behavior, text alternatives, and contrast.

Review the plan for template defaults before writing UI. New visual values become tokens only when they represent a reusable system decision—not merely to disguise arbitrary decoration.

## 3. Approved styling architecture

The web application uses plain CSS plus locally scoped **CSS Modules**. Tailwind CSS, CSS-in-JS, Sass, runtime styling libraries, and UI kits are not part of the approved stack. Propose them as stack changes; do not mix styling systems silently.

### 3.1 Ownership by stylesheet

| Stylesheet | Owns | Must not own |
| --- | --- | --- |
| `src/app/globals.css` | Reset, semantic design tokens, base element defaults, global focus/selection behavior, reduced-motion and forced-color safeguards | Page layout, feature selectors, component classes, route-specific imagery |
| `src/app/**/page.module.css` | Composition unique to one route: page grid, section flow, page background, local responsive rearrangement | Shared component internals, duplicate button/card/input rules, global resets |
| `src/app/**/layout.module.css` | Route-group shell composition, navigation/content geometry, safe-area accommodation | Feature presentation or reusable component variants |
| `ComponentName.module.css` | The component's structure, visual states, variants, and local responsive behavior | Parent page placement, unrelated descendants, external component internals |
| Feature `*.module.css` | Domain-specific presentation for that feature component | Global primitives or styles used by unrelated features |

Each substantial component has a same-name colocated module:

```text
ExerciseCard/
  ExerciseCard.tsx
  ExerciseCard.module.css
  ExerciseCard.test.tsx
```

Small route-only markup may use its route's `page.module.css`. Once a visual pattern is reused, extract the component and move its styles with it.

### 3.2 Module imports and class use

```tsx
import styles from "./ExerciseCard.module.css";

<article className={styles.card}>…</article>
```

- Import the CSS Module after package and application imports.
- Class names are camelCase and semantic to the component (`mediaFrame`, `primaryMuscle`), not visual accidents (`blueBox`, `leftThing`).
- Use one root class per component and explicit modifier/variant classes. Map typed component variants to module classes in TypeScript.
- A `className` escape hatch is allowed only where a shared component intentionally supports parent placement. Parent selectors must not reach into its internal DOM.
- Do not construct class names dynamically from untrusted/provider strings. Use a typed lookup.
- Do not use global string classes in JSX except documented application hooks owned by `globals.css`.

## 4. Global CSS rules

`globals.css` stays small and unsurprising. It may contain:

- `:root` semantic tokens and approved theme scopes;
- box-sizing and minimal margin reset;
- `html`/`body` defaults and text-size adjustment;
- base typography for headings and flowing text;
- responsive media defaults;
- inherited form typography;
- global link, `:focus-visible`, and selection defaults;
- universal reduced-motion and forced-color safety rules.

It must not contain `.button`, `.card`, `.exerciseGrid`, route names, feature names, or selectors that compensate for a component's missing local styles. Do not use a global reset that removes native semantics without rebuilding accessible behavior.

## 5. Page and layout module rules

Page modules compose regions; they do not recreate the design system.

- The page component imports `./page.module.css`; a route-group layout imports `./layout.module.css`.
- Page classes describe composition (`page`, `hero`, `contentGrid`, `resultsRegion`) and may set page background, max width, grid/flex flow, section spacing, and breakpoint changes.
- Shared width/gutter behavior belongs in a layout component such as `Container`, not copied across pages.
- A page may position a shared component through its documented root `className`; it must not select `.page .sharedComponent button` or depend on that component's DOM.
- Keep semantic reading order in the markup. CSS grid areas may reposition presentation only when focus and reading order remain logical.
- Route modules must account for sticky navigation, safe-area insets, scroll padding, and `min-width: 0` in flexible/grid children where overflow is possible.
- Use `100dvh`/`100svh` only with a justified mobile viewport behavior; do not trap content in a fixed viewport height.

## 6. Component module rules

Component modules own the complete visual contract of the component.

- Define default, hover where a hover-capable pointer exists, active, `:focus-visible`, disabled, loading, selected, invalid, and forced-color states when applicable.
- Use `@media (hover: hover)` for hover-only feedback so touch devices do not receive sticky hover behavior.
- Preserve control dimensions during loading; scope busy styling to the action being processed.
- Prefer attributes already present for semantics (`[aria-current]`, `[aria-selected="true"]`, `[data-state]`) over duplicate presentation-only state when practical.
- Keep selectors shallow: normally one local class, a local modifier, or a local state/child selector. Avoid specificity escalation, IDs, `!important`, and long descendant chains.
- Do not style raw descendants broadly (`.card button`, `.panel h2`) when a named class or shared component contract is safer.
- Co-locate keyframes in the module that uses them. Give them component-specific names if collisions could be confusing.
- A component module must remain meaningful if rendered in another page context.

### 6.1 Composition over CSS overrides

If two instances need different behavior, add an intentional typed variant or compose smaller components. Do not duplicate components that differ only in styling, fork a module, or override internals from a parent stylesheet.

## 7. Cascade, specificity, and nesting

- CSS Modules provide scoping, not immunity from cascade bugs. Order selectors from base → variant → state → media/forced-color adjustments.
- Keep specificity flat. Prefer separately applied base and variant classes over nested route selectors.
- Use `:where()` only when deliberately lowering specificity; document non-obvious cascade decisions.
- Never use `!important` except the universal reduced-motion safeguard, where it prevents third-party or component motion from overriding the user preference.
- Avoid CSS nesting until browser support and the project's configured tooling are verified. If used later, keep the compiled selector shallow and readable.
- Do not use `:global()` without a documented third-party integration need and a narrowly scoped owning wrapper.

## 8. Tokens and permitted values

Components consume semantic tokens rather than defining a private design system.

### 8.1 Required token families

- **Color:** canvas, surface, elevated surface, text, muted text, border, strong border, action, action-hover, on-action, focus, success, warning, danger, info, primary-muscle, secondary-muscle.
- **Typography:** interface font, optional display font, sizes, weights, line heights, tracking, readable measure.
- **Space:** a compact step scale plus fluid page gutter and section spacing.
- **Shape/depth:** purpose-specific radii, border widths, and restrained shadows.
- **Layout:** content max, reading max, detail/sidebar widths, media aspect ratios where repeated.
- **Controls:** minimum control/touch dimensions.
- **Motion:** duration, easing, and layer/z-index levels.

Final values require brand approval and contrast verification. Token names describe meaning, not a current color (`--color-action`, not `--blue-600`). Feature-specific semantic tokens such as muscle roles may alias core tokens.

### 8.2 Raw-value policy

Repeated visual values for color, spacing, radius, shadow, font, duration, or layer must come from tokens. Module-local functional values are allowed for `0`, `auto`, `100%`, `1px` hairlines, grid fractions, aspect ratios, intrinsic sizing, breakpoint literals, safe-area fallbacks, and one-off geometry that has no system meaning. Any repeated raw value should be promoted to the appropriate token owner.

Use:

- `rem` for type, spacing, controls, and breakpoints;
- logical properties (`margin-inline`, `padding-block`, `inline-size`, `border-block`) by default;
- `clamp()` for bounded fluid type/space only when all limits are intentional;
- `ch` or a reading token to cap line length, generally below 80 characters.

Do not set the root font size in pixels.

## 9. Responsive layout

Write mobile-first base rules and add `min-width` enhancements. Breakpoints are project-wide literals documented with the token/layout system because custom properties cannot drive media queries.

The initial breakpoint vocabulary is provisional until Phase 1 validates real content:

| Name | Query | Intended use |
| --- | --- | --- |
| base | none | Single-column phone composition |
| `sm` | `min-width: 40rem` | Additional card columns or paired controls |
| `md` | `min-width: 48rem` | Detail/media split when content supports it |
| `lg` | `min-width: 64rem` | Persistent navigation or catalog/sidebar composition |
| `xl` | `min-width: 80rem` | Wider gutters within capped content; never unlimited stretch |

- Break where the content fails, not because a device name suggests it.
- Prefer Grid for two-dimensional page/card composition and Flexbox for one-dimensional groups.
- Use `minmax(0, 1fr)` and `min-inline-size: 0` where long exercise names or metadata could overflow.
- Cards use `repeat(auto-fit, minmax(...))` only when the resulting minimum remains touch-friendly and visually intentional.
- Validate at 320 CSS pixels, 200% zoom, enlarged text, portrait/landscape, and long localized content.

## 10. Typography and content hierarchy

Typography carries the product's character. Choose one family or a deliberately contrasting pair after licensing and performance review; do not default automatically to common product fonts.

- Body text stays readable, generally 16px equivalent or larger; form inputs remain at least 1rem to prevent mobile zoom behavior.
- Headings use a bounded scale, clear weight hierarchy, balanced wrapping where supported, and tighter leading than body text.
- Default line length is below 80 characters; instructional steps may be narrower.
- Avoid light weights below 400 for functional text and all-caps sentences.
- Use tabular numerals for timers, repetitions, sets, and other changing aligned values.
- UI copy uses sentence case, active verbs, and stable action names. Empty/error text explains the next step rather than performing personality.

## 11. Layout and page patterns

- **Catalog:** search and primary filter summary lead; exercise results remain the dominant region. Filters collapse accessibly on narrow screens and may become a stable sidebar only when wide enough.
- **Exercise detail:** demonstration/media and exercise identity lead. Instructions and muscle information follow in semantic order; wide layouts may create a media/detail split.
- **Muscle explorer:** diagram and equivalent list are peers. Neither may hide the other's selected state.
- **Dashboard/profile:** use grouped sections and meaningful dividers rather than a wall of interchangeable metric cards.
- **Empty and failure pages:** preserve navigation and context, state what happened, and offer one clear recovery action.

## 12. Shared component contracts

Build a primitive only when a real use requires it; then reuse it.

| Component | Core design rules |
| --- | --- |
| **Button / ActionLink** | Text names the outcome; icon is supporting. Variants reflect semantic importance. At most one primary action per region. Loading preserves size and accessible name. Navigation uses links, not buttons. |
| **Field** | Persistent label, optional hint, inline error, strong control boundary, minimum control height, and 1rem input text. |
| **Card** | Used only for a real grouped object. Whole-card targets contain no nested interactive target. Shadow depends on surface hierarchy, not decoration. |
| **ExerciseCard** | Stable media frame, exercise name, verified concise metadata, honest missing-media state; long names wrap without expanding the grid unexpectedly. |
| **ExerciseMedia** | Reserved aspect ratio, lawful source state, loading/error fallback, reduced-motion behavior, and no unrelated replacement media. |
| **Filter controls** | Visible labels, active-filter summary, clear removal, URL-compatible state, and touch-friendly controls. |
| **MuscleDiagram** | Primary/secondary legend, text equivalent, keyboard selection, responsive SVG containment, and forced-color behavior. |
| **Dialog/Sheet** | Use for a short focused task, with labelled title, focus containment/restoration, cancel path, and non-blocking responsive geometry. Do not hide page-length content in a modal. |
| **Inline message** | State icon/text and next action. Errors remain near the affected content; transient toast never replaces recovery. |
| **Skeleton** | Mirrors final geometry, is hidden from assistive technology, and does not become permanent decorative shimmer. |

## 13. Interaction, motion, and media

Every interactive component defines relevant default, hover, active, focus-visible, selected, disabled, pending, success, and error behavior. Disabled is not a substitute for explaining invalid input.

- Motion should answer an action or direct attention once. Prefer `opacity` and `transform`; avoid layout animation without measured need.
- Use the motion tokens and remove non-essential transitions/animations under `prefers-reduced-motion: reduce`.
- Animated exercise media must not be the only explanation. Avoid grids of simultaneously animating GIFs.
- Media reserves its final size, uses intentional `object-fit`, and provides an honest unavailable state.
- Do not use hover translation or shadow growth as a universal sign of interactivity.

## 14. Themes, contrast, and system modes

- Components depend only on semantic tokens and must not assume a white page or dark text.
- Light and dark compatibility is an architectural requirement; implementing automatic dark mode waits for approved palette tokens and verified contrast.
- Every foreground/background and status pair requires recorded WCAG contrast verification when values are selected.
- Forced-colors mode retains boundaries, focus, selection, and muscle-role labels.
- Do not override user color scheme or motion preferences with a purely decorative theme.

## 15. CSS and design prohibited patterns

- Global component or route styles in `globals.css`
- A page stylesheet reaching into a child component's DOM
- Inline `style` for static visual design; inline values are limited to truly data-driven custom properties with validated values
- Raw provider strings used as classes or style values
- `!important` outside the reduced-motion safeguard
- IDs used for styling
- Deep descendant selectors and specificity wars
- Duplicated button, field, card, container, or status CSS across features
- Fixed heights that clip translated or user-enlarged content
- Color-only status or muscle meaning
- Breakpoints added ad hoc without documenting why existing ones fail
- Third-party component overrides scattered across pages; centralize them in one integration owner

## 16. Acceptance criteria for UI work

- [ ] A clear page/component owner exists for every style.
- [ ] `globals.css` contains only reset, tokens, base elements, and global preference safeguards.
- [ ] Each substantial component has a same-name colocated `.module.css`.
- [ ] Page modules compose shared components without styling their internals.
- [ ] Repeated visual values use semantic tokens; raw-value exceptions follow §8.2.
- [ ] Selectors are local, shallow, and free of IDs or unauthorized `!important`.
- [ ] Default, keyboard focus, pointer, loading, disabled, error, and selected states are covered where relevant.
- [ ] Narrow, wide, zoomed, long-content, reduced-motion, and forced-color behavior is defined.
- [ ] Loading, empty, partial, provider failure, and missing-media states preserve stable layout.
- [ ] The design has one subject-specific visual lead and does not fall back to generic SaaS-card decoration.
- [ ] No accessibility, performance, licensing, or provider-accuracy rule is weakened for visual effect.
