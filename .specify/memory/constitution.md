# GT100K Constitution

> The supreme rules of the GT100K platform. Every spec, plan, task, and implementation produced by
> the Spec Kit chain (`/speckit-*`) and every agent or human contributor **must** comply. Where any
> spec, plan, PRD section, or convenience conflicts with a principle here, **this document wins** for
> rights/safety/authority limits (the `G`-class invariants).
>
> **Status: RATIFIED (1.0.0).** Synthesized from `PRD.md` v1.10 (Implementation baseline) and
> `GOVERNANCE.md` G1–G8 — the non-negotiables the change log marks as *not moving* with scope (or
> moving only in the more-protective direction): child rights, human authority, privacy separation,
> evidence-class authority, and the prohibited-behavior list. Product *scope* may grow; these
> invariants should not. Rights/authority content was extracted to `GOVERNANCE.md` in PRD v1.7 with
> the original section numbers preserved, so a citation like "G3 §8.1" resolves inside `GOVERNANCE.md`.

## Core Principles

### I. Human Authority Over Consequential Decisions (NON-NEGOTIABLE)

A **consequential decision** changes access, intensity, cohort, specialization, privacy, public
exposure, credential status, or program participation (PRD §8.1).

- Every consequential decision MUST name a human owner, policy version, evidence set, rationale,
  expiry, and appeal route (POL-001). No learned model issues a final consequential decision in the beta.
- Models MAY prepare evidence and a recommendation; a **deterministic policy service** MAY block a
  policy-violating action — neither may *decide*.
- The system MUST show uncertainty and abstain when evidence falls outside the validated population or
  feature range (POL-002), and MUST keep model/informant disagreement visible — never average it into
  a false consensus (POL-008).
- Every consequential decision MUST be **replayable** with the exact evidence, policy, and model
  versions of the time (POL-004), and records are append-only; corrections attach, never overwrite (POL-006).
- A safeguarding hold MUST pause any conflicting workflow, token, cohort move, project action, or
  public exposure (POL-007).

### II. Child Assent and Veto (NON-NEGOTIABLE)

- Guardian consent does **not** substitute for child assent where the product can honor a refusal (PRD §8.2).
- Assent is captured **per intensity dial** — daily load, difficulty/pace, competition & rivalry
  exposure, specialization-commitment depth, public-audience exposure — is revocable at any time, and
  lowering a dial never requires justification.
- **Raising** any dial requires fresh, age-appropriate assent for that dial; higher intensity is never
  inferred from prior compliance, good performance, or a guardian's wish. **No learned model may move
  an intensity ceiling** — that stays human.
- A refusal during a hard task starts inquiry (the 14-day structured-persistence diagnostic), never
  punishment or trait inference. Sleep disruption, distress, injury, bullying, or safeguarding signals
  trigger an **immediate deload** with no diagnostic delay.
- The product MUST NOT present parents a control that raises a child's intensity. Withdrawal of assent
  immediately stops sensitive research, recording, public exposure, and optional specialization/mentor
  interaction; no parent, guide, or panel may override these boundaries.

### III. Evidence-Class Authority Ladder (NON-NEGOTIABLE)

Every capability carries an **evidence class** (PRD §5) and every model a declared **authority level**
(Lab → Shadow → Advisory → Bounded automation → Retired, PRD §8.5).

- `G` (rights/safety/legal) and `ENG` (engineering controls) requirements are enforced as gates
  regardless of measured product lift.
- **Bounded automation** is permitted only for actions that are reversible, low-harm, human-kill-switched,
  and validated on a short-horizon proxy. Irreversible, identity-defining, or only-eight-year-verifiable
  decisions stay Shadow/Advisory and human-owned.
- `E3` runs shadow-mode or reversible pilot only; **`R`-class research gets no production authority** and
  cannot inform a live child's admission, intensity, specialization, cohort, route, or credential.
- **No learned model may move a fixed, human-owned decision rule or cut online** (readiness or intensity):
  the Cognitive Floor Engine may use adaptive item *selection*, but its decision cut is fixed and
  human-owned, and online calibration never lets the rule change itself (PRD §11, §14.9; GOVERNANCE G3 §8.5).
- **Software delivery speed never upgrades an evidence class or authority level.** Only the model & data
  governance board may promote a level, after local validation, subgroup analysis, calibration, safety,
  privacy, and abuse review. A model trained on adults/public corpora/synthetic students cannot gain
  child-facing authority from benchmark performance alone.

### IV. Evidence Before Authority; Proof of Process

- A deterministic policy service applies the approved rule; a model cannot change a rule through a
  weight update (PRD §4.1). Each model output states uncertainty, evidence, counter-evidence, missing
  context, version, and a safe next action.
- The system records **how** an artifact was built (attempts, revisions, tests, prompts, assistance,
  tool calls) and evaluates whether the learner can explain, modify, test, and extend it. It MUST NOT
  make an automated AI-authorship accusation (PRD §4.7).

### V. Privacy Follows Purpose

- Seven separated data domains — identity, **admissions-eligibility reference** (reference-only, not raw
  admissions PII), learning, wellbeing, sensitive research, private project evidence, public portfolio —
  each with its own role, key hierarchy, retention, and audit (GOVERNANCE G7; PRD §4.8). A cross-purpose
  read is denied even when a service has technical access.
- Every collection declares purpose, retention, allowed users, and model-training status. Sensitive
  features (voice/gaze/rPPG and the like) MUST NOT enter admissions or discipline, and raw sensitive
  media is discarded after local processing.
