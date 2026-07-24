# PassionLab Build Roadmap

**Status:** v2 · updated 2026-07-24 · Owner: (product/eng)
**Purpose:** Sequence the `passionApps.md` artifacts into a phased, dependency-ordered build path, mapped to the **actual** Spec-Kit features under `specs/`. Each feature is `specs/NNN-<slug>/spec.md` → a `writing-plans` implementation plan (`docs/superpowers/plans/…`) → execution (factory loop).
**Reads with:** `passionApps.md` (artifact catalog + live status log), the two PRDs, and `hardening/`.

> **Numbering note (read this first):** the actual build order diverged from the v1 proposal. The real spec numbers are the source of truth: `009` two-axis-tagging, `010` socratic-defense, `011` interest-inference, `012` signal-pipeline, `013` hypothesis-store + guide console, `014` student-profile + orchestrator, `015` concierge + child-safe RAG + curated library, `016` wellbeing, `017` guardrails, `018` specialization-planner, `019` family-coengagement, `020` timeback. `002` evidence-graph predates the sequence. `001/003/004/005/006/007/008` are archived.

---

## Where we actually are (2026-07-24)

| Lane | Status |
|---|---|
| **Discovery spine** (C1/C2/C3/C4 + G1 orchestrator) | ✅ built + merged — `009` `011` `012` `013` `014` |
| **Guide-console cockpit** (F1) | ✅ merged — 4-tab (Hypotheses/Wellbeing/Plan/Family) + polish + Galaxy backdrop |
| **Assessment / defense** (E2 engine) | ✅ built + merged — `010` |
| **Concierge + child-safe RAG + curated library** (B1/B2/A6) | ✅ built + merged — `015` |
| **Wellbeing** (F2) | ✅ built + merged — `016` |
| **Guardrails / metrics + compliance** (G6) | ✅ built + merged — `017` |
| **EvidenceGraph** (E1 MVP) | ✅ MVP merged — `002`; D1–D6 productionization **owned by teammate** |
| **Specialization planner** (D1) | ✅ engine + Plan tab merged — `018` |
| **Family co-engagement** (F3) | ✅ engine + Family tab merged — `019` / `021` |
| **TimeBack priors** (G2) | ✅ merged — `020` (fake data now; live adapter opt-in) |
| **Project workspace** (D2) | ✅ engine + evidence-sink adapter + **project-studio app** merged — `022` (child-facing journey-timeline studio, 7-preset theme switcher, `window.__qa`/LOOP_QA; stub EvidenceSink until E1's API settles) |
| **Game/visual world** (A1 world, A2 cabins, A3 assets, A5 mirror) | 🟡 partial / teammate — tinker cabin + realism loop |
| **Rest of specialization** (D3 mentor, D4 audience, D5 PCDE) | ⬜ not started |
| **Pre-live gates** (G3 consent/erasure, G4 safety-at-scale, G5 calibration, E1 D1–D6) | ⬜ not started (E1 productionization = teammate) |

**Synthetic-first:** every merged feature is built + tested on synthetic/pilot data. No real child data until the Phase 5 pre-live gates pass.

---

## Phase 0 — Substrate ✅ done

- `002-evidence-graph` (E1 MVP) merged; a synthetic project graph builds + verifies. Productionization (D1–D6) is a Phase-5 gate, now owned by teammate.
- The discovery *engines* were built directly as `009`–`014` (the old `003-interest-lab` monolith was archived and split).

## Phase 1 — Discovery MVP ✅ done (engines) / 🟡 world partial

**Goal:** a kid's behavior produces a real, revisable interest read a guide can act on — on synthetic/pilot data.
- **`009-two-axis-tagging`** → **C2** ✅ — domain × work-mode taxonomy; afforded + action-resolved engaged mode; tag-validity gate.
- **`011-interest-inference`** → **C3** ✅ — Beta-Bernoulli belief-per-cell, novelty decay, voluntary-vs-prompted, topic-vs-style, calibrated "not sure yet".
- **`012-signal-pipeline`** → **C1** ✅ — Interaction → CellEvent firewall (engine done; the game-side emitter is teammate).
- **`013-hypothesis-store`** → **C4 + F1 (MVP)** ✅ — versioned hypotheses + lifecycle + Phase 2→3 gate + the guide console.
- **`014-student-profile`** → **G1** ✅ — per-kid profile + append-only log + idempotent `runCycle` wiring 012→011→013; the console reads genuinely-derived data.
- **Still open here:** **A4** taste-app embedding SDK (intern apps exist; SDK not built); **A1/A5** discovery world + accessibility mirror (teammate track; only one **A2** cabin exists).

## Phase 2 — Discovery, full ✅ done (RAG + honesty) / 🟡 world remainder

**Goal:** the long-tail concierge + the honesty layer.
- **`015-concierge-rag`** → **B1 + B2 + A6** ✅ — on-demand companion; the staged child-safe harness (`hardening/child-safe-rag.md`); curated library + opt-in live open-web behind the harness; niche→probe; distress→human; async vet→promote.
- **`017-guardrails`** → **G6** ✅ — program metrics (funnel, coverage, calibration, reopen) + GC1–GC6 compliance checks + CLI report.
- **Still open here:** **G5** calibration/validation harness (needs longitudinal outcomes); **`003` remainder** — remaining cabins + **A5** accessibility mirror + per-spike quiet-period hygiene (teammate/world track).

## Phase 3 — Handoff + Specialization core ✅ core merged / 🟡 remainder

**Goal:** a certified spike flows into a living, project-first plan with process capture.
- **Phase 2→3 certification** ✅ — shipped as the `013`/`014` gate (gap-surviving return + full-term durability + perseverance artifact + human autonomy sign-off).
- **`018-specialization-planner`** → **D1** ✅ (engine + Plan panel) — four-stage ascent (readiness-gated), bounded DP, rest cadence, mentor relay, PCDE focus, grounded on the `015` curated library; guide-console Plan panel. Surface polish pending.
- **`010-socratic-defense`** → **E2** ✅ (engine) — AI-conducted, sampled, anxiety-safe oral defense + evidence record; human owns the of-record grade. Sampling cadence + UI wiring remain.
- **D2 project workspace** (Type III PBL wrapped by E1) ✅ **engine + evidence-sink adapter + `apps/project-studio` merged** (`022`; child-facing journey-timeline studio, 7-preset theme switcher, `window.__qa`/LOOP_QA, stub EvidenceSink until E1's API settles). · **D5 PCDE curriculum** ⬜.

## Phase 4 — Specialization, full + the human/family layer 🟡 partial (F2/F3 engines merged)

**Goal:** the ascent runs healthy at scale.
- **`016-wellbeing`** → **F2** ✅ — signal→action push/back-off playbook; quiet-devaluation detection; escalation to F1.
- **F1 guide + wellbeing console** ✅ (functional) — redesigned Workbench, fed by `014`, carrying the `016` panel; audit-only default + human-owned carve-outs per `hardening/human-scaling.md` (polish ongoing).
- **`019-family-coengagement`** → **F3** ✅ (engine + surface) — warm-demanding coaching, door-opening asks, showcases + family-driven-pressure backstop (`remaining-weakpoints.md` #5). Surface polish pending.
- **D3 mentor relay + D4 audience broker** ⬜.

## Phase 5 — Pre-live gates (block any real child) ⬜ not started

**Goal:** everything required before a live child touches the system.
- **E1 D1–D6 productionization** (`hardening/evidencegraph-productionization.md`): **D2 erasure data model first**, then anchoring/signing, then the rest. **Teammate-owned.** *Blocks live use.*
- **G3 identity/consent/privacy**: consent scope, retention, parental access, erasure wiring. *Blocks live use.*
- **G4 safety-at-scale**: harden + consolidate the shared moderation service (concierge already ships in-app safety stages). *Blocks live use.*
- **G5 inference validation**: once real outcomes land, re-fit and validate the model.

## Cross-cutting

- **G1 Student Profile / Longitudinal Record** — ✅ shipped (`014`); the shared state above everything.
- **G2 TimeBack Integration** — ✅ merged (`020`): aptitude tilt + discretionary-XP prior + a light two-block handoff (prior only, never a gate). Deterministic fake data now; opt-in live adapter ready for the real API.

---

## Critical path & risks

- **MVP critical path (done):** 009 tagging → 011 inference → 013 hypothesis store + guide console → 014 orchestrator. The discovery read is live on synthetic data.
- **Longest-lead / riskiest (remaining):** 015/B2 child-safe live open-web (shipped behind stubs; live path is opt-in), C3 + G5 (inference validation with no launch labels yet), E1 D1–D6 (all pre-production, teammate), G3 (erasure on append-only child data — a hard pre-live gate).
- **Hard ordering rule:** E1 **D2 (erasure data model) before D1 (external anchoring)** — never anchor un-erasable child PII externally.

## Next step

- 018/019/020/022 (engine + **project-studio app**) merged, and the **guide-console cockpit** (4-tab + polish + Galaxy) merged. Next: pick from **D3/D4 mentor+audience**, **D5 PCDE**, or the **pre-live gates** (G3/G4, G5 once outcomes accrue). Real E1 evidence wiring lands once the teammate's EvidenceGraph API settles.
