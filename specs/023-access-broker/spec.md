# Feature Specification: D3 + D4 — Access & Audience Broker (mentor relay + real-audience broker)

**Feature Branch**: `023-access-broker`
**Created**: 2026-07-24
**Status**: Draft (grilled; pending final approval)

**Input**: D3 (Mentor Relay + Access-Transfer) + D4 (Real-Audience / Submission Broker) in `docs/prd/passionApps.md`, grounded in `SPECIALIZATION-PIPELINE-PRD.md` §5.1 (the mentor relay — handoffs are first-class; the highest-value mentor act is **access-transfer**, each handoff an **engineered event**), §7.3 (layered real-expert & real-audience sourcing), §8/§8.3 (push/back-off + burnout guardrails), §9 (family = relational **amplifier, never the judge**), and research memo `docs/research/passion-pipeline/03-talent-development-spine.md` §6. This closes PRD open question §13.5 ("mentor-relay handoff design — engineered, low-attrition handoffs at scale"). Design settled via a `/grilling` session (decisions §3).

**What it is**: once the D1 planner (`018`) names, for a certified spike's current stage, **which mentor role** (`WARM → TECHNICAL → DOMAIN_EXPERT → MASTER`) and **which audience level** (`SELF → MENTOR_PEERS → REAL_COMMUNITY → FIELD`) the child should be climbing toward, this engine **brokers the actual connection**: it matches that named need against a **synthetic catalog of real-world opportunities**, ranks candidates, proposes them to the guide, and tracks a **human-gated access-transfer lifecycle** (`matched → proposed → approved → introduced → active → transferred`). "**Access transferred**" is the tracked deliverable. The system proposes; the **guide disposes**.

---

