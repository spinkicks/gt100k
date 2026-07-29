# @gt100k/evidence-explorer

The **Evidence Explorer** — the Next.js app that renders the `@gt100k/evidence-graph` domain as a clean,
content-addressed evidence DAG. It leads with the story of how a project was really built and keeps the
cryptographic rigor one click deeper. Reads the deterministic view model from
`@gt100k/evidence-explorer-view`; computes no grade and no crypto in the UI. Synthetic ("Demo data") only.

The app is part of the standalone EvidenceGraph product (`docs/decisions/evidencegraph-v1-design.md`
§11/§13a), so no GT package imports a value from it. Unlike the `@gt100k/evidence-*` packages, though, it is
**not** dependency-free in the other direction: it uses `@gt100k/design-tokens` and `@gt100k/ui`, the shared
GT School design system (PRs #188/#189). Those two would have to travel with the app or be replaced when the
product is extracted. The `@gt100k/boundaries` check reports this as a **warning** rather than failing the
build, because sharing one design system across GT surfaces is a cohesion decision made on purpose.

## Run

```bash
pnpm --filter @gt100k/evidence-explorer dev     # local dev server
pnpm --filter @gt100k/evidence-explorer build   # production build (part of the gate)
pnpm --filter @gt100k/evidence-explorer test    # app smoke tests (vitest)
```

No secrets are required. Non-secret `NEXT_PUBLIC_*` knobs (with safe defaults) are documented in
`.env.local.example`; copy it to a git-ignored `.env.local` to override locally.

## Surface

The explorer is a single, story-first 2D surface
(`docs/superpowers/specs/2026-07-29-evidencegraph-clean-2d-design.md`):

- **Header** — a plain title + one-line explainer, the "Demo data" pill, and a **Verify** button.
- **Hero** — a 2D SVG constellation (`Constellation2D`) of the evidence DAG. Every node reads as a distinct
  **shape + glyph + text label**, so meaning never rests on colour alone. Clicking a node opens the Inspector.
- **Build timeline** — a scrubber that reveals the beats of the project in order.
- **Verify panel** (opens from the header button) — the plain result line on top, the verbatim technical
  checks (Merkle root re-derivation, subject-digest binding, human-owned final grade, transparency-log
  inclusion) behind a "how we checked" detail, plus a tamper demo that visibly breaks the seal.
- **Explore disclosure** (collapsed by default) — search, filters, display, add-to-graph, and the full
  **DOM Ledger**.

Presentation flags (filter / trace / plain-mode / reduced-motion / captions) never change the underlying
`ExplorerView` state — they only change what is shown.

> The 3D "cosmos" render tier was retired in the Phase 1 clean-2D rebuild. The reusable 3D layout/camera
> code still lives in `@gt100k/evidence-explorer-view` (`layout3d` / `camera` / `tiers`), so the option can
> return behind a flag, but the app ships **2D only**.

## Accessibility & performance

- The 2D constellation is `aria-hidden`; the **DOM Ledger** (`role="tree"` with a described panel per node,
  a beat timeline, and an `aria-live` verify seal) is the single accessible source of truth (SC-E13), now
  inside the Explore disclosure. Keyboard / switch / screen-reader users reach every state through it.
- Only `transform` / `opacity` / `filter` animate in the DOM (no layout thrash); every motion has a
  reduced-motion equivalent (SC-E03). These invariants are pinned by `test/a11y.test.ts` +
  `test/motion-budget.test.ts`, and `test/no-3d.test.ts` guards that the 3D path stays retired.
- **Manual verification** (needs a real browser, unavailable headless): the Playwright smoke in
  `e2e/smoke.spec.ts`. See that file to run it locally.
