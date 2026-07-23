# Specialization & Pipeline PRD — The Passion Lab Student Journey

**Status:** Draft v1 · 2026-07-22 · Owner: (product)
**Grounding:** Source-of-truth design agreed in a structured design session, grounded in the brainlifts (`docs/research/gtBrainlift.md`, `passionBrainlift.md`, `familyBrainlift.md`), the `@gt100k/evidence-graph` MVP, and the five cited research memos in `docs/research/passion-pipeline/`. Every consequential decision is tied to that evidence.

> **Companion doc:** the discovery half lives in `DISCOVERY-APP-PRD.md`. This PRD owns the **full student pipeline** and the **specialization ascent** — from enrollment through the graduation gate to the age-14 handoff.

---

## 1. Purpose & Scope

This PRD defines the **end-to-end journey** a child aged 6–14 takes to discover a passion and specialize in it toward a world-class trajectory, and it owns the **specialization** half in full: the graduation gate, the staged spine, the Specialization Planner, EvidenceGraph integration, mentorship/audience sourcing, the family amplifier, the push/back-off + burnout system, and outcomes.

**In scope:** the pipeline skeleton and timeline; the graduation gate; plurality/reversibility mechanics; the 4-stage specialization spine; the Planner; EvidenceGraph process assessment + defense; the human/software boundary and expert/audience sourcing; family co-engagement mechanics; the push/back-off + burnout playbook; outcomes/metrics/external validation.

**Out of scope (see Discovery App PRD):** the discovery experience, the world/cabins/concierge, the interest-signal measurement model, and the hypothesis object (this PRD *consumes* that hypothesis).

---

## 2. The End-to-End Pipeline

### 2.1 Shape: a shifting blend, not sequential phases

Discovery and specialization are **not** two sequential phases with a hard handoff. They are a **shifting blend**, and **each spike moves through the pipeline independently** (a kid can be specializing spike A while still discovering spike B):

- **Discovery-dominant** early → **blended** in the middle → **specialization-dominant** later.
- Emphasis shifts by **experience/readiness, not age** (Sosniak/Bloom: prior experience is at least as good an instructional guide as age). Age bands throughout are *indicative*, never gates.

### 2.2 Fast start, escalating commitment

Discovery is **fast and experience-gated**, not an age-bound phase:

- A **provisional spike** can form in weeks. The moment a candidate looks promising, **low-commitment deepening begins immediately** (this is Stage 1 / Ignition — deliberate play, ~0 formal practice) — and that early deepening *is itself the durability test*.
- **What escalates over the term is *commitment*, not *access*.** The graduation gate governs *expensive commitment* (mentor relay, real deliberate-practice load, the protected spike slot, big projects), **not** the right to touch the domain deeply.
- **Backpedaling is cheap:** if it was novelty, it fades and the child re-explores (Park, no penalty).
- **Pace is domain-calibrated:** in early-peaking domains (piano, chess, gymnastics, competition math) the ramp is legitimately steeper and earlier; in late-peaking domains, keep more sampling first.
- **Honest constraint:** early enthusiasm is a weak predictor (Boeder; Harackiewicz), so a *deterministic* early read isn't achievable — we start fast and *confirm over time*, which cheap reversibility makes safe.

### 2.3 Daily container (the two-block loop)

