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
