# Q&A Prep — Final Presentation (PassionLab × EvidenceGraph)

**For:** the 5-minute demo + Q&A with Joe (skeptical, sharp, pro-extrinsic-reward).
**How to use:** every answer below is a *say-it-out-loud* line (**bold**) → the sourced backing → the honest concession. Joe rewards expertise and honesty; **volunteer the weak spot before he finds it.** Citations are traceable to code (`file:line`) and the `RESEARCH-*.md` / brainlift corpus.

> Golden rule for the whole Q&A: **claim only what the evidence supports, concede the rest, and show you know exactly where the line is.** The negative claims (duration is a bad signal; detectors are biased; rewards corrupt the discovery signal) stand on far firmer ground than the positive ones — lead with the negatives.

---

## 0. The two questions we are almost certain to get

### Q: "Which signal do you actually use to calculate a spike?"

**"We count a child's *unprompted choices* — coming back to something on a later day, taking the harder version, finishing something that broke — never how long they sat there. Time-on-task is banned from the math on purpose."**

- Per `(domain × work-mode)` cell we hold a **Beta-Bernoulli belief** (`interest-inference/src/posterior.ts:5-26`). Signals that move it (`fold.ts:106-178`):
  - `cross_day_return` (came back on a *later UTC day*, unprompted) → **α += 1.0** — the strongest signal.
  - depth actions `chosen_challenge` / `unrequired_revision` / `failure_recovery` / `self_authored_scope` → **α += 0.5**.
  - a delayed, out-of-product adult interview (`external_report`, broad scope) → **α += 0.25** *(weight is ours, not calibrated — see weak spots)*.
  - `skip` (a known love passed over) and `decline` (never tried, on offer) → **β**, and **divided by the choice-set size** (breadth-invariance).
- **Duration is structurally impossible to submit** — there is no duration field on the event type at all (`model.ts:138-181`); the old free-numeric `magnitude` field was deliberately deleted so "an emitter cannot smuggle a duration in." PRD is explicit: *"duration is barred from any belief term… dwell is non-monotonic in interest"* (`DISCOVERY-APP-PRD.md:6,168`). Rationale: at the youngest band, **choice predicts durable interest and dwell does not** (dwell is confounded with struggling/familiarity).
- **A "spike" is a conjunction, not one number.** A cell qualifies only when **all** hold (`model.ts:47-61`, applied `aggregate.ts:4-10`):
  - `observedMass ≥ 6` (undecayed observations; raised from 3 — "3 returns is one afternoon of enthusiasm"),
  - over **`≥ 2 distinct UTC days`** ("a count can be run up in an afternoon; a calendar cannot"),
  - confidence-interval width `≤ 0.35`,
  - **the *lower bound* of the interval `≥ 0.6`** (we rank by the pessimistic bottom of the band, not the mean — `aggregate.ts:7`).
- **Breadth-invariance** (`test/breadth-invariance.test.ts`): a curious kid who explores widely must not have their real favorite drowned out. Without the choice-set normalization, the favorite's mean erodes (0.647 → 0.407 → 0.262 as known cells go 2→4→7) and past ~4 cabins the spike falls below 0.6 and becomes **undetectable**. Fixed: mean holds within <0.01 across 1/3/6 alternatives.

### Q: "How do you manage motivation without gamifying it?"

**"This isn't anti-reward — it's phase-specific reward placement. We reward the part you're right about, and keep rewards *off* the one thing they'd corrupt."**

- **Morning academic floor = reward-driven by design** (the XP gate) — exactly the *low-interest task* where the pro-reward evidence (Cameron & Pierce) actually holds. Hitting the gate is the contingency that **unlocks** the afternoon passion block (`SPECIALIZATION-PIPELINE-PRD.md §2.3`, lines 41-42).
- **Afternoon discovery signal = reward-neutral**, because a reward there converts pre-existing interest into *controlled* regulation and **overwrites the measurement we exist to take** (unprompted voluntary return). And that undermining is **worst in 9–12-year-olds**: Deci, Koestner & Ryan 1999 (128 studies, *Psych Bulletin* 125(6)) — child tangible-reward **d = −0.39 vs −0.27 adults**; engagement-contingent **−0.46 vs −0.21 (Qb = 6.76, p < .01)**.
- **Enforced in code, not just policy:** the engine never emits a scalar/score/ranking (`interest-inference` output is per-cell beliefs + reasons only); `prompted_return` scores **zero** so an adult nudging a child can't manufacture signal; a `guardrails` package scans field names against `SCALAR_KEYS`/`GAMIFICATION_KEYS`.
- **Interest is *built*, and we certify the moment it becomes self-sustaining** (Hidi & Renninger 2006, *Educational Psychologist* 41(2)): the graduation gate certifies the **Phase 2 → Phase 3** crossing — where re-engagement becomes self-generated rather than externally supported.