- **Morning:** TimeBack academics to a raised daily XP gate (minimum per section + discretionary remainder). Discretionary allocation = weak interest prior; achievement = aptitude tilt.
- **Afternoon:** the **passion block** — Discovery and/or Specialization (they run concurrently across a kid's plural spikes). Reward-neutral; hitting the academic gate *sequences into* it but never *scores* it.

---

## 3. The Graduation Gate (Discovery → Expensive Commitment)

The gate certifies the **Hidi–Renninger Phase 2 (maintained situational) → Phase 3 (emerging individual) crossing** — the point where interest becomes a self-generated predisposition to reengage with perseverance and self-set goals, i.e., the capacities mentor-led PBL and deliberate practice actually consume (interest-consolidation memo).

**A candidate spike is certified when its top `(domain × work-mode)` cell shows ALL of:**

1. **Depth-weighted, self-initiated return that survives a deliberately inserted ≥2-week no-prompt / no-new-content gap** (novelty filter), and
2. **is sustained across a full term (~8–12 weeks, ≥2 review cycles) with flat-or-rising depth** (durability is a months-scale property; short windows only filter novelty), **plus**
3. **at least one EvidenceGraph artifact showing iteration *past* a failure** (a perseverance signal — return + made something, not novelty clicks), **plus**
4. **a structured human autonomy sign-off** that the return is **autonomous (harmonious), not pressured, rewarded, or defaulted** — invisible to logs, so a human must confirm it.

**Notes:**
- The numeric thresholds are **calibratable engineering defaults**; the *horizons* (gap length, term) are evidence-anchored, the *counts* are ours to tune on the first 6–14 cohorts.
- **Evidence is weighted by capability**: parent-observed behavior dominates for young/pre-verbal kids; self-articulated value earns weight as the child can reliably give it (handled by the inference layer's reliability weighting).
- Promotion is **human-authored** (AI drafts the recommendation; a human owns it) and is a **hypothesis getting stronger, never a locked verdict**.
- **Stage-to-stage transitions** within the spine use the same principle: **readiness-gated, human-owned**, re-checking fit at each gate (ability keeps steering the domain; SMPY).

---

## 4. Plurality & Reversibility

- **Age-graded convergence** (indicative): **3 light candidates @ ~6–8 → 2 @ ~9–11 → 1 lead + 1 *mandatory* protected second @ ~12–14**, hard ceiling of 3 ever. The mandatory second is the structural antidote to **identity foreclosure** (Marcia) — the real hazard, not switching.
- **Every exit defaults to "Park," never "quit"** — reversible, no penalty, never deleted. The sunk-cost "you've invested too much to stop" instinct is an *adult* bias children largely lack, so retention is never justified by prior investment.
- **Continuation is an active re-choice checkpoint (~every 6 months)**, not a default.
- **Healthy-switch-vs-quitting decision rule:** a switch is **healthy** when it's a **cool, approach-driven** move toward something the child already voluntarily returns to, made **after clearing ≥1 real difficulty**; it's **avoidance** when it's a **hot, away-from-difficulty exit at the first wall**, justified by an identity verdict ("I'm not a ___ person"). Gently resist **only** the hot-state and first-wall cases, and only by **cooling down + scaffolding the obstacle** — never by forbidding; then honor the child's choice.
- **Plural spikes run parallel stage clocks**, each its own spine with its own mentor relay and cadence — **no transfer discount** (far transfer largely fails; Sala & Gobet 2017).

---

## 5. The Specialization Spine (4 stages, experience-gated)

One spine, four stages, gated by **experience/readiness, not age**. A validated spike enters at Stage 1. Terminal artifact at ~14 is a **ready-to-invest performer** — a signature body of work + a tamper-evident EvidenceGraph + a defensible portfolio — **not eminence** (an adult outcome; the heavy investment years belong to 16+). (Talent-spine memo; Subotnik et al. 2011; Bloom 1985; Côté 2009.)

| Stage | Indicative band | Mentor role (the relay) | Project cadence & audience | Deliberate-practice dose | Lead PCDEs (psychosocial) |
|---|---|---|---|---|---|
| **S1 — Ignition** ("fall in love") | ~6–9 / first 12–18 mo post-validation | **Warm first mentor** — relatedness-first; protects the "rage to master" | Many short (2–4 wk) playful micro-projects; audience = *self* (+ family); high deliberate **play** | Near-zero formal DP | Enjoyment, relatedness, identity spark ("I do X"), basic self-regulation |
| **S2 — Foundations** ("get precise") | ~9–11 | **Technical mentor** — standards, correction; sets challenge≈skill (ZPD) | Fewer, term-length projects (2–3/yr); audience = *mentor + peers* | Small, bounded DP embedded in projects; rising fraction; rest cycles enforced | Goal-setting, quality practice, planning, realistic self-evaluation; buffer the early-adolescent motivation dip |
| **S3 — Authorship** ("make it real") | ~11–13 | **Domain-expert mentor** — transmits *insider knowledge*, opens doors, brokers next tier | 1–2 major Renzulli **Type III** authentic real-audience projects/yr; EvidenceGraph wraps each | Moderate, targeted DP serving the project; still capped below investment loads | Coping with public feedback, strategic risk-taking, self-advocacy; learner→producer shift begins |
| **S4 — Signature** ("find your voice") | ~13–14+ → hand off to investment years (16+) | **Master mentor** — near-peer apprenticeship; shapes personal style; opens field networks | One flagship portfolio-defining project + coherent evidence body + public defense | Highest in-program DP, still bounded; child self-directs the regime | Autonomy/ownership, resilience under stakes, managing competition, networking/insider access |

### 5.1 The mentor relay (handoffs are first-class)

The mentor is a **sequence** (warm → technical → expert → master), and the highest-value mentor act is **access-transfer** — brokering the next tier and its insider knowledge (Bloom 1985). Each handoff is engineered as a **designed event** (overlap, warm introduction, explicit "why now"), because botched transitions are where pursuits die. "Access transferred" (introductions, auditions, real-audience placements) is tracked as a mentor deliverable. In the software-first model (§7), most of this relay is AI-delivered, with the *relational/door-opening* parts carried by family + a thin expert layer, concentrated at S3–S4.

### 5.2 Deliberate-practice dosing rules (bounded Ericsson)

1. DP **always serves a child-owned goal, embedded in a project** — never a free-standing drill regime.
2. **DP fraction rises with stage** (≈0 in S1 → highest-but-capped in S4); deliberate **play** is the early substitute (Côté).
3. **Never reach investment-year loads before 14.** Enforce AAP-style rest: **≥1–2 days/week off, ~3 months/year off the primary spike** (in ~1-month increments) (Brenner/AAP 2016).
4. **Set challenge ≈ skill (ZPD)** so DP produces flow, not burnout.
5. **No contingent extrinsic rewards** on intrinsically interesting work (protects the rage to master; reward-undermining worst in our ages).
6. **Don't over-index on hours** — most performance variance is elsewhere (Macnamara 2014: DP explains ~4–26%); invest equally in mentoring, opportunity, and psychosocial skill.

### 5.3 The PCDE curriculum (staged, embedded, assessable)

Psychosocial skills are the **actual rate-limiter** and are **teachable** (Subotnik 2011; MacNamara/Button/Collins 2010). Treat PCDEs as a graded curriculum **embedded in project work** (not a standalone class), AI/mentor-coached, and **assessed via the EvidenceGraph process + defense**, introduced **progressively by readiness**: S1 relatedness/enjoyment/identity/self-regulation → S2 goal-setting/quality-practice/self-evaluation → S3 coping-with-feedback/strategic-risk/self-advocacy → S4 self-direction/resilience/networking + the explicit learner→producer identity shift. Design the mentor+family environment to be **"complex"** (high support *and* high challenge together; Csikszentmihalyi).

---

## 6. The Specialization Planner

A **living, adaptive, project-first** planner (AI-drafts, human-owns):

- **Input:** the validated spike (`domain × work-mode`) + aptitude tilt + environmental access + current stage + history.
- **Output:** a **staged sequence of increasingly ambitious Renzulli Type III real-audience projects**, with **bounded deliberate practice embedded** and PCDEs woven in; **ambition scales by widening the audience, not adding hours**.
- **Generation:** LLM-generated **personalized** project/curriculum drafts, **grounded in a curated library + RAG** (so niche spikes are covered, not just library topics); every draft **human-reviewed**.
- **Adaptation:** **continuously replans** against progress, mastery, voluntary return, and burnout signals — keeping challenge in the **80–90% stretch zone** and **cutting pressure before difficulty** when strain shows (§8).
- **Wrapping:** the EvidenceGraph wraps every project (§7 below).

---

## 7. Human/Software Boundary, EvidenceGraph & Sourcing

### 7.1 Software-first, thin high-leverage human layer

- **AI conducts** instruction, coaching, curriculum, practice, measurement, and **runs the Socratic oral defense** (LearnLM RCT: AI Socratic tutoring matched human tutors).
- **A human only *owns*** the final grade and the **autonomy/wellbeing sign-off** (EvidenceGraph SPOV 6: a human owns every grade — human *ownership*, not human labor on every step).
- **Families carry the relational load** (§9); **expert-human touch is back-loaded to S3–S4** and kept thin (few kids are at the top of any one domain at once, so expensive expert time is concentrated and high-leverage).

### 7.2 EvidenceGraph integration + assessment

- **Every specialization project is wrapped by the EvidenceGraph** — a tamper-evident, content-addressed DAG of the real process, with declared AI help as a neutral, status-equal node (honesty is architecture; SPOV 6).
- **Grade the process, not the polish** — a messy-deep process can outscore a clean-shallow one, and a reasoned honest failure can outscore a tidy success (Kapur productive failure).
- **The rubric is readiness-staged, NOT age-staged.** Productive failure *reverses* for the least-ready learners (Sinha & Kapur 2021) because it requires domain prior-knowledge + self-regulation. So scaffolding/rubric key off **measured domain experience + aptitude/ability + self-regulation**, estimated from demonstrated behavior — catching the genius-8yo (low scaffold, productive-failure rubric) and the floundering-14yo (more structure) correctly. The soft self-regulation floor in the very young is handled by **measuring** readiness, not assuming from age.
- **Authorship is verified structurally, never by a detector:** a **sampled, multi-touchpoint, anxiety-safe interactive oral defense**, **age-adapted** (younger: talk-through / show-and-tell; older: Socratic probing on decisions & dead-ends), **AI-conducts + human-owns** (Dawson; Corbin/Dawson/Liu 2025). **No AI-text detector ever touches a child** (Liang 2023; Weber-Wulff 2023).

### 7.3 Real expert & real-audience sourcing (layered)

1. **Real *audiences* come from the internet at scale** — publish/compete/ship to genuine communities, competitions, marketplaces; software brokers submissions (competition calendars, community connections). "Widen the audience" scales online, no hire needed.
2. **AI carries the bulk of coaching + insider knowledge.**
3. **Family + their networks** supply relational/door-opening expertise (the DJ-dad *is* the audio expert).
4. **A thin, vetted expert network**, used **sparingly and high-leverage**, concentrated at S3–S4 milestones (portfolio review, real introductions, sampled defense sign-off).
5. **Near-peer mentoring** (advanced students → younger) as an amplifier.

---

## 8. Push / Back-off & Burnout Playbook

**Operating rule:** *Push the challenge, never the child.* Keep difficulty in the ~80–90% stretch zone; when strain shows, **pull the pressure/stakes lever before the difficulty lever**, and raise autonomy support as stakes rise. (Push/back-off memo.)

### 8.1 Two independent knobs

- **Challenge** (difficulty vs skill) — target **80–90% success**, **co-set with the child**. Moves: **PUSH / HOLD / SCAFFOLD.**
- **Pressure** (stakes, evaluation, deadlines, contingency of regard, surveillance) — Moves: autonomy support **UP / DOWN**. Default posture: **low control, high structure, high warmth.** "Back off" = **pressure down first**; only lower challenge if success genuinely leaves the zone.

### 8.2 Signal → action (behavioral only; no affect/face detection)

| Behavioral state | Read | System action | Human action |
|---|---|---|---|
| Return rising, depth rising, success **>90%**, picks harder | Under-challenged | **PUSH** (raise difficulty, fade scaffold, *offer* a stretch/real-audience milestone) | Offer stretch project; co-set a bigger goal; keep the choice the child's |
| Return/depth stable, success **80–90%**, no strain | In the zone | **HOLD** (vary reps, continue fade) | Light touch; **resist adding stakes**; protect autonomy |
| Success **<70%**, give-ups rising, no devaluation | Over-challenged | **SCAFFOLD** (lower into zone, smaller wins) | Normalize struggle; rebuild competence |
| External-stakes event or **parental-valuation spike** | Danger window | **Counter-cyclical autonomy** (no streaks/urgency; reduce evaluative surfacing) | Autonomy support **up**; state regard is unconditional; keep spike reversible |
| Exhaustion proxies + depth falling + return declining | Early burnout | **BACK OFF** (pressure down, load down; surface to human — never label the child) | Warm check-in; cut load/pressure; restore play; protect a light week |
| **Devaluation** (compliance-without-depth, cancels, stopped sharing) or obsessive-tip signs, or sustained multi-signal decline | Burnout / obsessive tip | **REST** (prescribe deload, stop nudges, hand to human) | Guilt-free reversible break; broaden identity (re-open plural spikes); remove family valuation pressure |
| A **gap** in return (missingness) | Ambiguous — a question | **No** auto-nudge/at-risk label; after threshold, flag a human | Curious check-in; distinguish life-event from devaluation |

**Reading rules:** weight **devaluation over exhaustion** (it predicts dropout 2.2–2.4×; Isoard-Gautheur 2016); **presence-without-depth is worse than a clean gap**; **push only from strength** (rising return + stretch-seeking, not just high success).

### 8.3 Burnout guardrails (non-negotiable)

1. **Never gamify the return** (no streaks/points/prizes/leaderboards on return or practice; informational feedback only).
2. **Regard is unconditional** (warmth never contingent on performance — the line between warm-demanding and tiger).
3. **The system proposes; humans dispose** — every back-off/rest/quit judgment is a human's; **no automated burnout label ever reaches the child.**
4. **Counter-cyclical autonomy** — any stakes increase auto-pairs with an autonomy-support increase.
5. **Keep spikes plural & reversible; watch identity breadth** (single-identity is an obsessive-passion antecedent).
6. **Prescribe rest proactively** (scheduled deloads, framed as reversible, never failure).
7. **Family protocol = warm-demanding** (structure + unconditional warmth + autonomy; off valuation-loading and contingent regard).
8. **Missingness is a question, not a verdict** (route to a human; no affect detection anywhere).
9. **Difficulty setpoint ~80–90% success, co-set with the child.**

---

## 9. Family Co-Engagement Mechanics (the amplifier, done safely)

The family is the **biggest lever** (familyBrainlift) *and* the biggest risk if mishandled — harm runs through **contingent self-worth and control** (Luthar 2020; Kim 2013), not through high expectations. So the mechanics **engineer toward warm autonomy-support and away from pressure**:

- **System-scaffolded, autonomy-supportive co-engagement:** give families **specific warm prompts** + **structured shared activities / showcases** + **door-opening asks** ("ask your kid to show you their project," "share your own hobby," "attend their showcase").
- **Actively coach families *away* from** contingent regard, surveillance, and "do it for me."
- **Monitor for family-driven pressure** via the kid's harmonious-vs-obsessive + devaluation signals, with **guide intervention/re-coaching** if it appears.
- **Family = relational/access amplifier, never assessor or judge** (the wellbeing/autonomy call stays with the thin professional layer — a pressuring parent can't also be the neutral judge).

---

## 10. North Star, Outcomes & Metrics

**North Star (domain-calibrated):** a **world-class trajectory + a signature portfolio** by 14; genuine **elite-junior standing** by 14 only in early-peaking domains (chess, music, competition math, gymnastics). Eminence is post-14.

**Success is multi-dimensional and measured at the *program* level (never kid-facing scores — a motivational dashboard would reintroduce reward-undermining):**

- **Progression** — stage advancement, competence growth, time-in-stage.
- **Spike outcome** — a validated differentiated spike + signature portfolio (domain-calibrated).
- **Wellbeing (co-primary, not a side-constraint)** — harmonious-vs-obsessive indicators, burnout/dropout rate, sustained voluntary engagement. **A spike achieved through burnout is a failure, not a success.**
- **Authorship** — defense pass rates + EvidenceGraph integrity.
- **External validation** — the **verifiable evidence packet** (EvidenceGraph portfolio + defense) valued by real gatekeepers (elite admissions, competitions, real audiences); real-world outcomes (competition results, published/shipped work, admissions); the **demand-side-pull bet** — get ≥1 gatekeeper to *require* the packet (the riskiest, highest-value bet; passionBrainlift Insight 15).
- **Longitudinal ground-truth** — track **which spikes persisted** to train the discovery inference layer over time (the labels that don't exist at launch).

Why a spike at all: at the most selective tier, a **deep, differentiated ("angular") spike beats an equally-credentialed well-rounded profile**, and the value is in the **thoughtful, verifiable process**, not novelty (passionBrainlift Category 5).

---

## 11. Guardrails & Refusals (shared with Discovery)

**Hard refusals:** no affect/face/emotion detection (Barrett 2019; EU AI Act); no AI-text detectors on a child (Liang 2023; Weber-Wulff 2023); no rewards/streaks on the signal (Deci 1999).
**Soft guidelines:** no scalar "passion score" / fixed label; missingness ≠ disinterest.

---

## 12. Non-Functional Requirements

- **Software-first** delivery; thin human layer owns judgments (§7.1).
- **EvidenceGraph:** content-addressed DAG, human-owned grades (`assertHumanAuthority`), declared-AI-help neutral. **Pre-live gates (non-production in the MVP):** transparency-log anchoring (D1), crypto-shred erasure (D2), comparative-judgment reliability (D3), conformal calibration (D4), durable public-export provenance (D5), attestation signing (D6).
- **Privacy:** minor data — data minimization + explicit consent scope; retention limits; no child data used to train third-party models; parental access. Right-to-erasure on an append-only store (D2) is a **pre-live gate, unsolved**.
- **Platform:** target school **Windows** machines; web stack shared with Discovery.

---

## 13. Open Questions / Pre-Live Gates

1. **Right-to-erasure on append-only child data** (EvidenceGraph D2) — must be solved before any live child.
2. **Demand-side pull** — securing ≥1 gatekeeper that *requires* the evidence packet (the pipeline's riskiest bet).
3. **Extrapolation validation** — the staged models, PCDEs, and burnout signals skew sport/music and adolescent; downward extension to 6–10 and sideways into academic/maker domains is ours to validate on real cohorts.
4. **Numeric thresholds** (gate horizons/counts, DP fractions, stretch-zone %, rest cadence) — calibratable defaults to tune per domain and child.
5. **Mentor-relay handoff design** — the operational detail of engineered, low-attrition handoffs at scale.
6. **Early-peaking-domain timelines** — compressed ramps + *extra* burnout guardrails, handled as flagged exceptions, not the default.

---

## 14. References

- Brainlifts: `docs/research/gtBrainlift.md`, `passionBrainlift.md`, `familyBrainlift.md`.
- Research memos (full citations within): `docs/research/passion-pipeline/{01-interest-consolidation-graduation, 02-push-vs-backoff-burnout, 03-talent-development-spine, 04-reversibility-plurality-switching, 05-assessment-measurement}.md`.
- EvidenceGraph MVP: `passion/packages/evidence-graph/README.md`.
- Key sources: Subotnik, Olszewski-Kubilius & Worrell (2011); Bloom (1985); Côté, Lidor & Hackfort (2009); Ericsson, Krampe & Tesch-Römer (1993); Macnamara, Hambrick & Oswald (2014); Renzulli (1977); MacNamara, Button & Collins (2010); Winner (1996); Csikszentmihalyi, Rathunde & Whalen (1993); Vallerand et al. (2003); Mageau et al. (2009); Bartholomew et al. (2011); Raedeke & Smith (2001); Isoard-Gautheur et al. (2016); Kim et al. (2013); Grolnick & Pomerantz (2009); Deci, Koestner & Ryan (1999); Sinha & Kapur (2021); Dawson / Corbin, Dawson & Liu (2025); Marcia (1966); Sala & Gobet (2017); Hidi & Renninger (2006); Boeder et al. (2021); Harackiewicz et al. (2008).
