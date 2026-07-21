# Loop progress (durable memory the agent maintains each turn)

## NEXT
- Begin P0. Read only the PRD section for the current phase.

## 2026-07-20 — P0 / T001
- Added `packages/arena-world/package.json` for `@gt100k/arena-world`, mirroring the existing pure-domain package contract.
- Declared only the required `@gt100k/learning-loop: workspace:*` dependency; no 3D or renderer dependency entered the domain package.
- Verified the manifest contract test-first: the absence assertion failed before creation, then the exact field/dependency assertions passed.
- Gate status: `pnpm typecheck` passed; `pnpm test` passed (4 files, 14 tests).
- SC status: P0 remains in progress; no feature success criterion is claimed by this scaffold-only increment.
- Blockers: none.

## NEXT
- T002: add `packages/arena-world/tsconfig.json` extending `../../tsconfig.base.json`, with `composite: true`, `rootDir: "."`, `outDir: "dist"`, and includes for `src/**/*.ts` and `test/**/*.ts`; keep `pnpm typecheck` and `pnpm test` green.

## 2026-07-20 — P0 / T002
- Added `packages/arena-world/tsconfig.json` with the exact composite package contract: shared base config, package-local root/output directories, and source/test include globs.
- Added a persistent configuration contract test; it failed on the missing config before implementation and passed after the minimal file was added.
- Gate status: `pnpm typecheck` passed; `pnpm test` passed (5 files, 15 tests); direct arena-world TypeScript validation passed.
- SC status: P0 remains in progress; no feature success criterion is claimed by this configuration-only increment.
- Blockers: none.

## NEXT
- T003: define every arena-world domain type in `packages/arena-world/src/model.ts` exactly as listed in `tasks.md` and `data-model.md`, reusing `Section`/`SECTIONS` from `@gt100k/learning-loop`.
- Acceptance: type-level tests first; `Cosmetic` cannot expose `price`, `currency`, `dropRate`, or `rarity`; standings cannot expose `rank`, `position`, `percentile`, or `outOf`; `SoundCue` cannot expose negative/alarm/loop flags; package and repository gates remain green.

## 2026-07-20 — P0 / T003
- Added the complete pure-domain type surface in `packages/arena-world/src/model.ts`, including quest/layout/3D presentation, progression, cosmetic, avatar, base, motion, quality, accessibility, staging, standing, and composed `ArenaView` shapes.
- Reused `Section` and `SECTIONS` from `@gt100k/learning-loop`; no framework, renderer, I/O, time, or randomness dependency entered the domain model.
- Added six type-level contract tests first. The RED run failed on the missing model, then the implementation passed; exact key assertions make commerce fields, caste-ranking fields, and negative/alarm/loop sound flags structurally unrepresentable.
- Restored the new package's missing local workspace symlink with a filtered offline install and lockfile writes disabled; verified `pnpm-lock.yaml` stayed byte-identical.
- Gate status: `pnpm typecheck` passed; `pnpm test` passed (6 files, 21 tests); direct arena-world TypeScript validation and Biome checks passed.
- SC status: structural groundwork for SC-002, SC-021, and SC-022 is present; those criteria remain open until their fixtures/resolvers and final guardrail tests land.
- Blockers: none.

## NEXT
- T004: add `packages/arena-world/src/graph.fixture.ts`, `tiers.fixture.ts`, and `catalog.fixture.ts` from spec §§7.1–7.3 and §8.15.
- Acceptance: tests fail first, then prove the exact synthetic 9-node/4-region DAG with a landmark on every node, tier thresholds `0/100/250/500/900/1500`, and the nine-item catalog in declaration order with deterministic eligibility plus stable `look`/`equipEffect`; region order is `[numbers-coast, tinker-bluffs, story-vale, wordwind-reach]`, guardrail fields remain absent, and repository gates stay green.

## 2026-07-20 — P0 / T004
- Added the canonical synthetic `FIXTURE`, `TIERS`, and `CATALOG` modules with the exact 9-node/4-region graph, seven derived edges, landmark on every node, six gain thresholds, and nine competence-earned cosmetics in declaration order.
- Preserved the cosmetic guardrails by construction: every item has only deterministic eligibility plus stable `look`/`equipEffect` descriptors (including reduced-motion behavior), with no price/currency/drop/drop-rate/rarity data.
- Added three fixture acceptance tests first. The RED run failed on the missing fixture modules; the GREEN run verifies exact values/order, unique and non-dangling nodes, an order-independent acyclic graph check, every landmark, all thresholds, and exact cosmetic keys.
- Independent review found no Critical or Important issues; its one Minor note about the order-dependent cycle check was addressed before the final gate.
- Gate status: direct arena-world TypeScript validation passed; Biome checked all four changed feature files; `pnpm typecheck` passed; `pnpm test` passed (7 files, 24 tests).
- SC status: the fixture half of SC-002 and the stable-descriptor/structural-guardrail half of SC-022 are present; resolver determinism and zero-power acceptance remain open for P2.
- Blockers: none.

## NEXT
- T004a: add `packages/arena-world/src/biomes.fixture.ts` and `packages/arena-world/src/baseLayout.fixture.ts` from spec §§8.12, 8.16, and 8.20.
- Acceptance: tests fail first, then prove the exact four-region biome rows in canonical region order (including elevation and stable landmarks) and the exact base feature-to-zone/coordinate table; fixtures remain pure/synthetic and package plus repository gates stay green.

## 2026-07-20 — P0 / T004a
- Added `BIOMES`, the exact four-row synthetic biome fixture in canonical region order, including signature/terrain/ambient colors, elevations, and stable landmark order.
- Added `BASE_LAYOUT`, the exact six-feature Base Camp zone/coordinate lookup table for deterministic later placement resolution.
- Added two acceptance tests first. The RED run failed on the absent fixture modules; the GREEN run verifies every golden value, biome-to-world region order, and Base Camp feature declaration order.
- Recorded the ordered-array/keyed-table fixture organization so later resolvers can preserve stable output while performing direct feature lookup.
- Gate status: direct arena-world TypeScript validation passed; Biome checked all three changed feature files; `pnpm typecheck` passed; `pnpm test` passed (7 files, 26 tests). No app changed, so no Next.js build was required.
- SC status: the fixture half of SC-017 and deterministic known-feature table groundwork for SC-019 are present; resolver behavior and final acceptance remain open for P1/P4.
- Blockers: none.

## NEXT
- T004b: add the exact exported constant registries in `art.ts`, `motion.ts`, `scene3d.ts`, `quality.ts`, `assets.ts`, and `sound.ts` from spec §§8.10–8.11 and §§8.17–8.24, without resolver behavior.
- Acceptance: tests fail first and then prove every golden registry value, stable declaration order, and required quality beacon-light caps; the domain remains pure/renderer-free and package plus repository gates stay green.

## 2026-07-20 — P0 / T004b
- Added the exact exported `PALETTE`/`TYPOGRAPHY`, `MOTION`/`EASINGS`/`LAMBDAS`, 3D scene, four-tier quality, asset-key, and muted sound-cue registries in six focused pure-domain modules; no resolver behavior was pulled forward.
- Added seven golden acceptance tests first. The RED run failed on the absent registry modules; the GREEN run verifies every pinned value, stable keyed/array declaration order, quality caps A=8/B=3/C=0/D=0, and sound-cue guardrail keys.
- Confirmed the package source contains no `Math.random`, React/Next, three.js, or react-three imports.
- Gate status: direct arena-world TypeScript validation passed; Biome checked all seven changed feature files; `pnpm typecheck` passed; `pnpm test` passed (8 files, 33 tests). No app changed, so no Next.js build was required.
- SC status: exact-registry groundwork for SC-015, SC-017, SC-018, SC-021, SC-023, and SC-025 is present; resolver, fallback-loader, and final guardrail acceptance remain open in their scheduled phases.
- Blockers: none.