## 1. Why & where it sits
The D1 planner names the relay *role* and audience *level* per stage but explicitly defers the **brokering** to D3/D4. This engine is that broker. It consumes the `SpecializationPlan` (`018`), the `016` wellbeing read, and the `014` readiness/age context; it feeds the D2 workspace (an approved audience becomes a project's real audience) and, later, the EvidenceGraph, where "access transferred" becomes a provenance node emitted **through a passion-side sink adapter, never a direct import** (§4.6). It is **guide-facing only**: connecting a child to real people is the highest-stakes act in the program, so it is gated by a human and never surfaces to the child. Progression is **widening the audience + access, not adding hours** (PRD [D2]).

## 2. Scope Fence *(hard)*

### In scope
- **Domain package** `@gt100k/access-broker` (`passion/packages/access-broker`): the pure `Opportunity` + `Brokerage` model (§4.1); the **`OpportunityCatalog` port** (§4.4) + a deterministic **stub catalog** (the full layered synthetic catalog, §4.5); the pure engine **`brokerAccess(inputs, deps, now)` → `BrokerPlan`** (ranked mentor + audience proposals with every gate applied, §4.2/§4.3); the pure lifecycle transitions `proposeMatch` / `approve` / `advanceHandoff` / `declineMatch` (§4.2); `deriveBrokerInputs` over `018`/`016`/`014`; **no network**.
- **Adapter** `@gt100k/access-broker-live` (`passion/adapters/access-broker-live`): an **opt-in `OpportunityCatalog`** scaffold shaped for a real mentor/competition/publishing API, returning **deterministic fake data now** (like `@gt100k/planner-live` / TimeBack `020`). Never imported by a domain test.
- **App**: a **new 5th "Access" tab** in `apps/guide-console` (alongside Hypotheses / Wellbeing / Plan / Family): per certified spike, the plan's named mentor + audience need, the **ranked proposals** (with fit reasons + any blocked reason), and each **`Brokerage`** with its lifecycle state + **guide actions** (approve [+ guardian-consent], advance, decline) and any "needs your review". Preserves **`window.__qa`/`LOOP_QA`** (extend `state()` additively; keep the existing `primaryAction`). **SYNTHETIC only.**

### Out of scope (gated / owned elsewhere)
- **Real mentor/competition/publishing/marketplace integrations** — the catalog is synthetic; the live adapter is an opt-in scaffold with fake data until real APIs exist.
- **Real guardian-consent / identity / COPPA plumbing (G3)** — consent is a **recorded boolean** on the guide gate here; the real consent + identity + erasure system is the G3 pre-live gate.
- **Real safety/vetting/moderation pipeline (G4)** — `vetting` is a synthetic field; only `"vetted"` opportunities surface. The real vetting + moderation service is the G4 pre-live gate.
- **EvidenceGraph "access transferred" node emission** — the `transferred` state is the deliverable; emitting an E1 provenance node is deferred. When it lands it goes through a **passion-side sink adapter**, because E1 is a separate product with an enforced no-inbound-value-imports boundary (mapping + the required shape in §4.6).
- **Any child-facing surface** — the broker is guide-facing only; no broker output ever reaches the child (no auto-labels; PRD §8.3).
- **Real scheduling/calendar logistics** — v1 tracks the lifecycle + the engineered-handoff attributes (warm intro / overlap / why-now), not live calendar integration.
- **Grading / scoring** — the broker never scores anyone; no score/rank field anywhere.

## 3. Design decisions *(from the grill — do not re-open)*
- **[D1]** **One combined engine**, two `OpportunityKind`s (`mentor` | `audience`) — shared matcher + shared lifecycle; no duplicated D3/D4 engines.
- **[D2]** **Full access-transfer lifecycle** per brokered connection: `matched → proposed → approved → introduced → active → transferred` (+ `declined`, + `held`). Models the relay ladder + the **engineered handoff** (warm intro / overlap / explicit "why now"). **"Access transferred" is the deliverable.**
- **[D3]** **Single guide gate.** The guide (thin professional layer) owns the one human gate; **guardian consent is a required attribute recorded at approval** (a hard blocker — `approve` without `guardianConsent === true` is refused), not a separate guardian-owned state. **The family owns no gate** (amplifier, never the fit/wellbeing judge; PRD §9).
- **[D4]** **Full layered synthetic catalog** — mentor opportunities across every source layer (`AI`, `FAMILY`, `NEAR_PEER`, `THIN_EXPERT`, `MASTER`) + audience opportunities across every channel (`COMPETITION`, `PUBLISHING`, `COMMUNITY`, `MARKETPLACE`); each entry carries domain×mode fit, the role/level it fills, `minStage`, `ageTier`, `vetting`, `reputation`, `availability`.
- **[D5]** **New 5th "Access" cockpit tab** — the lifecycle + catalog is too much to crowd into the Plan panel.
- **[D6]** **Everything:** engine + deterministic stub catalog + opt-in live adapter scaffold (fake data) + the Access tab.
- **[D7]** **Guardrails baked in** (PRD §5/§7/§8/§9): readiness/stage-gated (expert/master only surface at S3–S4 via `minStage`); **wellbeing back-off holds new access** (widening audience/access = raising stakes → hold, never auto-advance); **craft floor** (audience never widens above `SELF` without the plan's `craftScaffold`); vetting + age-tier gates; **system proposes, guide disposes** (engine never advances past `proposed`); no gamification; no child-facing output.
- **[D8]** **Reuses `018` types** (`Stage`, `MentorRole`, `AudienceLevel`, `AgeBand`, `SpecializationPlan`) + the `016` `WellbeingRead`; **deterministic, synthetic, no network**; the stub-catalog + opt-in live-adapter pattern mirrors TimeBack (`020`) / planner-live (`018`).
- **[D9]** **Integration points noted, deferred:** an approved `audience` brokerage can set a D2 project's real audience; a `transferred` brokerage maps to an EvidenceGraph node, wired through a **passion-side sink adapter** (§4.6) and never by importing the graph into this engine.

## 4. Domain model *(decisions made — do not re-open)*

### 4.1 Opportunity + Brokerage
```
// reused from @gt100k/specialization-planner:
Stage         = "S1_IGNITION" | "S2_FOUNDATIONS" | "S3_AUTHORSHIP" | "S4_SIGNATURE"
MentorRole    = "WARM" | "TECHNICAL" | "DOMAIN_EXPERT" | "MASTER"
AudienceLevel = "SELF" | "MENTOR_PEERS" | "REAL_COMMUNITY" | "FIELD"
// reused from @gt100k/two-axis-tagging: WorkMode (build|investigate|compose|perform|debug|explain|persuade|collaborate|care)

OpportunityKind    = "mentor" | "audience"
MentorSourceLayer  = "AI" | "FAMILY" | "NEAR_PEER" | "THIN_EXPERT" | "MASTER"   // §7.3 sourcing layers
AudienceChannel    = "COMPETITION" | "PUBLISHING" | "COMMUNITY" | "MARKETPLACE"
VettingStatus      = "vetted" | "pending" | "rejected"

Opportunity {
  id; kind: OpportunityKind; title;
  domainPath: string;                 // domain × leaf fit (matches the plan's domainPath)
  modes: readonly WorkMode[];         // work-modes it fits
  fillsRole?: MentorRole;             // mentor-only: which relay role it serves
  sourceLayer?: MentorSourceLayer;    // mentor-only: who delivers it
  level?: AudienceLevel;              // audience-only: which audience level it opens
  channel?: AudienceChannel;          // audience-only: the channel
  minStage: Stage;                    // earliest appropriate stage (expert/master ⇒ S3/S4)
  ageTier: AgeBand;                   // age-appropriateness floor
  vetting: VettingStatus;             // only "vetted" is surfaceable
  reputation: number;                 // 0..1 deterministic quality prior
  availability?: { deadline?: string; slots?: number };
}

HandoffState = "matched" | "proposed" | "approved" | "introduced" | "active" | "transferred" | "declined" | "held"
Brokerage {
  id; kidId;
  spikeCell: { domainPath: string; mode: WorkMode };   // the certified spike this serves
  opportunityId; kind: OpportunityKind;
  state: HandoffState;
  guardianConsent?: boolean;          // required true to leave "approved" (recorded at the guide gate)
  approvedBy?: string;                // guide id — the human who owns the gate
  handoff?: { warmIntro: boolean; overlap: boolean; whyNow: string };  // the engineered handoff event
  note?: string;                      // e.g. "held: protecting rest"
  createdAt; updatedAt;
}
```
**No score / rank / streak / points / badge field anywhere on any type.**

### 4.2 The engine + lifecycle (pure)
```
brokerAccess(inputs: BrokerInputs, deps: { catalog: OpportunityCatalog }, now): BrokerPlan
BrokerInputs { plan: SpecializationPlan; wellbeing: WellbeingRead; ageBand: AgeBand; existing: readonly Brokerage[] }
BrokerPlan   { kidId; mentorMatches: readonly Match[]; audienceMatches: readonly Match[];
               brokerages: readonly Brokerage[]; held: boolean; escalateToHuman: boolean; reasons: readonly string[] }
Match        { opportunity: Opportunity; score: number; fit: readonly string[]; blocked?: string }
```
- `brokerAccess` reads the plan's **current-stage named need** (`mentorRole`, `audience`, `stage`, `domainPath`, `craftScaffold`), queries the catalog, ranks candidates (§4.3), applies every gate (§4.3), and returns the ranked proposals + the reconciled `brokerages`. It **never advances a brokerage past `proposed`** (system proposes).
- **Lifecycle transitions** (each pure, human-invoked): `proposeMatch(match, cell, now)` → `Brokerage{state:"proposed"}`; `approve(b, { guardianConsent, guideId }, now)` → `state:"approved"` **only if `guardianConsent === true`** (else throws `CONSENT_REQUIRED`); `advanceHandoff(b, next, now)` for `approved → introduced → active → transferred` (guide-owned, ordered); `declineMatch(b, now)` → `declined`.

### 4.3 Ranking + gates *(baked invariants)*
- **Score** (deterministic): `w·domainFit + w·modeFit + w·roleOrLevelMatch + w·reputation + w·availabilitySoon` (fixed weights; ties broken by `id` for determinism).
- **Hard gates** (excluded from matches, with a reason when guide-relevant):
  - **Vetting** — only `vetting === "vetted"` surfaces.
  - **Age-tier** — `opportunity.ageTier` appropriate for the kid's `ageBand`.
  - **Stage** — `opportunity.minStage ≤ plan.stage` (⇒ no `DOMAIN_EXPERT`/`MASTER` mentor or `FIELD` audience to an S1/S2 kid).
  - **Craft floor** — for an `audience` need where `plan.audience !== "SELF"`, require a non-empty `plan.craftScaffold`; else the **audience need is blocked** with reason `"craft floor: widen the audience only with a skill scaffold"`.
  - **Wellbeing back-off** — if `wellbeing.rest || wellbeing.backOff`, `held = true`: **surface no new proposals**, mark any existing non-terminal brokerage `note:"held: protecting rest"`, and **never auto-advance** (widening access = raising stakes; back off pressure first, PRD §8).
- **Family-as-amplifier** — `FAMILY` mentor opportunities are surfaceable (relational/door-opening), but the approval gate is **always the guide** — a family member never owns the gate (PRD §9).
- **escalateToHuman** — every proposal requires guide action; `escalateToHuman` is true whenever there is a non-empty proposal set or a `held` state needing a human's eyes.

### 4.4 The `OpportunityCatalog` port + stub + live adapter
```
OpportunityCatalog { search(q: { domainPath; mode; kind; stage }): readonly Opportunity[] }  // pure, sync
```
- **Stub** (`stubCatalog`, in-package): the **full layered synthetic catalog** (§4.5) as a synchronous deterministic value — CI + `LOOP_QA` use it; **no network**.
- **Live** (`@gt100k/access-broker-live`): an opt-in adapter shaped for a real mentor/competition/publishing API, returning **deterministic fake data** now (a `ACCESS_LIVE=1` server route can call it later, mirroring `PLANNER_LIVE`). **Never imported by a domain test.**

### 4.5 The seed catalog (synthetic, deterministic)
A handful of `Opportunity`s per pilot cell (e.g. music/audio, chess, code) covering **every mentor source layer** (`AI` coach, `FAMILY` network, `NEAR_PEER` apprentice, `THIN_EXPERT` reviewer, `MASTER`) and **every audience channel** (`COMPETITION` with a deadline, `PUBLISHING` pipeline, `COMMUNITY` showcase, `MARKETPLACE`), with a spread of `minStage`, `ageTier`, `vetting`, and `reputation` so the gates + ranking are all exercised (including a `pending`/`rejected` entry that must be filtered, and an S4-only `MASTER` that an S1 plan must not see).

### 4.6 Integration points *(noted, deferred)*
- **→ D2**: an `audience` brokerage reaching `approved`/`active` can set a `apps/project-studio` project's real `audience` — wired when the two are connected.
- **→ E1**: a `transferred` brokerage maps to an EvidenceGraph node (an "access-transfer" `Outcome`/`Review` with `released_as`/`validates`), deferred until the teammate's EvidenceGraph API settles. **It must not be wired by importing `@gt100k/evidence-graph` into `@gt100k/access-broker`** — E1 is its own product, extracted later as a mechanical copy (`docs/decisions/evidencegraph-v1-design.md` §11/§13a), and the rule is enforced: nothing outside `@gt100k/evidence-*` may import a **value** from inside it (`import type` is fine). `@gt100k/boundaries` checks this under the root `pnpm test`, so a PR that adds the inbound import goes red. When it is built:
  1. `@gt100k/access-broker` **stays graph-free**: it emits **pure data** describing the node + its edges (the shape `@gt100k/project-workspace`'s `toEvidencePlan` emits), and may name graph types by `import type` only.
  2. Materialization (hashing, `addNode`/`addEdge`) happens in a **sink adapter on the passion side**, the same shape as `@gt100k/project-evidence-sink`, the plan-in/graph-out seam described in `022` §4.4. The adapter lives **outside** the `evidence-*` namespace so extraction lifts the graph and leaves the adapter behind.
  3. **Prefer extending the existing seam** (`@gt100k/project-evidence-sink`, generalized to take an access-transfer plan) over standing up a second one. `@gt100k/boundaries` exempts exactly **one** package by design; a second exemption is a deliberate boundary change to agree with the E1 owner and record in the decision doc, not something a feature PR adds to `EXEMPT_PACKAGES` to get green.

## 5. `window.__qa` contract (app)
Extend the guide-console `state()` **additively**: `access: { proposals: number; brokerages: number; held: boolean }`. Keep `ready`, `error`, and the **existing `primaryAction()`** (promote the top hypothesis candidate) unchanged so the current `LOOP_QA` stays green. No score/grade in the state.

## 6. Success Criteria *(each maps to a test)*
- **SC-1** matching: a plan naming `(stage, mentorRole, audienceLevel, domainPath, craftScaffold)` + the stub catalog → ranked `mentorMatches` + `audienceMatches` whose fit matches domain×mode + role/level + stage — golden table.
- **SC-2** lifecycle: `proposeMatch` → `proposed`; `approve` **refuses without `guardianConsent === true`** and succeeds with it → `approved`; `advanceHandoff` walks `introduced → active → transferred` in order; `declineMatch` → `declined`; `brokerAccess` never emits a state past `proposed` — test.
- **SC-3** stage gate: an `Opportunity{minStage:"S4_SIGNATURE"}` never appears for an S1 plan (no MASTER/expert or FIELD audience too early) — test.
- **SC-4** craft floor: `plan.audience !== "SELF"` with empty `craftScaffold` → the audience need is **blocked** with the craft-floor reason; non-empty scaffold → it surfaces — test.
- **SC-5** wellbeing back-off: `wellbeing.rest|backOff` → `held === true`, zero new proposals, existing brokerages noted `"held: protecting rest"`, nothing advanced — test.
- **SC-6** vetting + age-tier gates: `vetting !== "vetted"` and age-inappropriate entries are excluded — test.
- **SC-7** no gamification / guide-only / family-not-judge: no score/rank/streak/points/badge on any type; no child-facing field; `approve` is guide-owned (a `FAMILY` opportunity still gates on the guide) — shape/type test.
- **SC-8** determinism: identical inputs → identical `BrokerPlan` (stable ranking, tie-break by id); the stub catalog uses **no network** — test.
- **SC-9** live adapter: `@gt100k/access-broker-live` returns the `Opportunity` shape (fake data), is opt-in, and is **never imported by a domain test** — hermetic test.
- **SC-10 (app)** the Access tab renders per-spike proposals + each brokerage's lifecycle + guide approve(+consent)/advance/decline; `window.__qa.ready === true`, `error === null`, and the existing `primaryAction()` still works (LOOP_QA unbroken) — app smoke + `LOOP_QA`.
- **SC-11** gate: `pnpm exec tsc -b` + `pnpm test` (domain + adapter, **including the `@gt100k/boundaries` check** — no value import of `@gt100k/evidence-*` from this engine, §4.6) + `apps/guide-console` `next build` + `LOOP_QA` pass.

## 7. Fixtures
In `src/__fixtures__/`: (a) one `SpecializationPlan` per stage (`S1`…`S4`) naming its role/level/domainPath/craftScaffold; (b) the **seed catalog** (§4.5) across all layers/channels with the gate-exercising spread; (c) `WellbeingRead`s (ok, and a `rest`/`backOff`); (d) a craft-floor case (audience > `SELF`, empty scaffold) and a stage-gate case (S1 plan vs an S4 `MASTER` opportunity); (e) a plurality pair (two cells → independent broker plans). Assert `mentorMatches`/`audienceMatches` (score order, fit, `blocked`), `held`, `escalateToHuman`, and every lifecycle transition incl. the consent refusal.

## 8. Phasing (P0…P6)
- **P0** scaffold `@gt100k/access-broker`; types; smoke.
- **P1** the `OpportunityCatalog` port + `stubCatalog` seed (§4.5).
- **P2** `brokerAccess` ranking + all gates (§4.3). Golden table (SC-1/3/4/5/6/8).
- **P3** lifecycle transitions + the consent hard-blocker (SC-2) + guardrail/shape tests (SC-7).
- **P4** adapter `@gt100k/access-broker-live` (opt-in, fake data) + hermetic test (SC-9).
- **P5** `apps/guide-console` **Access tab** — per-spike proposals + lifecycle + guide actions; `deriveBrokerInputs` over the plan (`018`) + wellbeing (`016`); `window.__qa` additive; a11y + reduced-motion. Built to match the cockpit's dark theme + tab pattern.
- **P6** polish (guide microcopy: fit reasons, "why now", held/consent states) + LOOP_QA.

## 9. Loop / build notes
- **Domain + adapter:** headless; gate `tsc -b` + `test`; adapter opt-in + never imported by a domain test (hermetic).
- **App:** extends the existing guide-console cockpit (a 5th tab beside Plan/Family); reuse the tab/panel patterns + tokens; `LOOP_QA` with the **stub catalog** (deterministic, offline); keep `window.__qa` additive + the existing `primaryAction`.
- **Requires `pnpm install`** (not `--frozen`); imports `@gt100k/{specialization-planner, wellbeing, student-profile, two-axis-tagging}` for the reused types.
- Branch from current `main`; new files under `passion/packages/access-broker` + `passion/adapters/access-broker-live` + `apps/guide-console/app` (the Access tab) + root `tsconfig.json` appends.

## 10. Stack + Commands (pinned)
- Domain `passion/packages/access-broker` (`@gt100k/access-broker`), deps `@gt100k/specialization-planner` (`Stage`/`MentorRole`/`AudienceLevel`/`AgeBand`/`SpecializationPlan`) + `@gt100k/wellbeing` (`WellbeingRead`) + `@gt100k/two-axis-tagging` (`WorkMode`). Adapter `passion/adapters/access-broker-live` (`@gt100k/access-broker-live`), dep `@gt100k/access-broker`. App: extend `apps/guide-console` (new Access tab), dep `@gt100k/access-broker` + the reused engines.
- Gate: `pnpm exec tsc -b` + `pnpm test`; app `next build` + `LOOP_QA`. TS strict; SYNTHETIC only; no network in the gate.
```
