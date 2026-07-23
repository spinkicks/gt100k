# Discovery App PRD — The Passion Lab "Discover" Experience

**Status:** Draft v1 · 2026-07-22 · Owner: (product)
**Grounding:** This PRD is the source-of-truth design agreed in a structured design session. It is grounded in the project brainlifts (`docs/research/gtBrainlift.md`, `passionBrainlift.md`, `familyBrainlift.md`), the `@gt100k/evidence-graph` MVP, the exploration-world precedents research (`docs/research/interest-lab-world-precedents.md`, `interest-lab-hybrid-vs-full-3d.md`), and five cited research memos in `docs/research/passion-pipeline/` (interest consolidation, push/back-off, talent spine, reversibility, assessment). Every consequential decision below is tied to that evidence.

> **Companion doc:** the specialization half of the pipeline lives in `SPECIALIZATION-PIPELINE-PRD.md`. This PRD covers **Discovery** only, up to and including the evidence it produces for the graduation gate.

---

## 1. Purpose & North Star

The Discovery App answers one question for a child aged **6–14**: *what does this kid genuinely, durably want to go deep on?* — and answers it from **behavior**, not from what the kid or parent says.

**Discovery's output** is a **revisable, ranked hypothesis of 1–3 candidate "spikes"** (a candidate = a `domain × work-mode` profile), each backed by behavioral evidence of **voluntary return after novelty fades**, surfaced as *"current evidence suggests… / next test is…"* — **never a fixed label**.

**North Star (domain-calibrated):** discovery puts a kid onto a **world-class trajectory** by finding a spike worth developing. Genuine elite-junior standing by 14 is realistic only in early-peaking domains (chess, music, competitive math, gymnastics); elsewhere the honest 6–14 outcome is a validated spike + signature portfolio, with eminence a post-14 outcome (talent-spine memo; Subotnik et al. 2011).

---

## 2. Target User

The **low-agency, high-potential child**: a kid who has latent interests but lacks the agency to explore them autonomously. Explicitly **not** the already self-directed child who will spend free hours going deep on their own — that child does not need us. Our user has a real potential spike but won't find it alone, so the product supplies the scaffolding, triggers, and guidance.

Families are pre-selected for high commitment (`familyBrainlift.md`) and are a usable design input (see §7).

---

## 3. Scope

**In scope:** the discovery experience end-to-end — the explorable world, cabins, gadgets, tastes, the concierge, the measurement/inference engine, the hypothesis object, the guide console, onboarding, and the evidence handed to the graduation gate.

**Out of scope (see Pipeline PRD):** the graduation-gate operational process, the specialization stages, the Specialization Planner, mentor relay, deliberate-practice dosing, EvidenceGraph project wrapping, and the 8-year loop. Also out of scope: academics/TimeBack itself (assumed working).

---

## 4. Core Principles (each load-bearing and evidence-backed)