## NEXT
- T005: add `packages/arena-world/src/index.ts` as the package public entrypoint with explicit named exports for the completed types, fixtures, and constant registries (avoid wildcard/barrel-style exports).
- Acceptance: a package-entrypoint test fails first, then imports the full completed P0 surface through `@gt100k/arena-world`; direct package checks and repository `pnpm typecheck`/`pnpm test` remain green.

## 2026-07-20 — P0 / T005
- Added `packages/arena-world/src/index.ts` with explicit named value and type exports for the complete P0 model, fixtures, and constant registries; no wildcard re-export was introduced.
- Added a package-entrypoint acceptance test first. The RED run failed because `@gt100k/arena-world` had no resolvable entrypoint; the GREEN run imports all 20 runtime values and the complete domain type surface through the package name.
- Biome and direct arena-world TypeScript validation passed. Direct repository-root arena-world tests passed (5 files, 21 tests); `pnpm typecheck` passed; `pnpm test` passed (9 files, 35 tests). No app changed, so no Next.js build was required.
- Gate caveat: the previously pinned package-local `test: vitest run` script finds no tests when `pnpm --filter` changes the working directory because the shared Vitest include globs are repository-root-relative. The canonical root gate and direct feature test selection are green; this pre-existing quickstart incompatibility remains to be reconciled before P7/T051.
- SC status: P0's public package boundary is now available; no feature-level success criterion is newly claimed by this API-surface-only increment.
- Blockers: none for T005.

## NEXT
- T006: add `packages/arena-world/test/smoke.test.ts` and only the minimal pure deterministic resolver stubs required for the P0 seeded smoke.
- Acceptance: the smoke fails first, then imports `@gt100k/arena-world`, proves `buildQuestWorld(FIXTURE)` has 9 nodes and 4 regions, `layoutQuestWorld` returns non-empty positions, `resolveWorldTransform` returns 9 3D nodes, and `PALETTE`/`MOTION`/`CAMERA3D`/`QUALITY_TIERS`/`ASSET_KEYS` are non-empty; direct package checks and repository gates remain green.

## 2026-07-20 — P0 / T006
- Added the seeded domain smoke through the public `@gt100k/arena-world` entrypoint. It proves the synthetic fixture builds to 9 nodes and 4 regions, layout positions are non-empty, the 3D transform contains 9 nodes, and all five required registries are populated.
- Added minimal pure deterministic P0 resolvers in `world.ts`, `layout.ts`, and `worldTransform.ts`, with explicit named entrypoint exports. Full DAG validation, golden region layout, and biome elevation remain scheduled for P1.
- Followed red-green TDD: the new smoke failed with `buildQuestWorld is not a function`, then passed after the resolver stubs landed.
- Review status: the task requirements were checked locally; no Critical or Important issues found. Subagent/git-SHA review was intentionally not used because the loop forbids unrequested subagents and all git commands.
- Gate status: Biome checked all five changed feature files; direct arena-world TypeScript validation passed; direct feature tests passed (6 files, 22 tests); `pnpm typecheck` passed; `pnpm test` passed (10 files, 36 tests). No app changed, so no Next.js build was required.
- SC status: the P0 seeded-smoke requirement is complete; feature-level world determinism SC-013/SC-024 remains open until the P1 golden resolvers and acceptance tests land.
- Blockers: none.

## NEXT
- T007: create `apps/arena/package.json` with the exact React 18 / Next 14 / r3f v8 / drei v9 / postprocessing v2 / three / motion dependency contract from `tasks.md`, mirroring the existing student-compass app manifest where applicable.
- Acceptance: a manifest contract test fails first, then verifies the exact package name, scripts, workspace dependencies, pinned React-compatible 3D stack ranges, and required type devDependencies; `pnpm typecheck`, `pnpm test`, and the new app package's dependency resolution remain green.

## 2026-07-20 — P0 / T007
- Added `apps/arena/package.json` for `@gt100k/arena-world-app`, mirroring the existing app scripts/private/version shape and pinning the specified Next 14, React 18, three, r3f v8, drei v9, postprocessing v2, and Motion ranges.
- Added a feature-owned manifest contract test first. The RED run failed only because the manifest was absent; the GREEN run verifies the full exact manifest, including both workspace links and required type dependencies.
- Resolved the complete app dependency graph with lockfile reads/writes disabled and verified `pnpm-lock.yaml` stayed byte-identical. The first offline attempt exposed missing local metadata for `@types/three`; registry verification plus an online no-lockfile resolution confirmed the pinned package and all React-18-compatible majors without peer-dependency errors.
- Review status: checked the manifest line-by-line against T007 and §11; no Critical, Important, or Minor issues found. Git-SHA/subagent review was not used because this loop prohibits Git commands and unrequested subagents.
- Gate status: Biome checked both deliverable files; direct arena-world TypeScript validation passed; `pnpm typecheck` passed; `pnpm test` passed (11 files, 37 tests); required root `pnpm build` passed. The Arena-specific build remains scheduled after T008/T009 add its Next configuration and routes.
- SC status: P0 app dependency groundwork is complete; no feature-level success criterion is claimed by this manifest-only increment.
- Blockers: none.

## NEXT
- T008: add `apps/arena/next.config.mjs` with exact `transpilePackages` entries for `@gt100k/arena-world` and `@gt100k/learning-loop`, plus `apps/arena/tsconfig.json` mirroring the student-compass app TypeScript contract.
- Acceptance: configuration contract tests fail first, then verify the exact transpilation list and strict no-emit/DOM/JSX settings; dependency resolution, direct feature checks, `pnpm typecheck`, `pnpm test`, and the required root `pnpm build` remain green.

## 2026-07-20 — P0 / T008
- Added `apps/arena/next.config.mjs` with the exact ordered transpilation targets for `@gt100k/arena-world` and `@gt100k/learning-loop`.
- Added `apps/arena/tsconfig.json`, mirroring the established strict Next.js app contract with DOM libraries, preserved JSX, bundler resolution, no emit, and Next's plugin/include settings.
- Added two focused configuration contract tests first. The RED run failed only because both config files were absent; the GREEN run verifies the complete exported Next config and full parsed TypeScript config.
- Review status: checked T008 line-by-line against `tasks.md`, spec D3/§9/§11, and the student-compass reference; no Critical, Important, or Minor issues found.
- Gate status: Biome passed; direct arena-world TypeScript validation passed; Arena resolved Next.js v14.2.35; `pnpm typecheck` passed; `pnpm test` passed (12 files, 39 tests); required root `pnpm build` passed. The Arena-specific build remains scheduled after T009 adds its App Router shell.
- SC status: P0 app configuration groundwork is complete; no feature-level success criterion is claimed by this configuration-only increment.
- Blockers: none.

## NEXT
- T009: add the Arena App Router placeholder shell, tokenized global CSS/accessibility preference hooks, synthetic public-env example, and app-local ignore rules exactly as specified.
- Acceptance: tests fail first, then verify the layout/page shell, §8.11 palette and typography variables, reduced-motion/reduced-transparency/increased-contrast/plain-mode/focus-visible hooks, exact `NEXT_PUBLIC_*` placeholders including `NEXT_PUBLIC_QUALITY_TIER`, and `.env.local`/`.next` ignores; direct feature checks, `pnpm typecheck`, `pnpm test`, root `pnpm build`, and `pnpm --filter @gt100k/arena-world-app build` remain green.

