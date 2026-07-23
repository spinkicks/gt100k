# PassionLab Build Roadmap

**Status:** Draft v1 · 2026-07-22 · Owner: (product/eng)
**Purpose:** Sequence the 30 `passionApps.md` artifacts into a phased, dependency-ordered build path, mapped to **Spec Kit** features. Each feature below becomes `specs/NNN-<slug>/spec.md` → then a `writing-plans` implementation plan (`docs/superpowers/plans/…`) → then execution.
**Reads with:** `passionApps.md` (artifact catalog), the two PRDs, and `hardening/`.

---

## How to read this

- **Feature** = a Spec-Kit unit (`specs/NNN-<slug>/`). Some already exist; most are new.
- Each feature lists the `passionApps` artifacts it delivers, its dependencies, and a **Definition of Done (DoD)**.
- **Synthetic-first:** every phase is buildable and testable on synthetic/pilot data. No real child data until the Phase 5 pre-live gates pass.
- Numbers for new features are proposals (existing IDs: 002, 003, 007 active; 001/004/005/006/008 archived).

## Existing Spec-Kit features to build on

- **`002-evidence-graph`** → artifact **E1** (the process-DAG MVP). Extended later by the productionization feature. **v1 build direction:** `docs/decisions/evidencegraph-v1-design.md` — one graph per project (packets removed), standalone product.
- **`003-interest-lab`** → big chunks of **A1/A2/A5, C1/C3/C4, F1(partial)** (the discovery world, behavioral capture, inference, hypothesis lifecycle, guide surface). Our Discovery App PRD is aligned to it.
- **`007-passion-tutor`** → part of **E2** (a deterministic Socratic project-interview that surfaces articulation gaps and emits an evidence record to 002). A seed for the defense + concierge.

---

## Phase 0 — Substrate (in flight)

**Goal:** the two foundational engines exist and are green on synthetic data.
- `002-evidence-graph` (E1) and `003-interest-lab` (A1/A2/A5, C1/C3/C4) — continue/stabilize.
- **DoD:** discovery world renders 1+ cabin; behavioral events captured; a hypothesis object updates; evidence graph builds+verifies a synthetic project graph.

## Phase 1 — Discovery MVP (the thinnest end-to-end interest read)

**Goal:** a kid can explore 2–3 cabins and the system produces a real, revisable interest read a guide can act on — on synthetic/pilot data. *This is the MVP.*
- **`009-two-axis-tagging`** → **C2**. Domain (hierarchical) + work-mode taxonomy; afforded-modes + action-resolved engaged mode; tag-validity gate. *Dep:* 003. *DoD:* every gadget/taste app tagged; engaged-mode resolved from actions; tag reliability measured.
- **Extend `003-interest-lab`** → **C3/C4** to the spec in `engines/C3-inference.md` (belief-per-cell, novelty-decay, voluntary-vs-prompted, topic-vs-style separation, "not sure yet"). *DoD:* ranked 1–3 candidate spikes with calibrated uncertainty + supporting/disconfirming evidence.
- **`010-taste-apps`** → **A4** embedding SDK + 2–3 seeded taste apps (reuse intern apps). *DoD:* a gadget click opens a measurable embedded taste; depth signals captured.
- **Extend `003` guide surface** → **F1 (MVP)**. *DoD:* a guide sees the hypothesis, evidence, coverage gaps, next probe; can park/promote (human-owned).
- **DoD (phase):** end-to-end — explore → tasted/returned → per-(domain×mode) read → guide console. Metrics: time-to-provisional-hypothesis, coverage breadth.

## Phase 2 — Discovery, full

