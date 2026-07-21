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

---
---

# Part II — Interest Lab UI Surfaces (Child Probe-Picker + Guide Hypothesis Console)

**Status**: Loop-ready (UI expansion) · **Created**: 2026-07-20 · builds **on top of** the done Part I pure domain (`@gt100k/interest-lab`).

**Input (Part II)**: "A BEAUTIFUL, game-y, impressive, fully-animated UI on top of the existing pure Interest-Lab domain — a **child probe-picker** (playful, quest-like) plus a **guide hypothesis console** — rendered from the domain outputs, with full art direction + a golden motion table, reduced-motion as a first-class equal mode, WCAG 2.2 AA, age-band staging, and no dark patterns. Synthetic learners only; the pure domain stays the unit-tested core."

## §U0 · How to read Part II (for the build loop)

Part I (above) is the **pure domain** and is *done* — Part II renders it; it never re-computes a learning rule and never re-opens a Part-I decision. This Part II is the single loop source-of-truth for the UI. It is large on purpose; read **only the section for the current phase** each turn (JIT), then the referenced golden values.

- Build path is **§U9 Phasing (P8…P13)** — always work the lowest unfinished phase.
- Every phase gate is **`pnpm typecheck` (`tsc -b`) + `pnpm test` (Vitest)** green for the pure **view package** `@gt100k/interest-lab-view`; the app phases add **`pnpm --filter @gt100k/interest-lab-app build`** (`next build`) + the **§U11 seeded smoke** + the **[quickstart](./quickstart.md) acceptance walkthrough**.
- Machine-checkable acceptance lives in **§U10 Success Criteria** (each mapped to a named test) and **§U8 Golden values**.
- Choices already settled are in **§U2 Decisions already made** — do not re-open them.
- Anything not specified: follow **§U3 Defaults for the unspecified** (log it, continue).
- Companion docs kept consistent with this file: [plan.md](./plan.md) *(Part II)*, [tasks.md](./tasks.md) *(P8…P13)*, [data-model.md](./data-model.md), [contracts/interest-lab-ui.md](./contracts/interest-lab-ui.md), [research.md](./research.md), [quickstart.md](./quickstart.md), [checklists/ui.md](./checklists/ui.md). **Where they disagree, this file wins.**

## §U1 · Scope fence (in / out / non-goals)

### In scope

1. A **pure, deterministic presentation package `@gt100k/interest-lab-view` (`packages/interest-lab-view`)** that turns the Part-I domain outputs (`Lab`, `CoverageMatrix`, `SignalSummary`, `InterestHypothesis`/`HypothesisRevision`, `evaluateCandidateGate`) into **render-ready view models** for both surfaces, plus the exact constant registries (`PALETTE`, `TYPOGRAPHY`, `MOTION`, `EASINGS`, `HUE_RAMP`, `WORK_MODE_GLYPHS`) and their resolvers (`resolveMotion`, `resolveDomainHue`, `resolveChildStaging`). Depends only on `@gt100k/interest-lab` (`workspace:*`). No I/O, no wall-clock, **no `Math.random`**.
2. A **new Next.js App-Router app `@gt100k/interest-lab-app` (`apps/interest-lab`)** rendering **two animated DOM/SVG surfaces** with React + a motion library (framer-motion): the **child Curiosity Quest Board** (probe-picker) and the **guide Hypothesis Console**.
3. A **first-class, equal reduced-motion / plain rendering** of the identical view models, and **DOM-native WCAG 2.2 AA** (keyboard/switch/screen-reader operable by construction — no opaque canvas).
4. **Age-band staging** on the child surface (6-8 / 9-11 / 12-14) per §14.13, resolved from `resolveChildStaging`.
5. A **seed adapter wiring** in the app that feeds the Part-I fixtures (`CATALOG_GOLDEN_V1`, `EVENTS_GOLDEN_V1`) through the domain and view package so the app renders **with no external fetch**.

### Out of scope (explicit)

- Any change to **Part I** (`packages/interest-lab`, `adapters/interest-*`) beyond consuming its public API. The domain rules, the coverage matrix, the signal families, the hypothesis lifecycle, and the guardrails are **injected as inputs**, not recomputed.
- The **learned Bayesian model** and the **contextual bandit** (still shadow/deferred in Part I). The console renders shadow **proposals as suggestions only**; it never makes them operative.
- The **Specialization Planner** (`CANDIDATE_SPINE → ACTIVE` adoption, §14.7) — the console *visualizes* the lifecycle state and the transition guardrails; it does not author an adoption.
- Real persistence, real consent/admissions/legal machinery, real device/artifact capture, sound-asset pipeline (cues are muted-by-default captions only), and cross-cohort standings (this is the exploration/scouting surface, not the Arena §15.3 social surface).

### Non-goals (will not build, by principle)

- **No** scalar passion/drive score, **no** confidence number that hides a coverage gap, and **no** verdict/label ("you are an X person") in **any** view model or on **any** surface (IL-005/IL-006; §14.5).
- **No** dark patterns on the child surface: no countdown/urgency timers, manufactured scarcity, FOMO/guilt framing, loss-framed streaks, decaying/absence meters, or engagement-timed notifications (§14.12).
- **No** admissions/discipline/family-fidelity/public-ranking/commercial framing: the view types are **structurally** free of `rank`/`percentile`/`score`/`price`/`verdict` fields (PASS-010, IL-013).
- **No** motion-only affordance and **no** degraded accessibility fallback — reduced-motion and the full DOM are **equal** modes.
- **No** game engine / Canvas / WebGL (see §U2 D-U1): the surfaces are card/grid/timeline/state-diagram based and are **DOM-native** for accessibility-by-construction.
- **No** fixed identity/career taxonomy and **no** hardcoded domain list in the view package — domain hue is derived from **catalog order**, not a domain→hue table (constitution: no fixed labels; IL-001).

## §U2 · Decisions already made (do not re-open)

### D-U1 — Rendering: **React + framer-motion + SVG/DOM (no game engine) — SETTLED**

The two surfaces are a **card/quest board**, a **coverage grid**, a **return timeline**, a **lifecycle state diagram**, and **evidence prose** — all inherently DOM/SVG. Building them in the DOM (not Canvas/Phaser) makes them **accessible by construction** (no `aria-hidden` canvas + parallel structure needed), lets us apply the Apple/Emil DOM-motion craft (springs, `@starting-style`, `clip-path`, `backdrop-filter`, origin-aware transforms), and keeps `next build` lean. **Motion library: `framer-motion@^11`** (a.k.a. Motion). Canvas/Phaser is rejected for these surfaces (recorded in [research.md](./research.md)). Reduced motion remains a first-class **equal** mode; WCAG 2.2 AA is a hard requirement (UI-FR-012/013).

### D-U2 — Architecture: pure view package + separate Next.js app (mirror feature 001 / 004)

`packages/interest-lab-view` is **pure** (no I/O, no wall-clock, **no `Math.random`**), framework-agnostic, and holds every render-shaping rule as a unit-testable function. `apps/interest-lab` is the only place React/framer-motion/DOM live. The **Part-I domain package stays the untouched, unit-tested core**; the view package builds *on top of it*, so both layers are Vitest-covered (the app is verified by `next build` + walkthrough). Parallel-safe (new dirs only).

### D-U3 — One state → many renderings (parity by construction)

The view package composes a single **`InterestLabView`** (`buildInterestLabView(...)`). The child probe-picker, the guide console, the reduced-motion/plain rendering, and every age-band rendering **all render from that same view**. Reduced-motion/plain/age-band **do not recompute** the domain state — they render the identical view with motion stripped and presentation swapped. `plainViewEquals` is a pure, testable guarantee (UI-FR-019, SC-UI-10).

### D-U4 — Guardrails are structural

View types carry **no** `score`/`confidence`/`passionScore`/`verdict`/`label`/`rank`/`percentile`/`price` field (grep-tested, SC-UI-11). Coverage **gaps are visible fields**, never collapsed to a number. Competing explanations are a **paired supporting+disconfirming** structure (never averaged). Prompted engagement and support (accessibility/safety) markers carry an explicit `lowersSignal: false`. Shadow proposals carry `operative: false` and the console has **no path** to make them operative — the guide authors the record (IL-011).

### D-U5 — Art direction: **"The Curiosity Atelier" — dusk workshop, not cream, not golden-hour**

Deliberately **not** the 2026 SaaS-cream/sand default (impeccable) and deliberately **distinct** from feature 004's golden-hour teal-navy sea. The identity is a **deep plum-indigo dusk workshop-atrium** where curiosities glow warm; the guide console is a calm **violet-tinted observatory desk / field notebook**. Full palette + type in **§U8.2/§U8.3** (golden). Fonts served by **system fallback stacks** (no external fetch); self-hosted `woff2` is an optional non-breaking upgrade (D-U8).

