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

## 2026-07-20 — T017 staged ArenaView composition
- Exported `InitialArenaView` as the exact P1 return type instead of claiming the already-defined final `ArenaView` while omitting its later-phase progression, representation, avatar, eligibility, base, standing, visual-band, and base-placement fields. Rejected placeholder values and type assertions because both would make unfinished domain state look authoritative; T029/T036/T044 will grow the composer at their scheduled phases.
- Added `caps` as a top-level P1 composer input because quality tier and budget must already be resolved for the renderer. Effective reduced motion is the logical OR of the explicit option and the device preference, so either accessibility signal selects the calm Tier C path. Rejected allowing those inputs to disagree and leave avatar motion active in a calm-quality view.
- Return fresh copies of renderer-facing fixture and registry containers. Rejected exposing mutable `BIOMES`, `CAMERA3D`, `ASSET_KEYS`, `QUALITY_TIERS`, or `PALETTE` objects because a renderer mutation could otherwise make a later identical composition diverge.

## 2026-07-21 — T018 scene-bootstrap defaults
- Chose a per-client typed event-bus factory instead of a module singleton. The future `ArenaClient` can create one bridge and pass it to the HUD, Ledger, and scene without leaking listeners or mutable state across mounts or server requests.
- Defined an unrecoverable context loss as either an immediate `webglcontextcreationerror` or a `webglcontextlost` event not restored within a 2-second grace period. Rejected immediate Tier-D degradation for every loss because WebGL restoration is expected, and rejected waiting forever because a permanently lost canvas would never reach the required 2D fallback.
- Generated small group-appropriate Three primitives and palette-derived materials from each domain fallback seed, while exposing explicit resource disposal. Rejected key-specific hand-authored meshes in this bootstrap because T019/T020 own concrete world composition and the required default is a deterministic, complete fallback for every registry key.

## 2026-07-21 — T019 atmosphere-renderer defaults
- Centered a 96-unit water plane and 180-unit sky dome on the canonical 64-unit world, with sea-deep fog from 72 to 180 units. Rejected an edge-to-edge 64-unit plane because oblique cameras could reveal its boundary, and rejected an unbounded plane/dome because the renderer should retain finite culling and fog ranges.
- Chose a fixed five-card cloud field and twelve-mote field, plus small deterministic Tier-A/Tier-B water-wave amplitudes. Rejected runtime placement/noise because atmosphere replay must remain stable and no golden count or seed is specified for these ambient props.
- Set the key-light orthographic shadow frustum to ±72 units with a 0.5–160 depth range so the complete archipelago stays inside the shadow map. Rejected Three's small default frustum because it clips most of the world, and rejected a per-frame fitted frustum because this static scene does not justify its complexity.
- Kept every geometry/material declarative under the r3f tree so r3f owns unmount disposal, and never opted resources out with `dispose={null}`. Rejected parallel manual disposal because it risks double-disposal and React Strict Mode lifetime bugs.

## 2026-07-21 — T020 world/avatar/camera renderer defaults
- Derived each island's center and footprint from its region's exact world-transform extent, with stable padding and the biome's pinned elevation. Rejected hand-authored island coordinates because they could drift from a compatible deterministic world, and rejected per-node terrain meshes because the task calls for instanced region terrain.
- Implemented the pinned `easing.damp3` behavior as a small frame-rate-independent local `damp3` helper using the exact domain lambdas. Rejected adding/importing `maath` because it is only a transitive drei implementation detail, the app manifest contract intentionally exposes no direct dependency, and pnpm package boundaries should remain explicit.
- Exposed an optional shared avatar object ref for the camera to follow the avatar's live damped position. Rejected following only the destination tuple because that would let the camera arrive before the avatar and violate the interruptible follow contract.

## 2026-07-21 — T021a Tier-D fallback boundary
- Kept the static SVG map `aria-hidden` and non-interactive because the adjacent Arena Ledger is the settled semantic and keyboard source of truth. Rejected a second SVG accessibility tree because duplicate controls and labels could drift or create conflicting navigation.
- Named the seven committed fallback assets after the existing region and node-state asset keys, and derived every rendered path, position, landmark, and state from `InitialArenaView`. Rejected recomputing world state or hard-coding fixture positions in the renderer because Tier D must remain a presentation of the identical view.

## 2026-07-21 — T022 client composition defaults
- Start server rendering and hydration from a conservative Tier-D capability profile, then upgrade after browser capability detection. Rejected assuming WebGL during SSR because it would create a hydration mismatch and briefly remove the guaranteed static fallback on unknown devices.
- Apply explicit runtime degradation before the public quality preference, while reduced-motion and automatic low-power signals still force calm Tier-C behavior unless WebGL is unavailable. Rejected allowing a QA quality override to defeat reduced-motion equivalence or allowing the build-time override to undo an unrecoverable context-loss fallback.
- Assemble the complete Three/r3f scene inside the dynamically imported `ArenaCanvas` module while keeping `Fallback2D` and the Ledger in the light client shell. Rejected statically importing scene components into `ArenaClient` because Tier D must not evaluate or mount the WebGL renderer path.