**Goal:** the full discovery experience with the long-tail concierge and cold-start.
- **`011-concierge`** → **B1 + B2 + A6**. On-demand companion; the staged child-safe harness (`hardening/child-safe-rag.md`); curated library + live open-web behind the harness; niche→probe conversion. *Dep:* 009, G4. *DoD:* niche request → vetted/served probe; distress→human escalation; async vet→promote.
- **`012-onboarding-inventory`** → environmental inventory intake + kid starter + cold-start priors. *DoD:* new kid seeded; priors only re-order the coverage pass.
- **Complete `003`**: remaining cabins, accessibility mirror (A5) parity, session hygiene (quiet periods per `remaining-weakpoints.md` #2).
- **`013-calibration-harness`** → **G5** + metrics/guardrail-compliance (**G6**). *DoD:* tag reliability, confidence calibration, longitudinal-outcome banking started; guardrail checks automated.

## Phase 3 — Handoff + Specialization core

**Goal:** a certified spike flows into a living, project-first plan with process capture.
- **`014-graduation-gate`** → the Phase 2→3 certification (gap-surviving return + full-term durability + perseverance artifact + human autonomy sign-off). *Dep:* 003, F1. 
- **`015-specialization-planner`** → **D1** (`engines/D1-specialization-planner.md`): living, project-first, scaffolded co-authorship, AI-drafts/human-owns, continuous replanning. *Dep:* 014.
- **`016-project-workspace`** → **D2** (Type III PBL) wrapped by **E1**. *DoD:* a project runs; process captured to the evidence graph.
- **`017-assessment-defense`** → **E2**: readiness-staged process rubric + AI-conducted, sampled, anxiety-safe oral defense (extends `007`); human owns of-record grade. *Dep:* 002, 007.
- **`018-pcde-curriculum`** → **D5** embedded psychosocial scaffolds + assessment.

## Phase 4 — Specialization, full + the human/family layer

**Goal:** the ascent runs healthy at scale.
- **`019-mentor-audience`** → **D3 + D4**: mentor relay + access-transfer; real-audience/submission broker (competitions, publishing, communities).
- **`020-burnout-monitor`** → **F2**: the signal→action playbook (`SPECIALIZATION-PIPELINE-PRD.md` §8); quiet-devaluation detection; escalation to F1.
- **`021-guide-wellbeing-console`** → **F1 (full)**: audit-only default + the two human-owned carve-outs, uncertainty-based routing, anti-rubber-stamp UX (`hardening/human-scaling.md`).
- **`022-family-coengagement`** → **F3**: scaffolded warm prompts, showcases, door-opening; family conversion + pressure-monitoring backstop (`remaining-weakpoints.md` #5).

## Phase 5 — Pre-live gates (block any real child)

**Goal:** everything required before a live child touches the system.
- **`023-evidencegraph-productionization`** → **E1 D1–D6** in order (`hardening/evidencegraph-productionization.md`): **D2 erasure data model first**, then D1/D6 anchoring+signing, then D3/D4/D5. *Blocks live use.*
- **`024-identity-consent-privacy`** → **G3**: consent scope, retention, parental access, erasure wiring. *Blocks live use.*
- **`025-safety-at-scale`** → **G4** hardening of the shared moderation service. *Blocks live use.*
- **Inference validation** (**G5**): once real outcomes begin to land, re-fit and validate the model.

## Cross-cutting (built alongside, not a phase)

- **`G1` Student Profile / Longitudinal Record** — the shared state above everything; stand up early (Phase 1) and grow it.
- **`G2` TimeBack Integration** — aptitude tilt + discretionary-XP prior + two-block loop; needed by Phase 1 inference (can stub first).

---

## Critical path & risks

- **Critical path to the MVP:** 003 (world) → 009 (tagging) → C3 (inference) → F1 (guide console) → 010 (taste apps). Everything else follows.
- **Longest-lead / riskiest:** 011/B2 (child-safe live open-web), C3+G5 (inference with no launch labels), 023 (EvidenceGraph D1–D6, esp. D2 erasure).
- **Hard ordering rule:** `023` **D2 before D1** — never anchor un-erasable child PII externally.

## Next step (step 2)

Pick the first feature(s) to take from roadmap → **Spec Kit `spec.md`** → **`writing-plans` plan**. Recommended first: **`009-two-axis-tagging`** (unblocks the whole MVP read) or extend **`003-interest-lab`** inference to `engines/C3-inference.md`.
