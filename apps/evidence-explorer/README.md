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

The observatory renders in three tiers that share one state (`ExplorerView`); presentation flags never
change state:

- **Calm 2D** — the accessible, no-WebGL, reduced-motion-safe SVG constellation (this tier is live).
- **Standard / Cinematic 3D** — the react-three-fiber cosmos with bloom/DOF grading (arriving in U1).

Every node reads as a distinct **shape + glyph + text label**, so meaning never rests on color alone.
