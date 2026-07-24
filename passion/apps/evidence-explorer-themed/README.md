# @gt100k/evidence-explorer

The **Provenance Observatory** — the Next.js app that renders the `@gt100k/evidence-graph` domain as a
navigable, content-addressed evidence DAG. Reads the deterministic view model from
`@gt100k/evidence-explorer-view`; computes no grade and no crypto in the UI. Synthetic data only.

## Run

```bash
pnpm --filter @gt100k/evidence-explorer dev     # local dev server
pnpm --filter @gt100k/evidence-explorer build   # production build (part of the gate)
pnpm --filter @gt100k/evidence-explorer test    # app smoke tests (vitest)
```

No secrets are required. Non-secret `NEXT_PUBLIC_*` knobs (with safe defaults) are documented in
`.env.local.example`; copy it to a git-ignored `.env.local` to override locally.

## Tiers

The observatory renders in three tiers that share one state (`ExplorerView`); presentation flags
(filter / trace / plain-mode / reduced-motion / tier / captions) never change state:

- **Cinematic 3D** — the react-three-fiber cosmos: procedural bodies, light-thread edges, seeded
  starfield, and a `@react-three/postprocessing` grade (bloom / DOF / vignette) under a cinematic camera.
- **Standard 3D** — the same cosmos with the grade + ambient motion dropped (steadier frame budget).
- **Calm 2D** — the accessible, no-WebGL, reduced-motion-safe SVG constellation.

The tier resolves from device caps + `prefers-reduced-motion` + a manual override, **auto-degrades**
(Cinematic → Standard → Calm 2D) when the frame budget slips, and falls back to Calm 2D on no-WebGL /
context loss **with no lost state**. Every node reads as a distinct **shape + glyph + text label**, so
meaning never rests on colour alone.

## Accessibility & performance (U6)

- The 3D `<canvas>` and the 2D constellation are `aria-hidden`; the **DOM Ledger** (`role="tree"` with a
  described panel per node, a beat timeline, and an `aria-live` verify seal) is the single accessible
  source of truth (SC-E13). Keyboard/switch/screen-reader users reach every state through it.
- Only `transform` / `opacity` / `filter` animate in the DOM (no layout thrash); every motion has a
  reduced-motion equivalent (SC-E03). These invariants are pinned by `test/a11y.test.ts` +
  `test/motion-budget.test.ts`.
- **Manual verification** (needs a real browser + GPU, unavailable headless): the live 60fps orbit/fly,
  the auto-degrade sweep, and the Playwright smoke in `e2e/smoke.spec.ts`. See that file to run it
  locally.
