# @gt100k/arena-world

`@gt100k/arena-world` is the pure TypeScript domain for the GT100K Arena progression world. It builds on `@gt100k/learning-loop` for `Section` and `SECTIONS`, then turns injected mastery signals into one deterministic `ArenaView` for the 3D scene, calm mode, Tier-D map, and accessible Arena Ledger.

The package performs no I/O, reads no clock, and owns no React or renderer code. See the [feature spec](../../specs/004-arena-game-world/spec.md) for the product contract and the [validation guide](../../specs/004-arena-game-world/quickstart.md) for the end-to-end walkthrough.

## Quickstart

```ts
import {
  CATALOG,
  FIXTURE,
  TIERS,
  buildArenaView,
  createSyntheticMasteryFeed,
} from "@gt100k/arena-world";

const view = buildArenaView({
  world: FIXTURE,
  signals: createSyntheticMasteryFeed(),
  tierTable: TIERS,
  catalog: CATALOG,
  avatar: { learnerRef: "learner-synthetic-kestrel", equipped: [] },
  base: {
    cohortRef: "cohort-synthetic-six",
    contributions: [],
    unlockedFeatures: [],
  },
  nearPeers: [],
  caps: {
    webgl2: true,
    webgl1: true,
    prefersReducedMotion: true,
    deviceMemoryGB: 4,
    hardwareConcurrency: 4,
  },
  options: {
    ageBand: "9-11",
    reducedMotion: true,
    plainMode: false,
    standingsOptedIn: false,
  },
});

console.log(view.progression.cumulativeIndependenceReward); // 300
console.log(view.presentation.qualityTier); // "C"
```

The committed fixtures and `createSyntheticMasteryFeed()` contain synthetic, pseudonymous data. Callers can replace them with other validated inputs without changing the domain rules.

## Public API

| Area | Main exports |
| --- | --- |
| World | `buildQuestWorld`, `layoutQuestWorld`, `resolveWorldTransform`, `deriveNodeStates` |
| Progression | `computeProgression`, `tierForReward`, `deriveCosmeticEligibility`, `equipCosmetic` |
| Cohort and standing | `applyCohortContribution`, `resolveBaseLayout`, `deriveStanding` |
| Feedback and staging | `classifyCelebration`, `celebrationMotionSpec`, `resolveSoundCue`, `resolveRewardRepresentation`, `resolveVisualBand` |
| Presentation config | `resolveBiome`, `resolveAvatarAnimation`, `resolveMotion`, `resolveLighting`, `resolveWater`, `resolvePostFx`, `resolveQualityTier`, `nextLowerTier` |
| Composition | `buildArenaView`, `plainViewEquals`, `BuildArenaViewInputs`, `ArenaView` |
| Synthetic fixtures | `FIXTURE`, `TIERS`, `CATALOG`, `BIOMES`, `BASE_LAYOUT`, `createSyntheticMasteryFeed` |
| Golden registries | `PALETTE`, `TYPOGRAPHY`, `MOTION`, `EASINGS`, `LAMBDAS`, `CAMERA3D`, `QUALITY_TIERS`, `ASSET_KEYS`, `SOUND_CUES` |

Import the complete value and type surface from `@gt100k/arena-world`. The package entrypoint uses explicit named exports.

## Inputs as ports

`BuildArenaViewInputs` is the composition boundary. Callers inject:

- a `QuestWorld` plus `NodeMasterySignal[]` records from a mastery engine or synthetic feed;
- tier and cosmetic tables;
- pseudonymous avatar, cohort-base, and optional near-peer gain state;
- `DeviceCaps` and presentation options such as age band, reduced motion, plain mode, and standings opt-in.

The package does not compute the mastery gate or independence reward. It consumes their validated results. It also declares no repository, network, or clock adapter because every public operation is synchronous and pure. These plain function inputs serve as the domain ports.

## Renderer boundary

- **No 3D dependency:** the domain depends only on `@gt100k/learning-loop`.
- The domain exposes deterministic presentation configuration only, including transforms, camera, lighting, water, post-fx, motion, assets, and quality budgets.
- `apps/arena` owns React, Next.js, three.js, react-three-fiber, DOM behavior, WebGL lifecycle, and the Tier-D SVG renderer.
- Every renderer consumes the same `ArenaView`; `plainViewEquals` checks state parity across presentation modes.

## Guardrails

- Domain source has no I/O, wall-clock reads, external fetches, or `Math.random`.
- Inputs stay synthetic and pseudonymous. The package needs no consent, admissions, legal, live-user, or persistence workflow.
- Cosmetics expose no `price`, `currency`, `dropRate`, or `rarity` field and carry zero gameplay power.
- Standings default off and expose no `rank`, `position`, `percentile`, or `outOf` field.
- Sound cues stay captioned and muted by default. Incorrect attempts and help requests never become loss events.
- Reduced-motion, plain, lower-quality, and Tier-D renderings preserve the same learning, access, progression, base, and standing state.

## Develop

Run these commands from the repository root:

```bash
pnpm --filter @gt100k/arena-world test
pnpm lint
pnpm typecheck
pnpm test
```
