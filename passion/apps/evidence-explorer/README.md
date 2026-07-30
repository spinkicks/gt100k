# @gt100k/evidence-explorer

The **Provenance Observatory** — the Next.js app that renders the `@gt100k/evidence-graph` domain as a
navigable, content-addressed evidence DAG. Reads the deterministic view model from
`@gt100k/evidence-explorer-view`; computes no grade and no crypto in the UI. Synthetic data only.

The app is part of the standalone EvidenceGraph product (`docs/decisions/evidencegraph-v1-design.md`
§11/§13a), so no GT package imports a value from it. Unlike the `@gt100k/evidence-*` packages, though, it is
**not** dependency-free in the other direction: it uses `@gt100k/design-tokens` and `@gt100k/ui`, the shared
GT School design system (PRs #188/#189). Those two would have to travel with the app or be replaced when the
product is extracted. The `@gt100k/boundaries` check reports this as a **warning** rather than failing the
build, because sharing one design system across GT surfaces is a cohesion decision made on purpose.

## Run

```bash
pnpm --filter @gt100k/evidence-explorer dev     # local dev server on :3030
pnpm --filter @gt100k/evidence-explorer build   # production build (part of the gate)
pnpm --filter @gt100k/evidence-explorer test    # app smoke tests (vitest)
```

No secrets are required, and there is nothing to copy: the two knobs both have working defaults.
`NEXT_PUBLIC_EXPLORER_SEED` (default 42) seeds the starfield, which is byte-reproducible from it and
carries no data; `PGLITE_DATA_DIR` moves the embedded Postgres the project store writes to, which
otherwise lands in a git-ignored `.pglite-data` beside the app. Set either in a git-ignored
`.env.local` if you need to.

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

The override is a plain **3D / 2D** segmented control in the bar above the view, beside a live readout
of which tier is actually running — not a four-way tier picker. "3D" means `auto`, so the app still
picks the best 3D tier the device can hold and still degrades under it; "2D" pins Calm 2D. The
remaining presentation switches (reduced motion, plain mode, audio captions) sit one tap deeper, in
the HUD's **Display** drawer.

## Adding to the graph

The observatory is not read-only. An **Add** drawer in the rail appends nodes and edges to the working
graph, append-only, with no edit or delete affordance. Hashing and validation are server-side — the
Node SHA-256 hasher never reaches the client — and the domain's DAG and no-dangling invariants are
what reject a bad add, returned as an inline message rather than an accusation. The working graph
persists in an embedded Postgres (PGlite) on disk, which is what `PGLITE_DATA_DIR` above points at.

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
