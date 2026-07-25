# Discovery App PRD — The Passion Lab "Discover" Experience

**Status:** Draft v1.1 · 2026-07-22, revised 2026-07-25 · Owner: (product)
**Grounding:** This PRD is the source-of-truth design agreed in a structured design session. It is grounded in the project brainlifts (`docs/research/gtBrainlift.md`, `passionBrainlift.md`, `familyBrainlift.md`), the `@gt100k/evidence-graph` MVP (v1 direction: `docs/decisions/evidencegraph-v1-design.md`), the exploration-world precedents research (`docs/research/interest-lab-world-precedents.md`, `interest-lab-hybrid-vs-full-3d.md`), and six cited research memos in `docs/research/passion-pipeline/` (interest consolidation, push/back-off, talent spine, reversibility, assessment, activity design 6–8). Every consequential decision below is tied to that evidence.

> **Revision 2026-07-25 — activity design & signal validity.** §5.4, §5.7, §6.2–6.4, §9.3–9.4, §11 and §14.6–14.10 were revised from `docs/research/passion-pipeline/06-activity-design-ages-6-8.md` (four adversarially-verified research passes). Substantive changes: intrinsic integration is now **required** of signal-bearing artifacts; **duration is barred from any belief term** and choice becomes the primary instrument; **return is split by day horizon**; a **delayed out-of-product probe is mandatory**; the coverage pass must **maintain what it triggers**; the work-mode read is demoted to a **nuisance covariate that is never routed from**; and `artifact_competence`/`solves` are removed as interest signals.
>
> **Age scoping — read carefully.** This PRD covers ages **6–14**, but that memo's evidence is specific to **6–8**, which is where the product now specializes. Age-bounded figures (block length ~10–15 min, the ~6-minute vigilance decrement, the ~51-day parent-report window, reward effect sizes for children, the ability-stability findings) are **6–8 figures and should not be assumed to hold at 12–14**. The structural claims (intrinsic integration, choice-over-duration, return-by-horizon, no routing from mode) are not age-bounded. Per §9, age remains **not a gate** — capability tunes the edges.

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

**Intrinsic integration is required of every signal-bearing taste app** (`06-activity-design-ages-6-8.md` §2.1/D1). The domain content must **be the core mechanic**, not a quiz or a scoreboard attached to unrelated gameplay. Operational test: *if the domain content could be replaced with arbitrary symbols and the activity would still play the same, the binding is extrinsic and what we measure is wrapper engagement, not domain interest.* In the closest experiment (identical shell, only the binding varied) children chose the intrinsically-bound version 75.7 min vs 10.28 min (r = .89). Only intrinsically-bound artifacts emit belief-bearing events; extrinsically-bound ones are **trigger-only** and emit context.