### D-U6 — Data model, motion vocabulary, stack

- **View data model** is fixed in [data-model.md](./data-model.md).
- **Motion vocabulary** (Apple fluid-motion + Emil design-engineering) is fixed in **§U6** and **§U8.4**: eased `enter` (strong ease-out) on entrances, `move` (ease-in-out) for on-screen moves, `pop` (gentle overshoot ≤1.05, **never `scale(0)`**) for reveals, press feedback `scale 0.97` on pointer-down, one momentum **spring** reserved for the "pick" gesture, and a full reduced-motion equivalent for every row.
- **Stack** pinned in **§U11**. Loop gate = `pnpm typecheck` + `pnpm test`; app phases add `next build` + smoke + walkthrough.

## §U3 · Defaults for the unspecified

> **For anything Part II doesn't specify, choose the simplest correct option, record it in `.loop/decisions.md`, and continue.**

Escalate (append one line to `.loop/requests.jsonl`, then proceed on your recommendation) **only** for a genuine product/design choice with hard-to-reverse consequences you cannot defensibly default — e.g. a golden value you believe is wrong. Never escalate naming, formatting, copy wording, or anything this doc answers. The rendering approach (D-U1), the view-package architecture (D-U2), and the art direction (D-U5) are **settled** and MUST NOT be re-opened.

## §U4 · User Scenarios & Testing *(mandatory)*

Prioritized, independently testable slices. **UI-US1 alone is a viable MVP**: the child Curiosity Quest Board rendering the domain Lab with satisfying pick motion, age-band staging, and a reduced-motion equal mode.

### UI-US1 — Pick a curiosity quest on a playful, animated board (P9) 🎯 MVP

A synthetic learner opens the **Curiosity Quest Board**: the domain `Lab` (18–24 balanced probes) rendered as a warm, dusk-lit spread of **quest cards / curiosity islands**, clustered by domain constellation. Each card shows its **domain hue**, a **work-mode glyph** (build / investigate / compose / …), difficulty/social/audience cues (icon + text, never color-only), and **why it appears** (provenance: guide / rule / shadow-model). The child always has **≥2 eligible offers** at each choice point. Picking a quest plays a satisfying **momentum spring** into a "my quests" tray; press feedback is instant. `prefers-reduced-motion` conveys the identical state calmly.

**Why this priority**: it is the atomic child-facing surface — the playful rendering of the balanced Lab. Everything else (the delight, the console) hangs off "the board renders the domain Lab with parity, staging, and reduced-motion" (UI-FR-002).

**Independent Test**: feed `buildLab(CATALOG_GOLDEN_V1, freshLearner, {seed:42})` (Part-I **G1**) into `buildProbePickerView`; assert 20 quest cards, each `provenance:"RULE"` + non-empty `whyCopy`, `domainHue` = `HUE_RAMP[catalog-domain-index]`, `workModeGlyph` per **§U8.6**, `returnState:"new"`, ≥2 eligible at each choice point; render the board (DOM) and confirm each card state is conveyed color-independently, with a reduced-motion rendering that loses no state.

**Acceptance Scenarios**:

1. **Given** the golden Lab, **When** the board renders, **Then** every offer appears as a quest card with its domain hue, work-mode glyph, difficulty/social/audience cue (icon+text), and a `whyCopy`/provenance — and no card exposes a price/score/rank/label.
2. **Given** any choice point, **When** the child views offers, **Then** ≥2 eligible offers are present and pickable by pointer **and** keyboard, with visible focus.
3. **Given** a pick, **When** the child selects a quest, **Then** it animates into the tray with a momentum spring (interruptible), press feedback fired on pointer-down; under reduced motion it moves via a ≤150ms crossfade with no spring.
4. **Given** `prefers-reduced-motion`, **When** the board renders, **Then** entrances become instant/short crossfades, no `scale(0)`, and every quest/state remains fully conveyed.

### UI-US2 — "Come back later" delight for voluntary return (P10)

