# Muscle Visualization

**Purpose:** Define the safe, accessible mapping between exercise muscles and interactive anatomy.  
**Scope:** React Muscle Highlighter, front/back views, highlighting, and the future muscle explorer.  
**Related:** [exercises.md](exercises.md), [accessibility.md](accessibility.md), [architecture.md](architecture.md)  
**Last reviewed:** 2026-10-27

## 1. Verified library status

[React Muscle Highlighter](https://github.com/soroojshehryar/react-muscle-highlighter) was reviewed at repository version `1.2.0` on 2026-10-27. Its package declares React 18/19 peer support and an MIT license. Installation still requires developer approval under [workflow.md](workflow.md).

Verified component features include front/back views, male/female illustrations, custom colors/intensity, click callbacks, disabled/hidden parts, and TypeScript types. Marketing claims such as accessibility and anatomical accuracy must be independently tested; they are not accepted as proof.

## 2. Client boundary

Wrap the library in a narrow feature-owned Client Component. Server components pass only serializable application muscle IDs and display metadata. UI outside the wrapper never imports library-specific slugs or component props.

## 3. Explicit normalization

The inspected library slugs are:

`abs`, `adductors`, `ankles`, `biceps`, `calves`, `chest`, `deltoids`, `feet`, `forearm`, `gluteal`, `hamstring`, `hands`, `hair`, `head`, `knees`, `lower-back`, `neck`, `obliques`, `quadriceps`, `tibialis`, `trapezius`, `triceps`, `upper-back`.

Provider names differ (for example `delts`→`deltoids`, `forearms`→`forearm`, `glutes`→`gluteal`, `hamstrings`→`hamstring`, `quads`→`quadriceps`, `traps`→`trapezius`). Maintain a typed, tested table:

```ts
type MuscleMapping = {
  providerMuscle: string;
  appMuscle: MuscleId;
  highlighterSlug: HighlighterSlug | null;
};
```

Never construct slugs with string replacement or unsafe casts. A `null` visualization mapping is valid and renders a textual fallback.

## 4. Meaning and color

Primary and secondary highlights must be visibly distinguishable and explained by labels/legend; do not use color alone. The diagram represents provider metadata, not activation intensity, diagnostic anatomy, or a guarantee about an individual's movement. Avoid presenting arbitrary “intensity” values unless a verified source defines them.

## 5. Accessible interaction

- Supply a synchronized textual list of primary/secondary muscles and exercise counts.
- Front/back controls are real buttons with selected state and announcements.
- Interactive muscles are keyboard focusable, named, and expose selection state.
- Focus remains visible and predictable; pointer-only SVG paths are insufficient.
- If the package output cannot meet these requirements through wrapping/adaptation, use a non-interactive diagram plus accessible controls or replace the library after approval.

## 6. Views and representation

Do not require users to choose a body gender to access exercise facts. If illustration options are exposed, use respectful copy and explain that the muscle mapping is illustrative. Both front and back views must surface the same normalized selection state where supported.

## 7. Future muscle explorer

The explorer selects an application muscle ID, shows its accessible label, and filters normalized exercise records. Diagram selection and list selection are two interfaces for the same state. URL state is preferred for shareability. Unsupported provider/highlighter mappings must not disappear silently.

## 8. Testing

Cover every mapping, unknown inputs, primary/secondary styling, front/back switching, text equivalence, keyboard activation, focus, reduced motion, responsive scaling, and forced colors. Snapshot tests alone are insufficient.