**Medium roles are not interchangeable** (§4 of the memo). Layer-2 instrumented tastes are the *only* measurement instrument. Layer-3 video is a **trigger and deep-dive, never a signal** — video matched hands-on on knowledge only under heavy scaffolding (teacher-edited, task-relevant, pre-briefed). Hands-on/physical extension transfers well (screen-vs-physical is the wrong cut; *demand structure* is what predicts transfer) but is read via guide/parent report, not telemetry. A single live-practitioner visit moves attitudes by only d = 0.06–0.13, so it is not a measurement surface. Prefer solo or partner arrangements over whole-group (on-task OR 1.51–1.62).

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
- **Never trigger a domain we cannot maintain** (`06-activity-design-ages-6-8.md` §2.3/D5 — binding on the coverage pass). A triggered-but-**unmaintained** domain ends up measurably *below* where it started, while an untouched domain merely drifts (control slope −.03 vs treatment +.03). A pass that triggers 8 cabins and maintains 1 is therefore net-negative for 7 of them. **Requirement:** every triggered cabin gets **≥2 spaced re-exposures** before it may be dropped. This is a scheduling rule, not a redesign.
- **Block length ~10–15 min, 4–6 spaced exposures per domain** (§D4). Observed K–4 activity blocks centre on ~10–17 min (median 12.8), and each additional minute lowers on-task log-odds by 0.0174 (≈1.42× better on-task odds for a 10- vs 30-min block). A vigilance decrement is detectable within **~6 minutes** at ages 5–7.9 — **and it persists through continuous per-trial rewards**, which is independent support for §11's no-rewards refusal. Port the *count and spacing* of the 4-stimuli/4-week dosage benchmark, not its 1-hour duration (that benchmark is ages ~9–10). **Triggering recurs in later phases**, so schedule deliberate **re-triggers**, not one taster followed by maintenance only.
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
- **Return is split by horizon** (`06-…` §8.5/E2): `cross_day_return` is **the signal**; `same_session_reopen` is recorded but **weighted zero**. "Reopened it 30 seconds later" and "came back on day 4 unprompted" are different evidence, and the across-day one is what predicts. At ages 7–8 **in-session telemetry discriminated nothing** — only delayed measurement did (partial η² = .24), so a same-session read is not a fallback.
- **Choice requires a recorded choice set** (§8.5/E3). A return to the only available activity is not a preference — choice is only interpretable against **what was declined**. Every choice event records the alternatives that were available and not chosen, plus whether the activity was **system-surfaced or self-found** (which also discharges the exposure-propensity logging that `hardening/06` requires against feedback loops). System-surfaced returns are down-weighted.
- **Duration never enters a belief term** (§8.4/P1, §8.6). Dwell is **non-monotonic in interest**: stronger performers stay longer as learning progress rises (β = −.51) while weaker ones stay with the most **familiar** option (β = .96); it is separately confounded with epistemic uncertainty (persistence rises with *no reward at all*) and with executive function. Aggregate dwell and session length were **flat against learning** (p = .80, p = .24) in exactly the design where trial-wise **choice** predicted it. Dwell is retained only as (a) a **validity floor** (~20–30 s before an open counts as an event) and (b) a **diagnostic** — high dwell with no cross-day return is the familiarity/struggling pattern and is flagged to a human, never folded into a posterior.
- **Coverage floor:** you can't detect a work-mode column preference if the child only ever saw one mode, hence the coverage pass.
- **Missingness ≠ disinterest:** a quiet week never lowers a state; missing data is routed to a human, never auto-labeled.

### 6.3 The six active-construction signal families (the feature layer)

Emitted **separately per cell, never summed into a scalar**: `voluntary_return, unrequired_revision, chosen_challenge, failure_recovery, self_authored_scope, artifact_competence`. Passive metrics (dwell/clicks/views) are kept only as **low-weight context**, never as the signal.

**Each family is a discrete observable action, and one event = one occurrence** (`06-…` §8.5/E1). No family carries a continuous "magnitude," because a magnitude derived from active time would reintroduce duration as the dominant posterior term. Derivations: `unrequired_revision` = reopened a solved item or changed a correct answer; `chosen_challenge` = took the harder variant when an easier one was offered *(requires a difficulty-variant affordance to exist)*; `failure_recovery` = resumed after an abandoned/failed attempt (the productive-failure signal); `self_authored_scope` = continued past the win state.

**Scope note:** `artifact_competence` is a **work-quality judgement** and belongs to the Evidence Graph, not to interest discovery. It is **excluded** where Discovery is operating as a topic-interest finder. Likewise `solves`/accuracy is **not an interest signal** — it indexes **prior ability** (r = .37–.44 with pre-test; nulls against learning gain; accuracy *inverted* in the less-effective condition) — so it is repurposed as a **difficulty-calibration** input, which is exactly what prior ability is good for.

### 6.4 The inference layer (Bayesian now → ML-tuned later)

A **transparent Bayesian inference layer** on top of the six-family features:

