# Implementation Plan: Interest Lab / Passion (Rules-Engine MVP)

**Branch**: `003-interest-lab` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-interest-lab/spec.md`

## Summary

Build the Interest Lab as a **pure, framework-agnostic TypeScript domain package** `packages/interest-lab`, mirroring `packages/learning-loop` (deterministic core, no I/O, all I/O behind ports with in-memory/stub adapters). Three domain capabilities plus a guard layer: (1) a **deterministic rules-engine offer service** that assembles a balanced 18–24 probe Lab with a permanent exploration floor and an explicit coverage matrix (never a scalar score); (2) an **event model** that separates voluntary/discretionary return from prompted return and computes separated signal families (accessibility/safety-safe); (3) a **versioned `InterestHypothesis`** with a lifecycle state machine, a `CANDIDATE_SPINE` promotion gate (≥3 signal families incl. ≥1 delayed-discretionary + ≥1 artifact/competence), a missing-data prohibition, and shadow-only model proposals that only a **guide-authored** revision makes operative; (4) **hard guardrails** (PASS-006/007/008/010) enforced at typed boundaries. The learned Bayesian model and the contextual bandit are **shadow/deferred**; interfaces are shaped to accept them later. Synthetic learners only; consent/admissions machinery stubbed.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js LTS. Mirrors `tsconfig.base.json` (`ES2022`, `NodeNext`-style bundler resolution, `strict`, `noUncheckedIndexedAccess`, `composite`, `verbatimModuleSyntax`).

**Primary Dependencies**: None at runtime for the domain (pure TS). Dev: Vitest (test), Biome (lint/format), `tsc -b` (typecheck/build). pnpm workspaces per repo root. No framework, no Next.js in this feature.

**Storage**: In-memory `InterestHypothesisRepository` adapter behind a port; a Postgres/bitemporal adapter can slot in later without touching the domain.

**Testing**: Vitest (unit + contract + an acceptance suite mapping §14.4.3 #1–#7). Auto-discovered by the existing `vitest.config.ts` globs (`packages/**/test`, `adapters/**/test`) — no config edit needed.

**Target Platform**: Local/dev (Node). No cloud/infra in this slice.

**Project Type**: TS monorepo domain package + stub/in-memory adapters (no app/UI in this feature).

**Performance Goals**: Not performance-bound; offer assembly and signal computation are small-N and deterministic. Correctness and determinism over throughput.

**Constraints**: Pure domain (no I/O, no wall-clock reads — clock injected); deterministic (seeded rules engine ⇒ identical Lab); append-only hypothesis; deny-by-default purpose guard.

**Scale/Scope**: One synthetic learner's Interest Lab; a synthetic probe catalog; 18–24 probes; ≤ a few hundred synthetic events. Synthetic data only.

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after design below.*

| Principle | Status | Note |
|---|---|---|
| I. Human authority over consequential decisions | ✅ Pass | No learned model decides. Rule/model proposals are shadow; a **guide authors** the operative revision (IL-011). Promotion gate + missing-data rule keep the record human-owned. |
| II. Child assent & veto | ✅ Pass | Child can dispute/withdraw a reflection without losing access (PASS-008); withdrawal linked to a stub `AssentRecord`. No intensity dial is raised here. |
| III. Evidence-class authority ladder | ✅ Pass | Learned Bayesian model + bandit are **shadow/deferred** (`R`/`E3` → shadow only). MVP is deterministic rules (`G`/`ENG`). Software speed grants no authority. |
| IV. Evidence before authority; proof of process | ✅ Pass | Rules engine applies fixed rules; every revision states uncertainty, competing explanations, coverage gaps, next probe, and versions. Disconfirming beside supporting evidence (IL-012). |
| V. Privacy follows purpose | ✅ Pass | Synthetic only; pseudonymous refs. Purpose guard denies admissions/discipline/family-fidelity/public-ranking/commercial reads (IL-013, PASS-010). Artifact port emits only coarse semantic transitions (PASS-007). |
| VI. Accessibility & non-discrimination | ✅ Pass | Accessibility/safety help never lowers a signal (PASS-006); assistive/unaided learners get identical interpretation (SC-007). |
| VII. Durable learning over performance | ✅ Aligned | Central signal is delayed **voluntary** return, not in-session clicks; novelty spikes do not confirm (edge cases). Competence recorded without inferring passion. |
| VIII. Bounded motivational pressure | ✅ N/A | No pressure/rivalry mechanics here; prompted returns are *recorded with context*, never generated. |
| IX. Prohibited product behavior | ✅ Pass | No automated consequential decision, no ranking/leaderboard, no export to admissions/discipline. Guard is deny-by-default. |
| ENG (governed flow, tests-define-done, no secrets, isolation) | ✅ Pass | Branch→PR→CI, Vitest gate, Biome, `tsc -b`; synthetic-only; no secrets/machine paths; new code isolated to new dirs. |

**Result: PASS** — no violations; no Complexity Tracking required. Risk is concentrated in the *correctness of the guardrails and the promotion/missing-data rules*, which are covered by dedicated contract + acceptance tests rather than by added architecture.

## Project Structure

### Documentation (this feature)

```text
specs/003-interest-lab/
├── spec.md                     # Feature spec (done)
├── plan.md                     # This file (incl. Data Model + Contracts below)
├── tasks.md                    # Test-first, dependency-ordered tasks
└── checklists/
    └── requirements.md         # Spec quality checklist
