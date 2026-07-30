# Engine Spec — Specialization Planner (D1)

**Status:** Draft v1 · 2026-07-22 · Engine built as `@gt100k/specialization-planner`; reviewed against it 2026-07-28 · Owner: (eng)
**Purpose:** Turn a validated spike into a living, staged sequence of authentic projects that climbs toward a world-class trajectory — while keeping the pursuit the *kid's own*.
**Grounding:** Specialization/Pipeline PRD §6; talent-spine + push/back-off memos.

---

## 1. What it produces

A **living, adaptive plan** per spike: a staged sequence of increasingly ambitious **Renzulli Type III** real-audience projects, each with **bounded deliberate practice embedded** and **PCDEs woven in**, plus curated/generated resources and the next milestone. Ambition scales by **widening the audience, not adding hours**. Every project is wrapped by the EvidenceGraph — which is **its own product**, integrated across a boundary rather than a planner subsystem (`docs/decisions/evidencegraph-v1-design.md` §11 + §13a): the write path is the single seam adapter `@gt100k/project-evidence-sink`, and the planner itself imports nothing from `@gt100k/evidence-*`.

## 2. Scaffolded co-authorship (the decided product stance)

The plan is never handed down and never left blank. The system/mentor **proposes the path and a menu of real options**; the **kid always chooses among them** — which project, who the audience is, the pace. Autonomy over the choices that matter; structure and opportunity (which low-agency kids can't self-source) supplied around it. This is the resolution to the autonomy paradox (control kills passion, but these kids can't self-drive).

## 3. How it drafts (AI drafts, human owns)

- **Inputs:** the validated spike (domain path + work-mode profile), mastery tilt, environmental access, current stage, and project history.
  - **What the shipped deriver assembles is narrower, and the gap is unclosed.** `derivePlanInputs` reads the cell's readiness signals off the profile's interaction log — months in pursuit, recent voluntary returns, depth accumulation, stretch-seeking, producer identity — plus the hypothesis state and the wellbeing read. It does **not** carry the mastery tilt, environmental access, or project history, so any of those reaching a plan today would have to come from a caller, and none does.
  - **A human must have certified the spike first, and that is now enforced here rather than documented.** `derivePlanInputs` returns `null` unless the hypothesis is `CANDIDATE` or `ACTIVE` — both reachable only by a human transition — and `PlanInputs.hypothesisState` is typed to those two states, so an uncertified spike cannot be assembled into plan inputs even by hand. The input boundary is the right place for it because the GC4 guardrail is detective: it audits a roster's history afterwards and can catch an illegitimate promotion, but not a plan built on no promotion at all.
- **Generation:** LLM-drafted **personalized** project/curriculum options, **grounded in a curated library + RAG** so niche spikes are covered (not just library topics).
- **Human ownership:** a human reviews/owns the plan; of-record milestones stay human-owned (per the human-scaling carve-out). Routine drafting/replanning is automated + audited.

## 4. Continuous replanning (the control loop)

The plan recalculates against live signals:

- **Challenge** held in the **~80–90% success stretch zone**, co-set with the kid; **PUSH** only when they're returning + going deeper + choosing harder.
- On strain, **cut pressure/stakes before difficulty**, and raise autonomy support as stakes rise (counter-cyclical).
- **Quiet-devaluation / burnout signals** (from F2) → back off / rest; hand to a human for the wellbeing call.
- Deliberate-practice **dose rises by stage** (≈0 play in Ignition → capped-but-higher in Signature), never past investment-year loads before 14; AAP rest enforced.

## 5. Stage awareness

The plan's shape follows the four-stage spine (Ignition → Foundations → Authorship → Signature): mentor type, project cadence/audience, DP dose, and lead PCDEs all shift by **experience/readiness** (not age), re-checking spike fit at each stage gate.

## 6. Interfaces

- **In:** hypothesis store (C4, the validated spike), TimeBack mastery tilt (G2), environment inventory, F2 (burnout/challenge signals), project history. *(Wired today: C4 and F2. See §3 for the rest.)*
- **Out:** the plan + next options → Project Workspace (D2); each project → an EvidenceGraph (E1, across the product boundary via `@gt100k/project-evidence-sink`); PCDE scaffolds → D5; audience/submission asks → D4 (real-audience broker); mentor handoffs → D3.

## 7. Hard constraints

Reward-neutral (no streaks/points on the work). Regard stays unconditional. Plurality preserved — each spike runs its own plan on its own stage clock (no transfer discount). Park/switch always available and cost-free.

## 8. Open items

- The generation quality bar for niche-spike project drafts (LLM+RAG) needs its own eval harness.
- **The RAG half of §3's grounding is not wired.** `@gt100k/planner-live` is opt-in, grounds the brief on the curated resources it is handed, and coerces any malformed field back to the stub, so a niche spike outside the curated library gets a stub-shaped brief rather than retrieved material. Reaching "not just library topics" means giving the planner the concierge's retrieval path, which nothing does today.
- How finely the plan personalizes vs. reuses proven project templates is a cost/quality dial to tune.