## 2026-07-20 — P0 / T009
- Added the server-rendered Arena App Router layout and placeholder page with synthetic-only copy, document metadata, and native status semantics; no client boundary or P1 scene behavior was pulled forward.
- Added the complete §8.11 palette and typography CSS custom-property registry, high-contrast body pairing, visible `--focus` rings, and independent reduced-motion, reduced-transparency, increased-contrast, and `.plain-mode` hooks.
- Added the four exact public-only environment placeholders plus local ignore rules. Explicitly unignored `.env.local.example` so the repository's protective `.env.*` rule does not suppress the required example; `.env.local`, `.next`, and generated TypeScript build state remain ignored.
- Added four acceptance tests first. The initial RED run failed on all absent shell files; a later regression RED run caught the root-ignore interaction before the app ignore fix. The final focused run passes all four tests.
- Review status: checked T009 against tasks.md, spec §§8.11/9/11/12, existing app conventions, React/Next server-rendering guidance, and the accessibility preference contract. Biome is clean with one narrow documented suppression for the spec-required WebKit reduced-transparency media feature.
- Gate status: direct Arena TypeScript validation passed; `pnpm typecheck` passed; `pnpm test` passed (13 files, 43 tests); root `pnpm build` passed; `pnpm --filter @gt100k/arena-world-app build` passed (static `/`, 138 B route, 87.4 kB first load). The standard Next-generated `apps/arena/next-env.d.ts` now matches the existing app scaffold.
- SC status: P0 is complete and its package/app-smoke gate is green. Accessibility and motion-preference groundwork for SC-004/SC-012/SC-015 is present; feature-level criteria remain open until the P1 renderers and Ledger consume these hooks.
- Blockers: none.

## NEXT
- T010: add `packages/arena-world/test/world.test.ts` for the exact fixture world contract before replacing the P0 world-builder stub in T013.
- Acceptance: `buildQuestWorld(FIXTURE)` derives the seven stable prerequisite edges and four canonical regions; cyclic and dangling-prerequisite definitions throw; the new tests fail for the missing validation behavior while the existing P0 smoke and repository gate stay green.

## 2026-07-20 — P1 / T010 + T013
- Added `world.test.ts` through the public package API, proving the exact seven prerequisite-derived edges, the four first-seen canonical regions, cycle rejection, and dangling-prerequisite rejection.
- Followed red-green TDD: all three tests failed against the P0 copy-only stub for the intended missing behaviors, then passed after the minimal world-builder implementation landed.
- Replaced the stub with a pure linear graph normalization: prerequisite validation, DFS cycle detection, stable derived edges, and stable distinct regions. Caller-supplied derived arrays are ignored so they cannot drift from node declarations.
- Review status: checked the implementation line-by-line against T010/T013, data-model `QuestWorld`, and the public contract; no Critical, Important, or Minor issues found. Git-SHA/subagent review was not used because this loop prohibits Git commands and unrequested subagents.
- Gate status: Biome checked both changed feature files; direct arena-world TypeScript validation passed; `pnpm typecheck` passed; `pnpm test` passed (14 files, 46 tests). No app changed, so no Next.js build was required.
- SC status: the P1 quest-world construction/validation contract is complete; P1 remains in progress, with SC-013 and SC-024 still open until the scheduled layout and 3D-transform golden tasks land.
- Blockers: none.

## NEXT
- T011: add `packages/arena-world/test/layout.test.ts` for the exact §8.1 2D positions and two-run determinism, then make the minimal T014 layout implementation green in the same test-first increment.
- Acceptance: all nine node positions match the golden table exactly, bounds remain 2048×2048, two identical inputs produce byte-identical layouts (SC-013), and direct package plus repository gates remain green.

## 2026-07-20 — P1 / T011 + T014
- Added `layout.test.ts` through the public package API, proving all nine exact §8.1 positions, fixed 2048×2048 bounds, and byte-identical repeated output.
- Followed red-green TDD: the golden layout assertion failed against the P0 global-index stub for all six nodes outside Numbers Coast, while the determinism assertion passed; both tests passed after the minimal regional-grid implementation landed.
- Replaced the stub with the specified pure layout formula: stable world-region order selects each 1024-unit 2×2 origin, and a per-region node index selects the 3-column 192-unit slot with a 96-unit offset.
- Review status: checked T011/T014 line-by-line against spec §§5.2/8.1 and SC-013; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was intentionally not used because this loop prohibits unrequested subagents and all Git commands.
- Gate status: Biome checked both changed feature files; direct arena-world TypeScript validation passed; focused layout tests passed (2 tests); `pnpm typecheck` passed; `pnpm test` passed (15 files, 48 tests). No app changed, so no Next.js build was required.
- SC status: SC-013 is complete; the deterministic 3D-transform replay contract in SC-024 remains open for T011a/T014a.
- Blockers: none.

## NEXT
- T011a: add `packages/arena-world/test/world-transform.test.ts` for the exact §8.23 3D positions, determinism, and replayability, then make the minimal T014a world-transform implementation green in the same test-first increment.
- Acceptance: all nine 3D nodes match `WORLD_SCALE`, biome elevation, and `nodeLiftUnits=0.6` exactly; two identical inputs and replayed inputs are byte-identical (FR-042, SC-024); direct package plus repository gates remain green.

## 2026-07-20 — P1 / T011a + T014a
- Added `world-transform.test.ts` through the public package API, proving all nine exact §8.23 node coordinates, the 64-unit 3D bounds centered at `(32,0,32)`, `WORLD_SCALE=0.03125`, `seaLevel=-3`, two-run determinism, and serialized-layout replayability.
- Followed red-green TDD: the golden test failed against the P0 flat-elevation stub for the six nodes outside Numbers Coast, while its existing deterministic/replay behavior passed; all three tests passed after the minimal elevation-aware implementation landed.
- Replaced the flat transform with pure canonical 2×2 region-grid biome resolution and exact decimal normalization for elevation plus `nodeLiftUnits=0.6`; no framework, renderer, I/O, time, or randomness dependency entered the domain.
- Review status: checked T011a/T014a line-by-line against spec §§8.12/8.20/8.23, FR-042, SC-024, and the exact data-model shape; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was intentionally not used because this loop prohibits unrequested subagents and all Git commands.
- Gate status: focused transform tests passed (3 tests); Biome checked both changed feature files; direct arena-world TypeScript validation passed; `pnpm typecheck` passed; `pnpm test` passed (16 files, 51 tests). No app changed, so no Next.js build was required.
- SC status: SC-024 is complete; P1 remains in progress with node-state, presentation-resolver, and renderer/Ledger tasks still open.
- Blockers: none.

## NEXT
- T012 + T015: add `packages/arena-world/test/nodes.test.ts` for scenario S1, then implement the minimal pure `deriveNodeStates(world, signals)` resolver in `packages/arena-world/src/nodes.ts` and export it explicitly.
- Acceptance: the test fails first, then proves `blend-bay` remains locked while `place-value-point` is available; a node is `unlocked` iff every prerequisite is mastered and its own gate is cleared; output is deterministic and the API has no time/visit input (FR-002/003/004, SC-001); direct package and repository gates remain green.

## 2026-07-20 — P1 / T012 + T015
- Added `nodes.test.ts` through the public package API, proving all nine exact S1 states in world order, gate-before-prerequisite behavior, all-gates-cleared unlock behavior, two-run determinism, and an exact two-input API with no time/visit parameter.
- Followed red-green TDD: all three acceptance tests failed with `deriveNodeStates is not a function`, then passed after the minimal resolver and explicit package export landed.
- Added a pure `deriveNodeStates(world, signals)` implementation that treats missing signals as uncleared, derives prerequisite mastery only from `masteryCleared`, and preserves deterministic world-node order in the returned map.
- Review status: checked T012/T015 line-by-line against spec §§4/6/8.2/10, the public contract, and data-model `NodeState`; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was intentionally not used because this loop prohibits unrequested subagents and all Git commands.
- Gate status: focused node-state tests passed (3 tests); Biome checked all three changed feature files; `pnpm typecheck` passed; `pnpm test` passed (17 files, 54 tests). No app changed, so no Next.js build was required.
- SC status: SC-001 is complete; P1 remains in progress with the motion/art/avatar/scene/assets/quality/lighting resolver tests and renderer/Ledger tasks still open.
- Blockers: none.

