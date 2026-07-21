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

### Edge Cases

Drawn from PRD §14.4.3 (acceptance) and §14.10 (failure & recovery):

- **Novelty spike**: a burst of easy clicks with no revision/return keeps the hypothesis `EMERGING`; the engine schedules a delayed-return check and a novelty-matched probe. It must **not** confirm a hypothesis (§14.4.3 #1).
- **High skill, low voluntary return**: competence is recorded **without** inferring passion; offer a harder or different work mode while preserving exploration (§14.10).
- **Low skill, repeated self-authored return**: the learner remains eligible for a high-drive hypothesis; weak first artifacts do **not** route the child away (§14.4.3 #2, §14.10).
- **Prompted vs discretionary**: reminder-driven and discretionary work yield distinct events and distinct features (§14.4.3 #4).
- **Adaptive policy disabled**: the rules engine still produces a complete, balanced Lab (§14.4.3 #5).
- **Withdrawn reflection**: disappears from the next feature build and from replay under retention policy (§14.4.3 #6).
- **Assistive input / safety rescue**: same interest interpretation as an equivalent unaided learner (§14.4.3 #7, §14.10 disability/communication difference).
- **Coverage gap present**: the completed record states each gap; it cannot hide a gap behind a confidence score (§14.4.3 #3).
- **Missing data / inactivity**: suspend inference; do not infer low interest from absence (§14.5, §14.10 illness/grief/disruption).
- **Team success, unclear contribution**: request a solo extension/explanation before updating individual evidence (§14.10).
- **Two strong interests**: support co-primary candidates or a shared work-mode theme; do not force a premature winner (§14.10).
- **Model and child disagree**: the child's account is preserved beside the model evidence; neither is averaged away (§14.10; constitution POL-008).

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