When the child **voluntarily returns** to a quest they already explored (the domain's delayed voluntary-return signal at 7 / 30 days — the central passion signal), the quest renders a warm **welcome-back** state: a gentle `spark` bloom + concrete copy ("You came back to this one"). This is the **one delight reserved for voluntary return** — it celebrates the signal that survives the removal of pressure, **without** telling the child a fixed label and **without** any guilt/FOMO/urgency. Prompted returns get **no** such delight and visibly recede.

**Why this priority**: voluntary return is the load-bearing passion signal (PASS-004/005). Making it *felt* — and making prompted return deliberately un-celebrated — encodes the whole thesis at the child surface without dark patterns.

**Independent Test**: with a history marking a probe as voluntary-return @7 (and @30), `buildProbePickerView` yields that card's `returnState:"voluntary-return"` with a `welcomeBack` motion token and concrete (label-free) copy; a prompted-return probe yields `returnState:"prompted-return"` with a recessed tone and **no** delight; reduced-motion yields a static warm ring + text.

**Acceptance Scenarios**:

1. **Given** a voluntary return @7/@30, **When** the card renders, **Then** it shows a warm welcome-back state with concrete copy and **no** fixed label / no "you are an X".
2. **Given** a prompted return (reminder/deadline/nudge), **When** the card renders, **Then** it recedes (`prompted` tone), carries its intervention context on inspect, and shows **no** celebration.
3. **Given** the board, **When** inspected for dark patterns, **Then** there is no countdown, streak-break threat, scarcity, FOMO, or engagement-timed nudge anywhere.

### UI-US3 — Guide console: the animated coverage matrix, gaps never hidden (P11)

The guide opens the **Hypothesis Console** and sees the **coverage matrix**: domains (rows, catalog order, each with its hue) × the 9 work-modes (columns, each with its glyph). Each cell shows a **coverage status** (voluntary-explored / prompted-explored / offered / not-yet-offered). **Gaps are visible** (calm slate hollow cells + text), never hidden behind a score. A **coverage rail** summarizes each required dimension (`probeCount`, `domains`, `workModes`, `social`, `difficulty`, `audience`) as met / named-gap — the exact Part-I `CoverageMatrix` (**G2** complete, **G3** gappy). There is **no** scalar coverage/confidence anywhere.

**Why this priority**: the console's first job is an honest, beautiful coverage picture — the thing §14.4.3 #3 forbids collapsing into a confidence number.

**Independent Test**: `buildCoverageMatrixView(buildLab(CATALOG_GOLDEN_V1,…))` deep-equals the golden complete view (rail all met, `gaps: []`); the gappy catalog yields the golden gappy view (each dimension's exact gap string, `complete:false`); assert **no** `score`/`confidence` key exists on the view.

**Acceptance Scenarios**:

1. **Given** a complete Lab, **When** the matrix renders, **Then** the rail shows every dimension met, gaps empty, and the grid fills with a stagger (instant under reduced motion).
2. **Given** a gappy Lab, **When** the matrix renders, **Then** each unmet dimension appears as a **named, visible gap** (calm slate, icon+text) and the aggregate `gaps` list is shown — never a single number.
3. **Given** any matrix, **When** inspected, **Then** there is no scalar coverage/confidence field or element.

### UI-US4 — Guide console: competing explanations, return timeline, lifecycle & authoring (P12)

The console renders the mutable `InterestHypothesis` beautifully: (a) **competing explanations side-by-side** — the strongest **supporting** evidence beside the strongest **disconfirming** evidence, equal weight, never averaged, with uncertainty as an **evidence grade** (thin/moderate/strong) or interval — never a scalar passion score, never "you are an X"; (b) a **voluntary-vs-prompted return timeline** — voluntary returns @7/@30 bright and distinct, prompted returns recessed with their intervention context, and accessibility/safety events as **neutral care-markers that never lower a signal**; (c) an elegant **lifecycle state visual** (EXPLORING → EMERGING → CANDIDATE_SPINE → ACTIVE, with CONTESTED / PARKED / REOPENED branches) showing the current state, the legal transitions, and the **CANDIDATE_SPINE gate checklist** (≥3 families incl. ≥1 delayed-discretionary + ≥1 artifact/competence, from `evaluateCandidateGate`); (d) **authoring**: the guide authors the operative revision; a shadow rule/model proposal is shown as a **suggestion only** (`operative:false`, "a guide authors the record").

**Why this priority**: this is the console's evidentiary heart — the §14.5 contract rendered as an honest, contestable, human-authored record.

**Independent Test**: from a fixture revision + `EVENTS_GOLDEN_V1` + `evaluateCandidateGate`, assert: the explanations view always carries a `disconfirming` card whenever it carries a `supporting` card and exposes no scalar passion score; the timeline marks voluntary @7/@30 distinctly, marks the prompted return recessed with context `"reminder"`, and marks the assistive/safety events with `lowersSignal:false`; the lifecycle view's gate checklist matches **G5** (competence-only → `missing:["no delayed-discretionary signal"]`; the G4 summary → eligible) and any proposal is `operative:false`.

**Acceptance Scenarios**:

1. **Given** a hypothesis revision, **When** explanations render, **Then** supporting and disconfirming appear **side-by-side**, uncertainty is a grade/interval, and there is no scalar passion score or verdict.
2. **Given** `EVENTS_GOLDEN_V1`, **When** the timeline renders, **Then** voluntary @7/@30 are distinct and bright, the prompted return recedes with its context, and assistive/safety markers never lower a signal (`lowersSignal:false`).
3. **Given** the lifecycle visual, **When** a rule/model proposes a transition, **Then** it renders as a **suggestion** (`operative:false`) and only a guide-authored revision is shown as operative; the CANDIDATE_SPINE gate checklist matches `evaluateCandidateGate`.
4. **Given** any console text, **When** reviewed, **Then** it uses "current evidence suggests" / "next test" and never "you are an X person".

### UI-US5 — Reduced motion, plain mode, WCAG 2.2 AA & one-view parity (P13)

Every animated affordance has a reduced-motion equal; a low-spectacle **plain mode** is state-identical to full; both surfaces are fully **keyboard/switch/screen-reader** operable with visible focus, color-independent cues, and ≥4.5:1 contrast. Age-band staging changes only presentation; the underlying view state is identical across bands/plain/reduced (`plainViewEquals`).

**Independent Test**: `buildInterestLabView` + `plainViewEquals` confirm full/plain/reduced/age-band carry identical underlying state and differ only in `flags`+`presentation`; the a11y walkthrough confirms keyboard/screen-reader parity and contrast.

**Acceptance Scenarios**:

1. **Given** `prefers-reduced-motion` / plain mode, **When** either surface renders, **Then** every state/explanation/coverage-gap/timeline/lifecycle is fully conveyed without motion.
2. **Given** keyboard-only + screen-reader, **When** operating either surface, **Then** every control is reachable/operable with visible `--focus` rings, color-independent state, ≥4.5:1 contrast; `prefers-reduced-transparency` → solid panels.
3. **Given** an age-band switch, **When** the surfaces re-render, **Then** only presentation changes; `plainViewEquals` holds.

### Edge cases (Part II)

- **Fresh learner** (no history): every quest `returnState:"new"`; no welcome-back; the coverage matrix shows all gaps honestly.
- **All-prompted history**: no voluntary delight fires; prompted markers recede; the gate stays un-met (no delayed-discretionary family).
- **Coverage gap present**: the matrix shows the named gap (calm, never red, never a score) — parity with G3.
- **Missing data / withdrawn reflection**: the timeline/console reflect the domain's exclusion (a withdrawn optional reflection is absent) and **never** worsen the lifecycle state on absence alone.
- **Assistive input / safety rescue**: rendered as neutral care-markers; `lowersSignal:false`; identical interpretation to an unaided learner.
- **Shadow proposal**: rendered as a suggestion (`operative:false`); no UI path makes it operative.
- **Help affordance**: always present on the child surface; framed as "a different way", never as failure; never penalizes.
- **Reduced-motion + reduced-transparency + high-contrast**: all three honored; depth/hierarchy kept, motion/translucency dropped.

## §U5 · The two surfaces — the design bible

This is the **design doc** the app must deliver. Machine-checkable values are pinned as golden constants in **§U8**; where §U5 describes and §U8 pins, **§U8 wins for values**. Everything is buildable in React + framer-motion + SVG/CSS and inside every guardrail (§U1 non-goals, §14.5, §14.12, §14.13).

**Design pillars (five sentences everything answers to):**

1. **Curiosity is the light.** The Interest Lab is a warm dusk **workshop-atrium** of glowing curiosities you wander; the passion signal — *returning after the pressure fades* — is literally the warmest light on the board. Exploration, not a test.
2. **The board offers; it never verdicts.** The child picks among quests; the interface says "a new kind to try", never "you are an X". The *hypothesis* lives in the guide console, as evidence, always contestable.
3. **Honesty over a number.** Coverage **gaps are shown**, competing explanations sit **side-by-side**, uncertainty is a **grade** — never a scalar passion score, never a confidence that hides a gap.
4. **Calm by default, delight only at the return.** Ambient motion is sparse; the one reserved delight is the **voluntary "come back later"** moment. Frequency-appropriate motion (Emil): rare → delightful, occasional → standard, frequent → instant. No dark patterns, ever.
5. **Reduced motion and the keyboard are equal citizens.** Every visual has a calm, non-vestibular equivalent; the DOM is the accessible surface by construction (no opaque canvas). Nothing beautiful is motion-only; nothing stateful is pointer-only.

### 5.1 · Art direction & visual identity — "The Curiosity Atelier"

**Style register.** A tactile, warm-dusk **illustrated workshop** — soft rounded forms, 2px hand-inked outlines, 16–20px card radii, a single soft shadow + a warm inner glow on "lit" (returned-to) quests. Warmth is carried by **light + accent + type**, not by a cream body (impeccable anti-slop): the canvas is a **deep plum-indigo dusk** so warm curiosities glow against it. The guide console is a calmer, brighter **violet-tinted observatory desk** — an evidence field-notebook, editorial and quiet.

**Master palette (exact hex — golden in §U8.2).** OKLCH-reasoned, contrast-verified.

| Role | Token | Hex | Use |
|---|---|---|---|
| Night (child canvas bg) | `--night` | `#181026` | dusk atrium backdrop |
| Night raised (card/panel) | `--night-raised` | `#221A3D` | quest cards, panels |
| Night sunk | `--night-sunk` | `#120B1E` | wells, insets |
| Paper (guide surface) | `--paper-guide` | `#F6F3FB` | console light surface (violet-tinted off-white, **not** cream) |
| Ink (on paper) | `--ink-guide` | `#241B3A` | console body text (≈13:1 on paper) |
| Ink-hi (on night) | `--ink-hi` | `#F4F0FB` | primary text on night (≈14:1, AAA) |
| Ink-muted (on night) | `--ink-muted` | `#C3B8D9` | secondary text on night (≥4.5:1) |
| Spark (primary warm) | `--spark` | `#FF9E5E` | curiosity warmth; **voluntary-return glow** |
| Spark-hi | `--spark-hi` | `#FFC08A` | highlight/hover |
| Beacon (self-authored/challenge) | `--beacon` | `#FFD166` | chosen-challenge / scope-authored gold |
| Tide (voluntary marker) | `--tide` | `#5EC8D8` | voluntary-return timeline marker (cool counterweight) |
| Sprout (competence) | `--sprout` | `#7BD88F` | artifact/competence growth |
| Met (coverage) | `--met` | `#7BD88F` | dimension met (paired with check glyph) |
| Gap (coverage) | `--gap` | `#8FA6C9` | **calm slate** "still to explore" (paired with hollow-ring glyph) — deliberately **not** red |
| Prompted (discount) | `--prompted` | `#9A8FB5` | prompted engagement (recedes) |
| Support (help) | `--support` | `#5EC8D8` | accessibility/safety care marker (neutral/positive, **never** negative) |
| Contested (lifecycle) | `--contested` | `#E0A458` | CONTESTED (amber caution, **not** red) |
| Parked (lifecycle) | `--parked` | `#8B93A7` | PARKED (resting grey-blue) |
| Focus ring | `--focus` | `#FFD166` | 3px ring, 2px offset — high-contrast on night **and** paper |

**Per-domain hue** — **catalog-order-derived, not a fixed taxonomy.** `resolveDomainHue(catalogDomainsInOrder, domainId)` returns `HUE_RAMP[index % HUE_RAMP.length]` (12 curated accents, §U8.5). It tints only a domain's quest card / constellation node / matrix row header — **never** a state cue (state uses the semantic palette + glyph + text). This respects "no fixed labels" (the hue attaches to catalog *position*, not a hardcoded domain name).

**Typography (tokens §U8.3).** A three-role, contrast-axis system: display = rounded (`Fredoka`) for the child's playful headings; reading = a **serif** (`Iowan Old Style`/`Georgia`) for the guide's evidence prose (field-notebook gravitas); body = humanist sans (`Inter`) for UI/labels. **No external fetch** — system fallback stacks by default; self-hosted `woff2` is an optional non-breaking upgrade (D-U8). Size-specific tracking (Apple): display tight (`-0.02em`), body `0`, labels `+0.01em`; leading inverse to size. The guide's counts use **tabular numbers**; the 6-8 child surface shows **no raw numbers** (§14.13).

**Mood board, in words.** *A child's dusk workbench strewn with glowing curiosities — a jar of pinned constellations, tools that hum when you pick them up, a warm lantern that brightens for the things you keep coming back to. Beside it, a calm observatory desk with a field notebook open: a tide-chart of returns, two columns of evidence weighed against each other, a grid of little lit and unlit windows showing what's been explored and what's still dark. Studio-Ghibli-workshop warmth × a naturalist's honest field journal.*

### 5.2 · Surface A — The Curiosity Quest Board (child probe-picker)

The domain `Lab` rendered as a **quest board**: offers are **quest cards / curiosity islands** clustered into **domain constellations**. Each card carries its domain hue, a **work-mode glyph** (the process verb, §U8.6), difficulty/social/audience cues (icon + text), the **provenance + why** ("a new kind to try" / "you liked building" / "your guide picked this"), and an always-present **help affordance** ("try a different way" — never a failure). The child picks 1 of **≥2** eligible offers at each choice point.

**Interactions & motion.** Cards enter with a staggered `enter` scale-in+fade (never `scale(0)`, 40ms stagger, §U8.4). Hover lift is `@media (hover:hover)`-gated; press feedback `scale 0.97` on pointer-down. **Pick** = a momentum **spring** (`bounce 0.2`, the one reserved bouncy gesture) into the "my quests" tray; interruptible from the live position. A muted-by-default captioned chime accompanies a pick.

**"Come back later" delight (UI-US2).** A voluntary return warms the quest (`--spark` bloom, `welcomeBack`) with concrete copy — **the only reserved delight** — never a label, never guilt. Prompted return recedes (`--prompted`) and is never celebrated.

**Age-band staging (§14.13, `resolveChildStaging`, §U8.7).**
- **6-8** — concrete & story-framed: `showRawNumbers:false`, comparison **off**, `cardScale 1.25`, 56px targets, `maxVisibleQuests 3`, story labels ("A quest about building things"), a friendly one-line "why" (no guide/rule/model detail), celebration ceiling **medium**.
- **9-11** — transitional: growth-vs-past ("you've explored 5 kinds of making"), `cardScale 1.1`, 48px, `maxVisibleQuests 6`, provenance detail shown, a personal **exploration map** (never a score).
- **12-14** — full & strategic: the whole board + domain/work-mode filters, `cardScale 1.0`, 44px, all eligible visible, full provenance, exploration map with the child's own coverage (still never a verdict/score).

**No dark patterns (UI-FR-014).** No countdowns, no streak-break threats, no scarcity/FOMO, no engagement-timed nudges. Always ≥2 offers and a "something else / a different way" route. Language is concrete and non-labeling ("current evidence suggests"/"a new kind to try"), never "you are an X" (§14.5).

### 5.3 · Surface B — The Guide Hypothesis Console (staff-facing)

An **observatory desk / field notebook** — calm, editorial, honest about gaps. Four components render the mutable `InterestHypothesis`:

1. **Coverage matrix** (UI-US3). Domains (rows, catalog order + hue) × the 9 work-modes (columns + glyph). Cells show a coverage **status** (voluntary / prompted / offered / empty) with icon+text; **gaps are visible** calm slate cells. A **coverage rail** renders the exact Part-I `CoverageMatrix` per dimension (`probeCount`/`domains`/`workModes`/`social`/`difficulty`/`audience`) as met / named-gap. Cells fill with a stagger (instant under reduced motion). **No scalar coverage/confidence anywhere.**
2. **Competing explanations, side-by-side** (UI-US4). Strongest **supporting** beside strongest **disconfirming**, equal columns, never averaged; each card lists its `evidenceRefs`; uncertainty is a **grade** (thin/moderate/strong) or interval. Never a scalar passion score; never a verdict.
3. **Voluntary-vs-prompted return timeline** (UI-US4). A horizontal `dayOffset` axis; voluntary returns @7/@30 as bright `--tide`/`--spark` markers; prompted returns as recessed `--prompted` markers carrying their intervention context; assistive/safety events as neutral `--support` care-markers with `lowersSignal:false`. The line **draws in** (`timelineDraw`), markers **pop** on their day (static under reduced motion). This makes "returns that survived the removal of pressure" legible.
4. **Lifecycle state visual + authoring** (UI-US4). EXPLORING → EMERGING → CANDIDATE_SPINE → ACTIVE with CONTESTED / PARKED / REOPENED branches as an elegant **tide-chart**; the current state highlighted; **legal transitions** shown; the **CANDIDATE_SPINE gate checklist** (from `evaluateCandidateGate`) checks in met families and names the missing prerequisite. A rule/model **proposal** renders as a dashed **suggestion** (`operative:false`, "a guide authors the record"); the **guide authors** the operative revision. A **version history rail** scrubs revisions (append-only, never overwritten; bitemporal).

**Console language.** "current evidence suggests" / "next test" throughout; never "you are an X person" (§14.5). No scalar passion score; gaps and disconfirming evidence are always shown beside the supporting case.

### 5.4 · HUD, materials & wayfinding

Translucent `backdrop-filter` panels float over the night (Apple materials: chrome content flows under, not opaque bars); `prefers-reduced-transparency` → solid. Press feedback on every control; ≥44px targets (56px in the 6-8 band). A persistent surface switch (child ⇄ guide, staff-gated in a real build; here a synthetic toggle), a reduced-motion / plain-mode / age-band / audio (muted) control cluster, and a "?" help. Every screen answers Apple's four wayfinding questions (where am I / where can I go / what's here / how do I get out).

### 5.5 · Motion principles (the rules every §U8.4 value obeys)

- **Frequency-appropriate** (Emil): rare (welcome-back, tier-of-exploration reveal) → delight; occasional (pick, matrix fill, timeline draw) → standard eased; frequent (filters, toggles) → instant.
- **Enter/exit `enter` (strong ease-out)**; on-screen moves `move` (ease-in-out); reveals `pop` (overshoot ≤1.05, never `scale(0)`); **never `ease-in` on entrances**.
- **One reserved spring**: the **pick** gesture carries momentum (`bounce 0.2`); everything else is critically damped / duration-eased.
- **Interruptible & velocity-aware** (Apple): a pick can be grabbed/redirected mid-flight; animate from the presentation (live) value.
- **Only transform/opacity/filter** animate; no layout thrash; target 60fps.
- **Every** animation has a reduced-motion equivalent (§U8.4) and works keyboard-only; reduced motion is *the same surfaces, conveyed calmly*.

**Deliberately excluded** (would violate §14.12 / §14.5): `Shake`/`Wiggle` on a wrong/"not-yet" state (reads as rejection), any `scale(0)` entrance, `ease-in` entrances, countdown/urgency timers, decaying/absence meters, gacha "reroll" reveals, engagement-timed pop-ins, looping earworm audio, and any scalar-passion-score number or "you are an X" reveal.

## §U6 · The master motion table (the heart)

Every row derives from `resolveMotion(kind, { reducedMotion })` so the values are testable constants (SC-UI-08). Durations are named tokens (§U8.4 `MOTION`); easings are named (§U8.4 `EASINGS`); every row has a first-class reduced-motion equivalent (Emil/Apple: reduced motion = *gentler*, not *gone*).

| Event | Named effect (vocabulary) | Easing | Duration (token) | Reduced-motion equivalent |
|---|---|---|---|---|
| Quest card appear | **Scale-in + Fade** (0.96→1, α0→1) + **Stagger** 40ms | `enter` | 260 (`cardEnter`) | instant show, no stagger |
| Card hover (pointer-fine) | **Hover lift** (translateY -4px + shadow) | `enter` | 150 (`micro`) | none (no hover motion) |
| Press feedback | **Press/Tap** scale 0.97 on pointer-*down* | `press` | 120 (`press`) | kept (non-vestibular) |
| Pick a quest | **Momentum spring** into tray (origin-aware) | spring `bounce 0.2` | 420 (`pick`) | ≤150ms crossfade to tray |
| Voluntary "come back later" | **Warm bloom + Glow** (`--spark`) + concrete copy | `pop` | 480 (`welcomeBack`) | static warm ring + text |
| Prompted return | recede to `--prompted` (no celebration) | `enter` | 300 (`base`) | instant recede |
| Tray item return | **Crossfade** back to board | `enter` | 320 (`tray`) | 150ms crossfade |
| Filter / band / plain toggle | **Instant** (frequent → no animation) | — | 0 (`instant`) | instant |
| Coverage cell fill | **Fill + Fade** + **Stagger** 40ms | `enter` | 260 (`matrixCell`) | instant fill, no stagger |
| Coverage rail update | **Number ticker** (tabular; 9-11/12-14 only) | `enter` | 600 (`ticker`) | instant number |
| Timeline draw | **Line-drawing** of the axis | `move` | 700 (`timelineDraw`) | static drawn line |
| Timeline marker | **Pop** on its day (≤1.05) | `pop` | 260 (`markerPop`) | static marker |
| Explanations reveal | **Fade + Blur-mask** crossfade of the two columns | `enter` | 300 (`base`) | instant |
| Lifecycle state change | **Continuity morph** between states (shared element) | `move` | 360 (`stateMorph`) | instant state |
| Gate checklist item | **Check pop** (≤1.05) | `pop` | 200 (`fast`) | instant check |
| Drawer / popover | **Origin-aware Scale-in** (from trigger) | `drawer` | 220 (`drawer`) | instant / fade |
| Tooltip (subsequent) | **Fade** (skip delay + animation once one is open) | `enter` | 150 (`tooltip`) | instant |
| Ambient (lantern glow on lit quests) | **Glow pulse** (yoyo, low amplitude) | `linear` (loop) | 1600 (`glowLoop`) | off (static glow) |

## §U7 · Requirements *(mandatory)*

### Functional Requirements (UI-FR-xxx)

**Two surfaces & parity**
- **UI-FR-001**: The app MUST render **two** surfaces — the child Curiosity Quest Board and the guide Hypothesis Console — from a **single** `buildInterestLabView` view model; both surfaces (and reduced-motion/plain/age-band renderings) MUST render from that one view (parity by construction).
- **UI-FR-019**: `buildInterestLabView` MUST compose one view; reduced-motion / plain / age-band MUST differ **only** in `flags` + the `presentation` derived from them; `plainViewEquals` MUST hold (no re-computation of domain state).

**Child probe-picker**
- **UI-FR-002**: The board MUST render the domain `Lab` as quest cards — each with its domain hue, work-mode glyph, difficulty/social/audience cue (icon+text, **never color-only**), provenance + `whyCopy`, and an always-present help affordance — preserving the domain's **≥2 eligible offers** at each choice point (PASS-003).
- **UI-FR-003**: Pick/return motion MUST be satisfying and **interruptible**: press feedback on pointer-down, a momentum spring on pick, tray crossfade on return; **every** motion MUST have a reduced-motion equivalent and MUST NEVER animate from `scale(0)`.
- **UI-FR-004**: A **voluntary return** (@7/@30) MUST render a warm "come back later" delight with **concrete, label-free** copy; a **prompted** return MUST recede and MUST NOT be celebrated; there MUST be **no** guilt/FOMO/countdown/scarcity anywhere (§14.12).
- **UI-FR-005**: The child surface MUST resolve presentation from the age band (`resolveChildStaging`): 6-8 concrete/story/`showRawNumbers:false`/comparison-off/larger targets/celebration-ceiling `medium`; 9-11 transitional; 12-14 full. The **underlying view state MUST be identical across bands** (only presentation varies).
- **UI-FR-017**: Each quest MUST surface **provenance** (PASS-001) — why it appears + whether a guide/rule/shadow-model proposed it — band-appropriately (6-8: a friendly one-liner; 9+: detail).

**Guide console**
- **UI-FR-006**: The coverage matrix MUST render **gaps visibly** (calm slate, icon+text) and MUST render the exact Part-I `CoverageMatrix` rail per dimension; **no** view model or element may express coverage as, or hide a gap behind, a scalar score/confidence (IL-005, §14.4.3 #3).
- **UI-FR-007**: Competing explanations MUST render the strongest **supporting** beside the strongest **disconfirming**, equal weight, never averaged; uncertainty MUST be an evidence grade or interval, **never a scalar passion score**; the console MUST use "current evidence suggests"/"next test" and MUST NEVER render "you are an X" (§14.5, IL-006/012).
- **UI-FR-008**: The return timeline MUST distinguish **voluntary** returns (@7/@30, bright) from **prompted** returns (recessed, carrying intervention context), and MUST render accessibility/safety events as **neutral care-markers with `lowersSignal:false`** (PASS-005/006).
- **UI-FR-009**: The lifecycle visual MUST show the current state, the **legal transitions**, and the **CANDIDATE_SPINE gate checklist** (from `evaluateCandidateGate`); a rule/model **proposal** MUST render as a suggestion (`operative:false`) with **no UI path** to make it operative — the **guide authors** the operative revision (IL-011); the version history MUST be append-only/replayable (IL-006).

**Motion, art & guardrails**
- **UI-FR-010**: All interaction motion MUST derive from the deterministic `MOTION`/`EASINGS` registries via `resolveMotion`; **every** row of the §U6 master motion table MUST have a first-class reduced-motion equivalent; the excluded effects (§U5.5) MUST NOT appear.
- **UI-FR-011**: The surfaces MUST render with the **Curiosity Atelier** identity — the exact `PALETTE` (hex) + `TYPOGRAPHY` tokens, per-domain hue via `resolveDomainHue` — using **no external fetch** (system-font fallback). **Color is never the sole state cue**: every state also carries icon/shape/text at ≥4.5:1 contrast (WCAG 2.2 AA).
- **UI-FR-012**: Reduced motion MUST be a **first-class equal** mode (honored by default; overridable); `prefers-reduced-transparency` → solid panels; **no** feature may require motion.
- **UI-FR-013**: Both surfaces MUST meet WCAG 2.2 AA **natively in the DOM** — keyboard/switch/screen-reader operable, visible `--focus` rings, color-independent, ≥4.5:1 contrast; there is **no** opaque canvas to shim.
- **UI-FR-014**: The child surface MUST use **no dark patterns** — no loss-framed streaks, manufactured scarcity, FOMO/guilt, countdown/urgency timers, decaying/absence meters, or engagement-timed notifications.
- **UI-FR-015**: The child surface MUST always present a **help / "a different way"** affordance that is **never** framed as failure and **never** penalizes; assistive/safety signals MUST NEVER lower any value in any view (PASS-006).
- **UI-FR-016**: No probe-result or hypothesis view may be shaped for admissions/discipline/family-fidelity/public-ranking/commercial targeting: the view types MUST expose **no** `rank`/`percentile`/`score`/`confidence`/`passionScore`/`verdict`/`price` field (PASS-010, IL-013).
- **UI-FR-020**: Domain hue MUST be **deterministic and catalog-order-derived** (`resolveDomainHue`), never a hardcoded domain→hue taxonomy, and never a state cue (IL-001).

**Build-on / isolation & stack**
- **UI-FR-018**: The view package MUST be pure (no I/O, no wall-clock, **no `Math.random`**) and depend only on `@gt100k/interest-lab`; the app MUST read `@gt100k/interest-lab` + `@gt100k/interest-lab-view`, build via `next build`, run **synthetic-only** (no consent/admissions/legal), and fetch nothing external; Part I MUST NOT be modified beyond consuming its public API.

### Key Entities

Full shapes in [data-model.md](./data-model.md). Summary: `AgeBand`, `MotionToken`, `PALETTE`/`TYPOGRAPHY`/`MOTION`/`EASINGS`/`HUE_RAMP`/`WORK_MODE_GLYPHS` (constant registries), `ChildStaging` *(derived)*, `ProbeCardView`, `ProbePickerView` *(derived)*, `CoverageMatrixView`/`DimensionRailItem`/`CellView` *(derived)*, `ExplanationsView`/`ExplanationCard` *(derived)*, `ReturnTimelineView`/`MarkerView` *(derived)*, `LifecycleStateView`/`GateChecklist` *(derived)*, `RevisionHistoryView` *(derived)*, and the composed **`InterestLabView`** with a `presentation` block + `flags`.

## §U8 · Golden values + tolerances

All view-package values below are **exact** (deterministic; tolerance = 0). App-only UX (frame rate, gesture feel) are acceptance targets verified via the walkthrough.

### 8.1 Ordering conventions (so arrays are exactly reproducible)

- Matrix **rows** = domains in **catalog order** (first-appearance in the injected catalog, as Part-I `coverage.domains.have`). Matrix **columns** = the fixed 9 work-modes in vocabulary order (`build, investigate, compose, explain, perform, debug, collaborate, care, persuade`).
- `ProbePickerView.quests` = Part-I `Lab.offers` order. Timeline markers = event `occurredAtDayOffset` ascending, then fixture `ord`. Rail dimensions in dimension order (`probeCount, domains, workModes, social, difficulty, audience`).

### 8.2 Palette (exact) — `PALETTE`

`night:#181026`, `nightRaised:#221A3D`, `nightSunk:#120B1E`, `paperGuide:#F6F3FB`, `inkGuide:#241B3A`, `inkHi:#F4F0FB`, `inkMuted:#C3B8D9`, `spark:#FF9E5E`, `sparkHi:#FFC08A`, `beacon:#FFD166`, `tide:#5EC8D8`, `sprout:#7BD88F`, `met:#7BD88F`, `gap:#8FA6C9`, `prompted:#9A8FB5`, `support:#5EC8D8`, `contested:#E0A458`, `parked:#8B93A7`, `focus:#FFD166`.

**Contrast guarantees (asserted):** `inkHi` on `night` ≥ 12:1 (AAA); `inkMuted` on `night` ≥ 4.5:1; `inkGuide` on `paperGuide` ≥ 12:1; text on `spark`/`beacon` uses `inkGuide` at ≥ 4.5:1. State color is **always** paired with an icon/shape + text (UI-FR-011).

### 8.3 Typography (exact) — `TYPOGRAPHY`

`fontDisplay:'"Fredoka","Baloo 2",ui-rounded,"Segoe UI Rounded",system-ui,sans-serif'`, `fontReading:'"Iowan Old Style","Palatino","Georgia",ui-serif,serif'`, `fontBody:'"Inter",ui-sans-serif,system-ui,"Segoe UI",sans-serif'`; scale `display{rem:2.5,lh:1.05,ls:-0.02,w:600}`, `h1{1.75,1.1,-0.01,600}`, `h2{1.25,1.2,0,600}`, `reading{1.0625,1.6,0,400}`, `body{1.0,1.5,0,400}`, `label{0.8125,1.4,0.01,500}`; `numeric:"tabular-nums"`.

### 8.4 Motion tokens + easings (exact) — `MOTION`, `EASINGS`, `resolveMotion`

`MOTION` (durations, ms — exact): `instant:0`, `press:120`, `micro:150`, `tooltip:150`, `fast:200`, `drawer:220`, `cardEnter:260`, `matrixCell:260`, `markerPop:260`, `base:300`, `tray:320`, `stateMorph:360`, `pick:420`, `welcomeBack:480`, `ticker:600`, `timelineDraw:700`, `stagger:40`, `glowLoop:1600`.

`EASINGS` (CSS cubic-bézier / spring — exact): `enter:"cubic-bezier(0.23,1,0.32,1)"`; `move:"cubic-bezier(0.77,0,0.175,1)"`; `pop:"cubic-bezier(0.34,1.56,0.64,1)"` (overshoot peak ≤ 1.05 in use); `press:"cubic-bezier(0.5,0,0.5,1)"`; `drawer:"cubic-bezier(0.32,0.72,0,1)"`; `linear:"linear"`; `pickSpring:{ type:"spring", bounce:0.2, duration:0.42 }`.

`resolveMotion(kind, { reducedMotion })` → `{ kind, mode, durationMs, easing }`. Animated table (exact); under `reducedMotion:true` → `mode:"reduced"`, `easing:"linear"`, `durationMs` from the reduced column:

| kind | animated durationMs | animated easing | reduced durationMs | reduced note |
|---|---|---|---|---|
| `press` | 120 | press | 120 | kept (non-vestibular) |
| `cardEnter` | 260 | enter | 0 | instant show |
| `cardStagger` | 40 | enter | 0 | no stagger |
| `hoverLift` | 150 | enter | 0 | none |
| `pick` | 420 | pickSpring | 150 | crossfade to tray |
| `welcomeBack` | 480 | pop | 0 | static warm ring + text |
| `promptedRecede` | 300 | enter | 0 | instant recede |
| `trayReturn` | 320 | enter | 150 | crossfade |
| `matrixCell` | 260 | enter | 0 | instant fill |
| `matrixStagger` | 40 | enter | 0 | none |
| `ticker` | 600 | enter | 0 | instant number |
| `timelineDraw` | 700 | move | 0 | static line |
| `markerPop` | 260 | pop | 0 | static marker |
| `explanationsReveal` | 300 | enter | 0 | instant |
| `stateMorph` | 360 | move | 0 | instant state |
| `gateCheck` | 200 | pop | 0 | instant check |
| `drawerOpen` | 220 | drawer | 150 | fade |
| `tooltip` | 150 | enter | 0 | instant |
| `glowLoop` | 1600 | linear | 0 | static glow (off) |

### 8.5 Domain hue ramp (exact) — `HUE_RAMP`, `resolveDomainHue`

`HUE_RAMP` (12 curated accents, declaration order): `["#E8825A","#5FB98C","#6C8CE8","#C98BD9","#E8B84B","#E56B8C","#4FC0C7","#7E8CE0","#9CC65A","#E09E52","#6FD1B0","#D07AB0"]`.

`resolveDomainHue(catalogDomainsInOrder, domainId)` = `HUE_RAMP[ catalogDomainsInOrder.indexOf(domainId) % 12 ]`; a domain absent from the list throws. **Golden** for `CATALOG_GOLDEN_V1` domain order `[making, living_systems, symbols_math, word_craft, sound_music, movement_body, visual_design, social_world]`: `making→#E8825A`, `living_systems→#5FB98C`, `symbols_math→#6C8CE8`, `word_craft→#C98BD9`, `sound_music→#E8B84B`, `movement_body→#E56B8C`, `visual_design→#4FC0C7`, `social_world→#7E8CE0`. (Catalog-order-derived — no hardcoded domain→hue taxonomy; never a state cue.)

### 8.6 Work-mode glyphs (exact) — `WORK_MODE_GLYPHS`

Fixed map (SVG icon keys — **no emoji**, ui-ux-pro-max): `build→"glyph-hammer"`, `investigate→"glyph-lens"`, `compose→"glyph-quill"`, `explain→"glyph-speech"`, `perform→"glyph-star-stage"`, `debug→"glyph-wrench-bug"`, `collaborate→"glyph-hands"`, `care→"glyph-heart"`, `persuade→"glyph-flag"`.

### 8.7 Child staging (exact) — `resolveChildStaging(band)`

| field | 6-8 | 9-11 | 12-14 |
|---|---|---|---|
| `showRawNumbers` | **false** | false | **true** |
| `comparisonDefault` | **"off"** | "opt-in" | "opt-in" |
| `labelStyle` | "story" | "growth" | "full" |
| `cardScale` | 1.25 | 1.1 | 1.0 |
| `touchTargetPx` | 56 | 48 | 44 |
| `celebrationCeiling` | "medium" | "high" | "high" |
| `maxVisibleQuests` | 3 | 6 | "all" |
| `showProvenanceDetail` | false | true | true |
| `showExplorationMap` | false | true | true |

The underlying `ProbePickerView` state is **identical** across bands; only this presentation varies (UI-FR-005, `plainViewEquals`). 6-8 `showRawNumbers` MUST be `false` and `comparisonDefault` MUST be `"off"`.

### 8.8 ProbePickerView (exact structural golden) — `buildProbePickerView(G1 Lab, {history:[], band:"9-11", flags:default})`

- `quests.length === 20` (Part-I G1 Lab).
- Every quest: `provenance === "RULE"`, non-empty `whyCopy`, `returnState === "new"` (fresh history), `helpAffordance === true`, `motion.kind === "cardEnter"`.
- `quests[i].domainHue === resolveDomainHue(catalogDomainsInOrder, quests[i].domain)` (per §8.5).
- `quests[i].workModeGlyph === WORK_MODE_GLYPHS[quests[i].workMode]` (per §8.6).
- `choicePointsMinEligible >= 2` (from the domain Lab).
- **No** `price`/`score`/`rank`/`percentile`/`verdict`/`label` key on any quest (guardrail).
- With a history marking `p01` voluntary-return @7 → `quests[0].returnState === "voluntary-return"` and `quests[0].motion.kind === "welcomeBack"`; a prompted return on `p02` → `quests[1].returnState === "prompted-return"` with `tone:"prompted"` and **no** welcome-back motion.

### 8.9 CoverageMatrixView (exact) — `buildCoverageMatrixView(coverage, offers)`

- **Complete** (from Part-I **G2**): `rail` has all six dimensions `met:true`; `complete:true`; `gaps:[]`; `rows` = 8 domains (catalog order) each with `hue` from §8.5; `cols` = 9 work-modes with glyphs from §8.6.
- **Gappy** (from Part-I **G3**): `rail` per dimension `met` mirrors G3 (`probeCount:false`, `domains:false`, `workModes:false`, `social:false`, `difficulty:false`, `audience:false`), each unmet carries the **exact** G3 gap string, `complete:false`, and top-level `gaps` = the exact G3 6-string list in dimension order.
- **Guardrail**: the view object exposes **no** `score`/`confidence` key at any depth (SC-UI-04).

### 8.10 ReturnTimelineView (exact) — `buildReturnTimelineView(EVENTS_GOLDEN_V1)`

Markers (day-ascending): `e1`(voluntary, horizon 7, tone `tide`, `lowersSignal:false`), `e2`(voluntary, horizon 30, tone `tide`), `e3`(prompted, tone `prompted`, `interventionContext:"reminder"`, `provenanceRecedes:true`, contributes **0** to voluntary), `e4`(revision), `e5`(challenge, tone `beacon`), `e6`(recovery), `e7`(scope, tone `beacon`), `e8`(support/assistive, tone `support`, **`lowersSignal:false`**), `e9`(support/safety, tone `support`, **`lowersSignal:false`**), `e10`(artifact, tone `sprout`). Voluntary markers exist at day 7 **and** day 30; prompted at day 7 is visually recessed and never counted as voluntary (mirrors Part-I **G4** / SC-005/007).

### 8.11 LifecycleStateView (exact) — `buildLifecycleStateView(state, gate)`

- `states` main track `[EXPLORING, EMERGING, CANDIDATE_SPINE, ACTIVE]` + branches `[CONTESTED, PARKED, REOPENED]`; `legalTransitions` = the Part-I fixed set (Decision 3 / plan state-machine).
- `gate` from `evaluateCandidateGate` (**G5**): for the G4 summary → `eligible:true`, `missing:[]`; for competence-only → `eligible:false`, `missing:["no delayed-discretionary signal"]`; the checklist lists the six gate families each `present:boolean`.
- A rule/model `proposal` → `{ proposedBy, toState, operative:false, note }`; there is **no** field/path that sets `operative:true` from a proposal (guide authorship only — IL-011).
- Tones: `contested→#E0A458`, `parked→#8B93A7`.

### 8.12 ExplanationsView (exact structural golden)

For any revision carrying ≥1 explanation: `supporting` present ⇒ `disconfirming` present (the side-by-side invariant); `uncertainty` is `{kind:"grade",grade:"thin"|"moderate"|"strong"}` or `{kind:"interval",lo,hi}`; the view exposes **no** `passionScore`/`score`/`confidence`/`verdict`/`label` key; no card text matches `/you are (a|an|the) /i` (no-fixed-label guardrail).

### 8.13 InterestLabView + `plainViewEquals` (exact)

`buildInterestLabView(inputs)` composes `{ surface, probePicker, guide:{ coverage, explanations, timeline, lifecycle, revisionHistory }, flags:{ reducedMotion, plainMode, ageBand, surface }, presentation:{ palette, typography, motionOf } }`. `plainViewEquals(a,b)` = the two views carry **identical** underlying domain-derived state (probePicker quests + returnStates, coverage, explanations, timeline markers, lifecycle+gate) and differ **only** in `flags` + the `presentation` derived from them (SC-UI-10).

## §U9 · Phasing (P8…P13) — the UI build path

Continues the Part-I build path (P0…P7 = the done domain). Work the lowest unfinished phase. Detailed tasks in [tasks.md](./tasks.md).

### P8 — UI foundation & green-from-first-increment

**Goal**: view package + app skeletons compile; the gate is green immediately.
**Deliverables**: `packages/interest-lab-view` (`package.json` dep `@gt100k/interest-lab: workspace:*`, `tsconfig.json`, `src/index.ts`, `src/model.ts` view types, constant registries `art.ts` (`PALETTE`/`TYPOGRAPHY`/`HUE_RAMP`), `motion.ts` (`MOTION`/`EASINGS`), `glyphs.ts` (`WORK_MODE_GLYPHS`); a `test/smoke.test.ts` asserting the registries are non-empty). `apps/interest-lab` skeleton (`package.json`, `next.config.mjs` `transpilePackages:["@gt100k/interest-lab","@gt100k/interest-lab-view"]`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx` placeholder, `app/globals.css` with the §U8.2/§U8.3 tokens + `prefers-reduced-motion`/`prefers-reduced-transparency`/`.plain-mode`/`:focus-visible` rings, `.env.local.example`, `.gitignore`).
**Gate**: `pnpm typecheck` + `pnpm test` green.

### P9 — Child probe-picker + age-band staging (UI-US1) 🎯 MVP

**View**: `resolveMotion`, `resolveDomainHue`, `resolveChildStaging`, `buildProbePickerView`, first `buildInterestLabView` (child surface). **App**: the Curiosity Quest Board rendering the domain Lab (quest cards w/ hue + glyph + provenance + help affordance), pick spring + press feedback + tray, age-band staging, reduced-motion path.
**Gate**: P8 gate + view golden tests (§8.4–§8.8) + `next build` + smoke + walkthrough steps 1–3.

### P10 — "Come back later" voluntary-return delight (UI-US2)

**View**: `returnState` derivation (voluntary @7/@30 vs prompted) + `welcomeBack` motion. **App**: warm welcome-back state (reduced-motion static) + recessed prompted state; dark-pattern-free confirmation.
**Gate**: P9 gate + walkthrough step 4.

### P11 — Guide console: coverage matrix (UI-US3)

**View**: `buildCoverageMatrixView` (rows/cols/cells/rail; gaps visible; no score). **App**: the animated coverage grid + coverage rail; gap cells calm/visible.
**Gate**: P10 gate + coverage golden (§8.9) + walkthrough step 5.

### P12 — Guide console: explanations + timeline + lifecycle + authoring (UI-US4)

**View**: `buildExplanationsView`, `buildReturnTimelineView`, `buildLifecycleStateView`, `buildRevisionHistoryView`; finalize `buildInterestLabView` (guide surface). **App**: side-by-side explanations, voluntary/prompted timeline, lifecycle state visual + gate checklist + shadow-proposal-as-suggestion + guide authoring; version history rail.
**Gate**: P11 gate + golden (§8.10–§8.12) + walkthrough steps 6–8.

### P13 — Polish, accessibility, plain mode & one-view parity

**Goal**: reduced-motion parity, plain mode, WCAG 2.2 AA (keyboard/switch/screen-reader, contrast, focus, color-independent), `plainViewEquals`, README + demo; the final root-`tsconfig` reference for `packages/interest-lab-view` (human-reconciled).
**Gate**: all SC-UI map green; full quickstart validation.

## §U10 · Success Criteria *(mandatory)* — each mapped to a test

View-package SCs are Vitest tests in `packages/interest-lab-view/test/`; app SCs are verified via `next build` + the smoke + the [quickstart](./quickstart.md) walkthrough.

- **SC-UI-01** — `buildProbePickerView` matches the §8.8 structural golden (20 cards, `provenance:"RULE"`, domain hue per catalog order, work-mode glyph, ≥2 eligible, help affordance, no forbidden field). → `test/probe-picker.test.ts`
- **SC-UI-02** — `resolveChildStaging` matches §8.7; 6-8 `showRawNumbers:false` + `comparisonDefault:"off"`; underlying state identical across bands. → `test/staging.test.ts`
- **SC-UI-03** — Voluntary return @7/@30 yields `returnState:"voluntary-return"` + `welcomeBack` motion with **label-free** copy; prompted yields a recessed state with no delight; reduced-motion static. → `test/return-delight.test.ts`
- **SC-UI-04** — `buildCoverageMatrixView` matches §8.9 (complete from G2, gappy from G3, exact gap strings); **no** `score`/`confidence` key anywhere. → `test/coverage-view.test.ts`
- **SC-UI-05** — `buildExplanationsView` always pairs `disconfirming` with `supporting`; uncertainty is grade/interval; no scalar passion score / verdict / fixed-label text. → `test/explanations.test.ts`
- **SC-UI-06** — `buildReturnTimelineView` matches §8.10 (voluntary @7/@30 distinct; prompted recedes + carries context; support markers `lowersSignal:false`). → `test/timeline.test.ts`
- **SC-UI-07** — `buildLifecycleStateView` matches §8.11 (gate checklist from G5; proposal `operative:false`; legal transitions present). → `test/lifecycle-view.test.ts`
- **SC-UI-08** — `resolveMotion` matches the §8.4 golden table; every kind has a reduced-motion equivalent (`mode:"reduced"`, `easing:"linear"`). → `test/motion.test.ts`
- **SC-UI-09** — `PALETTE`/`TYPOGRAPHY` exact (§8.2/§8.3) with the stated contrast guarantees; `resolveDomainHue` matches §8.5. → `test/art.test.ts`
- **SC-UI-10** — `buildInterestLabView` + `plainViewEquals` (§8.13): full/plain/reduced/age-band carry identical underlying state, differ only in `flags`+`presentation`. → `test/view.test.ts`
- **SC-UI-11** — Guardrails (static): no `Math.random` in `packages/interest-lab-view/src`; no `price|currency|score|confidence|passionScore|rank|percentile|verdict|outOf` field in any view type; no copy generator emits `/you are (a|an|the) /i`. → `test/guardrails.test.ts`
- **SC-UI-12** — Synthetic-only: the whole view layer runs from the Part-I fixtures with **no** consent/admissions/legal input. → `test/synthetic.test.ts`
- **SC-UI-13** — (app) `next build` succeeds; both surfaces mount; `prefers-reduced-motion` honored by default; DOM accessible surface present. → `next build` + smoke + walkthrough (§ Accessibility).
- **SC-UI-14** — (app) No dark patterns present (no countdown/decay/FOMO/scarcity); help affordance present and non-penalizing; child copy passes the no-fixed-label check. → walkthrough + copy review.
- **SC-UI-15** — (app) WCAG 2.2 AA on both surfaces: keyboard/switch/screen-reader operable, visible focus, color-independent, ≥4.5:1; `prefers-reduced-transparency` → solid. → a11y walkthrough.

## §U11 · Stack, commands, env & seeded smoke (pinned)

### Stack

- **Package manager**: pnpm `9.15.9` (workspace).
- **Language**: TypeScript `5.6.3`, strict (`tsconfig.base.json`), Node LTS.
- **View package**: pure TS; dep `@gt100k/interest-lab` (`workspace:*`) only. **No `Math.random`.**
- **App**: Next.js `^14.2.15` App Router + React `^18.3.1` (match `apps/student-compass`), **`framer-motion ^11.11.0`** (Motion), `transpilePackages` for the two workspace packages. DOM/SVG only — **no** Canvas/Phaser.
- **Test**: Vitest (root `vitest.config.ts` already globs `packages/**/test/**/*.test.ts` — no root edit; the app is **not** in the Vitest glob and is verified by `next build`).

### Commands

```bash
pnpm install                                        # bootstrap workspace
pnpm typecheck                                      # tsc -b (green after the final root-tsconfig reference lands)
pnpm test                                           # Vitest across the workspace (view package)
pnpm --filter @gt100k/interest-lab-view test        # view package tests only
pnpm lint                                           # biome check packages adapters apps (covers new dirs)
pnpm --filter @gt100k/interest-lab-app dev          # run the two surfaces
pnpm --filter @gt100k/interest-lab-app build        # next build — app acceptance gate
```

> Loop gate = `pnpm typecheck` + `pnpm test`. App phases additionally require `pnpm --filter @gt100k/interest-lab-app build` + the smoke + walkthrough. The root `build` script (student-compass) is **not** modified; the interest-lab app builds via its filter.

### Env / secrets

No secrets. Commit `apps/interest-lab/.env.local.example` with non-secret public placeholders; `.env.local` is git-ignored; the app reads only `NEXT_PUBLIC_*` with safe defaults so `build` never fails on missing env.

```dotenv
# apps/interest-lab/.env.local.example
NEXT_PUBLIC_LAB_SEED=42
NEXT_PUBLIC_REDUCED_MOTION_DEFAULT=system   # system | on | off
NEXT_PUBLIC_DEFAULT_AGE_BAND=9-11           # 6-8 | 9-11 | 12-14
NEXT_PUBLIC_DEFAULT_SURFACE=child           # child | guide
```

### Seeded smoke (green from iteration 1)

- **View-package smoke** (`packages/interest-lab-view/test/smoke.test.ts`, part of P8): imports the package, asserts `PALETTE`/`MOTION`/`EASINGS`/`HUE_RAMP`/`WORK_MODE_GLYPHS` are non-empty and `resolveMotion("press",{reducedMotion:false}).durationMs === 120` — so `pnpm test` is green from the first increment.
- **App smoke** (P9+, run in the review pipeline's Playwright pass): loads `/`, mounts the child board, asserts **zero console errors**, then toggles reduced-motion and confirms the accessible controls are present and focusable.

## §U12 · Accessibility & reduced-motion equivalence (detail)

- **Reduced motion** (`prefers-reduced-motion: reduce`, honored by default; overridable): entrances → instant or ≤150ms crossfade; the pick spring → crossfade-to-tray; welcome-back → static warm ring + text; timeline draws → static; ambient glow off. State/coverage/explanations/timeline/lifecycle remain fully conveyed (UI-FR-012, SC-UI-10).
- **DOM-native accessibility** (UI-FR-013, SC-UI-15): both surfaces are semantic HTML — the quest board a keyboard-navigable list/`grid` of `button`/`option` cards with accessible names (title + work-mode + why + return-state); the coverage matrix a `table`/`grid` with row/column headers and per-cell status text; the timeline a labeled list of dated markers; the lifecycle a labeled state list with the gate checklist as text. Full keyboard/switch operation, visible `--focus` rings, color-independent state (icon + text), ≥4.5:1 contrast. There is **no** opaque canvas to shim.
- **Plain mode**: a low-spectacle rendering (calm palette, minimal motion) that is state-identical to full (`plainViewEquals`, SC-UI-10).
- **Reduced transparency / high contrast**: `prefers-reduced-transparency` → solid panels; `prefers-contrast: more` → near-solid surfaces with defined borders.
- **Free opt-out**: plain mode / reduced motion / muted audio never change the underlying view state.

## §U13 · Pre-marked decision points (defaults + severity)

The loop proceeds on the **default**; it escalates only per §U3.

- **DP-U1 — Rendering approach. ✅ SETTLED: React + framer-motion + SVG/DOM (no game engine).** Rejected: Canvas/Phaser (opaque to AT; the surfaces are card/grid/timeline/state-diagram DOM). Severity: low.
- **DP-U2 — Motion library. ✅ Settled: `framer-motion ^11`** (Motion), with CSS transitions/`@starting-style` for the simple cases and springs/`AnimatePresence`/layout for gestures; `useReducedMotion` gates every motion. Severity: low.
- **DP-U3 — View-layer location. ✅ Settled: a new pure package `packages/interest-lab-view`** (the Part-I domain core stays untouched and unit-tested). Severity: low.
- **DP-U4 — Art direction. ✅ Settled: "The Curiosity Atelier"** — deep plum-indigo dusk workshop + curiosity-warm accents; deliberately **not** cream/sand (impeccable) and **not** feature-004 golden-hour. Severity: low.
- **DP-U5 — Domain hue derivation. ✅ Settled: catalog-order `HUE_RAMP`** (no hardcoded domain→hue taxonomy; never a state cue). Severity: low.
- **DP-U6 — Coverage-gap framing.** Default: gaps render as **calm "still to explore"** (slate `--gap` + hollow-ring + text), never red/error, never a score. Severity: normal.
- **DP-U7 — Voluntary-return delight copy.** Default: concrete, label-free ("You came back to this one"); never "you are an X". Severity: normal.
- **DP-U8 — Fonts (no-fetch constraint).** Default: system fallback stacks; self-hosted subset `woff2` under `public/fonts/` is an optional non-breaking upgrade keyed identically. Severity: low.

## §U14 · Assumptions

- **Builds on the done Part-I domain.** `@gt100k/interest-lab` (+ its `adapters/interest-*` and fixtures `CATALOG_GOLDEN_V1`/`CATALOG_GAPPY_V1`/`EVENTS_GOLDEN_V1`) is available and unchanged; the view package consumes its public API (`buildLab`, `buildCoverageMatrix`, `summarizeSignals`, hypothesis/`evaluateCandidateGate`).
- **The view layer never re-computes a learning rule.** No scalar passion score, no coverage number, no verdict is introduced anywhere; the domain's honesty guarantees are rendered, not recomputed.
- **Synthetic-only, governance stubbed.** No real learners/consent/admissions/legal; the app runs entirely on the Part-I fixtures.
- **Child-facing surface.** The child Quest Board is a child-facing surface, so the buildable child-safety guardrails here apply (reduced-motion equal mode, WCAG 2.2 AA, age-band staging, no dark patterns, help-never-penalizes, no forbidden-purpose framing) — enforced as functional requirements + tests. Age-band defaults are **[E3]** operating defaults (§14.13), not research-validated optima.
- **Performance is an acceptance target.** 60fps feel is validated via `next build` + the walkthrough, not a unit test (the pure view layer carries no rendering).
- **New dirs only.** All code lives in `packages/interest-lab-view` + `apps/interest-lab`; the only shared-root edit is the final, human-reconciled root-`tsconfig` reference for the view package.