- Per `(domain × work-mode)` cell, maintain a **calibrated, revisable belief**: a **prior** (environmental inventory + aptitude tilt + discretionary-XP prior) updated by active signals **over a trajectory**, novelty-discounted, voluntary/prompted-separated, missingness-as-missing.
- A **low-rank factorization** over the domain×mode grid separates a **topic loading** from a **work-mode loading** (the row-vs-column crux) — solved by the model, not a heuristic. This is the mechanism that distinguishes *"loves deduction"* from *"loves mathematics,"* i.e. domain interest from wrapper/style interest. Marginals are **weighted by evidence mass**, so a cabin with one artifact does not get equal footing with a cabin with seven.
- **The work-mode read is a nuisance covariate, not a trait** (`06-…` §8.3, revised D6). The nine modes have **no established developmental basis at ages 6–8** (the only surviving age-specific finding is negative), and mode/activity preference has a low stability ceiling (~.31 rank-order consistency in childhood; ~40% stable hierarchies over months; ~60% stability *within a single sitting*). So mode is re-estimated continuously, requires **multiple occasions** before any attribution is reported, and is **never surfaced to a child and never used to route content** — see §11. Its only job is to soak up variance so the *topic* read is clean.
- **Confidence gates are day-spanning, not just count-based.** Evidence must span **≥2 distinct days** in addition to meeting an evidence-mass floor; a low mass floor (e.g. 3 events) reads "confident" far too early against the stability figures above. Exact values are calibratable (§14.3); the *direction* is fixed.
- **`aptitudeTilt` is down-weighted at ages 6–8.** The SMPY evidence it rests on identifies at **age 13** and supplies no validated early-childhood analogue; early ability rank order at age ≤7 does not reach group-decision stability until ~16. It re-orders, never gates (§5.6).
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
3. **Scaffolding level** — more structure-before-struggle for less-developmentally-ready kids, because productive failure backfires for the youngest (Sinha & Kapur 2021). Converging support: in the four-phase model, a Phase-1 learner **cannot sustain engagement unaided** — support from people *or* from the instructional design itself is a necessary condition, and independent re-engagement only becomes an indicator at Phase 3.
4. **A delayed, out-of-product probe is mandatory at 6–8, not optional** (`06-activity-design-ages-6-8.md` §2.2/D3). Because in-session telemetry discriminated nothing at ages 7–8, the read is not trustworthy without: (a) a **pressure-off return window** (no prompts, no assignment, no reward; ~2 weeks is the validated initiation window), and (b) a **delayed guide/parent report at ~7 weeks** (validated 32–67 days, mean 51) coding the interest as **`focused`** — bound to the specific triggering materials — versus **`broad`** — transferred to the topic or practice itself. `focused` vs `broad` *is* the wrapper-vs-domain distinction, operationalized. Consistent with item 2: parent-observed behaviour carries more weight at 6–8. These reports are triangulated alongside behaviour, never pooled into it.

---

## 10. Discovery's Exit: Evidence for the Graduation Gate

Discovery does not "promote" a kid by itself; it produces the **evidence** the gate consumes. A candidate is ready to certify the **Hidi–Renninger Phase 2→3 crossing** when its top cell shows depth-weighted **self-initiated return that survives a ≥2-week no-prompt/no-new-content gap** and **holds across a full term** with flat/rising depth, plus a **perseverance artifact** (iteration past a failure), plus a **human autonomy sign-off**. (Full gate operationalization: Pipeline PRD.) Low-commitment deepening starts *before* the gate — the gate governs *expensive commitment*, not access.

---

## 11. Guardrails & Refusals

**Hard refusals (non-negotiable):**
- **No affect/face/emotion detection** — scientifically invalid (Barrett 2019) and illegal in EU education (EU AI Act Art. 5). We read behavior, never faces.
- **No AI-text/plagiarism detectors aimed at a child** — inaccurate and discriminatory (Liang 2023: 61.3% false-positive on non-native writers; Weber-Wulff 2023), and contradicts EvidenceGraph SPOV 4.
- **No rewards/streaks on the signal** (reward-undermining; §4.3). Now over-determined for our age band: engagement-contingent rewards — points merely for spending time, the direct analogue of a points-for-play shell — are the **only contingency with a significant age moderator on free-choice motivation**, and its child estimate is large (**d = −0.46**, 43 studies, vs −0.21 in college students, Qb = 6.76, p < .01). The undermining **grows rather than decays**: −0.35 immediate → −0.49 within a week → **−0.55 after ~2 weeks**, and every delayed-assessment study used children. Praise is not a safe substitute at this age (d = 0.11, ns, vs 0.43 for adults). **Detection warning:** behavioural undermining (−0.46) far exceeds self-reported undermining (−0.15), so a rewarded child can still *say* they like the domain while voluntarily returning less — only a behavioural pressure-off probe catches this (§9.4).
- **No routing from an inferred work-mode, and no work-mode ever surfaced to a child.** Routing content, instruction, or recommendations from a *measured preference* asserts the learning-styles **meshing hypothesis**, which owes a crossover (disordinal) interaction design that has essentially never been produced — and several methodologically adequate studies contradict it. Under this refusal the mode axis stays a legitimate nuisance covariate (§6.4). The concierge routes from what the child **chose or asked for**, never from a mode-marginal (§5.5).
- **No duration in a belief term** (§6.2). Dwell is a validity gate and a diagnostic only.