## NEXT
- T012a + the `resolveMotion` slice of T016a: add `packages/arena-world/test/motion-tokens.test.ts`, then implement and explicitly export the minimal pure motion-token resolver.
- Acceptance: exact `MOTION`/`EASINGS`/`LAMBDAS` golden values remain stable; every motion kind has a reduced equivalent; `reducedMotion:true` returns `mode:"reduced"`, `easing:"Linear"`, and the exact reduced durations from §§8.10/8.21 (FR-034, SC-015); focused checks and repository gates remain green.

## 2026-07-20 — P1 / T012a + T016a (`resolveMotion` slice)
- Added `motion-tokens.test.ts` through the public package API, covering the exact `MOTION`, `EASINGS`, and `LAMBDAS` registries plus all 16 animated and reduced-motion resolver rows.
- Followed red-green TDD: the registry assertion passed while three resolver tests failed with `resolveMotion is not a function`; all four tests passed after the minimal implementation and explicit package export landed.
- Added a pure table-driven `resolveMotion(kind, options)` implementation. It derives durations and easings from the existing registries, preserves 120ms non-vestibular press feedback, and maps every other reduced mode to the exact 0ms or 150ms spec value with `Linear` easing.
- Review status: checked the implementation line-by-line against spec §§5.6/8.10/8.21, FR-034, SC-015, the data model, and the public contract; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was not used because the loop prohibits unrequested subagents and all Git commands.
- Gate status: focused motion tests passed (4 tests); Biome checked all three changed feature files; direct arena-world TypeScript validation passed; `pnpm typecheck` passed; `pnpm test` passed (18 files, 58 tests). No app changed, so no Next.js build was required.
- SC status: the domain golden-table and reduced-equivalence portion of SC-015 is complete; DOM/HUD `motion@^12` consumption remains open for the scheduled app tasks.
- Blockers: none.

## NEXT
- T012b + the `resolveBiome`/`resolveElevation` slice of T016a: add `packages/arena-world/test/art.test.ts`, then implement and explicitly export the minimal pure biome resolvers.
- Acceptance: exact `PALETTE`/`TYPOGRAPHY` tokens remain stable; every canonical region resolves to its exact §8.12 biome and elevation row; an unknown region throws (FR-031, SC-017); focused checks and repository gates remain green.

## 2026-07-20 — P1 / T012b + T016a (`resolveBiome`/`resolveElevation` slice)
- Added `art.test.ts` through the public package API, covering the exact `PALETTE`/`TYPOGRAPHY` tokens, all four §8.12 biome/elevation rows, identical-input determinism, and unknown-region rejection.
- Followed red-green TDD: the token assertion passed while all three resolver behaviors failed with `resolveBiome is not a function`; all four tests passed after the minimal resolver implementation and explicit package exports landed.
- Added pure `resolveBiome(region)` and `resolveElevation(region)` lookups backed by the canonical `BIOMES` fixture, and routed `resolveWorldTransform` through the shared elevation resolver so the golden values have one source.
- Review status: checked T012b/T016a line-by-line against spec §§8.11–8.12, FR-031, SC-017, the data model, and the public contract; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was not used because the loop prohibits unrequested subagents and all Git commands.
- Gate status: focused art and world-transform tests passed (7 tests); Biome checked all four changed feature files; direct arena-world TypeScript validation passed; `pnpm typecheck` passed; `pnpm test` passed (19 files, 62 tests). The domain purity scan passed. No app changed, so no Next.js build was required.
- SC status: the exact token/biome resolver portion of SC-017 is complete; the renderer's icon/shape/light pairing remains scheduled for T020.
- Blockers: none.

## NEXT
- T012c + the `resolveAvatarAnimation` slice of T016a: add `packages/arena-world/test/avatar.test.ts`, then implement and explicitly export the minimal pure avatar-animation resolver.
- Acceptance: all seven intents match the exact §8.13 state/loop/duration/easing/amplitude table; reduced motion returns `loop:false`, `easing:"Linear"`, a `-static` state, and the exact reduced duration with `amplitudePx:0`; output is deterministic and never represents `scale(0)` (FR-032, SC-016); focused checks and repository gates remain green.

## 2026-07-20 — P1 / T012c + T016a (`resolveAvatarAnimation` slice)
- Added `avatar.test.ts` through the public package API, covering all seven exact §8.13 animated rows, every static reduced-motion equivalent, identical-input determinism, and an exact transform-free/start-free output shape.
- Followed red-green TDD: all three acceptance tests failed with `resolveAvatarAnimation is not a function`, then passed after the minimal resolver and explicit package export landed.
- Added a pure table-driven `resolveAvatarAnimation(intent, options)` implementation. Durations and easings derive from the existing `MOTION`/`EASINGS` registries; reduced motion emits `loop:false`, `Linear`, zero amplitude, and the exact `-static` state/duration without carrying scale or an absolute start.
- Review status: checked T012c/T016a line-by-line against spec §§5.4/8.13/8.26, FR-032, SC-016, the data model, and the public contract; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was not used because the loop prohibits unrequested subagents and all Git commands.
- Gate status: focused avatar/motion tests passed (7 tests); Biome checked all three changed feature files; direct arena-world TypeScript validation passed; `pnpm typecheck` passed; `pnpm test` passed (20 files, 65 tests). The domain purity scan passed. No app changed, so no Next.js build was required.
- SC status: SC-016 is complete; the renderer's damped live-position application of the returned state remains scheduled for T020.
- Blockers: none.

## NEXT
- T012d + the `resolveParallaxLayers`/`resolveLighting`/`resolveWater`/`resolvePostFx` slice of T016a: add `packages/arena-world/test/scene3d.test.ts`, then implement and explicitly export the minimal pure scene resolvers.
- Acceptance: `CAMERA3D` remains exact; parallax resolves all seven layers back-to-front; lighting, water, and post-fx match every §8.20 quality-tier golden row; every camera motion has a reduced or instant equivalent and depth remains represented (FR-033, SC-018); focused checks and repository gates remain green.

## 2026-07-20 — P1 / T012d + T016a (scene resolver slice)
- Added `scene3d.test.ts` through the public package API, covering the exact bounded camera, all seven back-to-front parallax layers, Tier A/B/C/D lighting/water/post-fx rows, dawn/dusk appearance variants, reduced intro/region-focus motion, retained depth, deterministic replay, and registry-mutation isolation.
- Followed red-green TDD: the camera constant assertion passed while six resolver behaviors failed with missing-function errors; all seven tests passed after the minimal implementations and explicit exports landed.
- Added pure `resolveParallaxLayers`, `resolveLighting`, `resolveWater`, and `resolvePostFx` implementations. Tier B lowers shadow quality and post-fx; Tier C/D stop sun drift and realtime shadows; water and post-fx degrade exactly by tier; every call returns fresh renderer-agnostic values.
- Review status: checked T012d/T016a line-by-line against spec §§5.3/5.6/8.20, FR-033, SC-018, the data model, and the public contract; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was not used because the loop prohibits unrequested subagents and all Git commands.
- Gate status: focused scene tests passed (7 tests); direct package TypeScript validation passed; domain purity scan passed; full Biome lint passed (67 files); `pnpm typecheck` passed; `pnpm test` passed (21 files, 72 tests). No app changed, so no Next.js build was required.
- SC status: SC-018's deterministic camera/parallax/lighting configuration and reduced-motion depth contract is complete; mastery-state light contributions and the beacon cap remain scheduled for T012g.
- Blockers: none.