1. **Interest is built, not discovered.** We manufacture the conditions for interest via repeated, varied exposure; we never tell a kid "this is your passion" (O'Keefe, Dweck & Walton 2018; Hidi & Renninger 2006).
2. **Trust voluntary return, not stated interest.** Self-report predicts behavior only weakly (Nye et al. 2012, r≈.20–.36). The signal is what a kid comes back to unprompted after novelty/pressure lift (Harackiewicz et al. 2008; Boeder et al. 2021).
3. **Reward-neutral.** No points/streaks/scores on exploration or return — extrinsic rewards corrupt the very signal we measure, worse in children (Deci, Koestner & Ryan 1999). Beauty and interactivity are kept; a reward economy is not.
4. **Two axes: `domain × work-mode`.** Measure interest per cell, so a "maker" (work-mode across topics) separates from a "topic-loyalist," and missed niches are still caught by the mode axis.
5. **Bounded-but-porous.** Curated cabins are legible triggers + a door to everything else (the concierge), not the complete catalog.
6. **Software-first, thin human layer.** AI conducts; a human only *owns* the consequential judgments; the family carries the relational load (see Pipeline PRD §Human/Software boundary).
7. **Hard refusals** (see §11): no affect/face detection; no AI-text detectors on children.

---

## 5. The Experience

### 5.1 Placement in the day (the two-block loop)

- **Morning:** TimeBack academics to a **raised daily XP gate** (a minimum per section + a discretionary remainder). The discretionary allocation is captured as a **weak interest prior** (see §6.4); academic achievement is captured as an **aptitude tilt**.
- **Afternoon:** the **passion block** — Discovery for kids still forming/validating spikes, Specialization for those past the gate (they can run concurrently across a kid's plural spikes).
- The passion block is **reward-neutral**: hitting the academic gate *sequences into* it but never *scores* it.

### 5.2 The world model (2D navigate → 3D do)

Three layers, deliberately separated:

- **Layer 1 — 2D walkable overworld (navigation).** A cheap, legible 2D world the child's avatar moves through to *find and revisit cabins*. **Two signal-bearing choices live here:** which cabin to approach, and which cabin they **wander back to unprompted** (the return signal, read as a tile/cabin revisit). No heavy 3D on this layer. Free choice of where to go is preserved (the Duolingo-path lesson: over-railing destroys the self-directed revisit our signal depends on).
- **Layer 2 — 3D bounded cabin interior (the doing).** Entering a cabin drops the child into a **bounded, hyper-real 3D showroom** of gadgets. Walk up to a gadget → click → the three-layer interaction (§5.4). **One cabin's 3D loads at a time**, on a **single persistent canvas whose contents swap** on enter/exit (never a fresh scene per cabin — the one architectural rule that must not be violated).
- **Layer 3 — 2D accessibility mirror.** A DOM/list rendering of the *same* cabins/gadgets/return-state for keyboard/screen-reader users, at 1:1 parity with the world (`plainViewEquals`). Distinct from Layer 1; justified by accessibility, not hardware.

Transitions use a doorway/portal metaphor with color+emblem carried from cabin to interior, a persistent "back to world" exit, and (on capable machines) a brief establishing camera move; reduced-motion = instant cut.

### 5.3 Cabins (the domain axis)

**~8 broad themed launch cabins**, each rich enough to span multiple work-modes and chosen to cover academic + non-academic interests, front-loading domains where interns already built good taste apps:

Music & Sound · Code & Computers · Games & Strategy (chess/poker/board) · Making & Engineering (robotics/electronics) · Art & Motion (visual/animation/video/3D) · Influence & Media (marketing/story/psych/publishing) · Science & Nature · Math & Puzzles.

Granularity: **broad cluster at the cabin level**, gadget-level sub-topics inside. Sports/physical and Words/Debate are the top candidates to add next. **≥6 cabins is a floor** (needed to detect a work-mode column preference). Cabins must be **roughly equal in polish** — uneven art direction would make us measure aesthetics, not interest — and each interactable gadget must carry a **clear affordance** (teach-through-affordance; don't let hyper-realism cost legibility).

### 5.4 The three-layer cabin interaction

1. **Trigger** — the walkable showroom gets the kid curious and clicking.
2. **First taste (best-effort, on-platform, measurable)** — clicking a gadget opens a short interactive taste (an intern Brilliant-style app) as an embedded panel (the Gather.town "walk up, press X, embedded activity opens" pattern). Fully instrumented, so we measure *depth of first engagement*, not just the click. **Best-effort:** used where a good taste app exists; otherwise fall back to Layer 3.
3. **Deep dive (external)** — routes to deep curated external material (YouTube, Khan, Codecademy, LeetCode, full intern apps); return measured via resumption + whatever telemetry each platform allows.

Signal quality is therefore **tiered** (richer for gadgets with a taste app, coarser for external-only) — an accepted trade-off. Taste apps and the concierge's curated library are the **same compounding asset**: build taste apps for the highest-return topics over time.

### 5.5 The concierge (the porous escape valve)

- **A single persistent, context-aware companion** that travels with the child, knows the current cabin *and* the cross-domain pattern, and is **summoned on demand** (not proactive — a nudger corrupts voluntariness; not the primary interface — that's the rejected fully-open model).
- **Age/capability-adaptive modality:** voice + images/taps for pre-literate kids, voice/text for readers (triggered by literacy/motor capability, not birthday).
- **Its job:** convert a *stated* niche ("I liked the subwoofer, not the concert rig") into **1–few concrete, testable probes/resources**. The **chat itself is never scored** (stated interest is weak); only the child's later voluntary return to what it routed counts.
- **Routing:** curated vetted library first; for gaps, **open-web retrieval via RAG through safety/quality harnesses**, cached and promoted into the library so it compounds. Everything served to a child carries provenance, passes an **age-appropriateness gate before promotion**, and is auditable.
- **Child-safety wrapper:** input/output moderation, age-appropriate language, no PII solicitation, stays in the learning-routing lane (no medical/therapy/etc.), **human escalation on distress/safety flags**, full audit log; COPPA-compliant.

### 5.6 Onboarding & cold-start

At intake (a cheap add to existing family screening), collect a **light environmental interest inventory**: parent occupations/hobbies, home equipment/access, the kid's and peers' current activities. Optionally a light kid-facing "starter" (tap-to-pick) as a weak prior.

At true cold-start, the first sessions run the **coverage pass** (§6.2), **re-ordered** by the environmental + aptitude priors (surface likely-relevant cabins slightly earlier — the DJ-dad's kid sees the audio cabin sooner). Priors **only re-order; they never gate or narrow**, and behavioral return quickly dominates them.

### 5.7 Session structure & hygiene

- **Free-choice sessions**, with a **light early coverage pass** ensuring ≥6 domains × several work-modes get sampled (first-exposure only, discounted as novelty; **never nudges a return**). After coverage, pure free choice.
- **Session hygiene** (children's right to disconnect; no dark patterns): natural endpoints ("good place to stop — the lab will be here"), **guilt-free pause with no streak debt**, a definitive exit, and a single gentle **opt-in** "your half-built thing is still here" cue — never a countdown or FOMO.
- A **label-free "welcome back"** delight fires on voluntary return, carrying **no score**.

---

## 6. The Measurement Model

### 6.1 Two axes: `domain × work-mode`

Every activity is tagged with a **domain** (which cabin cluster) and a **work-mode verb**. The nine work-modes: **build, investigate, compose, perform, debug, explain, persuade, collaborate, care.** Interest is read **per `(domain × work-mode)` cell**, never per cabin alone.

### 6.2 What counts as signal

- **Primary signal:** **depth-weighted, novelty-subtracted, prompt-free voluntary return, as a trajectory** across **7-day and 30-day** horizons — not minutes, not clicks, not a one-session snapshot (Saqr 2022/2023: active proxies replicate, passive don't; single time-points don't forecast, trajectories do).
- **Novelty-decay gate:** first-visit enthusiasm is triggered situational interest and near-worthless; a cabin/gadget's early exposures are tagged novelty and **do not count** until a decay window passes. A novelty spike keeps a hypothesis `EMERGING` and *schedules* a delayed return check.
- **Voluntary vs prompted:** every revisit is flagged self-initiated vs prompted; only voluntary returns feed the signal. We minimize prompts to keep returns voluntary.
- **Coverage floor:** you can't detect a work-mode column preference if the child only ever saw one mode, hence the coverage pass.
- **Missingness ≠ disinterest:** a quiet week never lowers a state; missing data is routed to a human, never auto-labeled.

### 6.3 The six active-construction signal families (the feature layer)

Emitted **separately per cell, never summed into a scalar**: `voluntary_return, unrequired_revision, chosen_challenge, failure_recovery, self_authored_scope, artifact_competence`. Passive metrics (dwell/clicks/views) are kept only as **low-weight context**, never as the signal.

### 6.4 The inference layer (Bayesian now → ML-tuned later)

A **transparent Bayesian inference layer** on top of the six-family features:

- Per `(domain × work-mode)` cell, maintain a **calibrated, revisable belief**: a **prior** (environmental inventory + aptitude tilt + discretionary-XP prior) updated by active signals **over a trajectory**, novelty-discounted, voluntary/prompted-separated, missingness-as-missing.
- A **low-rank factorization** over the domain×mode grid separates a **topic loading** from a **work-mode loading** (the row-vs-column crux) — solved by the model, not a heuristic.
- Output is **calibrated uncertainty + supporting-vs-disconfirming reasons**, never a scalar or a label. Calibration is the EvidenceGraph deferred capability **D4 (conformal)**.
- **No labeled outcomes exist at launch**, so we ship a **principled model with research-set priors** and **learn its parameters over years** as longitudinal outcomes accrue (which spikes actually persisted). ML is a *staged* capability — principled now, learned later.
- **Behavior only** (never affect), **interpretable** (the guide must read *why*), **human-owned**.

### 6.5 Composition with academics (TimeBack)

- **Academic achievement/mastery tilt = aptitude signal** (SMPY: ability tilt channels which domain). Strong, objective.
- **Discretionary-XP allocation = weak interest prior** (confounded with ease), used only to seed/weight discovery.
- **Discovery voluntary return = the authoritative interest signal.**
- **Specialization target = the overlap of strong × loved.** Aptitude **informs but never vetoes** a genuinely loved *non-academic* spike (bowling, poker) that TimeBack is blind to.

---

## 7. Family / Environment as Input

- **In discovery:** a **weak additive prior** — the environmental inventory surfaces relevant triggers earlier. It can **only add** triggers, **never gate or narrow** (a kid in an interest-poor home must get *more* exposure, or we just reproduce the parents — an equity failure).
- Autonomy-supportive framing always ("want to try the thing dad does?" — never "your dad wants you to"). Peer influence is handled carefully to avoid herding (family/home is the primary input; cohort contagion is a specialization amplifier, not a discovery seed).
- (The strong **specialization amplifier** — recruiting the DJ-dad/bowling-crew to co-engage — lives in the Pipeline PRD.)

---

## 8. The Hypothesis Object & Guide Console

- **Versioned, revisable hypothesis** per candidate spike, with lifecycle states: `EXPLORING → EMERGING → CANDIDATE → ACTIVE`, plus `PARKED / CONTESTED / REOPENED`.
- Each spike carries: its **domain × work-mode profile**, the **six-family evidence shown separately**, **calibrated uncertainty**, **visible coverage gaps**, and the **next distinguishing probe** (chosen to break a row-vs-column tie — e.g., offer the same mode in a new domain).
- **Up to 3 candidate spikes**, converging by developmental readiness (see Pipeline PRD for the 3→2→1+1 schedule and park-not-quit mechanics).
- **Guide console** for the **thin professional layer** (not the parent — avoids the autonomy conflict of interest): **AI drafts recommendations** ("evidence suggests promote / park / next test"), the **human owns** promote/park and the autonomy (harmonious-not-pressured) sign-off. Language is *"current evidence suggests… / next test is…"*, **never "you are an X."**

---

## 9. Age / Capability Accommodations (one engine)

**One engine.** Identical experience-gated logic, stages, gates, and hypothesis machinery for all ages — **age is not a gate**. A 7-year-old and an 11-year-old at the same point are treated identically. Capability (not birthday) only tunes the edges:

1. **I/O surface** — voice/images/taps vs text, triggered by literacy/motor capability (a fluent-reading 7-year-old gets the text surface).
2. **Evidence reliability** — self-report is a low-reliability channel for young kids; the §6.4 Bayesian model **down-weights it automatically** (no forking). Parent-observed behavior carries more weight at 6–8, self-articulated value earns weight by 12–14 (interest-consolidation memo).
3. **Scaffolding level** — more structure-before-struggle for less-developmentally-ready kids, because productive failure backfires for the youngest (Sinha & Kapur 2021).

---

## 10. Discovery's Exit: Evidence for the Graduation Gate

Discovery does not "promote" a kid by itself; it produces the **evidence** the gate consumes. A candidate is ready to certify the **Hidi–Renninger Phase 2→3 crossing** when its top cell shows depth-weighted **self-initiated return that survives a ≥2-week no-prompt/no-new-content gap** and **holds across a full term** with flat/rising depth, plus a **perseverance artifact** (iteration past a failure), plus a **human autonomy sign-off**. (Full gate operationalization: Pipeline PRD.) Low-commitment deepening starts *before* the gate — the gate governs *expensive commitment*, not access.

---

## 11. Guardrails & Refusals

**Hard refusals (non-negotiable):**
- **No affect/face/emotion detection** — scientifically invalid (Barrett 2019) and illegal in EU education (EU AI Act Art. 5). We read behavior, never faces.
- **No AI-text/plagiarism detectors aimed at a child** — inaccurate and discriminatory (Liang 2023: 61.3% false-positive on non-native writers; Weber-Wulff 2023), and contradicts EvidenceGraph SPOV 4.
- **No rewards/streaks on the signal** (reward-undermining; §4.3).

**Soft guidelines (strong defaults, revisable):**
- No scalar "passion score," ranking, or fixed label (O'Keefe/Dweck/Walton).
- Missingness ≠ disinterest.

---

## 12. Non-Functional Requirements

- **Accessibility:** WCAG 2.2 AA; the 2D mirror is an **equal mode** at 1:1 parity, not a downgrade; full keyboard/screen-reader operability (move focus one item at a time; narrate name/role/state); reduced-motion = instant; color-independent.
- **Platform / stack:** target **school Windows machines** (higher perf ceiling than Chromebooks; richer in-cabin 3D is affordable). Next.js / React / react-three-fiber, WebGL2 baseline; **one persistent canvas** (contents swap, never remount); render-on-demand. Perf tiers (3D → 3D-lite → 2D) remain available but are now driven by accessibility/edge-cases, not weak hardware.
- **Privacy:** behavior-only; data minimization + explicit consent scope (EvidenceGraph `consentScope`); retention limits; **no child data used to train third-party models**; parental access. Right-to-erasure on an append-only store is a **pre-live gate** (EvidenceGraph D2, unsolved).

---

## 13. Success Metrics

- **Time-to-provisional-hypothesis** (how fast a first candidate forms).
- **% reaching a *certified* spike** within N months.
- **Coverage breadth** (domains × work-modes sampled per kid).
- **Voluntary-return rate** and its trajectory quality.
- **False-park / reopen rate** (spikes parked then genuinely reopened — a proxy for premature or wrong reads).
- **Concierge niche-resolution rate** (stated niche → returned-to probe).
- **Automated guardrail-compliance checks** (no scalar-score leakage; no prompted returns counted; novelty correctly discounted).

---

## 14. Open Questions / Pre-Live Gates

1. **Right-to-erasure on append-only child data** (EvidenceGraph D2) — must be solved before any live child.
2. **Conformal calibration** of the inference layer (D4) — needed for honest uncertainty.
3. **Numeric thresholds** (novelty-decay window, exact 7/30-day weighting, coverage floor counts) are **calibratable engineering defaults**; the *horizons* are evidence-anchored, the *thresholds* are ours to tune on the first 6–14 cohorts.
4. **Cross-platform external telemetry** — how much return we can actually observe on third-party resources.
5. **Keystroke/process signals** for depth — real discriminative power vs a heavy child-privacy cost (still open in the assessment memo).

---

## 15. References

- Brainlifts: `docs/research/gtBrainlift.md`, `passionBrainlift.md`, `familyBrainlift.md`.
- Research memos: `docs/research/passion-pipeline/{01-interest-consolidation-graduation, 02-push-vs-backoff-burnout, 03-talent-development-spine, 04-reversibility-plurality-switching, 05-assessment-measurement}.md` (full citations within).
- Precedents: `docs/research/interest-lab-world-precedents.md`, `interest-lab-hybrid-vs-full-3d.md`.
- Key sources: Hidi & Renninger (2006); Harackiewicz et al. (2008); Boeder et al. (2021); Nye et al. (2012); Deci, Koestner & Ryan (1999); Saqr et al. (2022, 2023); O'Keefe, Dweck & Walton (2018); Barrett et al. (2019); Liang et al. (2023); Weber-Wulff et al. (2023); Sinha & Kapur (2021).