## 2026-07-21 — T023/T027 progression derivation defaults
- Resolve each unlocked node's reward through a node-id map while iterating the canonical world nodes, so one world node contributes at most once and signals outside the world cannot inflate progression. Rejected summing the raw signal list because duplicate or extraneous records could diverge from the derived unlock state.
- Select the eligible tier with the greatest `minReward` and return a fresh tier value. Rejected relying on tier-table declaration order or exposing the mutable fixture object because the public contract is threshold-based and replay results should not be mutable through shared registry references.

## 2026-07-21 — T024/T028 cosmetic resolver defaults
- Evaluate `min-unlocks` and `region-complete` against the supplied canonical world/node-state pair, while `min-tier` reads the resolved progression tier. Rejected trusting duplicated `masteredCount`/`regionsComplete` summaries for every rule because the public contract deliberately supplies node states and world membership as the competence source.
- Treat equipping an already-equipped eligible cosmetic as an idempotent operation that returns a fresh avatar with stable order. Rejected appending duplicate IDs because `equipped` represents a set of active cosmetic IDs and repeated UI activation must not accumulate duplicate appearance state.

## 2026-07-21 — T026 zero-power proof boundary
- Prove zero power directly with exact outcome-function signatures plus the exhaustive six-tier by 512-equipped-set matrix. Matchmaking is out of scope as a service, so the acceptance snapshot uses fixed synthetic near-peer matching and a non-null standing derived only from unchanged learning state. Rejected a production `isZeroPower()` boolean because it would restate the invariant without preventing appearance inputs from reaching outcomes.
- Keep T026 acceptance-only because the tests passed immediately against the already-separated domain APIs. Rejected manufacturing a production change solely to force a RED run; frozen-input and exact-key assertions already prove `equipCosmetic` changes only appearance state and preserves the pseudonymous learner reference.

## 2026-07-21 — T029 staged P2 ArenaView composition
- Require callers to supply the tier table, cosmetic catalog, and pseudonymous avatar instead of importing canonical fixtures inside `buildArenaView`. Rejected hidden fixture coupling because the composed view must remain deterministic for any valid injected synthetic scenario and T030 needs an explicit avatar state to equip.
- Use a deliberately conservative P2 representation stub for every band: growth-vs-past framing, hidden raw numbers, comparison off, and neutral "not yet" copy. Rejected pulling the exact age-band resolver forward from P5 because T029 explicitly schedules a stub and T038/T042 own the pinned band-specific strings.
- Export the exact P2 return type as `ProgressionArenaView` while retaining `InitialArenaView` as a compatibility alias for the existing P1 renderers. Rejected claiming the final `ArenaView` type because base and standing remain absent until T036/T044.

## 2026-07-21 — T030 cosmetic equip presentation
- Keep equipped cosmetics in stable additive order, matching the settled `equipCosmetic` contract. If more than one world-theme ID is present, the last equipped theme controls the resolved lighting rig. Rejected silently removing an earlier ID because the domain exposes no unequip/replace operation and later renderers still need the complete expressive history.
- Store earned base-theme and celebration-effect selections in the same shared avatar state even though their concrete Base Camp and celebration renderers land in P4 and P3. Rejected inventing premature base or celebration view fields; the HUD and Ledger expose the equipped state now, and the scheduled renderers can consume the existing IDs without changing the equip flow.

## 2026-07-21 — T031/T033 celebration-classification boundary
- Chose an explicit `LearningMomentSignal` discriminated union: independent unlocks alone carry `nodeId` and `transferCritical`, while productive struggle, incorrect attempt, and help request are distinct parameter-free variants. Rejected generic strings or passing earned state because an exhaustive one-input classifier makes invalid event kinds and outcome mutation structurally unavailable.

