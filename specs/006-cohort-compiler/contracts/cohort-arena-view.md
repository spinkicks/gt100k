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
  Precondition:  input = { assignment, priorAssignment?, candidateSets?, hard, churn,
                 standings?: { self:{selfGain}, nearPeers:[{pseudonym,gain}], optedIn },
                 rivalry?: TurnAnalysis | null, flags: { reducedMotion, plain, band, standingsOptIn } }.
                 All values are synthetic/injected from the committed domain API (read-only).
  Behavior:      compose constellation (layoutConstellation), cohort cards (members+roles, the seven
                 SATISFIED hard-constraint badges, the non-harm floor readout, churn delta), standings
                 (deriveStandingsView), rivalry (buildArenaRoomView), safeguarding (display), motion
                 (resolveMotion per event, honoring flags.reducedMotion), presentation
                 (resolveVisualBand), and ledger (buildLedger).
  Postcondition: identical inputs -> BYTE-IDENTICAL view (FR-029); flags affect ONLY motion+presentation;
                 plainViewEquals holds across reducedMotion/plain/band (FR-028/FR-044, SC-009).

layoutConstellation(assignment) -> ConstellationView
  Pure: cohort hex centers center(i) = { x: 480 + (i%2)*640, y: 450 + floor(i/2)*300 }; member k (0..5,
        members sorted by learnerRef asc) at angles [-90,-30,30,90,150,210] deg on HEX_R=96 (rounded to
        int); unassigned on the bench { x: 120 + i*80, y: 820 }; caliperRings [140,220,300]. Deterministic
        (SC-010).

layoutArenaRing(speakers) -> SeatView[]
  Pure: N speakers sorted asc; seat k at angle -90 + k*(360/N) deg on RING_R=240, center (800,450),
        rounded to int. Deterministic (SC-010).

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
Pixi mount:        client-only (next/dynamic ssr:false); Phaser-free; Pixi.js v8 WebGL; destroyed on
                   unmount; ZERO console/WebGL errors in the smoke run (FR-041, SC-014).
Fallback:          WebGL unavailable / context loss -> reduced-motion DOM/SVG + Cohort Ledger (never depend
                   on WebGL); no state lost, no action blocked (FR-041).
One view drives all: Pixi canvas, DOM/Framer-Motion HUD, and Cohort Ledger all render from one
                   CohortArenaView; reduced-motion/plain do not recompute state (FR-028, SC-015).
Accessibility:     canvas aria-hidden; Ledger keyboard/switch/screen-reader operable; visible focus;
                   color-independent (icon+shape+text); >=4.5:1 contrast (FR-040/FR-045, SC-014/SC-018).
No-fetch / no-env: next build succeeds with empty env; no external fetch; NEXT_PUBLIC_* defaults only
                   (FR-042).
```

## Contract test obligations (map to FR/SC)

- `buildCohortArenaView`: composes one deterministic view; identical inputs -> byte-identical; `plainViewEquals` holds across reducedMotion/plain/band (FR-028/FR-029/FR-044, SC-009). Golden [Fixture V1](../spec.md#fixture-v1-view-cohort-12-ui-us1).
- `layoutConstellation` / `layoutArenaRing`: exact pinned positions (cohort hex vertices, bench slots, seat ring) across runs (FR-031, SC-010). Golden [Fixture V1](../spec.md#fixture-v1-view-cohort-12-ui-us1) + [Fixture V3](../spec.md#fixture-v3-view-rivalry-ui-us3).
- cohort cards: six members + role vector; all seven hard-constraint badges `satisfied:true`; non-harm floor readout `minBenefit ≥ floor` (Fixture V1 `0.825 ≥ 0.5`); churn delta correct; an unassigned learner renders as the calm bench state (from Fixture B2 `C1`), never force-placed/loss (FR-032/FR-033, SC-014/SC-016).
- `deriveStandingsView`: `optedIn:false` -> `null`; `optedIn:true` -> near-peer/anonymized/gain-based, `gainToBandTop = max − self = 40`; **no** rank/position/percentile/outOf field (FR-035, SC-012). Golden [Fixture V2](../spec.md#fixture-v2-view-standings-ui-us2).
- `buildArenaRoomView`: dominance/interruption patterns with evidence; `confidence`+`suppressed` from the domain; low-quality -> `suppressed:true`, 0 patterns; **no** emotion/trait field in 100% of outputs (FR-037, SC-013). Golden [Fixture V3](../spec.md#fixture-v3-view-rivalry-ui-us3).
- `resolveMotion`: exact animated/reduced rows for every kind; every kind has both forms (FR-039, SC-011). Golden [Fixture V4](../spec.md#fixture-v4-motion-golden-ui-us1).
- guardrail scan (`guardrails.test.ts`): no `Math.random` in `packages/cohort-arena-view`; no `price`/`currency`/`rank`/`position`/`percentile`/`outOf` field in view types; no honesty/emotion/personality/motivation field in the arena view; no loss/decay/gacha/purchase/engagement-timer construct (FR-043, SC-017).
- art tokens (`art.test.ts`): `PALETTE`/`TYPOGRAPHY`/`LAYOUT` exact; state color always paired with an icon/shape/text; contrast pairs ≥4.5:1 (FR-045, SC-018).
- safeguarding (`safeguarding.test.ts`): a `CohortHealthEvent` -> `optimizationBypassed:true`, conflicting moves in `pausedMoves`, **0** standing/rating/objective mutations in the view (FR-038, SC-016).
- app (`next build` + seeded smoke + walkthrough): client-only Pixi mount, zero console/WebGL errors, canvas `aria-hidden`, Ledger present + focusable, reduced-motion parity, no-fetch/no-env build (FR-040/FR-041/FR-042, SC-014/SC-015).