## NEXT
- T012e + the procedural-fallback slice of T016a: add `packages/arena-world/test/assets.test.ts`, then implement and explicitly export the minimal pure asset fallback descriptor helper.
- Acceptance: `ASSET_KEYS` stays in exact grouped declaration order; every key resolves deterministically to a seeded procedural fallback with committed-model/SVG before procedural load order and no `Math.random` (FR-039, SC-023); focused checks and repository gates remain green.

## 2026-07-20 — P1 / T012e + T016a (asset-fallback slice)
- Added `assets.test.ts` through the public package API, covering the exact grouped registry/order, all 30 deterministic per-key fallbacks, unique stable seeds, committed-source-first resolution, unknown-key rejection, and the absence of randomness/external-fetch escape hatches.
- Followed red-green TDD: the registry and source guard passed while both resolver behaviors failed because `resolveAssetFallback` was absent; all four tests passed after the minimal helper and explicit type/value exports landed.
- Added pure renderer-neutral asset descriptors. Non-UI keys prefer a committed model/atlas, UI keys prefer a committed SVG, and both fall back to a seeded procedural mesh/material descriptor without paths, I/O, or network access.
- Review status: checked T012e/T016a line-by-line against spec §§5.11/8.17/8.25, FR-039, SC-023, and the data model; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was not used because the loop prohibits unrequested subagents and all Git commands.
- Gate status: focused asset tests passed (4 tests); direct package TypeScript validation passed; domain purity scan passed; `pnpm lint` passed (68 files); `pnpm typecheck` passed; `pnpm test` passed (22 files, 76 tests). No app changed, so no Next.js build was required.
- SC status: SC-023's stable registry and deterministic domain-fallback contract are complete; the no-network app smoke and concrete procedural renderer remain scheduled for T018/P7.
- Blockers: none.

## NEXT
- T012f + the `resolveQualityTier`/`nextLowerTier` slice of T016a: add `packages/arena-world/test/quality.test.ts`, then implement and explicitly export the minimal pure quality resolvers.
- Acceptance: exact capability profiles map to A/B/C/D, reduced motion and low power force C, `nextLowerTier` follows A→B→C→D→D, and the exact budget/beacon-cap table remains stable (FR-043, SC-025); focused checks and repository gates remain green.

## 2026-07-20 — P1 / T012f + T016a (quality resolver slice)
- Added `quality.test.ts` through the public package API, covering the exact A/B/C/D budget table, beacon-light caps, ordered capability-profile precedence, pinned weak-device defaults/boundaries, deterministic replay, and the full degradation path.
- Followed red-green TDD: the existing budget assertion passed while all ten resolver/path cases failed because the functions were absent; all eleven tests passed after the minimal implementation and explicit exports landed.
- Added pure `resolveQualityTier(caps)` and `nextLowerTier(tier)` implementations. No-WebGL resolves before reduced-motion/low-power, which resolves before Safari/coarse-pointer/weak/WebGL1-only signals; Tier D degradation is idempotent.
- Review status: checked T012f/T016a line-by-line against spec §§8.22/8.24, FR-043, SC-025, the data model, and the public contract; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was not used because the loop prohibits unrequested subagents and all Git commands.
- Gate status: focused quality tests passed (11 tests); Biome checked all three changed feature files; direct arena-world TypeScript validation passed; `pnpm typecheck` passed; `pnpm test` passed (23 files, 87 tests). No app changed, so no Next.js build was required.
- SC status: SC-025's deterministic domain resolver, degradation path, exact budgets, and beacon-cap contract are complete; renderer wiring and sustained-frame auto-degrade remain scheduled for P6.
- Blockers: none.

## NEXT
- T012g: add `packages/arena-world/test/lighting.test.ts` for exact per-tier/world-theme rigs, mastery-state light contributions, and paired non-color state cues.
- Acceptance: `resolveLighting` retains its exact per-tier/default/dawn/dusk rigs; unlocked nodes contribute beacon lights, available nodes contribute warm glows, locked nodes contribute none; contributions respect the A=8/B=3/C=0 dynamic-light caps and expose icon/shape cues so light is never the sole state signal (FR-041, SC-026); focused checks and repository gates remain green.

## 2026-07-20 — P1 / T012g
- Added `lighting.test.ts` through the public package API, covering every exact default/dawn/dusk per-tier rig, ordinary and transfer-critical beacons, available glows, locked/unlit nodes, paired icon/shape cues, theme-adjusted light values, and fresh deterministic output.
- Followed red-green TDD: the exact rig assertion passed against the prior resolver while all three contribution tests failed because `resolveNodeLightContributions` was absent; all four tests passed after the minimal implementation and explicit exports landed.
- Added a pure `resolveNodeLightContributions` helper that preserves declaration-order output, allocates dynamic lights nearest the camera target with a stable declaration-order tie-break, applies the exact A=8/B=3/C=0/D=0 caps, and degrades over-cap active nodes to emissive presentation.
- Review status: checked T012g line-by-line against spec §§5.2/8.20/8.22, FR-041, SC-026, the data model, and the public contract; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was not used because the loop prohibits unrequested subagents and all Git commands.
- Gate status: focused lighting tests passed (4 tests); direct arena-world TypeScript validation and the domain purity scan passed; `pnpm lint` passed (71 files); `pnpm typecheck` passed; `pnpm test` passed (24 files, 91 tests). No app changed, so no Next.js build was required.
- SC status: SC-026's deterministic domain rig/contribution/cap/non-color-cue coverage is complete; concrete 3D marker/light rendering and walkthrough verification remain scheduled for T020/P7.
- Blockers: none.

## NEXT
- T016: add a focused test first, then implement and explicitly export `packages/arena-world/src/feed.ts` as a fixed or seeded deterministic `NodeMasterySignal` sequence/simulator.
- Acceptance: the feed reproduces scenario S1 exactly, advances through progressive valid unlock states in stable order, produces byte-identical replay for identical input/seed, uses no wall clock or `Math.random`, and keeps direct package plus repository gates green.

## 2026-07-20 — P1 / T016
- Added and explicitly exported `createSyntheticMasteryFeed()`, a pure fixed six-record signal sequence whose complete output is the exact S1 golden scenario and whose cumulative prefixes advance through stable prerequisite-valid unlock states.
- Return fresh records for every replay; the feed has no seed, cursor, wall clock, timer, or randomness input, so identical calls are byte-identical and consumer mutation cannot alter later runs.
- Followed red-green TDD: all three focused tests failed with the missing public function, then passed after the minimal feed and entrypoint export landed.
- Review status: checked T016 line-by-line against the P1 feed task, US1 scenarios, exact §8.2 S1 values, and the replaceable synthetic-input boundary; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was not used because the loop prohibits unrequested subagents and all Git commands.
- Gate status: `pnpm lint` passed (73 files); `pnpm typecheck` passed; `pnpm test` passed (25 files, 94 tests). No app changed, so no Next.js build was required.
- SC status: the deterministic synthetic input required to exercise SC-001 is complete; P1 remains in progress, with the composed view and renderer/Ledger tasks still open.
- Blockers: none.

## NEXT
- T017: add a focused test first, then implement and explicitly export the initial `buildArenaView` in `packages/arena-world/src/view.ts`.
- Acceptance: the view deterministically composes the fixture world, golden layout and node states with the complete P1 `presentation` block (`biomes`, world transform, camera, parallax, lighting, water, post-fx, avatar animation, quality tier/budget, asset keys, and palette) plus flags; progression/eligibility/base/standing/visual-band remain deferred; focused checks and repository gates stay green.

