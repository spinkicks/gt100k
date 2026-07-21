# Feature Specification: Interest Lab / Passion (Rules-Engine MVP)

**Feature Branch**: `003-interest-lab`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "A pure, framework-agnostic domain package for the GT100K Interest Lab (PRD §14.4/§14.5/§14.10). A deterministic **rules-engine** offer service generates a balanced Lab of safe, prerequisite-valid probes with a permanent exploration floor and an explicit coverage matrix; an event model distinguishes **voluntary** unprompted return from **prompted** return; a versioned, mutable `InterestHypothesis` record with a lifecycle state machine records evidence, competing explanations, coverage gaps, and uncertainty — never a scalar passion score. Hard guardrails forbid any hypothesis/probe result from entering admissions, discipline, family-fidelity scoring, public ranking, or commercial targeting; models are shadow-only and a human guide authors the operative record. Synthetic learners only; consent/admissions machinery stubbed. The learned Bayesian hypothesis model and the contextual bandit are shadow/deferred and out of this MVP."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate a balanced Interest Lab from the rules engine (Priority: P1)

A guide (or the platform, on a child's behalf) starts an Interest Lab for a synthetic learner. A **deterministic rules engine** selects, from a synthetic probe catalog, a balanced block of 18–24 probes spanning eight to twelve weeks. Every probe the child is offered is safe and prerequisite-valid, and the child always has at least two eligible offers to choose among. The Lab keeps a permanent **exploration floor** (dormant/untested domains always retain a path into the offer set) and emits a **coverage matrix** that states, explicitly, which of the required dimensions are met and which are still gaps. Each offer records *why it appeared* and *what proposed it* (guide, rule, or shadow model).

**Why this priority**: This is the atomic, load-bearing unit of the Interest Lab — without a rules engine that can produce a complete, balanced, safe, prerequisite-valid Lab and honestly report its own coverage gaps, none of the downstream evidence machinery (events, hypothesis, guardrails) has anything to attach to. It is the smallest independently demonstrable slice and it directly satisfies the constitutional/acceptance requirement that "with the adaptive policy disabled, the rules engine must still generate a complete, balanced Lab" (§14.4.3 #5).

**Independent Test**: For a synthetic learner and a synthetic probe catalog, generate a Lab with the shadow/bandit selection disabled, and confirm: (a) 18–24 probes; (b) coverage across ≥6 domains, ≥6 work modes, solo **and** collaborative, two difficulty bands, and audience **and** no-audience; (c) every offered probe is prerequisite-valid and safety-cleared; (d) at least two eligible offers at each choice point; (e) a coverage-matrix report that enumerates any dimension not met instead of collapsing it into a single confidence number; (f) each offer carries a provenance tag (`GUIDE | RULE | SHADOW_MODEL`).

**Acceptance Scenarios**:

1. **Given** a catalog that can satisfy every coverage dimension, **When** the rules engine generates a Lab with adaptive selection disabled, **Then** the Lab has 18–24 probes and the coverage matrix reports every required dimension as **met** with zero gaps.
2. **Given** a catalog that lacks, say, any collaborative or any audience-condition probe, **When** the Lab is generated, **Then** the coverage matrix explicitly lists each unmet dimension as a named gap and the result is **not** summarized as a scalar confidence/score.
3. **Given** a probe whose prerequisites the learner has not met or whose safety class is not cleared, **When** offers are assembled, **Then** that probe is excluded from the eligible set and never surfaced to the child.
4. **Given** any choice point in the Lab, **When** the child is presented offers, **Then** at least two safe, prerequisite-valid offers are available and each offer states why it appears and which of guide/rule/shadow-model proposed it.
5. **Given** a completed Lab, **When** the exploration floor is inspected, **Then** at least the configured floor of offers remains allocated to untested/dormant domains (exploration is never fully crowded out by exploitation).

---

### User Story 2 - Distinguish voluntary (discretionary) from prompted engagement (Priority: P2)

The Lab records engagement as typed **events**. It captures the signal families that matter for passion — delayed **voluntary** return at 7 and 30 days, unrequired revision, chosen challenge, recovery after criticism or failure, and self-authored scope — and it separates them from **prompted** engagement (a return triggered by a reminder, deadline, parent nudge, rivalry event, or reward), which carries its intervention context and is **never** counted as a voluntary-return passion signal. Accessibility help, safety intervention, translation, motor support, and communication support are marked so they can **never** be read as low persistence or reduce any signal.

**Why this priority**: "Return after external drivers fade" is the central passion signal in the PRD, and its integrity depends entirely on never confusing prompted re-engagement with voluntary re-engagement. This story turns raw engagement into the separated, honestly-labeled signal families the hypothesis layer (US3) is allowed to consume; without it, the hypothesis would be built on contaminated evidence.

**Independent Test**: Feed a synthetic learner's engagement stream containing both a reminder-driven return and an unprompted return at day 7 and day 30, plus an assistive-input session and a safety rescue. Confirm: (a) the prompted return and the voluntary return produce **distinct event types** and **distinct computed signal features**; (b) the prompted return contributes **zero** to the voluntary-return family; (c) the assistive/safety events never reduce a persistence or interest signal; (d) the summary reports each signal family as a **separate** value (never a single fused score).

**Acceptance Scenarios**:

1. **Given** a return caused by a reminder/deadline/nudge/rivalry/reward, **When** it is recorded, **Then** it is stored as a `PROMPTED_RETURN` carrying its intervention context and it does **not** increment the voluntary-return family.
2. **Given** an unprompted re-engagement 7 days (and again 30 days) after external drivers faded, **When** it is recorded, **Then** it registers as delayed voluntary return in the voluntary-return family with the correct 7-day / 30-day horizon.
3. **Given** an assistive-input session, a translation, a motor-support session, or a safety rescue, **When** signals are computed, **Then** none of these lowers persistence, mastery, or interest for that learner.
4. **Given** a completed engagement stream, **When** the signal summary is produced, **Then** voluntary return, scope authorship, competence growth, novelty decay, failure recovery, prompt dependence, and context effects are reported as **separate** values.

---

### User Story 3 - Maintain the versioned InterestHypothesis and its lifecycle (Priority: P3)

The Lab records a mutable, **versioned** `InterestHypothesis` — an append-only evidence record, not a scalar passion score. Each revision carries candidate domain(s), a work-mode profile, lifecycle `state`, separated signal summary, competing explanations, coverage gaps, uncertainty (interval or evidence grade, never false precision), the smallest next distinguishing probe, the child's position, guide review, and model/policy/valid/record versions. The lifecycle state machine moves a hypothesis through `EXPLORING → EMERGING → CANDIDATE_SPINE → ACTIVE`, with `CONTESTED`, `PARKED`, and `REOPENED` branches. Promotion to `CANDIDATE_SPINE` requires evidence from **at least three signal families**, including **at least one delayed discretionary** signal and **at least one artifact/competence** signal. The service **cannot infer low interest from missing data**, and any model/rule-**proposed** state change is a proposal only — a **human guide authors the operative revision**.

**Why this priority**: This is where evidence becomes a durable, contestable record the rest of the program plans against. It depends on the offer service (US1) for provenance and on the event model (US2) for clean signal families, so it comes third — but it carries the sharpest correctness rules (the promotion gate, the missing-data prohibition, and shadow-only authorship).

**Independent Test**: Drive a synthetic learner's hypothesis through revisions and confirm: (a) a learner who only clicks easy probes with no revision/return never reaches `CANDIDATE_SPINE`; (b) a low-skill learner who requests instruction, recovers after failure, and authors harder goals **is** eligible for `CANDIDATE_SPINE`; (c) a period of no data (missingness) never lowers the state or confidence; (d) a rule/model-proposed transition stays non-operative until a guide-authored revision commits it; (e) each revision is retrievable by version with its model/policy versions intact.

**Acceptance Scenarios**:

1. **Given** a hypothesis with fewer than three signal families, or lacking a delayed-discretionary signal, or lacking an artifact/competence signal, **When** promotion to `CANDIDATE_SPINE` is attempted, **Then** it is refused and the missing prerequisite is named.
2. **Given** a hypothesis with ≥3 signal families including ≥1 delayed-discretionary and ≥1 artifact/competence signal, **When** a guide authors the revision, **Then** the hypothesis may move to `CANDIDATE_SPINE`.
3. **Given** an inactivity/missing-data window (no events), **When** the hypothesis is re-evaluated, **Then** its state and uncertainty are not worsened on the basis of absence alone; low interest is not inferred until access/health/schedule/equipment/consent causes are ruled out by a human.
4. **Given** a rule- or shadow-model-proposed state change, **When** it is applied, **Then** it is recorded as a **proposal** in shadow logs and does not become the operative revision until a guide authors it.
5. **Given** an interest shift after specialization, **When** disconfirming evidence arrives, **Then** the prior hypothesis can move to `CONTESTED` or `PARKED` and later `REOPENED`, with all prior revisions preserved and replayable.
6. **Given** any hypothesis revision, **When** it is displayed, **Then** uncertainty is shown as an interval or evidence grade and the strongest disconfirming evidence is presented next to the strongest supporting evidence — never as "you are an X person."

---

### User Story 4 - Enforce hard guardrails and child agency (Priority: P4)

The domain enforces the non-negotiable boundaries around interest evidence. No `InterestHypothesis` or probe result may enter admissions, discipline, family-fidelity scoring, public ranking, or commercial targeting. A child may dispute an event, attach context, or withdraw an optional reflection from future modeling **without losing program access**, and a withdrawn reflection disappears from the next signal build and from replay. Accessibility/safety help never counts against a child. Local artifact adapters may emit only **coarse semantic transitions** — never screen recordings, raw keystrokes, or unrelated file contents.

**Why this priority**: These are `G`-class rights invariants from the constitution and PASS-006/008/010. They are cross-cutting and must hold across every other story, so they are specified as a first-class, independently testable guard layer rather than left implicit. They rank last only because they wrap the other three stories; they are **not** optional.

**Independent Test**: Attempt to consume a hypothesis/probe result for each forbidden purpose and confirm each is denied at the type/guard boundary; withdraw an optional reflection and confirm it is absent from the next signal computation and from replay; feed an artifact-adapter event containing raw content and confirm the port rejects anything beyond coarse semantic transitions.

**Acceptance Scenarios**:

1. **Given** a request to read an `InterestHypothesis` or probe result for admissions, discipline, family-fidelity scoring, public ranking, or commercial targeting, **When** the read is attempted, **Then** it is denied by a purpose guard (deny-by-default) and the denial is auditable.
2. **Given** a child who disputes an event or withdraws an optional reflection, **When** the withdrawal is recorded, **Then** program access is unchanged and the withdrawn reflection is excluded from the next signal build and from any subsequent replay.
3. **Given** an artifact-adapter payload that includes a screen recording, raw keystrokes, or unrelated file contents, **When** it is ingested, **Then** it is rejected; only coarse semantic transitions are accepted.
4. **Given** a team artifact, **When** it is used as evidence, **Then** it cannot become individual evidence without a solo explanation, extension, or traceable contribution.

---

### Probe taxonomy (domains × work modes)

The Lab's coverage is two-dimensional: **domains** (broad, catalog-driven themes — *what* the work is about) crossed with **work modes** (activity verbs — *how* the child engages). Topic-only recommendation misses a child who prefers a work mode (diagnosing, composing, building, persuading, caring) across topics, so both axes are first-class and coverage is checked on **both** (PRD §14.4.1). The MVP taxonomy is:

- **Work modes** (9, a fixed vocabulary of process verbs — *not* identity labels): `build`, `investigate`, `compose`, `explain`, `perform`, `debug`, `collaborate`, `care`, `persuade`. Coverage requires ≥6 present.
- **Domains** (catalog-supplied, ≥8 in the seed catalog so ≥6 is achievable): `making`, `living_systems`, `symbols_math`, `word_craft`, `sound_music`, `movement_body`, `visual_design`, `social_world`. The domain package hardcodes **no** fixed domain list — these live in the injected catalog fixture; the engine only reads the count/spread it is given.
- **Cross-cutting conditions** (each probe carries one value of each): `difficulty ∈ {foundational, stretch}`, `social ∈ {solo, group}`, `audience ∈ {audience, no_audience}`.

A balanced Lab must span ≥6 domains **and** ≥6 work modes **and** both values of each cross-cutting condition (PASS-002). The exact seed catalog and the exact balanced Lab it yields are pinned in *Seed Fixtures* and *Golden Values* below.

### Edge Cases

Drawn from PRD §14.4.3 (acceptance) and §14.10 (failure & recovery). Each row names its required response and the SC/test that proves it:

- **Novelty spike** (§14.4.3 #1): a burst of easy clicks with no revision/return keeps the hypothesis `EMERGING`; the engine schedules a delayed-return check and a novelty-matched probe. It must **not** confirm a hypothesis. → SC-003.
- **High skill, low voluntary return** (§14.10): competence is recorded **without** inferring passion; offer a harder or different work mode while preserving exploration. → SC-011.
- **Low skill, repeated self-authored return** (§14.4.3 #2, §14.10): the learner remains eligible for a high-drive hypothesis; weak first artifacts do **not** route the child away. → SC-004.
- **Prompted vs discretionary** (§14.4.3 #4): reminder-driven and discretionary work yield distinct events and distinct features. → SC-005.
- **Adaptive policy disabled** (§14.4.3 #5): the rules engine still produces a complete, balanced Lab. → SC-001.
- **Withdrawn reflection** (§14.4.3 #6): disappears from the next feature build and from replay under retention policy. → SC-006.
- **Assistive input / safety rescue** (§14.4.3 #7, §14.10 disability/communication difference): same interest interpretation as an equivalent unaided learner. → SC-007.
- **Coverage gap present** (§14.4.3 #3): the completed record states each gap; it cannot hide a gap behind a confidence score. → SC-002.
- **Missing data / inactivity** (§14.5, §14.10 illness/grief/disruption): suspend inference; do not infer low interest from absence. → SC-010.
- **Team success, unclear contribution** (§14.10): request a solo extension/explanation before updating individual evidence. → SC-012.
- **Two strong interests** (§14.10): support co-primary candidates or a shared work-mode theme; do not force a premature winner. → SC-013.
- **Model and child disagree** (§14.10; constitution POL-008): the child's account is preserved beside the model evidence; neither is averaged away. → SC-014.
- **Parent projection** (§14.10): parent-supplied `familyContext` is stored as a *distinct source* and never merged into a child signal; the child keeps balanced probes. → SC-015.
- **Mentor mismatch / cohort ridicule** (§14.10): these are downstream (persistence/rivalry) responses; in this package they surface only as **context effects** on the signal summary and a `→CONTESTED`/`→PARKED` transition option, never as a lowered domain signal. → SC-014 (context preserved).
- **Equipment or bandwidth gap** (§14.10): missing work under an equipment gap is treated as **access data / missingness**, never as low interest (same rule as missing data). → SC-010.
- **Child refuses all probes** (§14.10): the engine still returns an eligible offer set (≥2 offers) and records the refusal as an event; it never escalates rewards/pressure (no pressure mechanics exist in this package) and never infers low interest. → SC-003/SC-010.
- **Interest shift after specialization** (§14.10): disconfirming evidence can move a hypothesis `→CONTESTED` or `→PARKED` and later `→REOPENED`, with all prior revisions preserved and replayable. → SC-016.

## Scope Fence *(loop-ready)*

The loop builds the **whole** spec. Anything not fenced-in is scope creep or a question, so the boundary is explicit.

### In scope (build this)

- A **pure, deterministic rules-engine** `buildLab` that assembles a balanced 18–24 probe Lab from an injected catalog, with per-offer provenance + reason, a permanent exploration floor, and `≥2` eligible offers at every choice point (US1; PASS-001/002/003; IL-002/003/004).
- A **coverage matrix** that reports each dimension (domains, work modes, social, difficulty, audience, probe-count) as met or as a named gap, with **no scalar score** (US1; IL-005).
- A typed **event model** separating voluntary/discretionary return from prompted return, with assistive/safety tagging, and `summarizeSignals` producing **separated signal families** (US2; PASS-004/005/006).
- A **versioned, append-only `InterestHypothesis`** with a bitemporal current view, a **lifecycle state machine**, the **`CANDIDATE_SPINE` promotion gate**, the **missing-data prohibition**, and **shadow-proposal vs. guide-authored** revisions (US3; IL-006/007/008/009/011/012).
- A **guard layer**: purpose guard (deny-by-default), team-artifact rule, PASS-007 artifact-port shape, PASS-008 withdrawal (US4; IL-010/013; PASS-007/008/010).
- **In-memory / stub adapters** for every port (repository, catalog, assent, artifact-signal, offer-log, clock) and **in-repo seed fixtures** (probe catalogs + event streams).
- A **Vitest** suite: unit + contract + a §14.4.3 acceptance suite + **golden-value tests** (exact seeded Lab, coverage matrix, signal summary, state transitions) + a **seeded smoke test**.

### Out of scope (do NOT build here; interfaces stay forward-compatible)

- The **contextual bandit** offer selector and its propensity/burden logging (PASS-009) — deferred; only the forward-compatible `OfferDecisionLog` (eligible set, policy version, coverage constraints) ships now (IL-016).
- The **learned Bayesian `InterestHypothesis` model** — deferred; only the shadow-proposal recording path ships now (IL-016).
- Any **UI / Student Compass** rendering of provenance or the day view (this feature supplies the pure domain data only; a later app feature renders it, mirroring 001's `apps/student-compass`).
- The **Specialization Planner** (§14.7) that authors an `ACTIVE` adoption — this package models the *state and the transition guardrails* only; the `CANDIDATE_SPINE → ACTIVE` adoption is authored by that separate feature.
- Real **persistence infra** (Postgres/bitemporal store, crypto-shred), the **14-day persistence protocol** (§14.8), **MotivationDose / rivalry** mechanics (§14.8/§15), and real **device / artifact** integration.

### Non-goals (deliberately never in this package)

- **No scalar passion/drive score** anywhere in the model — ever (IL-006).
- **No automated consequential decision**: no code path lets a model/rule *decide* a state; a guide authors the operative revision (IL-011; constitution I).
- **No export** of any hypothesis/probe result into admissions, discipline, family-fidelity scoring, public ranking, or commercial targeting (IL-013; PASS-010).
- **No fixed identity/career taxonomy**: domains are catalog-driven; work modes are process verbs (constitution: no fixed labels).
- **No wall-clock / I/O in the domain**: all time and I/O are injected (IL-014).
- **No real child data**: synthetic learners only; consent/admissions stubbed (IL-015; constitution V).

## Phasing (P0…P7) *(loop-ready — ordered build path)*

The agent always has an obvious "next task." Each phase maps to a task block in [tasks.md](./tasks.md) and gates on `pnpm typecheck` + `pnpm test`.

- **P0 — Setup**: scaffold `packages/interest-lab` + four `adapters/interest-*` packages (mirror `packages/learning-loop`). Gate: workspace resolves, empty test run green. *(tasks T001–T003)*
- **P1 — Foundational types & ports**: enums/vocabularies, `Probe`/`ProbeFamily`, event/signal/hypothesis types, all ports. Gate: types compile. *(T004–T007)*
- **P2 — Seed fixtures**: the in-repo probe catalogs (`CATALOG_GOLDEN_V1`, `CATALOG_GAPPY_V1`, `CATALOG_FAMILY_V1`) and the event-stream fixtures (`EVENTS_GOLDEN_V1`), exactly as pinned in *Seed Fixtures*. Gate: catalog adapter test loads them. *(T008–T009)*
- **P3 — US1 rules-engine Lab + coverage** (🎯 MVP): `buildLab`, `buildCoverageMatrix`, eligibility filter, exploration floor. Gate: golden Lab + golden coverage tests pass. *(T010–T017)*
- **P4 — US2 events & signals**: `recordEvent`, `summarizeSignals`, voluntary-vs-prompted, accessibility-safe, withdrawal. Gate: golden signal-summary test passes. *(T018–T022)*
- **P5 — US3 hypothesis & state machine**: append-only versioned record, `evaluateCandidateGate`, `applyMissingData`, `proposeTransition`/`authorRevision`, legal transitions. Gate: golden state-transition tests pass. *(T023–T031)*
- **P6 — US4 guardrails**: `guardRead`, `promoteTeamArtifact`, `acceptArtifactSignal`, withdrawal-from-replay; the §14.4.3 acceptance suite. Gate: guard + acceptance tests pass. *(T032–T034)*
- **P7 — Polish & smoke + reconcile**: README, seeded smoke/demo script, then the **final flagged** root `tsconfig.json` references edit; full `pnpm typecheck && pnpm test && pnpm lint`. *(T035–T038)*

## Requirements *(mandatory)*

### Functional Requirements — from PRD §14.4.2 (canonical, PASS-00x)

These are the PRD's functional requirements; contract tests map to these IDs plus the §14.4.3 acceptance criteria. Items marked **[MVP]** are in scope for this slice; **[DEFERRED]** items are specified for interface-compatibility only and are not implemented here.

- **PASS-001 [MVP]**: The offer service MUST expose, per offered probe, *why it appears* and *what proposed it* (`GUIDE | RULE | SHADOW_MODEL`). (Student Compass rendering is out of scope; the domain supplies the data.)
- **PASS-002 [MVP]**: The Lab MUST offer 18–24 probes over an 8–12 week horizon, with coverage across ≥6 domains, ≥6 work modes, solo and collaborative work, two difficulty bands, and audience and no-audience conditions.
- **PASS-003 [MVP]**: The child MUST be able to choose among at least two safe, prerequisite-valid offers. A guide-assigned diagnostic probe MUST record a purpose and the child's response.
- **PASS-004 [MVP]**: The event model MUST capture delayed voluntary return at 7 and 30 days, unrequired revision, chosen challenge, recovery after criticism/failure, self-authored scope, and prompt dependence.
- **PASS-005 [MVP]**: The system MUST separate required participation from discretionary behavior; a return caused by a reminder, deadline, parent nudge, rivalry event, or reward MUST carry that intervention context and MUST NOT count as voluntary return.
- **PASS-006 [MVP]**: Accessibility help, safety intervention, translation, motor support, and communication support MUST NEVER count as low persistence or reduce a mastery or interest signal.
- **PASS-007 [MVP, port-level]**: Local artifact adapters MAY emit only coarse semantic transitions; they MUST NOT transmit screen recordings, raw keystrokes, or unrelated file contents. (Enforced at the artifact-signal port; real device integration deferred.)
- **PASS-008 [MVP]**: A child MUST be able to dispute an event, attach context, or withdraw an optional reflection from future modeling without losing access to the program.
- **PASS-009 [DEFERRED]**: The shadow bandit MUST log offer propensity, eligible set, policy version, burden cost, and coverage constraints. *MVP provides a forward-compatible `OfferDecisionLog` that records eligible set, policy version, and coverage constraints for the rules engine; propensity/burden logging lands with the bandit.*
- **PASS-010 [MVP]**: No `InterestHypothesis` or probe result MAY enter admissions, discipline, family-fidelity scoring, public ranking, or commercial targeting.

### Additional Functional Requirements — Interest Lab domain (IL-xxx)

- **IL-001 [MVP]**: A `Probe` MUST carry: domain, work mode, prerequisites, target difficulty band, autonomy level, solo/group mode, audience condition, equipment, accessibility variants, expected burden, safety class, and artifact-evidence descriptor. Domains are **catalog-driven**, not a hardcoded identity taxonomy (constitution invariant: no fixed labels).
- **IL-002 [MVP]**: A `ProbeFamily` MUST provide equivalent variants so repeated exposure does not become answer recall; offer assembly MUST draw at most one variant per family per choice point.
- **IL-003 [MVP]**: The offer service MUST be a **pure, deterministic rules engine** (given the same catalog, learner eligibility, config, and seed, it returns the same Lab). The contextual bandit is **shadow/deferred**; the rules engine alone produces the operative Lab.
- **IL-004 [MVP]**: The Lab MUST keep a permanent **exploration floor** — a configurable minimum of offers reserved for untested/dormant domains — and MUST give a dormant interest a path back into the offer set.
- **IL-005 [MVP]**: The coverage matrix MUST report each required dimension as met or as a **named gap**; it MUST NOT represent coverage as, or hide a gap behind, a scalar confidence/score.
- **IL-006 [MVP]**: The `InterestHypothesis` MUST be a **versioned, append-only** evidence record with a bitemporal (`valid_time`, `record_time`) current view, and MUST NOT contain a scalar passion/drive score.
- **IL-007 [MVP]**: The lifecycle states MUST be exactly `EXPLORING`, `EMERGING`, `CANDIDATE_SPINE`, `ACTIVE`, `CONTESTED`, `PARKED`, `REOPENED`, with legal transitions enumerated in the plan's state-machine contract.
- **IL-008 [MVP]**: Promotion to `CANDIDATE_SPINE` MUST require ≥3 distinct signal families, including ≥1 delayed-discretionary signal (voluntary return @7 or @30) **and** ≥1 artifact/competence signal.
- **IL-009 [MVP]**: The service MUST NOT infer low interest from missing data; a missingness input MUST NOT lower state or confidence, and low interest MUST require human rule-out of access, health, schedule, equipment, and consent causes.
- **IL-010 [MVP]**: A team artifact MUST NOT become individual evidence without a solo explanation, extension, or traceable contribution.
- **IL-011 [MVP]**: Any model/rule-**proposed** state change MUST be recorded as a proposal (shadow); only a **guide-authored** revision (carrying `guide_review`) becomes operative.
- **IL-012 [MVP]**: The hypothesis MUST store `competing_explanations`, `coverage_gaps`, and `uncertainty` (interval or evidence grade) on every revision, and MUST place the strongest disconfirming evidence beside the strongest supporting evidence.
- **IL-013 [MVP]**: Every read of an `InterestHypothesis` or probe result MUST pass a **purpose guard** (deny-by-default) that forbids admissions, discipline, family-fidelity scoring, public ranking, and commercial targeting (encodes PASS-010).
- **IL-014 [MVP]**: The domain MUST be pure and framework-agnostic (no I/O, no wall-clock reads); persistence, the probe catalog, the assent/consent record, the artifact-signal source, and the clock MUST be injected via ports with in-memory/stub adapters.
- **IL-015 [MVP]**: The whole feature MUST be exercisable with **synthetic learners only**; no real consent/admissions/legal workflow is required to run it (those are stubbed).
- **IL-016 [DEFERRED]**: The learned Bayesian hypothesis model and the contextual bandit are shadow-only and out of this MVP; interfaces (`OfferDecisionLog`, shadow-proposal recording) MUST remain forward-compatible with them.
- **IL-017 [MVP]**: Coverage MUST be checked on **both** axes — domains (≥6 distinct) **and** work modes (≥6 distinct of the 9-verb vocabulary) — plus both values of each cross-cutting condition (`social`, `difficulty`, `audience`). The 9 work-mode verbs are fixed in the domain package as process descriptors; the domain list is **catalog-supplied** (IL-001).
- **IL-018 [MVP]**: `buildLab` MUST be **selection under surplus**: given a catalog with more eligible probes than the target count, the engine MUST select a coverage-satisfying subset by a deterministic, documented order (coverage-greedy over a fixed total order derived from `seed`), never "take all" and never a random draw. Same `(catalog, eligibility, config, seed)` ⇒ byte-identical Lab (IL-003; SC-001).
- **IL-019 [MVP]**: The exploration floor MUST be measured as the count of offers whose domain is **not** in the learner's `engagedDomains` set, and MUST be `≥ config.explorationFloor` whenever the catalog can supply that many dormant-domain probes; when it cannot, the shortfall MUST appear as a named coverage gap, not be silently dropped (IL-004; SC-002).
- **IL-020 [MVP]**: `promptDependence` and `contextEffects` MUST be computed and stored as **discount/context** values, and MUST be excluded from `familiesPresent` (they can never satisfy the `CANDIDATE_SPINE` gate). The six gate-counting families are exactly: `voluntary_return`, `unrequired_revision`, `chosen_challenge`, `failure_recovery`, `self_authored_scope`, `artifact_competence` (IL-008; SC-005).
- **IL-021 [DEFERRED, forward-compat]**: When the bandit lands, `buildLab` MUST accept an optional `selector` port whose absence (the MVP default) yields the rules-engine Lab unchanged; the bandit MUST NOT be able to violate coverage, burden, exploration-floor, safety, or prerequisite constraints (the rules engine remains the guardrail). No bandit code ships in this slice (IL-016; PASS-009).

### Key Entities *(include if feature involves data)*

- **Probe / ProbeFamily**: a safety-classed, prerequisite-tagged unit of the Lab (IL-001/IL-002); a family groups equivalent variants.
- **ProbeCatalog (stub source)**: the synthetic set of probe families the rules engine draws from (injected port).
- **Offer / Lab**: an eligible, prerequisite-valid probe presented to the child with provenance; a Lab is the assembled 18–24 probe block with its coverage matrix and exploration floor.
- **CoverageMatrix**: the explicit met/gap report across the required dimensions (IL-005).
- **EngagementEvent**: a typed event (`VOLUNTARY_RETURN`, `PROMPTED_RETURN`, `UNREQUIRED_REVISION`, `CHOSEN_CHALLENGE`, `FAILURE_RECOVERY`, `SELF_AUTHORED_SCOPE`, `ASSISTIVE`, `SAFETY_RESCUE`, …) with intervention context and reliability.
- **SignalSummary**: the separated signal-family values (voluntary return, scope authorship, competence growth, novelty decay, failure recovery, prompt dependence, context effects).
- **InterestHypothesis (+ HypothesisRevision)**: the versioned, append-only evidence record and its lifecycle state (Key Entities row, PRD §28).
- **GuideReview**: the accountable guide, decision, rationale, review date that makes a proposed revision operative.
- **AssentRecord (stub)**: pseudonymous consent/assent + withdrawal linkage (synthetic; no real consent machinery).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** (§14.4.3 #5, PASS-002, IL-003): With adaptive/shadow selection disabled, the rules engine produces a complete, balanced Lab (18–24 probes; all six coverage dimensions met when the catalog allows) in **100%** of runs over synthetic learners/seeds.
- **SC-002** (§14.4.3 #3, IL-005): For **every** completed Lab, coverage is reported as an explicit met/gap matrix; in **0%** of cases is a gap represented as or hidden behind a scalar confidence/score.
- **SC-003** (§14.4.3 #1, IL-008): A synthetic learner who only clicks easy probes without revision or return reaches `CANDIDATE_SPINE` in **0%** of runs.
- **SC-004** (§14.4.3 #2): A synthetic learner who starts low-skill, requests instruction, recovers after failure, and authors harder goals remains eligible for `CANDIDATE_SPINE` / a high-drive hypothesis in **100%** of runs.
- **SC-005** (§14.4.3 #4, PASS-004/005): Reminder-driven and discretionary engagement always produce distinct event types and distinct computed features; prompted return contributes to the voluntary-return family in **0%** of cases.
- **SC-006** (§14.4.3 #6, PASS-008): A withdrawn optional reflection is absent from the next signal build and from replay in **100%** of cases.
- **SC-007** (§14.4.3 #7, PASS-006): A learner using assistive input or receiving a safety rescue receives the same interest interpretation as an equivalent unaided learner in **100%** of paired runs.
- **SC-008** (PASS-010, IL-013): No code path exports an `InterestHypothesis` or probe result into admissions, discipline, family-fidelity scoring, public ranking, or commercial targeting; the purpose guard denies all such reads (test-asserted, deny-by-default).
- **SC-009** (IL-011, constitution: humans author the operative record): No rule/model-proposed state change becomes the operative revision without a guide-authored revision, in **100%** of transitions.
- **SC-010** (IL-009): A missing-data / inactivity input never lowers a hypothesis's state or confidence in **any** run.
- **SC-011** (§14.10 high-skill/low-return): A high-competence, low-voluntary-return learner records competence growth **without** `familiesPresent` gaining a delayed-discretionary signal, so the gate is **not** satisfied on competence alone; `evaluateCandidateGate` returns `eligible: false, missing: ["no delayed-discretionary signal"]` in **100%** of such runs.
- **SC-012** (§14.10 team artifact, IL-010): `promoteTeamArtifact` returns individual credit in **0%** of calls lacking a solo explanation/extension/contribution, and returns credit in **100%** of calls that supply one.
- **SC-013** (§14.10 two strong interests): A hypothesis MAY hold ≥2 `candidateDomains` (co-primary) or a shared work-mode theme; the model never forces a single winner and never errors on multi-candidate revisions (asserted over a two-interest fixture).
- **SC-014** (§14.10 disagreement, POL-008): When `childPosition = DISAGREE` and model evidence is present, both are retained on the revision (child account beside model evidence); neither is dropped or averaged, in **100%** of revisions.
- **SC-015** (§14.10 parent projection): Parent-supplied `familyContext` is stored as a distinct source and contributes to **0** signal families and **0** signal magnitudes.
- **SC-016** (§14.10 interest shift): A hypothesis can traverse `→ CONTESTED → PARKED → REOPENED` with every prior revision replayable by version and no revision overwritten, in **100%** of runs.

### SC → test mapping (each SC is a concrete test)

| SC | Assertion (golden where applicable) | Test file / case |
|---|---|---|
| SC-001 | shadow OFF ⇒ 18–24 offers, all 6 dims met on `CATALOG_GOLDEN_V1`; byte-identical across seeds; golden Lab exact | `offer.test.ts` › `buildLab golden` |
| SC-002 | coverage = explicit met/gap; no scalar; `CATALOG_GAPPY_V1` names each gap | `coverage.test.ts` › `golden + gappy` |
| SC-003 | easy-clicks-only ⇒ never `CANDIDATE_SPINE`; gate lists missing prereqs | `state-machine.test.ts` › `novelty gate` |
| SC-004 | low-skill-recover-author ⇒ `eligible:true` | `state-machine.test.ts` › `high-drive gate` |
| SC-005 | prompted ⇒ distinct type; adds 0 to `voluntaryReturn`; golden `SignalSummary` exact | `events.test.ts` + `signals.test.ts` › `golden` |
| SC-006 | withdrawn optional reflection absent from next summary + replay | `signals.test.ts` + `acceptance.test.ts` |
| SC-007 | paired assistive/unaided ⇒ identical `SignalSummary` | `signals.test.ts` › `accessibility-safe` |
| SC-008 | `guardRead(purpose)` denies all five forbidden purposes | `guards.test.ts` › `purpose guard` |
| SC-009 | `proposeTransition` non-operative; `authorRevision` operative | `state-machine.test.ts` › `proposal vs authorship` |
| SC-010 | `applyMissingData` leaves state + uncertainty unchanged | `state-machine.test.ts` › `missing data` |
| SC-011 | competence-only ⇒ gate `missing:["no delayed-discretionary signal"]` | `state-machine.test.ts` › `high-skill low-return` |
| SC-012 | `promoteTeamArtifact` refuses w/o solo proof, accepts with | `guards.test.ts` › `team artifact` |
| SC-013 | ≥2 `candidateDomains` revision valid | `hypothesis.test.ts` › `co-primary` |
| SC-014 | `DISAGREE` + model evidence both retained | `hypothesis.test.ts` › `disagreement preserved` |
| SC-015 | `familyContext` contributes 0 to families/magnitudes | `signals.test.ts` › `parent projection` |
| SC-016 | `CONTESTED→PARKED→REOPENED` all revisions replayable | `state-machine.test.ts` + `repo.test.ts` |

## Assumptions

- **Synthetic-only, governance stubbed** (Constitution V): no real learners, consent, admissions, or legal machinery is implemented; `AssentRecord`/consent are stub ports. Admissions/discipline/etc. exist only as *forbidden purposes* the guard denies.
- **Rules engine only for the MVP; bandit + Bayesian model deferred** (IL-003/IL-016, PASS-009 deferred): the operative Lab and the operative hypothesis are produced by deterministic rules + guide authorship. Learned components are shadow-only and out of scope, but the `OfferDecisionLog` and shadow-proposal interfaces are shaped to accept them later.
- **No UI in this feature**: Student Compass rendering of PASS-001 provenance and the day view is out of scope; this feature supplies the pure domain data. (A later app feature can render it, mirroring 001's `apps/student-compass`.)
- **Domains are catalog-driven** (constitution: no fixed labels): the probe catalog supplies broad domain/theme identifiers; the domain package hardcodes no fixed passion/identity taxonomy. Work modes are a defined vocabulary of *activity verbs* (build, investigate, compose, explain, perform, debug, collaborate, care, persuade, …), which are process descriptors, not identity labels.
- **Difficulty bands = 2** (foundational / stretch) and **audience conditions = 2** (audience / no-audience) for coverage purposes, per PASS-002.
- **Determinism via injected seed + clock**: "8–12 weeks" and "7/30-day return" are computed against an injected clock/day-offset; the core reads no wall clock (IL-014), keeping tests replayable.
- **Signal families for the promotion gate** are: voluntary-return (delayed discretionary), unrequired-revision, chosen-challenge, failure-recovery, self-authored-scope, artifact/competence. `prompt_dependence` is a **context/discount** signal, not a passion family.
- **Parallel-safety**: all new code lives only under `packages/interest-lab/` and `adapters/interest-*`. `pnpm-workspace.yaml` (`packages/*`, `adapters/*`), `vitest.config.ts` (`packages/**`, `adapters/**`), and the root Biome `lint` script already discover these paths, so **no shared root file needs editing** except the root `tsconfig.json` project **references** for `tsc -b`, which is the final task, flagged for human reconcile.

## Open Questions

- **OQ-1**: Exact GT vs standard tuning for the exploration floor size and the probe-count target within 18–24 (defaults assumed; treated as config, not fixed by this spec).
- **OQ-2**: The precise numeric thresholds that separate `EMERGING` from earlier `EXPLORING` (e.g., how many voluntary returns before `EMERGING`). The `CANDIDATE_SPINE` gate is fixed by §14.5; the earlier thresholds are `[E3]` defaults and are config-driven here.
- **OQ-3**: Whether `ACTIVE` (adopted specialization) belongs in this package or in a future Specialization Planner feature (§14.7). Assumed: this package models the *state and transition guardrails*; the planner that authors an adoption is a separate feature.
- **OQ-4**: Retention/crypto-shred mechanics for withdrawn reflections (§14.4.3 #6) are modeled here as "excluded from next build + replay"; the storage-layer shred is an adapter/infra concern deferred to persistence.

---

## Decisions Already Made *(loop-ready — do not re-open)*

These are settled. The loop must implement them as written and MUST NOT reconsider or ask about them.

1. **Rules engine only for the MVP.** The operative Lab and the operative hypothesis are produced by a deterministic rules engine + guide authorship. The contextual bandit and the learned Bayesian model are **shadow/deferred** — no learned code ships (IL-003/IL-016; PASS-009 deferred).
2. **Catalog-driven taxonomy.** Domains come from the injected catalog fixture; the package hardcodes **no** domain list. The 9 work-mode verbs (`build, investigate, compose, explain, perform, debug, collaborate, care, persuade`) are the fixed process vocabulary. No fixed identity/career labels anywhere (constitution: no fixed labels).
3. **State-machine shape is fixed.** States: `EXPLORING, EMERGING, CANDIDATE_SPINE, ACTIVE, CONTESTED, PARKED, REOPENED`. Legal transitions: `EXPLORING→EMERGING`; `EMERGING→CANDIDATE_SPINE` (gated); `CANDIDATE_SPINE→ACTIVE` (out-of-package adoption); any state `→CONTESTED`; any state `→PARKED` (child may request at any time); `PARKED→REOPENED`; `REOPENED→EXPLORING|EMERGING`; `CONTESTED→EMERGING|PARKED`. Any other transition is rejected.
4. **`CANDIDATE_SPINE` gate is fixed by §14.5** (not tunable): `≥3` distinct signal families **AND** `≥1` delayed-discretionary (`voluntary_return` @7 or @30) **AND** `≥1` `artifact_competence`. The six gate families are exactly those in IL-020.
5. **Uncertainty is `interval | grade`, never a scalar passion score** (IL-006/IL-012). Grade vocabulary: `thin | moderate | strong` (evidence grade), or a `{lo, hi}` interval in `[0,1]` used only for internal probability of a *competing explanation*, never surfaced as "how much passion."
6. **`InterestHypothesis` is append-only + bitemporal.** New facts append a revision; corrections attach, never overwrite (constitution POL-006). `currentFor` returns the highest-version operative revision.
7. **Shadow proposal vs. guide authorship.** `proposeTransition` yields `guideReview:null` (non-operative shadow); only `authorRevision` (carrying a `GuideReview`) commits an operative state change (IL-011).
8. **Determinism model.** `seed` is an **integer**; the same `(catalog, eligibility, config, seed)` yields a byte-identical Lab. Time is an injected `Clock.dayOffset(): number`; the core reads no wall clock (IL-014).
9. **Stack.** TypeScript (strict, per `tsconfig.base.json`), pnpm workspaces, Vitest, Biome, `tsc -b`. Pure domain package + ports + in-memory/stub adapters. Same layout as `packages/learning-loop`.
10. **Parallel-safety.** All new code lives only under `packages/interest-lab/` and `adapters/interest-*`. The **only** shared-root edit is the root `tsconfig.json` `references` array — the final, human-flagged task.

## Defaults for the Unspecified *(loop-ready — verbatim rule)*

> **For anything this spec doesn't specify, choose the simplest correct option, record it in `.loop/decisions.md`, and continue.**

Applied here: unless a value is pinned in *Golden Values* or *Config defaults* below, prefer the smallest, purest, most deterministic implementation that keeps every `G`-class invariant (constitution I–IX) intact, log the choice, and proceed without blocking.

**Config defaults** (all overridable via `LabConfig`; pinned so the gate is green from iteration 1):

| Key | Default | Notes |
|---|---|---|
| `probeCountTarget` | `20` | within `[18, 24]` (PASS-002) |
| `probeCountRange` | `{ min: 18, max: 24 }` | |
| `horizonWeeks` | `{ min: 8, max: 12 }` | computed vs injected clock |
| `minDomains` | `6` | coverage floor |
| `minWorkModes` | `6` | coverage floor |
| `explorationFloor` | `4` | dormant-domain offers reserved (IL-019) |
| `seed` | `42` | integer; determinism |
| `cohort` | `"standard"` | `"gt"` only raises targets (config, no code fork) |

## Seed Fixtures *(loop-ready — in-repo, no external fetch)*

These fixtures live in `adapters/interest-probe-catalog/src/` (catalogs) and `packages/interest-lab/test/fixtures/` (event streams) and are the inputs the golden tests assert against. **They are normative** — implement the engine so these exact inputs produce the *Golden Values* below.

### `CATALOG_GOLDEN_V1` (24 families → 20 eligible)

Fields per probe: `ord | id | familyId | domain | workMode | difficulty | social | audience | safetyClass | prerequisites`. All 20 eligible rows are `safetyClass: cleared` with `prerequisites: []`. Rows 21–24 are the **filtered-out** controls.

| ord | id | domain | workMode | difficulty | social | audience |
|---:|---|---|---|---|---|---|
| 0 | p01 | making | build | foundational | solo | no_audience |
| 1 | p02 | making | debug | stretch | solo | no_audience |
| 2 | p03 | making | compose | foundational | group | audience |
| 3 | p04 | living_systems | investigate | foundational | solo | no_audience |
| 4 | p05 | living_systems | care | foundational | solo | no_audience |
| 5 | p06 | living_systems | explain | stretch | group | audience |
| 6 | p07 | symbols_math | investigate | foundational | solo | no_audience |
| 7 | p08 | symbols_math | build | stretch | solo | no_audience |
| 8 | p09 | symbols_math | debug | stretch | solo | no_audience |
| 9 | p10 | word_craft | compose | foundational | solo | no_audience |
| 10 | p11 | word_craft | explain | foundational | group | audience |
| 11 | p12 | word_craft | persuade | stretch | solo | audience |
| 12 | p13 | sound_music | perform | stretch | solo | audience |
| 13 | p14 | sound_music | build | foundational | group | no_audience |
| 14 | p15 | movement_body | perform | foundational | group | audience |
| 15 | p16 | movement_body | collaborate | stretch | solo | no_audience |
| 16 | p17 | visual_design | investigate | foundational | solo | no_audience |
| 17 | p18 | visual_design | persuade | stretch | solo | audience |
| 18 | p19 | social_world | collaborate | foundational | group | no_audience |
| 19 | p20 | social_world | care | foundational | group | audience |

**Filtered-out controls** (present in the catalog, MUST NOT appear in the Lab):
- p21 `making/build` — `safetyClass: review_required` (not `cleared`) → excluded (PASS-003).
- p22 `symbols_math/investigate` — `safetyClass: blocked` → excluded.
- p23 `sound_music/perform` — `prerequisites: ["prereq_x"]` with learner **not** holding `prereq_x` → excluded (PASS-003).
- p24 `word_craft/compose` — `prerequisites: ["prereq_y"]` learner lacks → excluded.

Learner eligibility for the golden case: `metPrereqs: []`, `engagedDomains: []` (fresh learner ⇒ all domains dormant).

### `CATALOG_GAPPY_V1` (8 eligible families, deliberately incomplete)

All `cleared`, all `prerequisites: []`, all `foundational`, all `solo`, all `no_audience`:

| id | domain | workMode |
|---|---|---|
| g1 | making | build |
| g2 | making | investigate |
| g3 | living_systems | compose |
| g4 | living_systems | explain |
| g5 | symbols_math | build |
| g6 | word_craft | compose |
| g7 | sound_music | care |
| g8 | sound_music | build |

Domains present: 5. Work modes present: 5 (`build, investigate, compose, explain, care`). Missing: `group`, `stretch`, `audience`, a 6th domain, a 6th work mode, and probe count (8 < 18).

### `CATALOG_FAMILY_V1` (variant-recall test, IL-002)

One family `fam_A` with 3 equivalent variants `fam_A_v1/v2/v3` (same domain `making`, same workMode `build`, differing only by a cosmetic prompt string). Used to assert **≤1 variant per family per choice point**.

### `EVENTS_GOLDEN_V1` (10 events, one synthetic learner)

`ord | id | type | occurredAtDayOffset | interventionContext | assistive | optionalReflection`:

| id | type | dayOffset | interventionContext | assistive |
|---|---|---:|---|---|
| e1 | VOLUNTARY_RETURN | 7 | — | false |
| e2 | VOLUNTARY_RETURN | 30 | — | false |
| e3 | PROMPTED_RETURN | 7 | `{source:"reminder"}` | false |
| e4 | UNREQUIRED_REVISION | 9 | — | false |
| e5 | CHOSEN_CHALLENGE | 12 | — | false |
| e6 | FAILURE_RECOVERY | 14 | — | false |
| e7 | SELF_AUTHORED_SCOPE | 20 | — | false |
| e8 | ASSISTIVE | 21 | — | true |
| e9 | SAFETY_RESCUE | 22 | — | false |
| e10 | ARTIFACT_COMPETENCE | 25 | — | false |

`e7` is also `optionalReflection: true` (used by the withdrawal test: withdrawing `e7` drops `scopeAuthorship` to 0 and removes `self_authored_scope` from `familiesPresent`).

## Golden Values + Tolerances *(loop-ready — exact expected outputs)*

Deterministic domain ⇒ **exact equality** unless a tolerance is stated. There are no floating-point outputs in the MVP paths, so the tolerance is **±0 (exact)** everywhere except the optional competing-explanation interval, which is **±0.0005 (rounding)**. These become the acceptance tests verbatim.

**Ordering convention (so arrays are exactly reproducible):** `workModes.have` and `familiesPresent` are listed in the **fixed vocabulary order** (`build, investigate, compose, explain, perform, debug, collaborate, care, persuade` for work modes; the six-family order `voluntary_return, unrequired_revision, chosen_challenge, failure_recovery, self_authored_scope, artifact_competence` for families). `domains.have` is listed in **catalog order** (order of first appearance in the injected catalog). The top-level `gaps` array is in **dimension order** (`probeCount, domains, workModes, social, difficulty, audience`).

### G1 — `buildLab(CATALOG_GOLDEN_V1, freshLearner, defaultConfig, seed=42)`

- `offers.length === 20` (all 20 eligible; p21–p24 filtered).
- **Per-domain counts** (exact): `making:3, living_systems:3, symbols_math:3, word_craft:3, sound_music:2, movement_body:2, visual_design:2, social_world:2` (8 domains).
- **Per-work-mode counts** (exact): `build:3, investigate:3, compose:2, explain:2, perform:2, debug:2, collaborate:2, care:2, persuade:2` (9 modes).
- **Cross-cutting counts** (exact): `social {solo:13, group:7}`; `difficulty {foundational:12, stretch:8}`; `audience {audience:8, no_audience:12}`.
- `explorationReserved === 20` (fresh learner ⇒ all domains dormant; `≥ explorationFloor(4)` ✓).
- Every offer has `provenance === "RULE"` (rules-engine MVP) and a non-empty `reason`.
- At least 2 eligible offers exist at every choice point (20 offers ≥ 2 ✓).
- Determinism: rebuilding with `seed ∈ {1, 42, 999}` yields the **same 20 probe ids** (coverage-complete catalog with target = eligible count ⇒ selection is the full eligible set regardless of seed order).

### G2 — `buildCoverageMatrix(G1.offers, defaultConfig)` (complete)

```json
{
  "probeCount": { "met": true, "count": 20, "need": 18 },
  "domains":    { "met": true, "count": 8, "need": 6, "have": ["making","living_systems","symbols_math","word_craft","sound_music","movement_body","visual_design","social_world"], "gaps": [] },
  "workModes":  { "met": true, "count": 9, "need": 6, "have": ["build","investigate","compose","explain","perform","debug","collaborate","care","persuade"], "gaps": [] },
  "social":     { "met": true, "solo": true, "group": true, "gaps": [] },
  "difficulty": { "met": true, "foundational": true, "stretch": true, "gaps": [] },
  "audience":   { "met": true, "audience": true, "no_audience": true, "gaps": [] },
  "complete": true,
  "gaps": []
}
```

There is **no** `score`/`confidence` field anywhere in this object (IL-005).

### G3 — `buildCoverageMatrix(buildLab(CATALOG_GAPPY_V1,…).offers, defaultConfig)` (gappy)

```json
{
  "probeCount": { "met": false, "count": 8, "need": 18 },
  "domains":    { "met": false, "count": 5, "need": 6, "have": ["making","living_systems","symbols_math","word_craft","sound_music"], "gaps": ["only 5 of ≥6 required domains"] },
  "workModes":  { "met": false, "count": 5, "need": 6, "have": ["build","investigate","compose","explain","care"], "gaps": ["only 5 of ≥6 required work modes"] },
  "social":     { "met": false, "solo": true, "group": false, "gaps": ["no collaborative (group) probe"] },
  "difficulty": { "met": false, "foundational": true, "stretch": false, "gaps": ["no stretch-band probe"] },
  "audience":   { "met": false, "audience": false, "no_audience": true, "gaps": ["no audience-condition probe"] },
  "complete": false,
  "gaps": [
    "probe count 8 below minimum 18",
    "only 5 of ≥6 required domains",
    "only 5 of ≥6 required work modes",
    "no collaborative (group) probe",
    "no stretch-band probe",
    "no audience-condition probe"
  ]
}
```

### G4 — `summarizeSignals(EVENTS_GOLDEN_V1)`

```json
{
  "voluntaryReturn": { "day7": 1, "day30": 1 },
  "unrequiredRevision": 1,
  "chosenChallenge": 1,
  "failureRecovery": 1,
  "scopeAuthorship": 1,
  "competenceGrowth": 1,
  "noveltyDecay": 0,
  "promptDependence": 1,
  "contextEffects": ["reminder"],
  "familiesPresent": ["voluntary_return","unrequired_revision","chosen_challenge","failure_recovery","self_authored_scope","artifact_competence"]
}
```

Invariants proven by G4:
- `e3` (PROMPTED_RETURN) adds **0** to `voluntaryReturn` and **+1** to `promptDependence`; `prompt_dependence` is **absent** from `familiesPresent` (IL-020, SC-005).
- `e8` (ASSISTIVE) and `e9` (SAFETY_RESCUE) change **no** signal magnitude and appear in **no** family (PASS-006, SC-007).
- **Paired run**: re-tagging `e4`/`e6` as `assistive:true` yields the **identical** `SignalSummary` object (SC-007).
- **Withdrawal run**: with `e7` withdrawn, `scopeAuthorship === 0` and `familiesPresent` drops `self_authored_scope` (→ 5 families) (SC-006).

### G5 — `evaluateCandidateGate(summary)` (exact outcomes)

| Input summary (`familiesPresent`) | `eligible` | `missing` |
|---|---|---|
| G4 summary (6 families incl. voluntary + artifact) | `true` | `[]` |
| Novelty (`[]`, easy clicks only) | `false` | `["<3 signal families (have 0, need 3)","no delayed-discretionary signal","no artifact/competence signal"]` |
| Competence-only (`["artifact_competence","chosen_challenge","unrequired_revision"]`) | `false` | `["no delayed-discretionary signal"]` |
| No-artifact (`["voluntary_return","chosen_challenge","unrequired_revision"]`) | `false` | `["no artifact/competence signal"]` |
| Minimal pass (`["voluntary_return","artifact_competence","chosen_challenge"]`) | `true` | `[]` |

### G6 — State transitions (exact)

- `applyMissingData({state:"EMERGING", uncertainty:{kind:"grade", grade:"moderate"}})` ⇒ new revision with `state:"EMERGING"`, `uncertainty:{kind:"grade", grade:"moderate"}` (**unchanged**), `version += 1` (a recorded no-op, never a downgrade) (IL-009, SC-010).
- `proposeTransition(current, summary, "RULE", versions)` ⇒ revision with `guideReview: null`, `proposedBy: "RULE"`, `operative: false` (goes to shadow log) (IL-011, SC-009).
- `authorRevision(current, proposed, guideReview)` ⇒ revision with the given `guideReview`, `operative: true`, `version += 1` (IL-011, SC-009).
- Illegal transition e.g. `EXPLORING → ACTIVE` ⇒ rejected (throws / `Result.err`), naming the illegal pair.

## Stack + Commands (pinned) *(loop-ready)*

Package manager **pnpm** (`pnpm@9.15.9`, auto-detected via `pnpm-lock.yaml`). Node.js LTS. All commands run from the repo root and are the ones the loop gate uses:

```bash
pnpm install                                   # bootstrap workspace (once)
pnpm --filter @gt100k/interest-lab test        # domain unit + contract + golden tests
pnpm test                                       # Vitest across the whole workspace (gate)
pnpm typecheck                                  # tsc -b (gate; needs root tsconfig refs — final flagged task T037)
pnpm lint                                       # biome check packages adapters apps
```

**Loop gate = `pnpm typecheck` + `pnpm test`** (both green). `pnpm lint` and `pnpm build` are advisory for this package (no app/UI here).

### Seeded smoke test (green from iteration 1)

`packages/interest-lab/test/smoke.test.ts` — the first test the loop writes; it keeps the gate green before any feature code and doubles as the determinism guard:

```ts
import { describe, it, expect } from "vitest";

describe("interest-lab smoke", () => {
  it("workspace + vitest wired", () => {
    expect(1 + 1).toBe(2);
  });
  // Upgraded in P3 to assert G1: buildLab(CATALOG_GOLDEN_V1, freshLearner, {seed:42}) has 20 offers,
  // is byte-identical across seeds {1,42,999}, and its coverage matrix deep-equals G2.
});
```

## Env / Secrets *(loop-ready)*

- **No env vars and no secrets are required.** The domain is pure and synthetic-only; there is no network, no database, no API key, no `.env` read anywhere in this feature (IL-014/IL-015).
- No `.env.local` is needed for `build`/`test`/`typecheck` to pass; the gate never fails on missing env.
- If a future adapter (e.g. a real Postgres repository) needs configuration, it belongs to that later feature, not here; add a git-ignored `.env.local` with placeholders **then**, not now.

## Pre-Marked Decision Points *(loop-ready — defaults with severity)*

Where a real product judgment is unavoidable, the preferred answer is the **default**; the loop proceeds on it and logs it. `severity: critical` is reserved for genuinely SC-invalidating or irreversible choices (escalate immediately under `LOOP_ESCALATE_MIN_SEVERITY=critical`); `normal`/`low` are recorded to `.loop/deferred-decisions.jsonl` for morning review.

| # | Decision | Default (proceed on this) | Severity |
|---|---|---|---|
| D1 | `probeCountTarget` within 18–24 | `20` | low |
| D2 | `explorationFloor` size | `4` | low |
| D3 | `EXPLORING→EMERGING` threshold (how many voluntary returns) | `≥1` voluntary return **or** `≥2` distinct families present | normal |
| D4 | Uncertainty representation | evidence **grade** (`thin/moderate/strong`) by default; interval only for a competing-explanation probability | normal |
| D5 | Coverage-gap phrasing (exact gap strings) | use the exact strings in G3 (tests assert them) | normal |
| D6 | Selection order when catalog surplus > target | coverage-greedy over `stableSort(familyId)` then seeded rotation; documented in `offer.ts` | normal |
| D7 | Whether `ACTIVE` adoption lives here | **No** — model the state + guardrails only; adoption is the Specialization Planner (§14.7) | normal |
| D8 | Withdrawn-reflection retention | model as "excluded from next build + replay"; storage crypto-shred deferred to persistence adapter | normal |
| D9 | **Never emit a scalar passion/drive score** (any collapse of coverage/signals into one number) | **forbidden — do not do it** | **critical** |
| D10 | **Never let a rule/model-proposed transition become operative without `authorRevision`** | **forbidden — guide authors the operative record** | **critical** |
| D11 | **Never export a hypothesis/probe result to a forbidden purpose** (admissions/discipline/family-fidelity/public-ranking/commercial) | **forbidden — `guardRead` denies by default** | **critical** |