```

> **Note**: For this package the Phase-0/Phase-1 artifacts (`research.md`, `data-model.md`, `quickstart.md`, `contracts/`) from the 001 layout are **folded into this plan** (see *Data Model* and *Domain Contracts* below) to keep the requested four-file package self-contained. tasks.md references those embedded sections. If a reviewer prefers the split layout, these sections can be lifted into separate files verbatim.

### Source Code (repository root — NEW directories only)

```text
packages/
└── interest-lab/                 # PURE domain — no I/O, deterministic
    ├── src/
    │   ├── probe.ts              # Probe, ProbeFamily, WorkMode, DifficultyBand, SafetyClass, AudienceCondition
    │   ├── catalog.ts           # ProbeCatalog view helpers (eligibility, family variant selection)
    │   ├── coverage.ts          # CoverageMatrix build + gap enumeration (IL-005)
    │   ├── offer.ts             # rules-engine offer service: balanced Lab + exploration floor + provenance (US1)
    │   ├── events.ts           # EngagementEvent model: voluntary vs prompted, assistive/safety tagging (US2)
    │   ├── signals.ts          # SignalSummary: separated signal families, accessibility-safe (US2)
    │   ├── hypothesis.ts       # InterestHypothesis + HypothesisRevision (versioned, append-only) (US3)
    │   ├── state-machine.ts    # lifecycle transitions + CANDIDATE_SPINE gate + missing-data rule + proposal/guide authorship (US3)
    │   ├── guards.ts           # purpose guard (PASS-010), PASS-006/008 helpers, team-artifact rule (US4)
    │   ├── ports.ts            # repository, probe-catalog, assent, artifact-signal, offer-log, clock ports (IL-014)
    │   └── index.ts            # public API barrel
    └── test/
        ├── fixtures/
        │   └── events.ts        # EVENTS_GOLDEN_V1 (10-event synthetic stream; spec Seed Fixtures)
        ├── smoke.test.ts        # P0 smoke (green from iteration 1); upgraded to assert G1 determinism
        ├── offer.test.ts        # US1 contract + golden G1 (PASS-002/003, IL-002/003/004/018/019)
        ├── coverage.test.ts     # US1 coverage-matrix golden G2 + gappy G3 (IL-005, §14.4.3 #3)
        ├── events.test.ts       # US2 voluntary vs prompted (PASS-004/005, §14.4.3 #4)
        ├── signals.test.ts      # US2 separated families golden G4 + accessibility-safe (PASS-006, §14.4.3 #7)
        ├── hypothesis.test.ts   # US3 versioning/append-only/bitemporal + co-primary + disagreement (IL-006)
        ├── state-machine.test.ts# US3 gate golden G5 + transitions G6 + missing-data (IL-008/009/011, §14.4.3 #1/#2)
        ├── guards.test.ts       # US4 purpose guard + team-artifact + PASS-007 (PASS-010/007/010, IL-010/013)
        └── acceptance.test.ts   # §14.4.3 acceptance criteria #1–#7 end-to-end over the in-memory adapters
