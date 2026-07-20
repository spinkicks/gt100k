# GT100K PRD Refinement — Living Synthesis

> **Status:** working document, appended across a self-paced refinement loop on 2026-07-20.
> **Purpose:** stress-test `docs/prd/PRD.md` (v1.10) against the originating `docs/research/gtBrainlift.md`, hunt for gaps, argue the contested points from both sides, and brainstorm missing product ideas — while staying true to brainlift ideals.
> **Not authoritative.** This is analysis and proposal, not a spec change. Anything adopted must go through the normal PRD/governance workflow (authority order in `README.md`). G-class rights/safety in `GOVERNANCE.md` and the constitution win over anything proposed here.
> **Method:** each loop iteration dispatches subagents to argue a contested point or hunt a gap; their briefs are distilled into the sections below. Iteration log at the end.

---

## 0. The meta-thesis: a governance-first reconciliation of a governance-hostile brainlift

The brainlift is deliberately *spiky*: it picks five positions each "false to current consensus, and true anyway," and it is unapologetic about the intensity elite results demand. The PRD (v1.10) is a **governance-first reconciliation** of that brainlift. In converting thesis into a buildable, defensible product, the PRD has *blunted the edge* of every one of the five SPOVs — sometimes as a necessary legal/ethical correction, sometimes (arguably) at the cost of the actual bet.

The single most important question for this refinement: **Is GT100K still the brainlift's program, or has it quietly become "an excellent, safe, well-governed gifted school" that dropped the spiky bets that were the whole point?** The brainlift's one-line summary is that *environment totality* is the dominant lever. The PRD forbids home sensing, runs a bounded school-day dose, and made contracts renewable. If the dominant lever is the home environment and the product can only touch 3–4 school hours, the central hypothesis may be structurally untestable inside the mainline product.

This is not a call to un-govern the product. The rights dials are correct and must hold. It is a call to notice *where the softening is load-bearing* and either (a) recover the brainlift's intent through an ethical mechanism, or (b) state plainly that the bet has been dropped and why — rather than letting the brainlift sit in the repo as a "foundation" the product no longer honors.

### 0.1 The five softenings (brainlift → PRD)

| SPOV | Brainlift ideal (spiky) | PRD (v1.10) reconciliation | Softening verdict (pre-debate) |
|---|---|---|---|
| **1 — Select the family, not the child** | TV-free homes, a parent on the hook daily, **legally binding 8-yr continuation contracts**, psychological profiling of parents to predict who folds | Support-adjusted **renewable** partnership; irrevocable contracts **rejected**; family-execution model is **advisory only**, never a selection input; no home surveillance | **Heavy.** The selection mechanism the brainlift called the #1 lever is now a support program with an advisory nudge. |
| **2 — Gate on IQ ~120–125** | A hard cognitive floor, stated "without flinching," a full SD below the gifted-establishment line | Cognitive Floor Engine repositioned from **admission gate** to **placement/readiness**; admissions team gates on external CogAT; 120–125 is a *hypothesis to be validated* | **Light.** The floor idea survives; ownership moved and the number is (correctly) treated as unvalidated. Most faithful of the five. |
| **3 — Homogeneous grouping, ruthless competition** | Cohorts of 5–6, direct competition, rivalry "kills the dead weight of the slowest kid" | Cohorts of 6, near-peer; but competition is dose-metered, opt-in, anonymized, **no-bottom-rank**, non-harm floors, guide can remove it entirely | **Moderate.** Grouping kept; the *ruthless competition* engine is heavily de-fanged. |
| **4 — Specialize brutally early, BURN breadth** | Ages 6–14 on a narrow spine; "enrichment buffet deleted"; breadth is a cheap late-teen bolt-on | Program **protects breadth** ("strong foundations across the other fields the state/federal curriculum requires"); wildcard exploration floor; Spine Curriculum Generator's "breadth elimination" **rejected** | **Direct inversion.** The PRD does the opposite of the SPOV. This is the sharpest contradiction. |
| **5 — Friction is the product; make help hurt** | Refuse the answer; **decayed ELO reward** so shortcutting is "mathematically worthless"; discomfort built in on purpose | Answer-blind tutor kept; punitive decay **rejected**; replaced with **non-punitive potential-based** independence reward — "asking for help costs nothing" | **Contested.** Arguably a *cleverer implementation* of the same incentive (potential-based shaping is reward-equivalent), or arguably the removal of the "hurt" that was the point. |

### 0.2 The yield question (the sixth tension)

The brainlift's guardrail: "optimize for the students who thrive at full intensity and **route the rest into ordinary excellent schooling**." The PRD renamed "no-scrap" to **no-abandonment**, reframed routing as a **change-of-fit**, and committed an **intent-to-treat** yield denominator (all children ever enrolled; routed-out counted as non-attainment). This is more honest and more humane — but it also quietly concedes that a meaningful fraction won't reach the age-14 bar, which sits uneasily with a "100,000 enrolled reaching MIT-readiness" promise. The honest ITT number is the right call; the open question is whether the *program economics and marketing* have absorbed what that number will actually be.

---

## 1. Gap inventory (first pass — to be deepened by subagent debate)

Ranked roughly by how load-bearing the gap is.