## 2026-07-20 — P1 / T017
- Added and explicitly exported the initial pure `buildArenaView`, its `BuildArenaViewInputs`, and the staged `InitialArenaView` return type. The composer normalizes the supplied world, derives the golden layout and stable node-state rows once, and assembles the complete P1 renderer-facing presentation block plus flags.
- Wired capability resolution through the existing quality ladder: explicit or device-requested reduced motion selects calm Tier C, and the selected tier consistently drives lighting, water, post-fx, avatar animation, and the copied quality budget.
- Kept later-phase state absent rather than inventing placeholders: progression, representation, avatar state, cosmetic eligibility, base, standings, visual band, and base placements remain scheduled for T029/T036/T044. Renderer-facing fixtures/registries are copied so consumer mutation cannot affect deterministic replay.
- Followed red-green TDD: all three focused tests failed with `buildArenaView` missing, then passed after the minimal composer and public exports landed. Acceptance covers the exact S1 node-state order, the full P1 presentation key/value contract, reduced-motion Tier C, byte-identical replay, and fresh presentation containers.
- Gate status: focused view tests passed (3 tests); direct arena-world TypeScript validation and the domain purity scan passed; `pnpm lint` passed (75 files); `pnpm typecheck` passed; `pnpm test` passed (26 files, 97 tests). No app file changed, so no Next.js build was required.
- SC status: the single-view composition groundwork for SC-014 is complete at P1; full underlying-state parity remains open until progression/base/standing and `plainViewEquals` land in T029/T036/T044.
- Blockers: none.

## NEXT
- T018: add focused app contract tests first, then implement the P1 scene bootstrap in `apps/arena/app/scene/eventBus.ts`, `ArenaCanvas.tsx`, and `scene/geometry/`.
- Acceptance: a typed DOM-to-scene bridge, client-only r3f v8 Canvas using the view quality budget for DPR and the pinned ACES/sRGB color setup, context-loss pause/restore and Tier-D fallback signaling, cleanup on unmount, plus deterministic seeded low-poly geometry/material descriptors keyed to `ASSET_KEYS` with no `Math.random`; `pnpm lint`, `pnpm typecheck`, `pnpm test`, root `pnpm build`, and the Arena app build remain green.

## 2026-07-21 — P1 / T018
- Added a typed per-client event-bus factory with the exact DOM-to-scene and scene-to-DOM event vocabulary, isolated subscriptions, unsubscribe cleanup, and explicit clearing.
- Added the client-only r3f v8 `ArenaCanvas` root driven by `InitialArenaView`: DPR and frame-loop mode come from the quality budget, Tier C uses demand rendering, shadows follow the tier, the canvas is hidden from assistive technology, and Three is configured for ACES filmic tone mapping, sRGB output, and color management.
- Added testable WebGL context lifecycle handling: loss pauses the loop, restoration resumes and invalidates it, creation failure or a non-restored loss emits a Tier-D degradation event, and unmount cleanup removes listeners and pending recovery timers. R3F retains ownership of renderer/root disposal.
- Added deterministic low-poly Three geometry, material, and mesh factories for all 30 `ASSET_KEYS`, derived from the domain fallback seeds with no ambient randomness or external fetch; explicit disposal frees generated geometry and material resources.
- Followed red-green TDD: all five focused tests first failed on missing modules, then passed after the minimal implementation. Coverage includes event isolation, recoverable/unrecoverable context paths, renderer source contract, every asset key, deterministic replay, unknown-key rejection, and disposal.
- Review status: checked T018 line-by-line against spec D3/D6, §§5.5/5.11/8.17/8.24, FR-028/030/039, and the React/Next lifecycle guidance; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was intentionally not used because the loop prohibits unrequested subagents and all Git commands.
- Gate status: `pnpm lint` passed (79 files); `pnpm typecheck` passed; `pnpm test` passed (27 files, 102 tests); root `pnpm build` passed; `pnpm --filter @gt100k/arena-world-app build` passed (static `/`, 138 B route, 87.4 kB first load).
- SC status: the app-side deterministic procedural-generator portion of SC-023 and the renderer lifecycle groundwork for FR-028/SC-025 are present; dynamic mounting, concrete world rendering, no-network smoke, and end-to-end fallback remain scheduled for T019–T022/P7.
- Blockers: none.

## NEXT
- T019: add focused tests first, then implement `apps/arena/app/scene/LightingRig.tsx` and `SeaAndSky.tsx` from the exact resolved P1 presentation values.
- Acceptance: lighting renders the resolved key/hemi/ambient/rim rig with per-tier shadow and sun-drift behavior; sea/sky render the resolved water mode, sky, clouds, fog, and motes with all ambient motion disabled under reduced motion/Tier C; generated resources clean up; focused checks plus `pnpm lint`, `pnpm typecheck`, `pnpm test`, root `pnpm build`, and the Arena app build remain green.

## 2026-07-21 — P1 / T019
- Added `LightingRig`, consuming the resolved key, hemisphere, ambient, and rim configuration directly, including per-tier shadow map/bias/softness and a world-covering shadow frustum.
- Added a deterministic 120-second ±5-degree key-light drift with a static zero-angle branch whenever ambient motion is disabled or the Tier-C resolver has clamped sun drift to zero.
- Added `SeaAndSky` with a deep-teal/dawn-horizon sky dome, sea-deep fog, fixed cloud cards, shader/cheap/static water branches, foam/glint treatment, and a fixed mote field. The resolved Tier-D `none` mode omits water.
- Preserved depth under reduced motion: sky, clouds, water, and motes remain rendered, while sun drift, cloud drift, water phase, and mote drift all resolve to stable static values. All resources stay declarative so r3f owns unmount disposal.
- Followed red-green TDD: three tests first failed on the missing modules; a review-driven RED pass then caught the flat sky and default shadow-frustum gaps before the gradient dome and explicit bounds landed.
- Review status: checked T019 line-by-line against tasks.md, spec §§5.1/5.3/8.20, the motion-review standards, and React/r3f performance guidance. The two visual/coverage findings were fixed; no Critical, Important, or Minor issues remain. Subagent/Git-SHA review was intentionally not used because the loop prohibits unrequested subagents and all Git commands.
- Gate status: `pnpm lint` passed (82 files); `pnpm typecheck` passed; `pnpm test` passed (28 files, 105 tests); root `pnpm build` passed; `pnpm --filter @gt100k/arena-world-app build` passed (static `/`, 138 B route, 87.4 kB first load).
- SC status: app-side atmosphere consumption advances SC-017/SC-018 and the static reduced-motion path advances SC-004; P1 remains in progress until the world, avatar, camera, Ledger, fallback, and client wiring tasks land.
- Blockers: none.

## NEXT
- T020: add focused tests first, then implement `WorldRoot.tsx`, `Avatar.tsx`, and `CameraRig.tsx` from the resolved `InitialArenaView` presentation.
- Acceptance: render deterministic floating biome islands, color-independent node markers/landmarks, paths/bridges, capped beacon lights with emissive fallback, the interruptible lantern-avatar, and the bounded follow/orbit/dolly camera; reduced motion uses static island/avatar/camera equivalents while retaining depth; focused checks and all repository/app gates remain green.

