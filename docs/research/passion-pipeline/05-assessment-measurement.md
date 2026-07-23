# 05 — Assessment & Measurement: Reading Interest from Behavior, and Authorship from Process

> Brainlift-style research memo for GT100K. Grounds two measurement problems: **(A)** behavioral measurement of durable interest in children 6–14, and **(B)** process-based authorship/competence assessment. Sibling to [`passionBrainlift.md`](../passionBrainlift.md); this memo goes deeper on *operationalization* (how to actually compute the signals) and shares its citation base.

**Owners:** Passion Pipeline research track
**Status:** Research input to PRD §14 (Interest Lab), §19 (EvidenceGraph & evaluation)
**Scope honesty:** Priority band is ages 6–14. Where the strongest evidence comes from adults or higher education, it is flagged inline as **[ADULT-EXTRAPOLATION]** or **[HE-EXTRAPOLATION]**. Only real, verifiable sources are cited, with DOIs/links; uncertainty is flagged explicitly.

---

## 1. Thesis (one line)

Interest and authorship are both **process properties, not artifact properties**: measure durable interest as *depth-weighted, un-prompted return read as a trajectory* (never a snapshot, never rewarded, never inferred from a face), and verify authorship as *a tamper-evident process trail plus a short, anxiety-safe human defense* (never an AI detector aimed at a child) — with both readings age-staged, because the youngest children break several of the adult rules.

---

## 2. DOK 4 — Spiky Points of View

Each breaks a prevailing consensus and survives contact with the evidence. Four for (A) interest measurement, two for (B) assessment.

### On measuring interest behaviorally (A)

**SPOV 1 — Time-on-task, logins, and clicks are engagement theater. The only trace worth trusting is depth-weighted *voluntary return*, read as a trajectory over 7- and 30-day horizons, not a snapshot.**
- **Consensus it breaks:** analytics dashboards equate minutes, sessions, streaks, and click-counts with "engagement," and read a single strong session as a signal.
- **Backing:** In the largest portability test (n = 2,385 learners, 50 course offerings, 4 years), *passive-consumption* traces failed to replicate — lecture-view frequency correlated r ≈ 0.28 with success but its 95% prediction interval crossed zero [−0.05, 0.54], i.e. not reliably portable — while *active* proxies (total activity, forum/collaboration) were the only durable predictors (Saqr et al., 2022). A full-program longitudinal study found "online engagement at any single time-point is not a consistent indicator" and that trajectories, not points, forecast durable outcomes (Saqr & López-Pernas, 2023). Behavioral engagement is a real, observable channel distinct from internal states (Fredricks, Blumenfeld & Paris, 2004), and *re-engagement* is the marker that best separates interest phases (Boeder et al., 2021).
- **Honest limit:** even the good active-trace proxies are context-specific and heterogeneous; they index behavior, not internal cognitive/emotional engagement, and they do not travel unchanged across domains or work-modes.

**SPOV 2 — You cannot read interest off a trace without knowing *why* the child came back. The identical re-entry is curiosity for one child and obligation, novelty, or social pull for another.**
- **Consensus it breaks:** behavioral analytics treats identical behaviors as identical signals — a return is a return.
- **Backing:** Falk's identity-motivation work shows the *same physical space* is entered under different, situationally-enacted motivations (explorer, facilitator, professional/hobbyist, experience seeker, recharger), and that this motive — not the space — drives what behavior and learning follow (Falk, 2006; 2009). Stated interest itself predicts behavior only weakly (Nye et al., 2012, r ≈ .20–.36), so motive cannot simply be asked for either. This is why GT100K reads **domain × work-mode separately** and triangulates traces with light human judgment rather than trusting the trace alone (PRD §14.4).
- **Honest limit:** triangulating motive re-introduces self-report, which is weak; so motive stays a *hypothesis with competing explanations*, never a fact stamped on the child.

**SPOV 3 — Missing data is not disinterest. Any system that scores a no-show as a "no" will systematically misread the least-resourced children.**
- **Consensus it breaks:** in most engagement analytics, absence of a trace is read as absence of interest (churn = disengaged).
- **Backing:** log data is a poor proxy for internal engagement — an LMS-log study found *no* statistically significant correlation between log activity and self-reported cognitive/emotional engagement (Henrie, Bodily, Larsen & Graham, 2018; review: Henrie, Halverson & Graham, 2015). For minors, access to the probe is adult- and resource-mediated, so non-return is *missing-not-at-random*: it can encode a broken laptop, a caregiving shift, or a sibling's turn on the device, not a preference. Reading it as "no" imports the digital divide directly into the interest signal.
- **Honest limit:** separating *can't-return* from *won't-return* needs opportunity/access data, which GT100K must collect carefully — the program does **no home sensing** (PRD §10.2), so this is deliberately partial.