---

## 1. Reward / extrinsic motivation (Joe's home turf)

**"Rewards work fine, why avoid them?"**
> We don't avoid them — we *place* them. Rewards run the effortful academic floor and gate access. We keep them off the discovery signal because there a reward overwrites the measurement, and the undermining is worst in 9–12s (DKR 1999; child engagement-contingent d = −0.46). **Concede:** Cameron & Pierce are right that rewards *help low-interest tasks* — which is exactly why they live on the morning academic block.

**"Isn't the intrinsic-motivation literature contested (Cameron & Pierce)?"**
> Yes, and we've labeled it. Cameron & Pierce (1994, *RER* 64(3)) called undermining "largely a myth"; DKR (2001, *RER* 71(1)) rebutted on methodology. Durable consensus: **expected + tangible + contingent** rewards on an *already-interesting* task reliably undermine; **unexpected / task-noncontingent rewards and informational praise do not.** We design to the **autonomous-vs-controlled mechanism** (Deci & Ryan 2000, *American Psychologist* 55(1)) — which predicts *sustained* behavior — not to a single effect size.

**"Kids need external structure."**
> Agreed, and Hidi & Renninger say so: in phases 1–2, extrinsic motivators "may play an important role." We provide heavy structure — the distinction is **structure vs. pressure/contingent reward**: posture is *"low control, **high structure**, high warmth."* And the effective structure is delivered through **adults**, not by gamifying the child (next section).

**"Badges/dashboards/leaderboards are proven engagement tools."**
> Not for this age. A digital-badge RCT (Balci & Morris, n=210) found badges *reduced* intrinsic motivation; a 38-study review found *no evidence* dashboards raise achievement. The one survivor is **self-comparison against the child's own past, never a leaderboard.** *Weak spot: those RCTs are largely college-age; our 9–12 record UI is untested.*

---

## 2. Interest development & "you can't build passion"

**"You're claiming you can manufacture passion?"**
> We manufacture *exposure*, then measure what a child returns to on their own. Interest is a trajectory, not a trait (Hidi & Renninger 2006, four phases: triggered → maintained → emerging individual → well-developed). The gate certifies the **2→3 crossing** — return that survives a **deliberately inserted ≥2-week no-prompt/no-new-content gap** (kills novelty), sustained across a term, plus a real artifact, plus human sign-off. *Caveat: the best re-engagement instrument (Boeder et al. 2021, Motivation Science 7(1)) was validated on adults — the 9–12 read is an extrapolation we keep checking.*