adapters/
├── interest-repo-memory/         # in-memory InterestHypothesisRepository (append-only, bitemporal view)
│   ├── src/index.ts
│   ├── test/repo.test.ts
│   ├── package.json
│   └── tsconfig.json
├── interest-probe-catalog/       # synthetic probe catalog implementing ProbeCatalog (stub source)
│   ├── src/index.ts              # exports CATALOG_GOLDEN_V1, CATALOG_GAPPY_V1, CATALOG_FAMILY_V1 (spec Seed Fixtures)
│   ├── test/catalog.test.ts
│   ├── package.json
│   └── tsconfig.json
├── interest-assent-stub/         # stub AssentRecord/consent (synthetic; withdrawal linkage)
│   ├── src/index.ts
│   ├── package.json
│   └── tsconfig.json
└── interest-artifact-stub/       # local artifact adapter: coarse semantic transitions ONLY (PASS-007)
    ├── src/index.ts
    ├── test/artifact.test.ts
    ├── package.json
    └── tsconfig.json
```

**Structure Decision**: Mirror the 001 pattern exactly — a pure `packages/interest-lab` domain with all I/O behind ports and thin in-memory/stub adapters under `adapters/interest-*`. Package/module conventions match `packages/learning-loop`: `"type": "module"`, `main`/`types` → `./src/index.ts`, `test` script `vitest run`, per-package `tsconfig.json` extending `../../tsconfig.base.json` with `rootDir: "."`, `outDir: "dist"`, and `references` to `../../packages/interest-lab` for adapters. All new; **no shared root file edited except** the root `tsconfig.json` `references` array (final flagged task; `pnpm-workspace.yaml`, `vitest.config.ts`, and the Biome `lint` script already glob the new dirs).

---

## Data Model (Phase 1, embedded)

All identifiers are pseudonymous; no real PII (Constitution V; synthetic-only). All types are plain, serializable data; the domain functions are pure over injected state.

### Enums / vocabularies

- **`WorkMode`** (activity verbs, ≥8 so ≥6 coverage is achievable): `build | investigate | compose | explain | perform | debug | collaborate | care | persuade`. *Process descriptors, not identity labels.*
- **`DifficultyBand`**: `foundational | stretch` (two bands, PASS-002).
- **`AudienceCondition`**: `audience | no_audience` (PASS-002).
- **`SocialMode`**: `solo | group` (PASS-002).
- **`SafetyClass`**: `cleared | review_required | blocked` (only `cleared` is offerable; real safety review is human/out of scope — stubbed on the catalog).
- **`Provenance`**: `GUIDE | RULE | SHADOW_MODEL` (PASS-001).
- **`HypothesisState`**: `EXPLORING | EMERGING | CANDIDATE_SPINE | ACTIVE | CONTESTED | PARKED | REOPENED` (IL-007).
- **`EventType`**: `VOLUNTARY_RETURN | PROMPTED_RETURN | UNREQUIRED_REVISION | CHOSEN_CHALLENGE | FAILURE_RECOVERY | SELF_AUTHORED_SCOPE | ARTIFACT_COMPETENCE | ASSISTIVE | SAFETY_RESCUE`. (`ARTIFACT_COMPETENCE` is the artifact/competence-growth event the gate counts; `ASSISTIVE`/`SAFETY_RESCUE` are context tags that never reduce a signal.)
- **`Domain` (catalog-supplied, not hardcoded)**: the seed catalog uses `making | living_systems | symbols_math | word_craft | sound_music | movement_body | visual_design | social_world` (≥8 so ≥6 coverage is achievable). The domain package stores no fixed domain list — it reads whatever the injected catalog provides (IL-001/IL-017).
- **`SignalFamily`**: `voluntary_return | unrequired_revision | chosen_challenge | failure_recovery | self_authored_scope | artifact_competence` (the six the promotion gate counts). `prompt_dependence` and `context_effect` are computed but are **discount/context** signals, not families.
- **`ForbiddenPurpose`**: `admissions | discipline | family_fidelity | public_ranking | commercial_targeting` (IL-013/PASS-010).
- **`ChildPosition`**: `AGREE | UNSURE | DISAGREE | DECLINE_TO_LABEL | REQUEST_TO_PARK` (PRD §14.5).

### `Probe` / `ProbeFamily` (IL-001/IL-002)

| Field | Type | Notes |
|---|---|---|
| `id` | string | stable probe id |
| `familyId` | string | groups equivalent variants (IL-002) |
| `domain` | string | **catalog-driven** broad theme (no fixed identity taxonomy) |
| `workMode` | WorkMode | |
| `prerequisites` | string[] | prerequisite skill/probe refs |
| `difficulty` | DifficultyBand | |
| `autonomy` | `low \| medium \| high` | |
| `social` | SocialMode | |
| `audience` | AudienceCondition | |
| `equipment` | string[] | |
| `accessibilityVariants` | string[] | available variants; presence never penalizes (PASS-006) |
| `expectedBurden` | int ≥ 0 | coarse cost |
| `safetyClass` | SafetyClass | only `cleared` is offerable |
| `artifactEvidence` | string | descriptor of the artifact the probe yields |

### `LabConfig`

| Field | Type | Notes |
|---|---|---|
| `cohort` | string | e.g. `standard`, `gt` |
| `probeCountRange` | `{min:18,max:24}` | PASS-002 default |
| `horizonWeeks` | `{min:8,max:12}` | PASS-002 default |
| `minDomains` | int (=6) | coverage floor |
| `minWorkModes` | int (=6) | coverage floor |
| `explorationFloor` | int > 0 | reserved offers for untested/dormant domains (IL-004) |
| `seed` | string/int | determinism for the rules engine (IL-003) |

### `Offer` / `Lab`

- **`Offer`**: `{ probeId, familyId, provenance: Provenance, reason: string, eligible: true }` — every offer records why it appears and what proposed it (PASS-001). Only prerequisite-valid, `cleared` probes become offers (PASS-003).
- **`Lab`**: `{ learnerRef, offers: Offer[], coverage: CoverageMatrix, explorationReserved: int, config: LabConfig }` — 18–24 offers; ≥2 eligible at any choice point.

### `CoverageMatrix` (IL-005, §14.4.3 #3)

`{ probeCount: {met:boolean, count:int, need:int}, domains: {met:boolean, count:int, need:int, have:string[], gaps:string[]}, workModes: {met:boolean, count:int, need:int, have:string[], gaps:string[]}, social: {met:boolean, solo:boolean, group:boolean, gaps:string[]}, difficulty: {met:boolean, foundational:boolean, stretch:boolean, gaps:string[]}, audience: {met:boolean, audience:boolean, no_audience:boolean, gaps:string[]}, complete: boolean, gaps: string[] }` — `gaps` is an explicit list; there is **no** scalar coverage/confidence field. The **exact** shape + exact gap strings are pinned in spec.md *Golden Values* G2 (complete) and G3 (gappy); the top-level `gaps` aggregates every per-dimension gap in dimension order (`probeCount, domains, workModes, social, difficulty, audience`).

### `EngagementEvent` (US2)

| Field | Type | Notes |
|---|---|---|
| `id` | string | idempotency key |
| `learnerRef` | string | pseudonymous |
| `probeId` / `familyId` / `domain` | string | what was engaged |
| `type` | EventType | |
| `occurredAtDayOffset` | int | days since anchor (computed vs injected clock; enables 7/30-day return without wall clock) |
| `interventionContext` | object? | required for `PROMPTED_RETURN` (source: reminder/deadline/nudge/rivalry/reward) — PASS-005 |
| `assistive` | boolean | true for assistive/translation/motor/communication support (PASS-006) |
| `reliability` | `low \| medium \| high` | |
| `optionalReflection` | boolean | withdrawable (PASS-008) |
| `withdrawn` | boolean | set when child withdraws; excluded from signal build + replay (§14.4.3 #6) |

### `SignalSummary` (US2)

Separated values, never fused: `{ voluntaryReturn: {day7:int, day30:int}, unrequiredRevision:int, chosenChallenge:int, failureRecovery:int, scopeAuthorship:int, competenceGrowth:int, noveltyDecay:number, promptDependence:number, contextEffects:string[], familiesPresent: SignalFamily[] }`. The **exact** golden output for `EVENTS_GOLDEN_V1` is pinned in spec.md *Golden Values* G4. `promptDependence`/`contextEffects` are discount/context values and never appear in `familiesPresent` (IL-020).

### `InterestHypothesis` + `HypothesisRevision` (US3, PRD §14.5 / §28)

Append-only list of revisions with a current bitemporal view. Each **revision**:

| Field | Type | Notes |
|---|---|---|
| `hypothesisId`, `learnerRef`, `version` | string / int | pseudonymous, monotonic |
| `candidateDomains` | string[] | broad theme(s); avoid career identity |
| `workModeProfile` | Partial<Record<WorkMode,number>> | verbs, not identity |
| `state` | HypothesisState | |
| `evidenceRefs` | string[] | point to consent-valid events/artifacts; carry source, context, reliability |
| `signalSummary` | SignalSummary | separated families (IL-012) |
| `competingExplanations` | string[] | novelty, ease, praise, peer belonging, parent pressure, resource access, work-mode-over-topic |
| `coverageGaps` | string[] | untested domains/work-modes/contexts/accessibility conditions |
| `uncertainty` | `{ kind:"interval", lo,hi } \| { kind:"grade", grade } ` | **never** a scalar passion score; never false precision (IL-006/IL-012) |
| `nextProbe` | string? | smallest safe distinguishing test |
| `childPosition` | ChildPosition | withdrawal linked to `AssentRecord` |
| `familyContext` | object? | parent-supplied context as a distinct source |
| `guideReview` | `{ guide, decision, rationale, reviewedAtDayOffset } \| null` | **null ⇒ proposal only, non-operative** (IL-011) |
| `proposedBy` | Provenance | RULE/SHADOW_MODEL proposals stay shadow until guide authors |
| `modelVersion`, `policyVersion` | string | audit/replay |
| `validFromDayOffset`, `recordedAtDayOffset` | int | bitemporal |

### State transitions (state-machine contract, IL-007)

```text
                (guide-authored revisions are the only OPERATIVE transitions; rule/model = proposals)

