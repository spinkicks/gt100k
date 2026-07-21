# Contract: `@gt100k/cohort-arena-view` view interface (UI, P7–P11)

The Cohort & Arena Viewer's "contract" is the public interface of the **pure** view-model package
`packages/cohort-arena-view` plus the app-level acceptance obligations for `apps/cohort-arena`. All view
functions are **pure** over injected domain values (read-only from `@gt100k/cohort-compiler`) — no I/O, no
wall-clock, **no `Math.random`**. See [../data-model.md](../data-model.md#ui-view-model--packagescohort-arena-view-p7p11)
for `CohortArenaView`, `ConstellationView`, `CohortCardView`, `StandingsView`, `ArenaRoomView`,
`SafeguardingView`, `MotionSpec`, `PresentationView`, `LedgerView`, and the golden constants. Exact golden
values are in [../spec.md § UI Golden Values](../spec.md#ui-golden-values--constants).

## Public functions (view package)

```text
buildCohortArenaView(input) -> CohortArenaView
  Precondition:  input = { assignment, priorAssignment?, pool?, candidateSets?, hard, churn,
                 standings?: { self:{selfGain}, nearPeers:[{pseudonym,gain}], optedIn },
                 rivalry?: TurnAnalysis | null, flags: { reducedMotion, plain, band, standingsOptIn } }.
                 All values are synthetic/injected from the committed domain API (read-only). Optional `pool`
                 supplies level/velocity for the caliper-gradient field-start (layoutField).
  Behavior:      compose constellation (layoutConstellation + layoutField + project2D — 3D positions and
                 their 2D projection), cohort cards (members+roles, the seven SATISFIED hard-constraint
                 badges, the non-harm floor readout, churn delta), standings (deriveStandingsView), rivalry
                 (buildArenaRoomView), safeguarding (display), motion (resolveMotion per event, honoring
                 flags.reducedMotion), presentation (resolveVisualBand), and ledger (buildLedger).
  Postcondition: identical inputs -> BYTE-IDENTICAL view (FR-029); flags affect ONLY motion+presentation
                 (never the 3D/2D geometry, cohorts, standings, rivalry, safeguarding); plainViewEquals holds
                 across reducedMotion/plain/band (FR-028/FR-044, SC-009).

layoutConstellation(assignment) -> ConstellationView         // 3D
  Pure: cohort centers center(i) = { x: -11 + (i%2)*22, y: 0, z: -(floor(i/2))*22 }; member k (0..5, members
        sorted by learnerRef asc) at theta_k = 90 - k*60 deg on HEX_R=6 in the local XZ plane
        (vertexLocal rounded to 3 dp), memberPos(i,k) = center(i)+vertexLocal(k); non-harm-floor halo at
        FLOOR_Y=-1.5 / FLOOR_R=8; unassigned on the bench { x: -20 + i*5, y: -8, z: 18 }; caliperRadii
        [5,10,15]; CAMERA/FOG pinned. Every 3D pos also carries project2D(pos). Deterministic (SC-010).

layoutField(pool) -> Map<ref, Vec3>                          // 3D compile-start (caliper gradient)
  Pure: fieldPos(l) = { x: round((l.level-11)*2.5, 3), y: 0, z: round((l.velocity-11)*2.5, 3) }.
        Near-peers cluster in space; used only as the compile animation's start. Deterministic.

project2D(p: Vec3) -> Vec2                                    // pure orthographic 2D-tier projection
  Pure: { x: round(800 + p.x*24), y: round(450 - p.z*24) } (PROJECT.scale=24, center (800,450)). Drops Y.
        Integer output, tolerance 0. Drives the reduced-motion / weak-device / WebGL-loss 2D tier (SC-010/SC-015).

layoutArenaRing(speakers) -> SeatView[]                       // 3D
  Pure: N speakers sorted asc; seat k at theta_k = 90 - k*(360/N) deg on RING_R=10, center {0,0,0}
        (rounded to 3 dp); each seat carries pos (Vec3) and pos2d = project2D(pos). Deterministic (SC-010).

deriveStandingsView(self, nearPeers, { optedIn }) -> StandingsView | null
  Pure: optedIn=false (default) -> null; optedIn=true -> { band, anonymizedPeers, selfGain,
        gainToBandTop = max(all gains) - selfGain }. The return type has NO rank/position/percentile/outOf
        field and NO bottom-rank surface (FR-035; G6; SC-012/SC-017).

buildArenaRoomView(analysis) -> ArenaRoomView
  Pure: seats (layoutArenaRing), patterns (from analysis, observable only), confidence, suppressed. The
        return type has NO honesty/emotion/personality/motivation field; suppressed=true -> 0 patterns
        surfaced (suppress, never mislabel) (FR-037; G5/G6; SC-013).

resolveMotion(kind, { reducedMotion }) -> MotionSpec
  Pure: { kind, mode, durationMs, easing }. Animated from MOTION/EASINGS; reducedMotion:true ->
        mode:"reduced", easing:"linear", durationMs from the reduced column. Every kind has both forms
        (FR-039, SC-011). Matches Fixture V4 exactly.

resolveVisualBand(band) -> VisualBand
  Pure: labelStyle/markerScale/celebrationCeiling per band; underlying state identical across bands
        (plainViewEquals) (FR-044).

buildLedger(view) -> LedgerView
  Pure: cohortTree (role=tree accessible names), standingsText, rivalryList, safeguardingAlert, announce
        (aria-live). The accessible twin from the same view (FR-040, SC-014).

plainViewEquals(a, b) -> boolean
  Pure: true iff a and b share identical constellation/cohorts/standings/rivalry/safeguarding (ignoring
        motion + presentation). Proves reduced-motion/plain/band change presentation only (SC-009/SC-015).
```

## App acceptance obligations (`apps/cohort-arena`)

```text
3D mount:          react-three-fiber <Canvas> loaded client-only (next/dynamic ssr:false); Pixi/Phaser-free;
                   three.js + drei on WebGL2; geometries/materials/textures disposed on unmount (no leaked GL
                   contexts); ZERO console/WebGL errors in the smoke run (FR-041, SC-014).
Perf + degrade:    target 60fps on the min device with a degraded 3D tier (halved instanced stars, bloom/
                   shadows off); on WebGL2 loss / weak device / sustained frame-budget miss -> 2D tier
                   (project2D DOM/SVG) + Cohort Ledger (neither depends on WebGL); no state lost, no action
                   blocked (FR-041).
One view drives all: 3D r3f canvas, 2D tier (project2D), DOM+motion@^12 HUD, and Cohort Ledger all render
                   from one CohortArenaView; reduced-motion/plain/2D-tier do not recompute state (FR-028, SC-015).
Motion ownership:  three.js useFrame owns 3D motion; motion@^12 (motion/react) owns DOM motion; NO third
                   animation library.
Accessibility:     3D canvas aria-hidden; Ledger keyboard/switch/screen-reader operable; visible focus;
                   color-independent (icon+shape+text); >=4.5:1 contrast (FR-040/FR-045, SC-014/SC-018).
No-fetch / no-env: next build succeeds with empty env; no external fetch; NEXT_PUBLIC_* defaults only
                   (FR-042).
```

## Contract test obligations (map to FR/SC)

- `buildCohortArenaView`: composes one deterministic view; identical inputs -> byte-identical; `plainViewEquals` holds across reducedMotion/plain/band (FR-028/FR-029/FR-044, SC-009). Golden [Fixture V1](../spec.md#fixture-v1-view-cohort-12-ui-us1).
- `layoutConstellation` / `layoutField` / `layoutArenaRing` / `project2D`: exact pinned **3D `{x,y,z}`** positions (cohort hex vertices, floor halos, bench slots, seat ring, field-start) **and** their **`project2D` `{x,y}`** projections across runs (FR-031, SC-010). Golden [Fixture V1](../spec.md#fixture-v1-view-cohort-12-ui-us1) (e.g. `A1 {-11,0,6}` → `(536,306)`) + [Fixture V3](../spec.md#fixture-v3-view-rivalry-ui-us3) (e.g. `S1 {0,0,10}` → `(800,210)`).
- cohort cards: six members + role vector; all seven hard-constraint badges `satisfied:true`; non-harm floor readout `minBenefit ≥ floor` (Fixture V1 `0.825 ≥ 0.5`); churn delta correct; an unassigned learner renders as the calm bench state (from Fixture B2 `C1`), never force-placed/loss (FR-032/FR-033, SC-014/SC-016).
- `deriveStandingsView`: `optedIn:false` -> `null`; `optedIn:true` -> near-peer/anonymized/gain-based, `gainToBandTop = max − self = 40`; **no** rank/position/percentile/outOf field (FR-035, SC-012). Golden [Fixture V2](../spec.md#fixture-v2-view-standings-ui-us2).
- `buildArenaRoomView`: dominance/interruption patterns with evidence; `confidence`+`suppressed` from the domain; low-quality -> `suppressed:true`, 0 patterns; **no** emotion/trait field in 100% of outputs (FR-037, SC-013). Golden [Fixture V3](../spec.md#fixture-v3-view-rivalry-ui-us3).
- `resolveMotion`: exact animated/reduced rows for every kind; every kind has both forms (FR-039, SC-011). Golden [Fixture V4](../spec.md#fixture-v4-motion-golden-ui-us1).
- guardrail scan (`guardrails.test.ts`): no `Math.random` in `packages/cohort-arena-view`; no `price`/`currency`/`rank`/`position`/`percentile`/`outOf` field in view types; no honesty/emotion/personality/motivation field in the arena view; no loss/decay/gacha/purchase/engagement-timer construct (FR-043, SC-017).
- art tokens (`art.test.ts`): `PALETTE`/`TYPOGRAPHY`/`LAYOUT` exact; state color always paired with an icon/shape/text; contrast pairs ≥4.5:1 (FR-045, SC-018).
- safeguarding (`safeguarding.test.ts`): a `CohortHealthEvent` -> `optimizationBypassed:true`, conflicting moves in `pausedMoves`, **0** standing/rating/objective mutations in the view (FR-038, SC-016).
- app (`next build` + seeded smoke + walkthrough): client-only react-three-fiber `<Canvas>` mount, zero console/WebGL errors, clean dispose on unmount, 3D canvas `aria-hidden`, 2D-tier degradation on WebGL loss, Ledger present + focusable, reduced-motion parity, no-fetch/no-env build (FR-040/FR-041/FR-042, SC-014/SC-015).