## 2026-07-21 — P1 / T020
- Added `WorldRoot` with a deterministic renderer plan, four instanced faceted biome islands at exact elevations, phase-offset island float, all nine landmark markers, seven lit paths including two cross-island bridges, and declaration-stable node-state presentation.
- Paired every node state with its domain icon/shape/light contract: closed padlock/closed marker/no light, start pennant/open ring/available glow, and filled star/raised beacon. Dynamic point lights obey A=8/B=3/C=0 caps; over-cap and calm-tier nodes retain emissive state.
- Added transition-aware 0.95→1.05→1.0 node reveal, with no initial-mount replay and an instant reduced-motion equivalent. Visible drei labels carry every canonical landmark while remaining hidden from assistive technology pending the T021 Ledger source of truth.
- Added the pseudonymous low-poly lantern avatar with exact idle/celebrate pose mappings, steady reduced-motion poses, frame-rate-independent live-position/facing damping, no `scale(0)`, and an optional shared live ref for camera following.
- Added the bounded perspective follow/orbit camera with the exact deadzone, look-ahead, damping, yaw/pitch/distance bounds, and token-driven 90→32 establishing dolly. Reduced motion cuts to the rest pose; retargeting follows the avatar's live position without resetting or bypassing damping.
- Followed red-green TDD: the initial ten tests failed on the missing modules, then passed after implementation. Additional review-driven RED passes caught initial-mount reveal replay, global-clock one-shot animation, camera-reset/damping bypass, and destination-only camera following before their fixes landed.
- Review status: motion review approved after the lifecycle fixes; motion is justified, interruptible, frame-rate-independent, reduced-motion complete, and free of per-frame geometry/resource allocation. Subagent/Git-SHA review was intentionally not used because the loop prohibits unrequested subagents and all Git commands.
- Gate status: focused T020 tests passed (10 tests); `pnpm lint` passed (86 files); `pnpm typecheck` passed; `pnpm test` passed (29 files, 115 tests); root `pnpm build` passed; `pnpm --filter @gt100k/arena-world-app build` passed (static `/`, 138 B route, 87.4 kB first load).
- SC status: concrete app rendering advances SC-004, SC-016, SC-017, SC-018, and SC-026; P1 remains in progress until the Ledger, Tier-D fallback, client composition, and mounted smoke/walkthrough tasks land.
- Blockers: none.

## NEXT
- T021: add focused tests first, then implement `apps/arena/app/ledger/ArenaLedger.tsx` as the accessible DOM parallel of the same `InitialArenaView`.
- Acceptance: expose the quest as `role="tree"` with every node as a `treeitem` named by title + state + region, support Tab/Arrow/Enter keyboard navigation with visible focus, keep the canvas `aria-hidden`, and keep focused checks plus all repository/app gates green.

## 2026-07-21 — P1 / T021
- Added the client-side `ArenaLedger`, derived directly from the same `InitialArenaView` as the scene, with all nine landmarks preserved in declaration order and accessible names containing landmark, state, and human-readable region.
- Implemented a semantic `role="tree"`/`treeitem` structure with one roving tab stop, clamped Arrow navigation, Home/End shortcuts, and Enter/pointer activation through the existing typed `focus-node` event bus.
- Added visible icon + state + region cues independent of color, 56px tree targets, high-contrast and reduced-motion CSS branches, and an explicit `--focus` ring while retaining the canvas's `aria-hidden="true"` contract.
- Followed red-green TDD: after correcting a test-harness-only React resolution error, four tests failed on the absent Ledger module and styles, then passed after the minimal component and CSS module landed. Runtime static markup verifies nine treeitems and exactly one tab stop; pure tests verify all labels and keyboard commands.
- Review status: checked T021 line-by-line against spec §5.12, §12, FR-016/FR-029, SC-012, the existing event bus, React performance guidance, and the Arena design tokens; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was intentionally not used because the loop prohibits unrequested subagents and all Git commands.
- Gate status: focused Ledger tests passed (4 tests); `pnpm lint` passed (89 files); `pnpm typecheck` passed; `pnpm test` passed (30 files, 119 tests); root `pnpm build` passed; `pnpm --filter @gt100k/arena-world-app build` passed (static `/`, 138 B route, 87.4 kB first load).
- SC status: the T021 semantic tree, keyboard model, color-independent cues, visible focus, and canvas-hiding portion of SC-012 is complete; mounting, switch/screen-reader walkthrough, and Tier-D parity remain scheduled for T022/P7.
- Blockers: none.

## NEXT
- T021a: add focused tests first, then implement `apps/arena/app/scene/Fallback2D.tsx` as the P1 Tier-D static 2D/DOM(SVG) stub driven by the identical `InitialArenaView`.
- Acceptance: Tier D renders the same regions, node positions, landmark labels, and locked/available/unlocked states without mounting a canvas; the Ledger remains the semantic source of truth, and focused checks plus `pnpm lint`, `pnpm typecheck`, `pnpm test`, root `pnpm build`, and the Arena app build remain green.

## 2026-07-21 — P1 / T021a
- Added the static Tier-D `Fallback2D` renderer and a pure `buildFallback2DPlan(view)` projection. It preserves the identical four-region order, all nine golden 2D positions and landmark labels, all seven graph edges, and every locked/available/unlocked state from `InitialArenaView` without recomputing domain state.
- Added seven committed, no-fetch SVG assets keyed to the existing four region and three node-state identifiers. The responsive SVG map includes visible landmark and state text while remaining fully static and free of r3f, Three, canvas, timers, effects, and randomness.
- Kept the visual fallback `aria-hidden` and non-interactive so the synchronized Arena Ledger remains the sole semantic and keyboard source of truth rather than creating a duplicate accessibility tree.
- Followed red-green TDD: all four focused tests first failed on the absent module/assets, then passed after implementation. A harness-only React binding and an SVG-namespace false positive were corrected without weakening the behavior assertions.
- Review status: checked T021a line-by-line against D4–D6, §§5.11/8.24/9 P1/12, FR-029/030/043, SC-011/012, the existing Ledger, UI accessibility guidance, and React/Next performance guidance; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was intentionally not used because the loop prohibits unrequested subagents and all Git commands.
- Gate status: focused fallback tests passed (4 tests); the static-dependency scan passed; `pnpm lint` passed (92 files); `pnpm typecheck` passed; `pnpm test` passed (31 files, 123 tests); root `pnpm build` passed; `pnpm --filter @gt100k/arena-world-app build` passed (static `/`, 138 B route, 87.4 kB first load).
- SC status: the P1 Tier-D visual-parity/no-canvas contract advances FR-029/043 and the fallback half of the SC-011/SC-012 smoke; mounted client selection and forced-Tier-D smoke remain scheduled for T022/P7.
- Blockers: none.

## NEXT
- T022: add focused tests first, then implement `apps/arena/app/ArenaClient.tsx` and render it from `apps/arena/app/page.tsx`.
- Acceptance: gather deterministic `DeviceCaps` and public quality overrides, build one shared `InitialArenaView`, render the dynamic client-only canvas for tiers A/B/C or `Fallback2D` for Tier D, always pair it with the Ledger and synthetic feed, honor reduced-motion defaults as calm Tier C, and keep `pnpm lint`, `pnpm typecheck`, `pnpm test`, root `pnpm build`, and the Arena app build green.