**SPOV 4 — Rewarding return destroys the thing you are measuring. The interest-measurement layer must be invisible and un-gamified by design.**
- **Consensus it breaks:** engagement products maximize time-in-app with points, streaks, and badges, and treat that as validated interest.
- **Backing:** expected, contingent tangible rewards reliably undermine free-choice intrinsic motivation (engagement d ≈ −0.40), and the effect is *stronger in children than adults* (Deci, Koestner & Ryan, 1999) — exactly our band. Gamifying return therefore corrupts the exact voluntary-return signal the Passion Engine reads. (This is why the PRD meters pressure with a bounded MotivationDose rather than maximizing dwell, §8.5/§13.)
- **Honest limit:** a competing meta-analytic tradition (Cameron & Pierce) argues reward-undermining is narrower and non-universal and that rewards can help low-interest tasks; we design to the *autonomous-vs-controlled* mechanism rather than betting on one contested effect size.

### On assessing authorship & competence from process (B)

**SPOV 5 — Never aim an AI/plagiarism detector at a child. Authorship is settled by a process trail plus a five-minute human defense; a detector's job is done instead by *structural* assessment design.**
- **Consensus it breaks:** artifact-level AI/plagiarism detection is the "responsible" default integrity control.
- **Backing:** across 14 tools and 754 cases, detectors were "neither accurate nor reliable" (Weber-Wulff et al., 2023); seven GPT detectors misflagged non-native English essays as AI at a **61.3%** false-positive rate while classifying US 8th-grade (native, ~age 13–14) essays accurately (Liang et al., 2023) — i.e. the harm falls hardest on the most vulnerable, in our age band. The structural alternative: redesign the task so integrity is built in rather than announced, and "add something synchronous and interactive… discussion with students after they complete a take-home task" (Corbin, Dawson & Liu, 2025), which is precisely a sampled oral defense. Fit it into a **two-lane** program — secured verification (Lane 1) plus open, AI-declared work (Lane 2) (Liu & Bridgeman, 2023; in Lodge et al., 2023), on the assessment-security foundation of *authentication + control of circumstances* (Dawson, 2021).
- **Honest limit:** detectors will keep improving, but *any* non-zero false-positive rate at school scale wrongly accuses children by the hundred — that does not improve away; and the oral-defense evidence base is largely **[HE-EXTRAPOLATION]**, thin for ages 8–14.

