# Loop decisions — what was chosen and why (do not re-litigate)

## 2026-07-20 — T003 model clarifications
- Chose `WorldTheme = "default" | "dawn" | "dusk"`: the spec names one default golden-hour rig plus dawn/dusk appearance variants. Rejected a free-form string or configuration object because `LightingConfig` already carries the resolved renderer values.
- Included `BiomeIdentity.elevation` and `MotionSpec.bloomPeak`: their data-model tables are abbreviated, while golden §§8.12/8.5 and the package contract explicitly require both fields. Rejected omitting them because later golden resolvers could not satisfy their contracts.
- Encoded `QualityBudget` renderer modes as literal unions (`soft-pcf-2048`/`pcf-1024`/`off`, shader/cheap/static/2D water, and full/bloom/off post-fx). Rejected generic strings and booleans because they cannot represent the exact four-tier budget distinctions.

## 2026-07-20 — T004 fixture clarifications
- Chose concise competency labels (`Counting`, `Addition`, `Place Value`, `Observation`, `Measurement`, `Phonemes`, `Blending`, `Letters`, `Sentences`) for the required but unspecified node `title` values. Rejected reusing landmark names because `landmark` is already the distinct primary POI label.
- Encoded each cosmetic's animated and reduced-motion behavior together in the single `equipEffect` string. Rejected adding a reduced-motion field because the settled `Cosmetic` contract has exactly one descriptive effect field and forbids expanding outcome-affecting state.

## 2026-07-20 — T004a fixture organization
- Chose an ordered `BIOMES` array because biome declaration order must match the quest world's canonical region order. Chose a feature-keyed `BASE_LAYOUT` object because §8.16 defines a feature-to-slot table and the later resolver needs direct known-feature lookup while preserving `unlockedFeatures` output order. Rejected a Base Camp slot array because it would add an unnecessary search and make the lookup contract less explicit.

## 2026-07-20 — T004b registry shapes
- Represented the two dual-runtime easing tokens as `enter`/`move` `{ three, css }` pairs while retaining the remaining exact named curves as strings. Rejected inventing unspecified CSS curves or dropping either pinned runtime value.
- Kept `WATER` as the exact renderer-independent baseline without a `mode`, because mode is selected later by `resolveWater(tier)`. Keyed `QUALITY_TIERS` by `A`/`B`/`C`/`D` in declaration order so later deterministic resolution is a direct lookup. Rejected baking tier behavior into the baseline scene registry or using an order-dependent search array.

## 2026-07-20 — T006 seeded-smoke resolver boundary
- Chose generic deterministic P0 stubs: copy the supplied world definition, lay nodes out by declaration order on a simple three-column grid, and map that layout into a complete 3D result. Rejected fixture-specific hard-coding because the public functions should accept any compatible world, and rejected pulling P1 validation, regional golden layout, and biome elevation forward because T006 explicitly permits trivial stubs and schedules those behaviors for T013/T014/T014a.

## 2026-07-20 — T007 app type dependency alignment
- Chose `@types/three: ^0.169.0` to align its minor with the pinned `three: ^0.169.0` runtime, and mirrored the existing student-compass React type ranges. Rejected an unbounded latest type dependency because it could drift beyond the React-18-compatible app stack.

## 2026-07-20 — T009 shell token and preference hooks
- Mapped the exact art registry to stable kebab-case CSS palette variables and role/property typography variables, with `--font-display`, `--font-body`, and `--numeric` retaining their explicit spec names. Rejected importing runtime TypeScript into global CSS because the P0 shell must remain static and server-rendered.
- Modeled reduced motion, reduced transparency, increased contrast, and plain mode as independent inherited custom-property hooks. Rejected merging them into one low-effects mode because the accessibility preferences are orthogonal and later renderers must be able to compose them.
- Added `!.env.local.example` to the app ignore file because the repository-wide `.env.*` rule otherwise suppresses the required public-only example. Rejected weakening the root secret rule or renaming the spec-pinned example.

## 2026-07-20 — T010/T013 green test-first increment
- Derived edges and regions only from node declaration order: edges preserve each node's prerequisite order, and regions preserve first appearance. Rejected trusting caller-supplied derived arrays because that would permit them to disagree with the prerequisite graph.
- Coupled T010's verified failing acceptance tests with the minimal T013 implementation in one increment because the loop requires every committed tree to remain green. Rejected leaving active tests failing or weakening them with skip/todo markers.