**Soft guidelines (strong defaults, revisable):**
- No scalar "passion score," ranking, or fixed label (O'Keefe/Dweck/Walton). This extends to any **child-facing** ranked or quantified display of the child's own engagement: a visible time-on-task ranking makes the measured quantity a target, converting the instrument into an engagement-contingent reward, and "your interests" framing asserts the fixed, discovered-interest model that collapses resilience. Operator/guide-facing readouts are fine.
- Signals say **"what to offer next," never selection.** Early identification at 6–8 is unreliable to the point of being unusable for selection: ability rank order at age ≤7 doesn't reach group-decision stability until ~16; ~60% of grade-3 top-3% scorers fall out within a year and 60–65% by grade 8, with *single-domain* subtests less stable than composites; in sport, junior performance explains 2.2% of senior variance, ~0 at ages 11–13.
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
6. **Six of the eight launch cabins have no age-specific evidence at all** (`06-activity-design-ages-6-8.md` §6). The verified base at 6–8 covers mathematics, music, dance/movement, sport, and thinly chess — and essentially nothing on programming, visual art, engineering/making, field science, writing, or second languages. Domain onsets are genuinely staggered, so "all cabins are equally enterable at 6" is an assumption we are currently making without support.
7. **Cross-cabin comparability is not yet defensible.** Games-methodology guidance explicitly cautions against operationalising different constructs as different games (feature-matching failed on an off-list dimension in the canonical case), and **generic game affinity independently predicts voluntary return** (β = 0.267, p = .003) — going non-significant only when thresholded on *above-median* play intensity. Mitigations: hold the shell constant and vary only content binding; threshold on intensity rather than any-play; carry an artifact **appeal baseline** once cross-child data exists. Until then, cross-cabin comparisons ship with the caveat attached. **Cabins must also be roughly equal in polish** (§5.3) — this is a *measurement* requirement, not a finish nicety.
8. **No validated instrument separates domain interest from wrapper interest at 6–8**, and voluntary return **loads on both**: in a fully controlled model, in-game performance (β = 0.565) *and* game enjoyment (β = 0.458) both contributed non-redundant variance. Hence the two-sided response — remove the separable wrapper (intrinsic integration, §5.4) *and* probe outside the product (§9.4) — rather than a better in-product metric.
9. **How many domains to sample before narrowing is not answered by the literature.** What is supported is a negative and a direction: do not make pursuit exclusive or year-round at 6–8, keep sampling, defer exclusive investment to late adolescence. Any specific breadth number we ship is ours, not the evidence's.
10. **Do not validate behavioural traces against child self-report.** In the reference case a trace persistence measure correlated **r = −.01 / −.06** with an 8-item self-report. Convergent validation must use covert performance measures dimensionally matched to the task's demands (see `hardening/06`).

---

## 15. References

- Brainlifts: `docs/research/gtBrainlift.md`, `passionBrainlift.md`, `familyBrainlift.md`.
- Research memos: `docs/research/passion-pipeline/{01-interest-consolidation-graduation, 02-push-vs-backoff-burnout, 03-talent-development-spine, 04-reversibility-plurality-switching, 05-assessment-measurement, 06-activity-design-ages-6-8}.md` (full citations within).
- **`06-activity-design-ages-6-8.md`** is the evidence base for §5.4, §5.7, §6.2–6.4, §9.3–9.4, §11 and §14.6–14.10 — activity formats, wrapper-vs-domain separation, and work-mode validity at ages 6–8. **Read its §8 amendment** (finder-only scope) before acting on its §3/§5. Raw verified reports in `docs/research/passion-pipeline/raw/06a–06d`.
  - **Evidence-strength caveat that applies to every §-reference above:** the 6–8 band is under-evidenced. Most findings carry 2-1 verification votes and "medium" confidence, and the strongest studies sit at ages 9–12 or in undergraduates. Numeric thresholds derived from it are calibratable defaults per §14.3, not settled constants.
- Engine change request derived from it: `docs/proposals/interest-engine-data-collection-v2.md` (E1–E12; revised `CellEvent` contract, constants, phasing, and the expected `specs/011` test fallout).
- Precedents: `docs/research/interest-lab-world-precedents.md`, `interest-lab-hybrid-vs-full-3d.md`.
- Key sources: Hidi & Renninger (2006); Harackiewicz et al. (2008); Boeder et al. (2021); Nye et al. (2012); Deci, Koestner & Ryan (1999); Saqr et al. (2022, 2023); O'Keefe, Dweck & Walton (2018); Barrett et al. (2019); Liang et al. (2023); Weber-Wulff et al. (2023); Sinha & Kapur (2021).