**SPOV 6 — Grade the dead ends, not the polish — but the "productive failure" rulebook *flips* for your youngest children, so a struggle-first rubric applied naively would actively harm ages ~6–10.**
- **Consensus it breaks:** two at once — (a) grade the finished artifact; and (b) "productive failure" (struggle-before-instruction) is universally good.
- **Backing:** struggling with ill-structured problems before instruction improves later conceptual learning and transfer (Kapur, 2008); the meta-analysis confirms it (Hedges' g = 0.36, rising to 0.87 after publication-bias correction; up to 0.58 at high fidelity). **But the same meta-analysis found the effect reversed for 2nd–5th graders (≈ ages 7–11) and for domain-general skills, where instruction-first won** (Sinha & Kapur, 2021). So "grade the process, reward the reasoned failure" is right for older learners and must be *age-staged* — scaffold more, and don't valorize struggle, for the youngest.
- **Honest limit:** process/performance scores are dominated by task-and-occasion variance (about half; Shavelson, Baxter & Gao, 1993), so the process graph is *strong evidence of authorship and effort but only suggestive about stable ability*; and grading visible struggle creates an incentive to *perform* struggle, which the live defense must catch.

---

## 3. DOK 3 — Insights (evidence → design)

Original bridging conclusions from the sources to GT100K's measurement/assessment design.

**On interest measurement (A):**

1. **Return must be defined as a curve, not a count.** Because a single strong session is unreliable (Saqr & López-Pernas, 2023) and novelty inflates the first exposure, the primitive is the *shape* of re-engagement after external drivers are removed: a **novelty spike** decays toward baseline by 7–30 days; **durable interest** persists or grows. The 7-day horizon catches near-term stickiness; the 30-day horizon catches survival past novelty decay. Measure both. (→ SPOV 1; PRD PASS-004/005)

2. **Depth-weight the return, and weight *active construction* over *passive dwell*.** Saqr et al. (2022) show active proxies replicate and passive ones don't, so a return's weight should come from generative actions inside the session — self-authored scope, chosen difficulty, unrequired revision, recovery after failure, questions asked, artifacts produced — with raw duration as a weak secondary term (time can be idle). A short deep return should outweigh a long shallow one. (→ SPOV 1)

3. **Subtract novelty with a matched control.** To separate "new and shiny" from "mine," pair each probe with a **novelty-matched neutral probe** and compare return to the target against return to the control (PRD §14 already schedules a "novelty-matched probe"). Durable interest is the *excess* return over the novelty baseline. (→ SPOV 1)

4. **Prompted return is a different measurement instrument and must be logged separately.** A re-engagement triggered by a reminder, deadline, reward, rivalry event, or parent nudge carries its intervention context and is **not** a passion signal (PRD PASS-005). The measurement layer must record the *provenance of every return* (was there a prompt in the preceding window?) or the signal is uninterpretable. (→ SPOV 4)

5. **Motive is under-determined by the trace, so triangulate — but hold motive as a hypothesis.** Falk (2006) means an identical re-entry can be curiosity or obligation. Reading **domain separately from work-mode** (a child who returns to *debugging* across audio, robots, and games may love a work-mode, not a topic) plus light periodic self-report plus guide judgment narrows motive without pretending the trace revealed it. Always store competing explanations (novelty, ease, praise, peer belonging, parent pressure, resource access, work-mode-over-topic) alongside the signal (PRD §14 `competing_explanations`). (→ SPOV 2)

6. **Treat missingness as missing.** Never impute non-return as disinterest; check opportunity/access first (SPOV 3). Because access for minors is adult-mediated and GT100K does no home sensing, the honest read is "insufficient evidence," which keeps the interest hypothesis `EMERGING` rather than closing it. This is both a validity fix and an equity guardrail. (→ SPOV 3)

7. **The measurement layer must not reward what it measures.** Reward-undermining is worse in children (Deci et al., 1999), so return, depth, and persistence are *observed*, not *incentivized*; the game-experience layer (PRD §15.3) is walled off from the interest signal and auto-reverts if it lifts dwell while depressing voluntary return. (→ SPOV 4)

8. **Traces can validly infer behavior; they cannot validly infer internal state, motive, or ability.** Henrie et al. (2018) is the honest ceiling: log data ≠ cognitive/emotional engagement. So GT100K reads *behavioral* engagement (return, active depth, persistence, recovery), explicitly refuses *affective* inference (no face/emotion detection — scientifically unfounded and EU-illegal in schools; Barrett et al., 2019; EU AI Act Art. 5(1)(f)), and never converts a behavioral trace into a claim about the child's ability or worth. (→ all A-SPOVs)

**On process/defense assessment (B):**

9. **Authorship is a process-and-understanding property, so no artifact-level test can establish it — and the false-positive math forbids trying on children.** Detectors are inaccurate and biased (Weber-Wulff, 2023; Liang, 2023); the correct instruments are the process trail and a human defense (SPOV 5). Declared AI is a neutral node, like a citation. (→ SPOV 5)

10. **The oral defense is the academy's structural moat, and it is a *security* mechanism, not just a pedagogy.** Corbin, Dawson & Liu (2025) reframe a synchronous interactive follow-up to take-home work as the paradigm *structural* change (versus unenforceable "please don't use AI" rules). An in-person program can run the five-minute defense that remote, artifact-only competitors cannot — so what looks like an unscalable cost is GT100K's advantage. (→ SPOV 5)

11. **Grade the process — but stage it by age.** Kapur (2008) / Sinha & Kapur (2021) justify rewarding reasoned dead ends over polished shallowness *for older learners*, while the grades-2–5 reversal means the rubric for ages ~6–10 must scaffold more and not treat struggle as a virtue in itself. One rubric, three age-band renderings (mirrors the PRD's §14.13 developmental staging). (→ SPOV 6)

12. **Keystroke-level process signals buy real discriminative power at a heavy privacy price — and most of the value is reachable more cheaply.** Keystroke logs separate authored from transcribed/pasted text at ~99% in-lab (Morris, Holmes, Choi, Tian & Crossley, 2024) and ~89–94% in operational conditions (*Journal of Educational Measurement*, 2024). But this detects *transcription*, not authorship, is validated on adults **[ADULT-EXTRAPOLATION]**, and logging a child's keystrokes is invasive. Coarser, privacy-preserving capture — versioned save-snapshots, disabled copy-paste inside secured contexts, tool-call/prompt logs already in the EvidenceGraph — recovers much of the signal without a keylogger. (→ SPOV 5/6)

13. **Process/defense discontinuity is a *sampling trigger*, never proof of misconduct.** Because process scores track task/occasion (Shavelson et al., 1993) and detectors accuse falsely, a gap between the trail and the defense routes the work to *more human review*, and no model may accuse, grade, or reject a child (PRD §19). Anomaly → look closer, not anomaly → guilty. (→ SPOV 5/6)

14. **Anxiety-safety is a validity requirement, not a courtesy.** A defense that frightens an 8-year-old measures composure, not understanding. With the age-appropriate evidence thin (**[HE-EXTRAPOLATION]**), the safe design is many small, low-stakes, familiar-guide touchpoints ("show me how you did this") rather than one high-stakes viva, plus multiple reviewers to damp single-rater bias (consistent with the "multiple, inclusive and contextualised" principle in Lodge et al., 2023). (→ SPOV 6)

---

## 4. DOK 2 — Knowledge Tree

DOK-1 facts are raw from the source; DOK-2 summaries are in our words. Grouped by problem.

### Category A — Behavioral measurement of interest (6–14)

#### A.1 Engagement as a measurable behavioral construct

- **Fredricks, Blumenfeld & Paris (2004), "School Engagement: Potential of the Concept, State of the Evidence," *Review of Educational Research* 74(1), 59–109.**
  - *DOK-1:* Engagement splits into **behavioral**, **emotional**, and **cognitive** dimensions; the behavioral and cognitive channels are observable from what a learner does. Engagement is malleable and responsive to context.
  - *DOK-2:* Behavioral engagement is a legitimate, measurable signal distinct from the affect we refuse to sense; it is the construct GT100K instruments (return, depth, persistence).
  - *Link:* https://doi.org/10.3102/00346543074001059

- **Boeder, Postlewaite, Renninger & Hidi (2021), "Construction and validation of the Interest Development Scale," *Motivation Science* 7(1), 68–82.**
  - *DOK-1:* IDS has five factors — information seeking, **motivation to reengage**, persistence, self-regulation, value. *Motivation to reengage was the only factor that differentiated among all three interest phases studied.* Validated on adults (MTurk, three studies). **[ADULT-EXTRAPOLATION]**
  - *DOK-2:* Re-engagement is the single best measurable marker of where a learner sits on the interest trajectory — the empirical anchor for "measure return." The child-validation gap is a real limit for our band.
  - *Link:* https://doi.org/10.1037/mot0000204

- **Hidi & Renninger (2006), "The Four-Phase Model of Interest Development," *Educational Psychologist* 41(2), 111–127.**
  - *DOK-1:* Interest = "the predisposition to reengage with particular classes of objects, events, or ideas over time"; four phases (triggered situational → maintained situational → emerging individual → well-developed individual); early phases need external support.
  - *DOK-2:* Interest is a trajectory that can be *engineered* by triggering and maintaining, and progress is read as re-engagement without external support — so the Interest Lab manufactures conditions rather than waiting for a latent passion.
  - *Link:* https://doi.org/10.1207/s15326985ep4102_4

#### A.2 Stated vs. behavioral interest

- **Nye, Su, Rounds & Drasgow (2012), "Vocational Interests and Performance," *Perspectives on Psychological Science* 7(4), 384–403.**
  - *DOK-1:* Meta-analysis; interests correlated with performance/persistence at r ≈ .20–.36, stronger under interest–environment fit. **[ADULT-EXTRAPOLATION]** (vocational samples)
  - *DOK-2:* Stated interest is a weak predictor of what people actually do, so an intake rating is a poor basis for a spike and measured behavioral return is the better signal.
  - *Link:* https://doi.org/10.1177/1745691612449021

#### A.3 What interaction traces can and cannot tell you

- **Saqr, López-Pernas, Jovanović & Gašević (2022), "Is there order in the mess? A single paper meta-analysis approach to identification of predictors of success in learning analytics," *Studies in Higher Education* 47(12), 2370–2391.** **[HE-EXTRAPOLATION]**
  - *DOK-1:* Trace data from n = 2,385 students across 50 course offerings / 4 years. **Total activity** and **forum (collaboration)** indicators had the highest prediction intervals (portable); **lecture-view frequency** was r = 0.28 but with a prediction interval of [−0.05, 0.54] — *not reliably portable*. Moderate heterogeneity within and across courses.
  - *DOK-2:* Trace predictors are heterogeneous and context-dependent; *active* engagement proxies replicate while *passive-consumption* proxies do not. Depth-weighting should therefore privilege active construction, and no single trace metric should be trusted to travel across domains unchanged.
  - *Link:* https://doi.org/10.1080/03075079.2022.2061450

- **Saqr & López-Pernas (2023), "The longitudinal association between engagement and achievement varies by time, students' profiles, and achievement state," *Computers & Education* 199, 104787.** **[HE-EXTRAPOLATION]**
  - *DOK-1:* Full four-year program, life-course methods. "Online engagement at any single time-point is not a consistent indicator for high achievement"; longitudinal high engagement (trajectories) forecast stable outcomes; disengagement at any point tracked lower achievement.
  - *DOK-2:* Measure return as a *trajectory across the 7- and 30-day horizons*, not a snapshot; one strong session is not evidence of durable interest.
  - *Link:* https://doi.org/10.1016/j.compedu.2023.104787

- **Henrie, Halverson & Graham (2015), "Measuring student engagement in technology-mediated learning: A review," *Computers & Education* 90, 36–53; Henrie, Bodily, Larsen & Graham (2018), "Exploring the potential of LMS log data as a proxy measure of student engagement," *Journal of Computing in Higher Education* 30(2), 344–362.**
  - *DOK-1:* Log data is scalable and unobtrusive but its validity as a proxy for cognitive/emotional engagement is *unproven*; the 2018 study found **no statistically significant correlation** between LMS log data and self-reported cognitive/emotional engagement.
  - *DOK-2:* Traces validly index *behavioral* engagement but are a poor proxy for internal states — the honest ceiling on what a trace can infer, and the reason GT100K refuses to convert traces into affect or ability claims.
  - *Link:* https://doi.org/10.1016/j.compedu.2015.09.005 ; https://eric.ed.gov/?id=EJ1183842

#### A.4 Why measurement must not reward the behavior

- **Deci, Koestner & Ryan (1999), "A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation," *Psychological Bulletin* 125(6), 627–668.**
  - *DOK-1:* Expected, contingent tangible rewards undermined free-choice intrinsic motivation (engagement d ≈ −0.40), and the undermining was **stronger for children than college students**. (Contested by Cameron & Pierce.)
  - *DOK-2:* Rewarding an already-interesting activity reduces later voluntary engagement — so gamifying return corrupts the exact signal; keep measurement invisible and un-gamified.
  - *Link:* https://doi.org/10.1037/0033-2909.125.6.627

#### A.5 The motive-underdetermination problem

- **Falk (2006), "An Identity-Centered Approach to Understanding Museum Learning," *Curator: The Museum Journal* 49(2), 151–166; Falk (2009), *Identity and the Museum Visitor Experience*, Left Coast Press/Routledge.**
  - *DOK-1:* Visitors enact situational, visit-specific identities in the *same* space — explorer, facilitator, professional/hobbyist, experience seeker, spiritual pilgrim (later "recharger"). "Identity influences motivations, which in turn directly influence behavior and learning"; the same museum is used differently by people with different motives, on different days.
  - *DOK-2:* The same behavioral trace (re-entering a probe) can mean different things depending on the child's enacted motive, so a trace under-determines interest; read domain × work-mode separately and triangulate, and never treat identical behavior as identical signal.
  - *Link:* https://doi.org/10.1111/j.2151-6952.2006.tb00209.x

#### A.6 The boundary we refuse (for completeness)

- **Barrett, Adolphs, Marsella, Martinez & Pollak (2019), "Emotional Expressions Reconsidered," *Psychological Science in the Public Interest* 20(1), 1–68; EU AI Act Art. 5(1)(f) / Recital 44.**
  - *DOK-1:* Emotion "cannot be reliably read from facial configurations"; "variability is the norm." The EU AI Act prohibits emotion inference in education for "lack of scientific basis" (in force Feb 2, 2025).
  - *DOK-2:* Facial/affect detection is unfounded and illegal in EU schools; GT100K reads behavior, never faces. This is the exact line SPOV 2/8 draws between behavioral engagement (kept) and affect inference (refused).
  - *Link:* https://doi.org/10.1177/1529100619832930

### Category B — Process-based authorship & competence assessment

#### B.1 Why artifact-level AI detection must never touch a child

- **Weber-Wulff, Anohina-Naumeca, Bjelobaba, et al. (2023), "Testing of detection tools for AI-generated text," *International Journal for Educational Integrity* 19, 26.**
  - *DOK-1:* 14 detectors across 754 cases were "neither accurate nor reliable"; none exceeded ~80% accuracy; tools biased toward classifying text as human and were easily defeated by light obfuscation.
  - *DOK-2:* Detection is inaccurate and gameable; any school-scale deployment produces many wrongful accusations, so GT100K never aims one at a child.
  - *Link:* https://doi.org/10.1007/s40979-023-00146-z

- **Liang, Yuksekgonul, Mao, Wu & Zou (2023), "GPT detectors are biased against non-native English writers," *Patterns* 4(7), 100779.**
  - *DOK-1:* 7 detectors, 91 non-native TOEFL essays vs 88 US **8th-grade** essays. Non-native false-positive rate **61.3%**; 19.8% unanimously misflagged; 97.8% flagged by ≥1 detector; native 8th-grade essays classified accurately. Bias traced to reliance on text perplexity, penalizing limited linguistic variability.
  - *DOK-2:* Detectors both fail and discriminate against the most vulnerable, in our age band; disqualifying on both accuracy and equity grounds.
  - *Link:* https://doi.org/10.1016/j.patter.2023.100779

#### B.2 Structural assessment security & the oral defense

- **Dawson (2021), *Defending Assessment Security in a Digital World*, Routledge.**
  - *DOK-1:* Assessment security has two components supporting validity: **authentication** (the student did the task) and **control of circumstances** (available supports match intent). Argues for "authentic restrictions" over inauthentic ones.
  - *DOK-2:* The conceptual foundation for verification-by-understanding; the defense authenticates, and the secured setting controls circumstances — without banning tools where tool use is authentic.
  - *Link:* https://philldawson.com/

- **Liu & Bridgeman (2023) two-lane approach (University of Sydney); Bridgeman, Liu & Weeks (2024) — as summarized in Lodge, Howard, Bearman, Dawson & Associates (2023), "Assessment reform for the age of artificial intelligence," TEQSA.**
  - *DOK-1:* **Lane 1** = highly secured assessments at key points to assure learning outcomes; **Lane 2** = open, lower-stakes assessments where AI use is permitted and acknowledged. The TEQSA report advises "trustworthy judgements… require multiple, inclusive and contextualised approaches." *Attribution note: cite as Lodge et al. (2023), not "TEQSA (2023)" — per lead author Dawson, it is expert opinion, not official regulator guidance.*
  - *DOK-2:* Maps directly onto GT100K: Lane 2 = open, AI-declared Foundry project work; Lane 1 = the secured, sampled human defense that verifies the understanding behind it.
  - *Link:* https://www.teqsa.gov.au/guides-resources/resources/corporate-publications/assessment-reform-age-artificial-intelligence

- **Corbin, Dawson & Liu (2025), "Talk is cheap: why structural assessment changes are needed for a time of GenAI," *Assessment & Evaluation in Higher Education*.**
  - *DOK-1:* Distinguishes **discursive** changes (rules students may ignore — an "enforcement illusion," e.g. traffic-light AI policies) from **structural** changes (redesigning task mechanics). "Adding in something that is synchronous and interactive is a common way to do a structural change, e.g. discussion with students after they complete a take-home task."
  - *DOK-2:* The sampled oral defense *is* the recommended structural security change; a policy telling children not to misuse AI is not. Build integrity into the architecture, not the rulebook.
  - *Link:* https://researchers.mq.edu.au/en/publications/talk-is-cheap-why-structural-assessment-changes-are-needed-for-a-

- **Sotiriadou, Logan, Daly & Guest (2020), "The role of authentic assessment to preserve academic integrity and promote skill development and employability," *Studies in Higher Education* 45(11), 2132–2148.** **[HE-EXTRAPOLATION]**
  - *DOK-1:* Interactive oral assessment "demonstrated resilience to academic misconduct" and was viewed by students as skill-building, not merely punitive.
  - *DOK-2:* A live, dialogic defense is the strongest single check on understanding and resists AI misconduct — but the evidence is HE, so it must be adapted and de-risked for ages 8–14.
  - *Link:* https://doi.org/10.1080/03075079.2019.1582015

#### B.3 Grade the process, not the polish (age-staged)

- **Kapur (2008), "Productive Failure," *Cognition and Instruction* 26(3), 379–424.**
  - *DOK-1:* Students who struggled through ill-structured problems before instruction later outperformed those given structure up front, despite worse initial attempts.
  - *DOK-2:* Struggle and dead ends are where learning shows — the basis for grading the process (failed attempts included) rather than the polished result.
  - *Link:* https://doi.org/10.1080/07370000802212669

- **Sinha & Kapur (2021), "When Problem Solving Followed by Instruction Works: Evidence for Productive Failure," *Review of Educational Research* 91(5), 761–798.**
  - *DOK-1:* Meta-analysis, 53 studies / 166 comparisons. PS-I beat instruction-first for conceptual knowledge & transfer (Hedges' g = 0.36; up to 0.58 at high fidelity; 0.87 corrected for publication bias). **Reversed for 2nd–5th graders (≈ ages 7–11) and for domain-general skills, where instruction-first won.**
  - *DOK-2:* "Grade the reasoned failure" is right for older learners but must be **age-staged** — scaffold the youngest and don't reward struggle for its own sake in ages ~6–10.
  - *Link:* https://doi.org/10.3102/00346543211019105

#### B.4 Keystroke / process signals and their privacy tradeoffs

- **Morris, Holmes, Choi, Tian & Crossley (2024), "Plagiarism Detection Using Keystroke Logs," *Proceedings of EDM 2024*.** **[ADULT-EXTRAPOLATION]**
  - *DOK-1:* 155 keystroke measures; a random-forest model separated *authentic* from *transcribed* essays at **99%** accuracy. Authentic writing = more/longer pauses before words and sentences, more insertions/deletions/revisions; transcription = longer uninterrupted bursts.
  - *DOK-2:* Keystroke logs strongly separate authored from pasted text, but they detect *transcription*, not authorship per se, and were validated on adults. High discriminative power at a high privacy cost.
  - *Link:* https://doi.org/10.5281/zenodo.12729864 (also: https://educationaldatamining.org/edm2024/proceedings/2024.EDM-short-papers.47/)

- **"Using Keystroke Dynamics to Detect Nonoriginal Text," *Journal of Educational Measurement* (2024), DOI 10.1111/jedm.12431.** **[ADULT-EXTRAPOLATION]** *(author list not independently confirmed here; cited by title/DOI)*
  - *DOK-1:* Keystroke features distinguished copy/reproduction from original drafting at >94% in-lab and >89% in operational assessment conditions (using content-similarity proxies for non-original status).
  - *DOK-2:* Independent corroboration that the authored-vs-transcribed distinction is real and robust, strengthening the case that *coarse* process capture (not full keylogging) can carry much of the signal.
  - *Link:* https://doi.org/10.1111/jedm.12431

#### B.5 The honest limit on what a process trail proves

- **Shavelson, Baxter & Gao (1993), "Sampling Variability of Performance Assessments," *Journal of Educational Measurement* 30(3), 215–232.**
  - *DOK-1:* In performance assessments, a large share of score variance (roughly half) sits in task and occasion rather than stable person ability; many tasks/occasions are needed for a dependable ability estimate.
  - *DOK-2:* The process graph is strong evidence of *authorship and effort* but only *suggestive about ability*; ability claims require many tasks and occasions, which is why the defense is sampled repeatedly, not once.
  - *Link:* *Journal of Educational Measurement* 30(3), 215–232 (DOI not independently confirmed here).

---

## 5. Experts to follow

- **Jennifer Fredricks** (Union College) — the behavioral/emotional/cognitive engagement construct; why behavioral engagement is a real, measurable signal distinct from affect. https://doi.org/10.3102/00346543074001059
- **K. Ann Renninger & Suzanne Hidi** (Swarthmore; Univ. Toronto), with **Jordan Boeder** — the four-phase model and the Interest Development Scale; interest as the disposition to *reengage*, and "motivation to reengage" as the sharpest phase marker. https://doi.org/10.1037/mot0000204
- **John H. Falk** (Oregon State / Institute for Learning Innovation) — identity-related, situational visit motivations; the "same space, different motives" caution behind refusing to read interest off a bare trace. https://doi.org/10.1111/j.2151-6952.2006.tb00209.x
- **Mohammed Saqr & Sonsoles López-Pernas** (Univ. of Eastern Finland) — learning-analytics trace data: which engagement indicators replicate, why single time-points mislead, and why trajectories matter. https://doi.org/10.1080/03075079.2022.2061450
- **Edward Deci & Richard Ryan** (Univ. Rochester) — Self-Determination Theory and reward-undermining; why the measurement layer must not reward the behavior it reads. https://selfdeterminationtheory.org/
- **Phillip Dawson** (Deakin) — assessment security (authentication + control of circumstances); structural vs discursive change; the oral defense as a security mechanism. https://philldawson.com/
- **Danny Liu & Adam Bridgeman** (Univ. of Sydney) — the two-lane (secured/open) assessment model that frames GT100K's Lane-1 defense + Lane-2 open Foundry work. (In Lodge et al., 2023, TEQSA.)
- **Weixin Liang & Debora Weber-Wulff** (Stanford; HTW Berlin) — empirical evidence that AI-text detectors are inaccurate and biased against non-native writers; the case for never aiming one at a child. https://doi.org/10.1016/j.patter.2023.100779 ; https://doi.org/10.1007/s40979-023-00146-z
- **Manu Kapur & Tanmay Sinha** (ETH Zürich) — productive failure and its meta-analysis, including the crucial age reversal for the youngest learners. https://doi.org/10.3102/00346543211019105
- **Scott Crossley** (Vanderbilt) — writing-process analytics and keystroke signals separating authored from transcribed text. https://doi.org/10.5281/zenodo.12729864

---

## 6. Recommendation for GT100K

### (A) Behavioral interest measurement — concrete design

**Signal primitive: the Depth-Weighted Voluntary-Return curve (DW-VR).**

1. **Define a *countable* return event.** A new session on a domain × work-mode probe that is **unprompted** — no reminder, deadline, reward, rivalry event, or logged parent nudge in a defined preceding window (e.g. 48 h). Stamp every return with its prompt-provenance; prompted returns are logged to a *separate* channel and never enter the passion signal (PRD PASS-005).
2. **Two horizons, read as a curve.** Compute return in the **1–7 day** window (near-term stickiness) and the **8–30 day** window (survival past novelty). Report the *trajectory* (persisting / growing / decaying), never a single session, because single time-points do not forecast durable outcomes (Saqr & López-Pernas, 2023).
3. **Depth weight = active construction, not dwell.** Weight each return by generative in-session actions — self-authored scope, chosen difficulty, unrequired revision, recovery after failure, questions asked, artifacts produced — with raw duration as a weak secondary term. This follows Saqr et al. (2022): active proxies replicate, passive ones don't. A short deep return outweighs a long shallow one.
4. **Subtract novelty with a matched control probe.** Durable interest = *excess* return to the target over a novelty-matched neutral probe. A first-exposure spike that decays to the control baseline by day 30 is novelty; return that persists above baseline is candidate durable interest.
5. **Read domain and work-mode as two separate axes**, and attach `competing_explanations` (novelty, ease, praise, peer belonging, parent pressure, resource access, work-mode-over-topic) to every hypothesis (Falk, 2006; PRD §14). Keep the hypothesis `EMERGING` until multiple returns across contexts converge.
6. **Handle missingness as missing, not "no."** Never impute non-return as disinterest; gate on an opportunity/access check first (SPOV 3). This is an equity guardrail as much as a validity one.
7. **Keep the whole layer invisible and un-gamified**, walled off from the game-experience layer, which auto-reverts if it lifts dwell while depressing voluntary return (Deci et al., 1999; PRD §15.3).
8. **Never infer affect or ability from traces.** Traces license behavioral claims only (Henrie et al., 2018); no face/emotion sensing (Barrett, 2019; EU AI Act).

> **Single most important (A):** Make the core metric **depth-weighted, novelty-subtracted, prompt-free voluntary return measured as a 7-/30-day *trajectory*** — not minutes, clicks, or a one-session snapshot — and never reward it.
> Strongest citations: **Saqr et al. (2022)** https://doi.org/10.1080/03075079.2022.2061450 ; **Saqr & López-Pernas (2023)** https://doi.org/10.1016/j.compedu.2023.104787 ; **Boeder et al. (2021)** https://doi.org/10.1037/mot0000204 (with **Deci, Koestner & Ryan, 1999** https://doi.org/10.1037/0033-2909.125.6.627 on why not to reward it).

### (B) Process & defense assessment — concrete design

1. **Ban artifact-level AI/plagiarism detection against any child, categorically** (Weber-Wulff, 2023; Liang, 2023). Declared AI help is a neutral EvidenceGraph node; only *undeclared* help passed off as unaided is misconduct.
2. **Run a two-lane program** (Liu & Bridgeman, 2023): **Lane 2** = open, AI-permitted-and-declared Foundry project work; **Lane 1** = the secured, sampled **human oral defense** that authenticates the understanding behind it (Dawson, 2021). The defense is a *structural* security change, not a rule (Corbin, Dawson & Liu, 2025).
3. **Grade the process, age-staged.** Score the EvidenceGraph trail (attempts, revisions, dead ends, recovery) so a reasoned honest failure can outscore a polished shallow artifact (Kapur, 2008) — **but** apply this fully only for older learners; for ages ~6–10, scaffold more and do not reward struggle for its own sake, because productive failure reverses for grades 2–5 (Sinha & Kapur, 2021). One rubric, three age-band renderings.
4. **Design the defense anxiety-safe and multi-touchpoint.** Many small, low-stakes, familiar-guide conversations ("show me how you did this"; modify a component; reconstruct a step) rather than one high-stakes viva; ≥2 reviewers to damp single-rater bias; playful and very short for ages 6–8 (Sotiriadou, 2020 **[HE-EXTRAPOLATION]**; Lodge et al., 2023). Anxiety-safety is a validity requirement.
5. **Prefer coarse, privacy-preserving process capture over keystroke logging.** Versioned save-snapshots, disabled copy-paste inside secured contexts, and the tool-call/prompt logs already in the EvidenceGraph recover much of the authored-vs-transcribed signal without a keylogger. Treat raw keystroke logging (Morris et al., 2024; *JEDM*, 2024) as opt-in, high-bar, and **never the accuser**.
6. **Treat any process↔defense discontinuity as a *sampling trigger*, never proof of misconduct** (PRD §19); route to more human review; no model may accuse, grade, or reject. Remember the process trail is strong on authorship/effort but only suggestive about ability (Shavelson et al., 1993).

> **Single most important (B):** Verify authorship and competence with a **sampled, anxiety-safe, age-staged human oral defense over an open, AI-declared process trail** — a *structural* Lane-1 check — and **never** with an artifact-level detector.
> Strongest citations: **Liang et al. (2023)** https://doi.org/10.1016/j.patter.2023.100779 ; **Corbin, Dawson & Liu (2025)** https://researchers.mq.edu.au/en/publications/talk-is-cheap-why-structural-assessment-changes-are-needed-for-a- ; **Sinha & Kapur (2021)** https://doi.org/10.3102/00346543211019105 (age-staging the "grade the process" rubric).

---

### Uncertainty ledger (flagged honestly)

- **Age transfer.** Boeder (IDS), Nye (interests–performance), Saqr (learning analytics), Sotiriadou (interactive orals), and the keystroke studies are **adult/HE**; each is marked and treated as a hypothesis to re-validate in ages 6–14, not a settled fact.
- **Numbers to re-check in situ.** The 7-/30-day windows, the 48-h prompt-free window, and depth weights are *design defaults*, not empirically-tuned constants; calibrate against GT100K's own data before any live use.
- **Two contested/unsettled points.** Reward-undermining universality (Cameron & Pierce vs Deci et al.) — we design to the mechanism; and productive failure's age reversal (Sinha & Kapur, 2021) — treated as a hard age-staging constraint.
- **Citations not independently re-verified in this pass** (title/journal correct, DOI/author unconfirmed here): Shavelson, Baxter & Gao (1993) DOI; the *JEDM* (2024) keystroke-dynamics author list; Henrie (2015/2018) exact DOIs (2018 verified via ERIC EJ1183842). Verify before external publication.