**"If competence is the top SDT predictor, just build skill and interest follows."**
> It doesn't follow — and conceding this *strengthens* us. Skjesol et al. (2025, RCT n=175, ages 9–12) built competence for 11 weeks and moved **neither** competence **nor** interest. Competence *feedback* is null for children (DKR d = 0.11, ns). The Childhood-and-Beyond cohort: child competence predicted *depth* of later participation but **not whether they continued** — only parental influence did. So we build skill because it's the buildable, measurable lever — then **measure voluntary return under protected choice.** *(Balance: Mabbe et al. 2018, n=110, mean age 10.71, found competence satisfaction predicted challenge-seeking, b=.31, where autonomy didn't — the two best 9–12 tests genuinely conflict; the firm claim is the negative one, "free choice alone is a broken instrument.")*

---

## 3. Autonomy support — "train the adults, not the kids"

**"How do you actually change a child's motivation?"**
> The strongest *controlled evidence on real children* says: intervene on the adults. **Coach Effectiveness Training (Smith, Smoll & Curtis 1979; Barnett, Smoll & Smith 1992, *The Sport Psychologist* 6(2))** — 18 Little League coaches, kids ~10–12: a pre-season workshop that changed *coach behavior* cut next-season **attrition 26% → 5%**, with **no change in win/loss**, and the **biggest self-esteem gains went to the lowest-starting kids.** That's why our primary surface is the **mentor relay** (warm → technical → expert → master) and family co-engagement coaching toward "warm-demanding."
> Supporting: autonomous motivation protects against dropout (music-school SEM: controlled β=+0.19 raised dropout, autonomous β=−0.17 protected, encouraging parental involvement β=−0.39 strongest); autonomy-supportive adults foster *harmonious* not *obsessive* passion (Mageau et al. 2009). *Concede: Smith & Smoll is one old baseball study — it's the strongest on-children controlled result there is, which itself says how thin the direct evidence is.*

---

## 4. Wellbeing / burnout

**"You can't run something this intense without burning some kids out — isn't that the price?"**
> Burnout runs through **pressure and contingent self-worth, not hours.** Harmonious and obsessive passion are **statistically indistinguishable on practice hours** (Vallerand-tradition meta, 94 studies, 1,308 effect sizes). So we hold expectations high, keep difficulty at **80–90% success** (the "85% rule," Wilson et al. 2019), and **pull *pressure* down before difficulty.** Wellbeing is a **co-primary success metric — "a spike achieved through burnout is a failure, not a success"** (`SPECIALIZATION-PIPELINE-PRD.md §10`).
- **Two independent knobs:** Challenge (difficulty vs skill) and Pressure (stakes/evaluation/deadlines/surveillance/contingent regard). Default: low control, high structure, high warmth.
- **Devaluation weighted above exhaustion**, fires the earliest escalation (Raedeke & Smith 2001; Isoard-Gautheur et al. 2016, n=458: high-burnout profile → 2.2–2.4× dropout six years later). Measured with the **School Burnout Inventory** (Salmela-Aro et al. 2009, N=1,418, 3 factors; school burnout ~4× dropout risk).
- **"The system proposes, humans dispose — no automated burnout label ever reaches the child."** Rest is prescribed proactively (AAP/Brenner 2024: ≥1–2 rest days/week, ~3 months/year off).
- *Population is genuinely at-risk:* affluent/high-pressure youth run 2–3× norms for anxiety/depression (Luthar); socially-prescribed perfectionism rose ~33% (Curran & Hill 2019). *Weak spots: no burnout instrument is validated below ~9–10 (youngest band leans on parent/teacher report); the specialization→burnout link is an unresolved conflict in the literature — we reconcile it as "harm runs through pressure," which is inference, not settled.*

---

## 5. EvidenceGraph — "does the crypto actually prove anything?"

**"I could fabricate the whole journey and it would still verify — so what does this prove?"**
> Correct, and we say it first. **Today "verify" = the integrity of *this copy*** — change one byte and re-derivation fails. It does **not** prove the record existed at a claimed time, or that a *human* (not a model) produced the content. A party who controls the store can recompute a consistent root over a fabricated graph. The crypto literature is explicit: a signature "proves she possesses the key… not that she wrote it" — garbage-in-signed-garbage-out. **The anti-fabrication layer is the human interactive defense, which is empirically GenAI-resilient (Sotiriadou et al. 2020, *Studies in Higher Ed* 45(11); Corbin, Dawson & Liu 2025, *Assessment & Evaluation in Higher Ed* — structural vs. discursive assessment security). Note: both are higher-ed samples, extrapolated to ages 8–14.**

**What's real today vs roadmap (be exact):**
- **IMPLEMENTED:** content-addressing (node id = SHA-256 of JCS-canonicalized bytes), append-only DAG (no destructive history, cycle-rejecting), a whole-graph **Merkle root** (RFC-6962 raw-byte scheme, ordered by `(timestamp, id)` for reproducibility), an **unsigned in-toto attestation** binding root→artifact, a verifier that re-derives the root + a live tamper demo, and the **human-authority invariant** (`invariants.ts`).
- **ROADMAP / stubbed (labeled NON-PRODUCTION in code):** external transparency-log anchoring (D1, Sigstore/Rekor-class), signing (D6), crypto-shred erasure (D2), calibration (D4). These are the pieces that would defend back-dating and prove authorship — deferred until real children exist.

**"So just use an AI detector to catch fakers."**
> The one thing we refuse. Detectors falsely flag **non-native English writers at 61.3%** (Liang et al., *Patterns* 2023, n≈91; all seven detectors unanimously flagged 19.8% of TOEFL essays). Vanderbilt disabled Turnitin's detector (Aug 2023) over ~750 wrongful flags/year; Pittsburgh, UCLA followed. Weber-Wulff et al. 2023: 14 detectors, 754 cases, **none exceeded 80% accuracy.** We enforce this in code — **no `authorshipAccusation` is permitted on any node/edge** (`invariants.ts`).

**"A machine grading kids?"**
> Never. **Any `Outcome` of kind grade/judgment requires a named *human* actor** (`assertHumanAuthority`, `invariants.ts`) — a model actor may author *only* `Assistance`/`Review` nodes. A machine can assist; it can never grade or accuse.

**Threat model (know the table):** tamper/replay → **defended** (content-addressing); back-date → **open today** (self-set timestamps; needs D1 anchoring); fabricate-a-journey → **not crypto-defended by design** (human defense is the backstop); conceal AI use → **open in v1** (self-declared, honor system); collude → **open** (self-declared contribution nodes).

**"Isn't your Merkle root non-standard?"** True and documented: RFC-6962 raw-byte hashing but leaves ordered by `(timestamp, id)` for a reproducible whole-graph root — an off-the-shelf verifier must be told we sort.

---

## 6. Equity

**"Won't a 'document your journey' system just reward rich kids with involved parents?"**
> Real risk, named honestly. Our mitigations are the evidence-backed ones. The single most robust equity lever is **universal screening**: Card & Giuliano (2016, *PNAS* 113(48)) — screening *every* student raised disadvantaged identification odds **~174%** (Hispanic +130%, Black +80%) with **no change to standards**, because the bias lives in *referral*, not the tests. Our discovery surface is the universal-screening analogue; we use **body-of-evidence over a single cutoff**, **local norms**, and a **hard ban on fixed "no passion" labels** (interest is built). *Weak spot: nontraditional methods **narrow but don't close** the gap (direction is well-established in the equity literature — state the direction, not a specific ratio, unless the primary source is in hand); parental over-valuation is a failure mode we monitor, not one we've eliminated; and there's genuine scholarly tension over how much residual under-representation is procedural vs. upstream opportunity — don't over-claim.*

---

## 7. Cost / feasibility at scale

**"Can you actually afford real-time tutoring for 100,000 kids?"**
> Published benchmarks put LLM Socratic tutoring at **$3–$70 / student / year** — below a textbook — dominated by **batching (a 44–100× per-token lever)** and model routing, not hardware. Best measured anchor: ITAS on Gemini 2.5 Flash, **~$2.63–$4.79 / student / semester**. Real vendor anchor: Khanmigo **~$10–$15 / student / yr** at district scale. *Weak spots, stated first: **no source benchmarks 100k concurrent** — every at-scale number is a composed extrapolation; the best figure is one non-peer-reviewed preprint measured to ≤50 concurrent users; routing's headline savings are **oracle-only** (RouterBench found practical routers barely beat a trivial baseline); and whether small models clear the pedagogical + child-safety bar for young kids is genuinely unresolved.*

---

## 8. Novelty / competitive landscape

**"Did you invent anything, or glue together in-toto, C2PA and Open Badges?"**
> Honest answer: the *primitives* are mature off-the-shelf standards and we reuse them deliberately — content-addressed attestation (in-toto/SLSA), append-only transparency logs (Rekor/Trillian), PROV-O provenance, C2PA content credentials, Open Badges 3.0 / CLR 2.0 verifiable credentials. **No existing product combines them into a tamper-evident, content-addressed learning-provenance DAG for children with a human-authorship invariant.** Closest analogue — **Grammarly Authorship** — does per-sentence attribution and keystroke replay, but its proof is *version-history, not cryptographic tamper-evidence.* The genuinely **unsolved research problem** we're taking on is **verifiable deletion (right-to-erasure) on an append-only store for child data** — and we treat that as a hard pre-live gate.

---

## 9. Weak spots we volunteer *first* (say these before Joe digs)

1. **Age extrapolation is pervasive** — much of the motivation/competence/burnout base is adolescents/adults read down to 9–12 (the SDT competence meta's mean age is 16.55); the discovery evidence memo is for 6–8 while our surface targets 9–12. We're closing that by evidence, not assertion.
2. **The two best direct 9–12 tests conflict** on competence vs. autonomy (Mabbe vs. DKR/Patall). Our firm claim is the *negative* one — free choice alone is a broken signal — not a ranking of skill over choice.
3. **Cold-start blindness** — at ages 7–8, in-session telemetry discriminated nothing; the engine leans on a delayed adult report whose weight (0.25) is **ours, uncalibrated.**
4. **Chess-map is honest work-in-progress** — nothing yet tracks *where* a child stands on a map, and almost nothing above "Foundations" is reachable by a child today (one gadget of nine feeds the stretch signal). Have the fallback GIF ready.
5. **EvidenceGraph authenticates the *record*, never *unaided human authorship*** — external anchoring, signing, and crypto-shred erasure are stubbed pre-live gates; verifiable child-data erasure is the hardest open problem.
6. **Cost at 100k concurrent is unbenchmarked** — extrapolated from ≤50-user studies.
7. **Chetty, Deming & Friedman (2025)** (if Joe pivots to admissions): non-academic ratings partly measure a school's *packaging*, and don't predict post-college outcomes — our answer is that a verifiable *process record* is a different object than a reader's holistic rating.

---

## Appendix — citation quick-reference

| Claim | Source | Key number |
|---|---|---|
| Reward-undermining, children | Deci, Koestner & Ryan 1999, *Psych Bulletin* 125(6) | child tangible d=−0.39; engagement-contingent −0.46 (Qb=6.76, p<.01) |
| Undermining is contested | Cameron & Pierce 1994, *RER* 64(3); DKR rebuttal 2001, *RER* 71(1) | — |
| Overjustification (classic) | Lepper, Greene & Nisbett 1973, *JPSP* 28(1) | rewarded kids drew ~½ as much in free play |
| Four-phase interest model | Hidi & Renninger 2006, *Educational Psychologist* 41(2):111–127 | phase 2→3 = self-generated re-engagement |
| Competence > autonomy (in-band) | Mabbe et al. 2018, *JECP* 170, n=110, age 10.71 | competence b=.31***, autonomy b=.01 ns |
| Building competence ≠ interest | Skjesol et al. 2025, *Psychology International* 7(4):101, RCT n=175 | neither moved in 11 wks |
| SDT predictor weights | RER meta 2022, 144 samples / 79,079 | competence 43% / autonomy 34% / relatedness 22% (mean age 16.55) |
| Train the adults (autonomy) | Smith, Smoll & Curtis 1979; Barnett, Smoll & Smith 1992, *TSP* 6(2) | dropout 26%→5%, no win/loss change |
| School burnout | Salmela-Aro et al. 2009, *EJPA* 25(1) | N=1,418; ~4× dropout risk |
| Burnout → later dropout | Isoard-Gautheur et al. 2016, n=458 | 2.2–2.4× at 6 yrs |
| Affluent-youth risk / perfectionism | Luthar & Becker 2002; Curran & Hill 2019, *Psych Bulletin* | 2–3× norms; perfectionism +33% |
| AI-detector false positives | Liang et al. 2023, *Patterns* (arXiv 2304.02819), n≈91 | 61.3% FP on non-native English |
| Detector accuracy ceiling | Weber-Wulff et al. 2023, *IJEI* | 14 tools, 754 cases, none >80% |
| Universal screening equity | Card & Giuliano 2016, *PNAS* 113(48):13678 | disadvantaged ID odds +174% |
| Nontraditional methods narrow-not-close | equity literature (direction only; verify primary source before quoting a ratio) | — |
| Per-student LLM tutoring cost | RESEARCH cost reports (ITAS preprint arXiv 2604.24110; Khanmigo pricing) | $3–$70/yr; ITAS $2.63–$4.79/sem |
| Admissions caveat | Chetty, Deming & Friedman 2025 | non-academic ratings don't predict post-college outcomes |

**Code anchors:** spike math `passion/packages/interest-inference/src/{fold,posterior,aggregate}.ts` + `model.ts`; certification `passion/packages/hypothesis-store/src/{lifecycle,actions,gate}.ts`; provenance `passion/packages/evidence-graph/src/{invariants,merkle,attestation,graph}.ts`.

**Do-not-fabricate note:** every figure above appears verbatim in the cited source. Where a number the team might want does not exist (a calibrated 7/30-day return threshold; an RCT pitting competence-building vs. free choice over months in a 9–12 cohort; a 100k-concurrent cost benchmark), the corpus says so — do not invent one under questioning.

---

# Part II — Adversarial deep-dive (superbuilder pass)

> Generated by adversarial review: interrogate **every decision that is not directly research-backed.** The pattern below is deliberate and worth stating out loud once, early: **our *architectural* claims are strong; our *numeric* claims are hand-set.** The negatives ("duration is banned," "silence never demotes," "no score is ever shown," "a reward can't manufacture signal," "a detector is never run on a person") are enforced in code and defensible. Almost every **threshold and weight** is an *engineering prior chosen to be defensible*, awaiting calibration on the first real cohort. **When Joe asks "what's the research behind that number?" the honest answer for most constants is: "The *shape* is research-backed; the *value* is our prior, and here's how we'll calibrate it."** Say that before he extracts it.
>
> **Scope tags used below:** `[IN-CODE]` enforced today · `[HAND-SET]` value is our prior, not calibrated · `[NOT-BUILT]` roadmap/stub · `[EXTRAPOLATED]` evidence is from an older/adjacent population · `[OUT-OF-SCOPE]` deliberately not this product.

## 10. The hand-set constants ledger (know this cold)

Every number in the spike engine, with its status. This table is the single most likely place to get caught, so own it:

| Constant | Value | Status | What actually backs it |
|---|---|---|---|
| cross-day return weight | α += 1.0 | `[HAND-SET]` | *ordering* is principled (return = strongest signal); magnitude is a prior |
| depth-action weight | α += 0.5 | `[HAND-SET]` | half of a return, by design; not calibrated |
| adult-report weight | α += 0.25 | `[HAND-SET]` | quarter-weight for out-of-product hearsay; explicitly uncalibrated |
| skip penalty | β += 0.5 | `[HAND-SET]` | ÷ choice-set size is the principled part; the 0.5 is a prior |
| decline penalty | β += 0.15 | `[HAND-SET]` | weaker than skip (never-tried < passed-over); prior |
| decay half-life | 14 days | `[HAND-SET]` | `r = 0.5^(Δdays/14)`; "recent behavior should dominate" is the principle, 14 is chosen |
| spike mass floor | ≥ 6 | `[HAND-SET]` | raised from 3 after reasoning "3 returns is one afternoon"; not an effect size |
| distinct-days floor | ≥ 2 | `[HAND-SET]` | "a calendar can't be run up in an afternoon"; principled shape, chosen value |
| CI-width ceiling | ≤ 0.35 | `[HAND-SET]` | a confidence bar; value is a prior |
| lower-bound threshold | ≥ 0.6 | `[HAND-SET]` | ranking on the *pessimistic* bound is the principled choice; 0.6 is a prior |
| certification GAP_DAYS | 14 | `[HAND-SET]` | maps to Hidi–Renninger "survives a novelty gap" — but 14 days is not from the paper |
| MIN_TERM_DAYS | 56 | `[HAND-SET]` | ~8 weeks; a schooling-term convention, not an effect size |
| MIN_REVIEW_CYCLES | 2 | `[HAND-SET]` | two human looks; prior |
| success-rate band | 80–90% | `[EXTRAPOLATED]` | the "85% rule" (Wilson et al. 2019) — a *machine-learning* result, applied to children by analogy |

**The line to say:** *"None of these are load-bearing on a cited effect size, and we don't pretend they are. The math **structure** — Beta-Bernoulli belief, decay, conjunction gate, ranking on the lower bound, breadth-invariance — is what the research and the failure-mode analysis justify. The **values** are priors we'll fit the moment we have a cohort. What is **not** a prior, and never moves, is what we refuse to count: duration, prompted return, and any adult-manufacturable signal."*

### Q: "You picked 6 observations and 0.6. Why not 5 and 0.7? What's the research?"
> **There is none for the exact values — and I won't pretend otherwise.** `[HAND-SET]` What's defensible is the *conjunction*: no single number can trip a spike, it takes mass **and** calendar spread **and** a tight interval **and** a high pessimistic floor, all at once. That structure is what stops an afternoon of enthusiasm from reading as a passion. The specific cutoffs are priors chosen to be conservative (we'd rather miss a spike than fabricate one), and they are the **first thing** we calibrate against real outcomes. **Concede:** until that calibration, precision/recall on real children is unknown.

### Q: "Half-life of 14 days — where does that come from?"
> `[HAND-SET]` The principle is research-backed (interest is a trajectory; recent voluntary behavior must dominate stale behavior — Hidi–Renninger). The **14** is an engineering prior. We can defend *that decay exists*; we cannot defend *14 vs 10 vs 21* from a citation, and we won't invent one.

## 11. Plan structure — "how is the build actually structured?" (chess and beyond)

This is the question the deck *implies* it can answer, so be concrete.

**The structure `[IN-CODE]`:** a certified spike enters a **4-stage ascent** — **Ignition → Foundations → Authorship → Signature** — that is **readiness-gated, not age-gated.** Each domain has a **mastery map** (`mastery-map/src/model.ts`) of skills with dependencies; a child's standing on the map is derived from **real artifacts/games**, not from seeds or self-report. Movement is **mentor-relayed** (warm generalist → technical → domain expert → master) and projects are **real-audience** (Renzulli Type III). A wellbeing monitor can hold or step back a stage.

### Q: "Show me the chess plan. How does a kid go from move-the-pieces to real?"
> **Straight answer: the *framework* is built; the *chess map itself is work-in-progress and not demo-ready.*** `[NOT-BUILT]` What exists: the stage machine, the gate logic, the map data-structure, and a fixture map. What's **not** solid yet: a refined chess mastery map with the right skill nodes and dependencies, and — critically — **nothing yet tracks *where* on the map a given child stands.** Today one gadget of nine feeds the stretch/challenge signal, so in practice **almost nothing above "Foundations" is reachable by a real child right now.** For the demo we carry this lightly and have a **fallback GIF** ready. **This is our biggest content dependency and I'll name it before you find it.**

### Q: "So the top two stages — Authorship, Signature — no child can actually reach them today?"
> `[NOT-BUILT]` Correct. The stages are defined and gated; the *content ladder* that would carry a child into them isn't populated for any domain yet. The architecture doesn't fake it — a child simply can't be advanced past what the map and artifacts support. **In-scope to build; not built.** What I won't claim is that we've *run* a child to Signature.

### Q: "What makes standing 'derived from real work' and not just another score?"
> `[IN-CODE]` The map reads a child's actual artifacts/games against skill nodes; the engine never emits a scalar ranking of the child — output is per-node standing with **reasons and disconfirming evidence**, the same "hypothesis, never a label" contract as discovery. There is no leaderboard and no composite number to chase.

## 12. Motivation management — "concretely, not philosophically"

The deck asserts motivation is "managed." Here is the concrete mechanism, and where it's thin.

**The concrete loop `[IN-CODE] + [EXTRAPOLATED]`:**
1. **Reward placement, not reward removal.** Morning academic floor is reward-driven (XP gate) — the low-interest task where pro-reward evidence holds. Afternoon discovery signal is reward-neutral, enforced: `prompted_return` scores **zero**, the engine emits no scalar, `guardrails` scans field names for smuggled scores/gamification. `[IN-CODE]`
2. **Structure, not pressure.** Posture is *low control, high structure, high warmth.* The two knobs — **Challenge** (difficulty vs skill) and **Pressure** (stakes/evaluation/deadlines/surveillance/contingent regard) — move **independently**; when a child strains, we **pull pressure down before difficulty.** `[IN-CODE]` in the wellbeing model; the *thresholds* that fire escalation are `[HAND-SET]`.
3. **The adults are the intervention, not the child.** Mentor relay + family "warm-demanding" coaching. Strongest on-children controlled evidence is Coach Effectiveness Training (attrition 26%→5% by changing *coach* behavior). `[EXTRAPOLATED]` — that's Little League, not a learning app.
4. **Certify the phase transition, don't reward it.** The gate fires on the Hidi–Renninger **2→3 crossing** — voluntary re-engagement that survives a ≥2-week no-prompt gap, across a term, with an artifact and human sign-off.

### Q: "A kid stalls out and stops coming back. What does the system actually *do*?"
> `[IN-CODE]/[HAND-SET]` First, silence is **never** punished — an absence does not demote a belief (decay is symmetric time, not a penalty), so the system does not "read" a quiet week as lost interest. What *does* happen: the wellbeing read distinguishes **disengagement-from-pressure** (devaluation/exhaustion signals → pull pressure/stakes down, prescribe rest) from **genuine interest-shift** (the spike was never certified → discovery keeps offering varied exposure, no label of failure). The **routing** between those is human-decided; the system proposes, a named adult disposes. **Concede:** the signals that classify "why a child stopped" are `[HAND-SET]` and unvalidated on this age; this is the softest part of the motivation story.

### Q: "What research backs 'pull pressure before difficulty'?"
> The *mechanism* is SDT/passion-dualism (harmonious vs obsessive passion are indistinguishable on hours but diverge on pressure/contingent self-worth — Vallerand tradition; Mageau et al. 2009 on autonomy-support producing harmonious passion). `[EXTRAPOLATED]` mostly from adolescents/adults. The *decision rule itself* ("pressure down first") is our engineering translation of that mechanism — defensible as inference, not as a cited RCT.

## 13. EvidenceGraph — the adversarial cut

Covered in §5; the superbuilder additions are the **negatives**, which are the strong part:

- **"Verify" today proves copy-integrity only.** `[IN-CODE]` Change a byte → re-derivation fails. It does **not** prove time-of-existence or human (vs model) authorship. Say it first.
- **Signing, external anchoring (Rekor-class), crypto-shred erasure, calibration are stubs** labeled NON-PRODUCTION in code. `[NOT-BUILT]` These are exactly the pieces that would defend back-dating and prove authorship — deferred until real children exist.
- **The genuinely unsolved research problem** we're taking on: **verifiable right-to-erasure on an append-only store for child data.** `[NOT-BUILT]` We treat it as a hard pre-live gate, not a solved feature.
- **What is enforced, not stubbed:** the human-authority invariant — no machine may author a grade/judgment, no `authorshipAccusation` on any node, and we **never run a detector on a person** (`invariants.ts`). `[IN-CODE]`

## 14. Out-of-scope boundary list (do NOT get dragged past these)

When Joe pushes into these, the honest move is *"that's deliberately not this product"* — not a hand-wave, a decision. Naming the boundary is itself a credibility signal.

- **`[OUT-OF-SCOPE]` The morning / academics.** We do not build or re-litigate mastery-based academic learning. We take Joe's "solved morning" as given and build the afternoon. If pressed on academic pedagogy: that's TimeBack's turf, not ours.
- **`[OUT-OF-SCOPE]` Extrinsic-reward moralizing.** We are **not** anti-reward. We do not argue rewards are bad. We place them where they work (the floor) and keep them off one specific measurement. Do not let the conversation become a rewards debate.
- **`[OUT-OF-SCOPE]` Detecting AI/cheating on a person.** We refuse authorship accusation as a category — not "we haven't built it," but "we will not." The record proves the journey; it does not police the child.
- **`[OUT-OF-SCOPE]` A funding ask.** The goal is *the vision is important and novel*, per the design. Don't pivot to numbers-for-a-raise.
- **`[OUT-OF-SCOPE]` Accessibility parity as a launch gate.** Deprioritized per admissions guidance; never claim it's satisfied, but it is not in this scope.
- **`[OUT-OF-SCOPE]` The archived social/arena/cohort layer.** If asked about peer competition/leaderboards: archived by design — self-comparison only, never a leaderboard.
- **`[OUT-OF-SCOPE]` Real user data / live cohort results.** There are no real children yet. Every metric is synthetic or a prior. We do not have outcome data and will not imply we do.

## 15. The three sentences to survive the whole Q&A

1. **"The architecture is the claim; the numbers are priors."** Negatives are enforced in code; thresholds await calibration — and I'll tell you which is which every time.
2. **"We refuse to count what an adult can manufacture."** Duration, prompted return, and detector-on-a-person are banned in code, not policy.
3. **"There are no real children yet, so every value is a defensible prior — and here's exactly how we calibrate each one."** Honesty about the gap is the point, not a weakness to hide.