EXPLORING ──(signals accrue)──▶ EMERGING ──(gate passes + guide authors)──▶ CANDIDATE_SPINE ──(adoption, separate feature)──▶ ACTIVE
    ▲                              │  ▲                                            │                                           │
    │                              │  └────────(new supporting evidence)───────────┘                                           │
    │                              ▼                                                                                            │
    │                         (novelty spike / thin evidence stays EMERGING; never auto-confirm)                               │
    │                                                                                                                          ▼
 REOPENED ◀──(dormant interest returns / child request)── PARKED ◀──(child request │ sustained low voluntary return │ inactivity+human review)── CONTESTED ◀──(disconfirming evidence / interest shift)
```

- Legal transitions: `EXPLORING→EMERGING`, `EMERGING→CANDIDATE_SPINE` (gated), `CANDIDATE_SPINE→ACTIVE` (adoption, out of package), any state `→CONTESTED` / `→PARKED` (child may request `PARKED` at any time), `PARKED→REOPENED`, `REOPENED→EXPLORING|EMERGING`, `CONTESTED→EMERGING|PARKED`.
- **`CANDIDATE_SPINE` gate (IL-008)**: `familiesPresent.length ≥ 3` **AND** includes a delayed-discretionary signal (`voluntary_return` with day7 or day30 > 0) **AND** includes `artifact_competence`. Otherwise refused with the missing prerequisite named.
- **Missing-data rule (IL-009)**: a `NoData`/inactivity input returns the state unchanged and never lowers `uncertainty`; a `→PARKED`/low-interest inference from absence is refused unless a human rule-out flag (access/health/schedule/equipment/consent) is supplied.
- **Guide authorship (IL-011)**: `applyProposedTransition(...)` returns a revision with `guideReview=null, proposedBy=RULE|SHADOW_MODEL` → **non-operative** (goes to shadow log). `authorRevision(guideReview, ...)` is the only path that commits an operative state change.

---

## Domain Contracts (Phase 1, embedded)

This package exposes **no** network/HTTP API. Its contract is the public interface of `@gt100k/interest-lab` plus the port shapes. All functions are pure over injected state (no I/O, no wall-clock reads).

### Public functions (pure)

```text
buildLab(learnerRef, catalogView, eligibility, config, selector?) -> Lab
  Pre:  catalogView provides families; config valid. `selector` is OMITTED in the MVP (bandit deferred, IL-021);
        when absent, the rules engine alone produces the operative Lab.
  Behavior (RULES ENGINE, deterministic given integer seed): filter to prerequisite-valid,
          safety-cleared probes; select ≥1 variant per family (≤1 per family per choice point);
          satisfy coverage dimensions greedily over a fixed total order (stableSort(familyId) then seeded
          rotation); reserve `explorationFloor` offers for untested/dormant domains; tag each offer's
          provenance (RULE) + reason.
  Post: 18–24 offers when the catalog allows; ≥2 eligible at each choice point; coverage matrix built;
        adaptive/shadow selection OFF ⇒ still complete & balanced.
  Golden: buildLab(CATALOG_GOLDEN_V1, freshLearner, {seed:42}) == spec G1 (20 offers, exact per-domain/
        per-work-mode/cross-cutting counts, explorationReserved=20); byte-identical across seeds (SC-001, §14.4.3 #5).

buildCoverageMatrix(offers, config) -> CoverageMatrix
  Pure read: per-dimension met/gap; `gaps` enumerated explicitly; NO scalar score (IL-005, §14.4.3 #3).

recordEvent(events, event) -> events'
  Idempotent by event.id. PROMPTED_RETURN must carry interventionContext; it never adds to voluntary_return.
  Withdrawn/optionalReflection excluded downstream.

summarizeSignals(events) -> SignalSummary
  Separated families; assistive/safety events never reduce any signal (PASS-006);
  withdrawn reflections excluded (§14.4.3 #6); prompt_dependence is a discount, not a family.

evaluateCandidateGate(summary) -> { eligible: boolean, missing: string[] }
  Pure: ≥3 families incl. ≥1 delayed-discretionary + ≥1 artifact_competence (IL-008).

proposeTransition(current, summary, proposedBy, versions) -> HypothesisRevision  // guideReview=null (shadow)
authorRevision(current, revision, guideReview) -> HypothesisRevision            // operative (IL-011)
applyMissingData(current) -> HypothesisRevision                                  // state/uncertainty unchanged (IL-009)

guardRead(purpose) -> void            // throws/denies for any ForbiddenPurpose (deny-by-default, IL-013/PASS-010)
promoteTeamArtifact(evidence, soloProof?) -> evidence'  // refuses individual credit without solo proof (IL-010)
acceptArtifactSignal(payload) -> ArtifactTransition     // rejects raw content; coarse transitions only (PASS-007)
```

### Ports (implemented by adapters, injected — IL-014)

```text
interface InterestHypothesisRepository {
  load(hypothesisId): Promise<InterestHypothesis | null>
  currentFor(learnerRef): Promise<InterestHypothesis | null>
  appendRevision(hypothesisId, revision): Promise<void>   // append-only
  revisions(hypothesisId): Promise<HypothesisRevision[]>   // replay (all versions)
}
interface ProbeCatalog { families(): Promise<ProbeFamily[]>; probe(id): Promise<Probe | null> }
interface AssentRecordPort { isWithdrawn(learnerRef, reflectionId): Promise<boolean>; recordWithdrawal(...): Promise<void> } // stub
interface ArtifactSignalSource { next(): Promise<ArtifactTransition | null> }   // coarse transitions ONLY (PASS-007)
interface OfferDecisionLog { record(entry: { eligibleSet, policyVersion, coverageConstraints }): Promise<void> } // fwd-compat w/ PASS-009 bandit
interface Clock { dayOffset(): number }   // injected; core reads no wall clock
// DEFERRED (IL-021, not implemented in MVP; shape reserved so buildLab's optional `selector` can slot in):
interface OfferSelector { pick(eligible: Probe[], ctx): Probe[] }   // bandit; MUST NOT violate rules-engine constraints
```

### Contract test obligations (map to PASS-00x / IL-xxx / §14.4.3)

- `buildLab` with shadow OFF ⇒ complete balanced Lab, 18–24 offers, ≥2 eligible/choice, exploration floor reserved (PASS-002/003, IL-003/004; §14.4.3 #5; SC-001).
- `buildCoverageMatrix` ⇒ enumerated gaps, no scalar score (IL-005; §14.4.3 #3; SC-002).
- prerequisite-invalid / non-`cleared` probes never offered (PASS-003).
- `recordEvent`/`summarizeSignals` ⇒ prompted ≠ voluntary; distinct types & features; prompted adds 0 to voluntary_return (PASS-004/005; §14.4.3 #4; SC-005).
- assistive/safety events never lower a signal; paired assisted/unaided learners ⇒ identical interpretation (PASS-006; §14.4.3 #7; SC-007).
- `evaluateCandidateGate` refuses without ≥3 families incl. delayed-discretionary + artifact/competence; easy-clicks-only ⇒ never CANDIDATE_SPINE; low-skill-recover-author ⇒ eligible (IL-008; §14.4.3 #1/#2; SC-003/004).
- `applyMissingData` ⇒ state/uncertainty unchanged (IL-009; SC-010).
- `proposeTransition` ⇒ non-operative shadow proposal; `authorRevision` ⇒ operative (IL-011; SC-009).
- `guardRead(forbidden)` ⇒ denied for all five purposes (PASS-010/IL-013; SC-008).
- `acceptArtifactSignal` ⇒ rejects raw content (PASS-007); `promoteTeamArtifact` ⇒ refuses w/o solo proof (IL-010).
- withdrawn optional reflection ⇒ absent from next summary + replay (PASS-008; §14.4.3 #6; SC-006).
- hypothesis is append-only + versioned + bitemporal; all revisions replayable (IL-006).
- **Golden-value obligations (exact equality, ±0):** `buildLab` == G1; `buildCoverageMatrix` == G2 (complete) and == G3 (gappy, exact gap strings); `summarizeSignals(EVENTS_GOLDEN_V1)` == G4; `evaluateCandidateGate` == G5 table; state transitions == G6. These are the acceptance tests verbatim (spec *Golden Values*).
- competence-only summary ⇒ gate `missing:["no delayed-discretionary signal"]` (SC-011); `promoteTeamArtifact` refuses w/o solo proof, accepts with (SC-012); ≥2 `candidateDomains` co-primary revision valid (SC-013); `DISAGREE`+model evidence both retained (SC-014); `familyContext` contributes 0 to families/magnitudes (SC-015); `CONTESTED→PARKED→REOPENED` replayable (SC-016).
- selection-under-surplus: a catalog with more eligible probes than target ⇒ a coverage-satisfying subset chosen by the documented deterministic order, byte-identical by seed (IL-018).

## Complexity Tracking

None — Constitution Check passed with no violations. The learned Bayesian model and contextual bandit are deliberately deferred (shadow-only), which keeps this slice inside the deterministic, human-authored, synthetic-only envelope.