## 2026-07-20 — T011a/T014a transform resolution
- Derived each node's canonical biome from its position in the specified 2×2 region grid, using `BIOMES` declaration order, because the exact `WorldLayout` contract intentionally carries only `nodeId`, `x`, and `y`. Rejected fixture-specific node-id lookup because it would make the public transform resolver fail for compatible synthetic worlds, and rejected adding region metadata because it would violate the exact §8.1 layout shape.
- Normalized elevation-plus-lift arithmetic to a stable decimal before returning it. Rejected approximate golden assertions because §8.23 marks positions exact and ordinary binary addition would expose values such as `0.09999999999999998` instead of `0.1`.

## 2026-07-20 — T012b biome resolver source
- Made `BIOMES` the single lookup source for both `resolveBiome` and `resolveElevation`, and routed the world transform through `resolveElevation`. Rejected a parallel region/elevation map because duplicated golden values could drift from the canonical fixture.

## 2026-07-20 — T012c avatar resolver source
- Derived avatar durations and easing names from the existing `MOTION` and `EASINGS` registries while keeping only amplitudes and state mappings in the avatar table. Rejected duplicating the shared golden motion values because the registries could drift apart.
- Kept `AvatarAnimationSpec` transform-free and start-position-free; reduced motion changes the same row to its `-static` state with zero amplitude. Rejected adding scale or absolute-start fields because the renderer must retarget from live state and must never receive a `scale(0)` instruction.

## 2026-07-20 — T012d scene resolver boundaries
- Resolved Tier D lighting with the same static, shadowless, no-sun-drift clamp as Tier C because Tier D never mounts WebGL while the settled `resolveLighting` contract still returns a non-null `LightingConfig`. Rejected inventing a separate unpinned rig or returning `null` outside the public type.
- Kept reduced-motion water/post-fx behavior tier-driven: the quality resolver forces reduced motion to Tier C, so `resolveWater` and `resolvePostFx` retain their specified tier-only signatures. Rejected a second reduced-motion input that could disagree with the selected quality tier.
- Applied dawn/dusk only to fields represented by the settled `LightingConfig`; the dusk star-card toggle remains a renderer concern. Rejected widening the domain model with an unlisted flag during this resolver task.
- Returned fresh nested scene values from every resolver so a renderer cannot mutate the exported golden registries and make later identical inputs non-deterministic. Rejected exposing the mutable registry objects directly.

## 2026-07-20 — T012e asset-fallback descriptor boundary
- Chose one renderer-neutral descriptor per key: group, committed-source-first load order, and a procedural mesh/material seed. UI keys prefer committed SVG while all other groups prefer committed model/atlas. Rejected embedding app paths or loader I/O in the pure domain because the renderer owns file availability and loading.
- Derived a stable unsigned 32-bit seed from each key with FNV-1a arithmetic and rejected a shared constant or runtime randomness so every fallback is key-specific and replay-identical.

## 2026-07-20 — T012g mastery-light contribution boundary
- Preserved the settled two-input `resolveLighting(tier, worldTheme)` rig contract and added a pure `resolveNodeLightContributions(candidates, tier, worldTheme, cameraTarget)` companion for state-specific lights. Rejected adding per-node data to `LightingConfig` because its exact golden shape has no node/state input, and rejected leaving contribution selection solely to the renderer because SC-026 requires deterministic domain acceptance coverage.
- Returned contributions in node declaration order while allocating dynamic lights by squared distance to the camera target, with declaration order as the exact tie-breaker. Rejected returning distance-sorted contributions because that would destabilize the shared view-model order.
- Encoded each state with literal icon and shape cues alongside its light mode: closed padlock/closed marker, start pennant/open ring, and filled star/raised beacon. Rejected generic optional cue strings because the no-color-only requirement should be structurally present on every contribution.

## 2026-07-20 — T016 synthetic-feed boundary
- Chose the spec-permitted fixed S1 schedule and cumulative-prefix advancement instead of a seeded PRNG or mutable cursor. The six stable records reproduce the exact golden scenario while keeping app advancement as ordinary array slicing and avoiding unpinned random ordering or hidden state.
- Return fresh signal records on every call so a consumer cannot mutate the canonical schedule and change a later replay. Rejected exporting the backing array directly because its mutable record objects could make identical calls diverge.