1. **Environment totality has no delivery mechanism.** The brainlift's #1 lever is the total environment (home/peers/immersion). The PRD can only touch a 3–4 hr school block + afternoon, with *no* home sensing and renewable (not binding) family commitment. There is no product surface that delivers "immersion" outside school hours in an ethical, non-surveillance way. **This is the deepest gap** — the central hypothesis may be untestable in the mainline product. *(Candidate fix: §3 brainstorm — Home Environment Compact, peer-family geographic pods, sibling/parallel enrollment.)*
2. **Guide/mentor supply at 100K scale is hand-waved.** 1 guide per ~20 learners → ~5,000 guides who are "experts across a variety of technical fields, extensively trained." Recruiting, training, and retaining 5,000 expert-generalist guides is arguably a harder problem than any software system in the PRD, and it has no pipeline, no cost model, no fallback. *(Candidate fix: grow-your-own near-peer guide ladder — SPOV-aligned.)*
3. **Unit economics / who pays.** 100K learners × (expert guides + isolated Firecracker workspaces + LLM inference + equipment loans + expert minutes + family compensation) has no cost-per-learner, no funding model, no sustainability story. The brainlift mentions "my capital" and family "compensation" but the PRD is silent on money at scale.
4. **Age-14 exit / off-ramp is nearly absent.** "MIT-level readiness by end of 8th grade" — then what? At 14 the child is 3–4 years from college. There is no continuation credential, early-college bridge, high-school transition, or "what happens to a 14-year-old with AP Calc BC and no high school." The Passport exists but the *institutional* off-ramp does not.
5. **Legal schooling status is undefined.** Is GT100K a school (accreditation, diploma, teacher-of-record, compulsory-education/truancy compliance)? Or a supplement to enrollment elsewhere? The 3–4 hr academic block + afternoon implies it may *replace* normal schooling for 6–14 year-olds, which triggers a large body of education law the PRD never names.
6. **Content library production at depth.** A grade-by-grade content library is explicitly out of scope, yet the enrichment/olympiad track, the six-domain Interest Lab, and per-domain project ladders all require enormous authored content. TimeBack supplies core academics; the *rest* (passion domains, olympiad, adapters for software/research/robotics/startup/documentary/audio) is a content-production problem with no plan.
7. **The pool→100K funnel math is unreconciled.** "Filtering and selecting from a pool" (brainlift) vs. admissions-team-owned CogAT with Track A/B. What's the applicant pool size, Track A/B mix, and yield to hit 100K enrolled? Owned elsewhere, but the *program* depends on the number and never states it.
8. **Cohort-of-the-floor pressure question.** SPOV 3 wants rivalry to manufacture elite pressure. But a cohort of six students *all* at the 120–125 floor may not generate the "rivalry a one-on-one tutor can't fake" — you may need variance/spikes in the cohort. The compiler matches on pace/velocity, not on the presence of a pace-setter. Unexamined.
9. **Twice-exceptional (2e) intensity interplay.** Glossary defines 2e; the accommodation rules are strong; but the *interaction* of full-intensity dose with a co-occurring disability (when accommodation and intensity pull opposite directions) is under-specified.
10. **Multi-year outcome/eval design.** The whole thesis is unfalsifiable in the 4-month synthetic build. There's no committed longitudinal evaluation design (cohorts, comparison groups, pre-registration) for the 8-year outcome — so the program could run for years without ever testing its own central claims.

---

## 2. Contested-point debates (filled by subagent briefs)

> Each subsection distills a dispatched subagent's steelman-both-sides argument, then states a synthesis recommendation. **Pending first batch.**

### 2.1 The Breadth Betrayal (SPOV 4) — *pending*
### 2.2 The Friction Softening (SPOV 5) — *pending*
### 2.3 The Family-Selection Retreat (SPOV 1) — *pending*
### 2.4 Environment Totality without Surveillance — *pending*

---

## 3. Brainstormed missing ideas (to be developed)

> Seeded now; expanded as debates conclude. Each must stay true to a brainlift ideal *and* respect the G-class rights dials.

- **Home Environment Compact (no surveillance).** Recover "environment totality" ethically: family-authored (not platform-mandated) rituals, opt-in shared-family learning artifacts, and a *self-reported, non-scored* home-rhythm plan the Family OS supports — delivering immersion via family agency, not sensing.
- **Peer-family geographic pods.** Manufacture Polgar-style immersion through *peer density* rather than the home: cluster enrolled families geographically so cohorts share physical space after school by choice. Environment totality via peers (SPOV 3) instead of via home surveillance.
- **Grow-your-own guide ladder.** Solve the 5,000-guide supply problem *and* honor near-peer pedagogy: program graduates and advanced learners become near-peer tutors/assistant guides on a structured ladder. Cheaper, scalable, and SPOV-3-aligned.
- **Age-14 exit ladder.** Continuation credential + early-college/dual-enrollment bridge + explicit high-school transition so a 14-year-old with 5s isn't stranded.
- **Radical-Dose track as the brainlift's preserve.** The §31.1 / G8 quarantined R&D track is the *ethical home* for the spiky bets (environment totality, harder friction, breadth-burning) — tested under separate consent with no live-child authority. Sharpen it so the brainlift is honored *somewhere* rather than nowhere.

---

## Iteration log

- **Iteration 1 (2026-07-20 ~17:57 CDT).** Read PRD v1.10, brainlift, README/governance map. Wrote meta-thesis (§0), the five-softenings table, the yield tension, a 10-item gap inventory (§1), and seeded debates (§2) + brainstorm (§3). Dispatched first batch of subagents to argue §2.1–§2.4. *(Synthesis of their briefs pending next iteration.)*