## 2026-07-21 — P1 / T022
- Added the client-side Arena composition boundary with safe public-config parsing, deterministic WebGL/device/preference capability gathering, and a hydration-safe Tier-D initial profile that upgrades after mount.
- Built one shared `InitialArenaView` from the canonical fixture and fixed synthetic feed, then selected the dynamically imported r3f renderer for A/B/C or the static SVG fallback for D while keeping the Arena Ledger mounted beside either rendering.
- Wired Ledger focus events to the live avatar/camera target and context-loss/tier-degradation events back to renderer selection. The dynamic `ArenaCanvas` now composes the resolved lighting, atmosphere, world, avatar, and camera without pulling Three/r3f into the Tier-D shell.
- Honored `system`/`on`/`off` reduced-motion defaults and public A/B/C/D quality preferences with explicit precedence: no-WebGL/runtime fallback remains D, reduced motion and automatic low power select calm C, and QA tier overrides remain deterministic.
- Followed red-green TDD: six focused assertions failed on the absent client/shell wiring, then all T022 tests passed; a harness-only classic-JSX RED failure identified the missing React namespace binding before the narrow fix.
- Review status: checked T022 line-by-line against D3-D5, US1, P1, §§8.24/11/12, React/Next bundle guidance, and the existing scene/Ledger contracts; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was not used because the loop prohibits unrequested subagents and all Git commands.
- Gate status: focused integration tests passed (22 tests); `pnpm lint` passed (94 files); `pnpm typecheck` passed; `pnpm test` passed (32 files, 128 tests); root `pnpm build` passed; `pnpm --filter @gt100k/arena-world-app build` passed (static `/`, 9.47 kB route, 96.9 kB first load). The built server returned HTTP 200 with the Tier-D fallback and Ledger in SSR output.
- SC status: P1 implementation tasks are complete; the one-view renderer/Ledger composition advances SC-004/011/012/014/025/026. The interactive zero-console/WebGL smoke remains for the review pipeline because no local Playwright runtime is installed; dependencies were left unchanged.
- Blockers: none for T022.

## NEXT
- T023 + T027: add `packages/arena-world/test/progression.test.ts` first, then implement and explicitly export `tierForReward` and `computeProgression` in `packages/arena-world/src/progression.ts`.
- Acceptance: exact reward boundaries `99/100/249/250/500/899/900/1500`; scenario S1 cumulative reward `300` resolves to tier 2 with `regionsComplete=["tinker-bluffs"]` and populated growth-vs-past; deterministic focused checks and repository gates remain green (FR-005/006).

## 2026-07-21 — P2 / T023 + T027
- Added `progression.test.ts` through the public package API, covering all eight exact inclusive tier boundaries, the complete S1 progression state, a supplied personal baseline, deterministic replay, and fresh results.
- Followed red-green TDD: all three acceptance tests failed only because `tierForReward` and `computeProgression` were absent, then passed after the minimal implementation and explicit exports landed.
- Added pure progression resolvers that select the greatest eligible tier threshold, count rewards once per unlocked world node, preserve canonical region order, and compute growth against `previousReward ?? 0` without time, randomness, or renderer dependencies.
- Review status: checked T023/T027 line-by-line against spec §§7.2/8.2–8.4, FR-005/006, the domain contract, and data-model shapes; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was not used because the loop prohibits unrequested subagents and all Git commands.
- Gate status: focused progression tests passed (3 tests); the domain-purity scan passed; `pnpm lint` passed (96 files); `pnpm typecheck` passed; `pnpm test` passed (33 files, 131 tests). No app changed, so no Next.js build was required.
- SC status: the deterministic progression/tier foundation for P2 is complete; cosmetic determinism SC-002 and zero-power SC-003 remain open for T024–T026/T028.
- Blockers: none.

## NEXT
- T024 + T028: add `packages/arena-world/test/cosmetics.test.ts` first, then implement and explicitly export `deriveCosmeticEligibility` and `equipCosmetic` in `packages/arena-world/src/cosmetics.ts`.
- Acceptance: S1 eligible/locked IDs match §8.4 exactly in catalog order; identical inputs replay identically; every cosmetic retains stable `look`/`equipEffect`; appearance never changes eligibility; equipping `avatar-cape-aurora` in S1 rejects; no money/randomness parameter or behavior enters the API; focused and repository gates remain green (FR-007/035, SC-002/022).

## 2026-07-21 — P2 / T024 + T028
- Added `cosmetics.test.ts` through the public package API, covering the exact S1 eligible/locked sets, fresh deterministic replay, all three rule variants, exact stable visual descriptors, appearance-independent eligibility, earned equip, duplicate-safe equip, unearned rejection, and the three-input no-money API shape.
- Followed red-green TDD: the initial seven tests failed because both public resolvers were absent; the positive `region-complete` case then failed independently before its minimal rule branch was restored. All eight focused tests pass.
- Added pure `deriveCosmeticEligibility` and `equipCosmetic` resolvers with explicit public exports. Eligibility partitions IDs in catalog order without reading visual descriptors; equip preserves the pseudonymous learner reference, rejects unearned IDs, never mutates caller state, and adds an earned cosmetic at most once.
- Confirmed the existing `resolveLighting(tier, worldTheme)` already implements the exact dawn/dusk appearance-only variants required by T028, and locked that integration in the cosmetic acceptance suite without duplicating the resolver.
- Review status: checked T024/T028 line-by-line against the domain contract, data model, §§7.3/8.4/8.15/8.20, FR-007/035, and SC-002/022; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was not used because the loop prohibits unrequested subagents and all Git commands.
- Gate status: focused cosmetic tests passed (8 tests); the domain-purity/commerce scan passed; `pnpm lint` passed (98 files); `pnpm typecheck` passed; `pnpm test` passed (34 files, 139 tests). No app changed, so no Next.js build was required.
- SC status: deterministic eligibility and the no-money function surface advance SC-002; stable descriptors and appearance-independent eligibility complete the behavioral half of SC-022. The package-wide static guardrails remain scheduled for T025, and full zero-power outcome invariance remains scheduled for T026.
- Blockers: none.

## NEXT
- T025: add `packages/arena-world/test/guardrails.test.ts` as the next ordered P2 acceptance task.
- Acceptance: statically prove no `Math.random` or 3D/render imports exist anywhere in `packages/arena-world/src`; `Cosmetic` exposes none of `price|currency|dropRate|rarity`; standings expose none of `rank|position|percentile|outOf`; every sound cue is muted by default and carries no `negative|alarm|loop` flag; focused and repository gates remain green (FR-008/019/037, SC-002/021/022).

## 2026-07-21 — P2 / T025
- Added `guardrails.test.ts` through the public package API, combining a scan of every domain source file with exact type-level commerce/caste/sound contracts and runtime checks over every sound cue.
- The source scan rejects `Math.random` and every external package import except the approved `@gt100k/learning-loop` domain dependency, keeping React/Next/Three/r3f/Motion and other renderer dependencies out by construction.
- The focused suite passed on its first run because T003/T004b had already made the forbidden fields and sound flags unrepresentable; no production change was needed or manufactured for this acceptance-only task.
- Direct package TypeScript validation exposed an existing T024 test-fixture issue: under `noUncheckedIndexedAccess`, three fixed `CATALOG[n]` spreads could be `undefined`. Added narrow non-null assertions at the already-covered canonical indices; direct package validation and the 12 affected guardrail/cosmetic tests then passed.
- Review status: checked the suite against T025, FR-008/019/037, SC-002/021/022, and the full current domain source set; no Critical, Important, or Minor issues found. Subagent/Git-SHA review was not used because the loop prohibits unrequested subagents and all Git commands.
- Gate status: `pnpm lint` passed (99 files); direct arena-world TypeScript validation passed; `pnpm typecheck` passed; `pnpm test` passed (35 files, 143 tests). No app changed, so no Next.js build was required.
- SC status: SC-002 and SC-022 are complete; T025 completes the structural/muted-default portion of SC-021, while deterministic cue selection remains scheduled for P3/T032a.
- Blockers: none.

## NEXT
- T026: add `packages/arena-world/test/zero-power.test.ts` as the next ordered P2 acceptance task.
- Acceptance: mastery, node-state, matchmaking, and standing outcomes are byte-identical across cosmetic/tier states; `equipCosmetic` changes only cosmetic fields; world-theme lighting cannot reach any outcome function; avatars remain pseudonymous; focused and repository gates remain green (FR-009/010, SC-003).
