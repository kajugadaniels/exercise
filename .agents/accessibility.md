# Accessibility

**Purpose:** Make exercise discovery and learning usable across keyboard, screen reader, vision, motor, cognitive, and motion needs.  
**Scope:** All user-facing UI and content. Target WCAG 2.2 AA.  
**Related:** [design.md](design.md), [muscle-visualization.md](muscle-visualization.md), [testing.md](testing.md)  
**Last reviewed:** 2026-10-27

## 1. Foundations

- Use semantic HTML before ARIA: landmarks, headings, buttons, links, lists, fieldsets, and native inputs.
- Preserve a logical DOM, heading hierarchy, reading order, and visible keyboard focus.
- Provide a skip link and meaningful page titles.
- Never make a `div`, SVG path, or card clickable without correct semantics and full keyboard behavior.

## 2. Keyboard and touch

Every action works using keyboard alone. Focus order follows reading order; dialogs trap and restore focus; Escape behavior is predictable. Touch targets should be at least 44×44 CSS pixels where practical and never below WCAG 2.2 minimum target guidance without an allowed exception.

## 3. Forms, search, and filters

- Every control has a persistent accessible name and visible label unless context is unequivocal.
- Group filters with `fieldset`/`legend` or equivalent semantics.
- Announce result counts and validation errors without moving focus unexpectedly.
- Do not rely on placeholder text as the label.
- Preserve query/filter state in a shareable URL where architecture permits.

## 4. Color and content

Meet at least 4.5:1 contrast for normal text and 3:1 for large text and meaningful UI graphics. Never use color alone for status, selection, or primary/secondary muscle meaning. Instructions use plain language, ordered steps, and descriptive headings.

## 5. Motion and media

- Respect `prefers-reduced-motion` and provide controls for non-essential animation.
- Avoid flashing content and unexpected autoplay.
- Animated demonstrations need a meaningful text alternative: exercise name plus available written instructions. Do not pretend alt text can fully replace technique instruction.
- Decorative media uses empty alt text; informative images use concise purpose-based alt text.

## 6. Muscle diagram

The diagram requires an equivalent text/list interface. Muscle selection must be reachable and operable by keyboard, expose name and state, and not depend on pointer precision. Front/back changes are announced. See [muscle-visualization.md](muscle-visualization.md); do not accept a package README's accessibility claim without testing the rendered output.

## 7. Dynamic states

Loading indicators have accessible names; skeletons are hidden from assistive technology. Errors identify the affected region and recovery action. Pending operations announce progress without repeated noisy live-region updates. Focus is moved only when necessary to complete or recover a task.

## 8. Responsive and zoom

Content remains usable at 320 CSS pixels, 200% browser zoom, and text spacing overrides. No essential two-dimensional scrolling except genuinely spatial content such as a diagram, which still needs a text alternative.

## 9. Testing expectations

For UI changes, write or specify automated semantic checks plus manual keyboard, screen-reader smoke test, zoom/reflow, contrast, reduced-motion, forced-color, and touch-target review. Per [workflow.md](workflow.md), agents write tests but do not run them.