- **No ambient, home, or continuous sensing, ever.** Sensitive-signal collection occurs **only on school
  premises**, under a visible indicator, per-signal consent, fail-closed storage, and crypto-shred on
  withdrawal (GOVERNANCE G5; PRD §10.2). No sensitive signal is the **sole basis** for any consequential
  decision (GOVERNANCE G1/G6).
- The beta operates on **synthetic learner populations only**; no live child data until the admissions
  pipeline is live, privacy/legal sign-off is complete, **and the §33 pre-live gates pass** (PRD §3.2/§32.4).

### VI. Accessibility and Non-Discrimination

- Twice-exceptional learners receive the **same acceleration and the same accommodations** as anyone
  else; a support need is never a reason to slow a child down (PRD §8.3).
- Approved support (screen reader, extended time, alternate input, sensory break, policy-permitted
  calculator, human reader, etc.) MUST NOT reduce mastery or independence credit — unless the construct
  being measured requires the excluded skill and a psychometrician approves that rule, recorded in the
  decision.
- Accommodation data is stored separately from performance evidence. No protected-class proxies,
  undisclosed notes, or expired consent may enter a decision (POL-005). Subgroup false-exclusion limits
  are hard constraints.

### VII. Durable Learning Over Performance

- The platform rewards independent retrieval, delayed retention, and transfer; it enforces the ≥90%
  independent-mastery gate where that gate applies, and asking for help never lowers access, status, or
  credit (PRD §4.3).
- Learning is measured by delayed retention and transfer, not in-session performance; a leading
  indicator may not be converted into a claim that a long-horizon outcome was achieved (PRD §2.5).
- **Honest outcome reporting.** Yield uses an intent-to-treat denominator (all children ever enrolled;
  routed-out learners counted as non-attainment, never silently excluded). No child is abandoned to
  inflate results (PRD §2.6; PIPELINE-PRD §9).

### VIII. Bounded Motivational Pressure

- Every machine-generated pressure action — deadline, rivalry escalation, public comparison, help
  refusal, parent nudge — spends a bounded **MotivationDose token** under a guide veto (PRD §8.5/§13).
- Safety overrides performance goals; the system reduces load on sleep, health, distress, bullying, or
  injury signals. **No fixed-ability caste rankings** in any form. Any comparative standing is **opt-in
  (default off), near-peer-band, anonymized, and never surfaces a child's bottom-rank position**
  (GOVERNANCE G6; PRD §15).

### IX. Prohibited Product Behavior (the hard "never" list — PRD §3.3)

The platform will **never** implement: financial escrow, income-share agreements for minors,
**irrevocable or multi-year binding participation contracts** (participation is renewable with
penalty-free exit, PRD §10), fixed-ability caste leaderboards, automatic expulsion, **automated
admission or rejection**, **single-signal or otherwise automated consequential decisions**, covert
cameras or microphones, biometric truth claims, punishment for approved accommodations, or automated
AI-authorship accusations.

- A project agent MUST NOT contact an adult, spend money, publish work, change access, or deploy to a
  public environment without an **approved capability and a named human action**, and MUST NOT be given
  open-ended funds, unrestricted internet, cross-student data, or public-release authority (GOVERNANCE G6).
- No student final project, credential, portfolio, public artifact, or marketing may invoke a
  third-party institution's brand; "MIT-level readiness" is an **internal** operational benchmark only
  and never appears in outward-facing materials (neutral language such as "elite academic preparation").

## Engineering & Delivery Constraints (`ENG`)

- **Governed git flow:** branch → PR → CI (must pass) → squash-merge; `main` is protected (no direct
  push/force-push, linear history). Conventional Commits; PRs < ~400 lines; **no secrets, tokens, or
  machine paths** in the repo (gitleaks in CI). `gt100k` is PUBLIC.
- **Policy as code:** OPA/Rego enforced at ingress, domain commands, model feature access, workspace
  capabilities, resource grants, credential issuance, and audience routing; signed bundles, deny-by-default,
  and CI policy tests. High-stakes bundle releases need two authorized reviewers.
- **Contracts & isolation:** versioned public contracts (Protobuf) with no breaking changes outside a
  deprecation window; untrusted builds/media run in isolation (Firecracker/gVisor); the public runtime
  has **no network route** to student workspaces or identity stores.
- **Reliability:** system-specific RTO/RPO targets are set and tested before enrollment; emergency
  exposure/capability/token revocation must propagate within seconds (PRD §30).
- **Tests define done:** unit, contract, integration, migration, and security tests ship with each
  change; CI must be green before merge.
- **Human review before child exposure:** no product surface, content, model behavior, or release
  reaches a child without passing a named human review gate; development velocity never waives it (PRD §25).

## Governance

- This Constitution **supersedes** other practices. **Amendments** require a PR, ratification by both
  CODEOWNERS (`@spinkicks` + `@f15cubing`), a version bump (semver), and a migration/impact note.
- Every spec, plan, and PR MUST verify compliance with these principles (checked in `/speckit-plan`
  and human review). **Complexity must be justified** against them; an unjustified violation blocks merge.
- **Authority order** (what wins when documents conflict): this Constitution **and `GOVERNANCE.md`**
  (`G`-class rights/safety; the **stricter** rule wins) → `AGENTS.md` (workflow) → the decision log
  (latest non-superseded entry) → PRD/specs (product intent). Where the PRD conflicts with either
  rights doc on a rights/safety limit, the stricter rule wins.
- Runtime, day-to-day guidance for agents lives in `AGENTS.md`, which points here.

**Version**: 1.0.0 | **Ratified**: 2026-07-20 (requires both CODEOWNERS `@spinkicks` + `@f15cubing` to approve this PR) | **Last Amended**: 2026-07-20