## 2026-07-21 — T034 learning-feedback presentation
- Kept feedback presentation-only: the typed event carries a learning-moment signal, while `Fx`, `PostFx`, and the Ledger consume the existing `ArenaView` without mutating mastery or node state. Rejected feeding visual completion back into the domain because effects must remain zero-power and errors-never-loss.
- Resolve an effect anchor in the stable order event node → focused node → first available node. Rejected dropping node-less productive-struggle/error feedback or inventing a new world position when an existing view anchor is available.
- Source not-yet wording from the current view's staged `representation.failureCopy`. Rejected pulling the final age-band wording forward because P5 owns that resolver and the renderer should remain faithful to the current public view.
- Keep sound cues captioned and muted with no playback path until a later audio-control task explicitly owns opt-in playback. Rejected autoplay or an implicit unmute because every current cue is contractually muted by default.
- Use emissive geometry overlays for beacon/warm-pulse feedback rather than allocating additional point lights. Rejected effect-local lights because they could violate the resolved quality tier's light cap.
- Delay the rare high-intensity burst, beacon ignition, camera punch, and bloom pulse together by 120ms so the sequence remains synchronized after the triggering state change. Rejected independently timed effects because they could visually drift across renderers.
- Key repeatable visual feedback by its monotonic sequence and deduplicate only the downstream `unlock-celebrated` emission. Rejected signal-content deduplication because two identical learning moments at different times must each remain visible, and rejected emitting twice during React effect replay.

## 2026-07-21 — T034a onboarding lifecycle and accessibility
- Write the versioned local shown flag when the first-run guide is displayed, while keeping explicit HUD reopen session-local. Rejected waiting for completion because an interrupted refresh would replay a supposedly shown-once sequence, and rejected server persistence because the spec requires only a local flag.
- Keep the visual coach marks `aria-hidden` and pointer-transparent over renderer-neutral semantic anchor zones; the persistent Arena Ledger live region owns the identical accessible beat and skip control. Rejected a modal, focus trap, canvas text, or event cancellation because any of those could block or duplicate the mastery surface.
- Treat pointer presses, non-repeating key presses, wheel gestures, and assistive virtual clicks as input while coalescing a held key, one trackpad gesture, and the synthetic click following pointer/keyboard activation. Rejected raw event counting because one physical intent could otherwise dismiss all three beats.

## 2026-07-21 — T035a/T036 base-layout attribution defaults
- Attribute each unlocked feature placement to the first matching contribution, because that append-only record is the feature's stable unlock origin. Rejected the latest contributor because later duplicate missions must not rewrite historical attribution.
- Treat only own keys of `BASE_LAYOUT` as known features and route inherited-name collisions such as `toString` through the exact outskirts fallback. Reject a missing contribution for an unlocked feature instead of inventing an empty contributor, because every placement is contractually attributable.

## 2026-07-21 — T036 staged P4 ArenaView composition
- Require callers to inject `CohortBase`, copy it into the composed view, and derive `presentation.basePlacements` from that same copy. Rejected importing a hidden canonical base because `buildArenaView` must remain deterministic for any valid synthetic cohort scenario, and rejected passing base state into world/progression resolvers because the base is zero-power.
- Export the exact P4 return shape as `BaseArenaView`, with the earlier staged names retained as compatibility aliases. Rejected claiming the final `ArenaView` because standing and the final visual-band presentation remain scheduled for P5, and rejected adding the golden cohort base to the production package surface solely to share test/app setup.

## 2026-07-21 — T037 Base Camp renderer and home boundary
- Make Base Camp the P4 client landing by initializing `homeFocused=true`, because P4 has no standing field yet and the spec defines standings-off as the belonging-first home surface. Typed `focus-home`/`focus-base-feature` events keep HUD, Ledger, Tier-D, and canvas focus synchronized; P5 can derive this initial state from its final standings option instead of adding a parallel navigation model.
- Reserve a campfire point light only when `maxDynamicLights` has capacity after active mastery-node lights; otherwise render the same fire emissively. Rejected always allocating the light because Tier B/C would exceed the settled global cap, and rejected hiding the campfire because quality degradation must preserve state.
- Animate home returns from the live `OrbitControls.target` with the exact 350ms `sceneTransition` Cubic.Out curve, while reduced motion recenters instantly. Rejected a target-value jump for full motion and a vestibular camera glide in reduced mode.
- Render all six canonical Base Camp feature looks explicitly and retain one deterministic generic low-poly prop only for unknown fallback slots. Rejected duplicating base layout coordinates in the renderer; every canvas, SVG, and Ledger placement continues to come from `presentation.basePlacements`.

## 2026-07-21 — T038 reward-representation boundary
- Resolve the exact presentation row exclusively from `AgeBand` while accepting `ProgressionState` only as the settled two-input API contract. Rejected deriving labels from reward values or copying/mutating progression because FR-017 requires one identical economy across every band.

## 2026-07-21 — T039 standing derivation boundary
- Include the learner's own gain when finding the band top, so an empty peer set or a learner above every peer produces `gainToBandTop=0` rather than a negative or undefined gap. Rejected taking the maximum of peers alone because the data model requires a non-negative own-gain comparison.
- Preserve the caller-supplied near-peer order while copying each pseudonymous gain record. Rejected sorting by gain because the resolver must not manufacture a rank-like ordering, and rejected returning caller-owned records because later mutation could break deterministic replay.
