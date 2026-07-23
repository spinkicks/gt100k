# 06 — Measurement Validity & Cold-Start: Trusting an Interest Model With No Ground-Truth Labels

> Hardening memo for GT100K PassionLab. Addresses weak-point #1: there are **no labeled "durable passion" outcomes at launch** (and won't be for years), so the C3 Interest Inference Engine cannot be trained or validated as a supervised model early — yet it must not mis-read children for years with no way to know. This memo specifies how to **validate, calibrate, cold-start, and honestly under-claim** the latent-interest read, and how to prove the `domain × work-mode` tags are valid.

**Owners:** Passion Pipeline research track · Measurement & Inference (C1–C4), Calibration/Validation Harness (G5)
**Status:** Research input to PRD §14 (Interest Lab), the C3/C4/G5 specs, and `passionApps.md` §3 ("inference with no launch labels" = highest-risk / longest-lead)
**Companions:** [`05-assessment-measurement.md`](../05-assessment-measurement.md) (how to compute the behavioral signal), [`01-interest-consolidation-graduation.md`](../01-interest-consolidation-graduation.md) (the lifecycle this feeds)
**Scope honesty:** The core validity/ML methods below are general and mature, but almost all come from settings where a criterion label *eventually* arrives (medicine, ads, NLP) or from adult psychometrics. Applying them to **children's latent interest, where the ultimate criterion may never be crisp**, is the novel and hard part. Domain-transfer risks are flagged **[TRANSFER]**; numeric thresholds are **design defaults to be tuned in situ**, not settled constants. Only real, verifiable sources are cited, with DOIs/links; uncertainty is flagged in the ledger at the end.

---

## 1. Thesis (one line)

With no ground-truth passion labels, you do not "validate the model" once — you run a **standing construct-validation program**: triangulate the behavioral read against independent methods (blinded expert comparative judgment, light self/family report, known-groups), report **calibrated set-valued uncertainty** (conformal on the *near-term proxies that do get labels*, wide sets → an honest "we don't know yet"), **cold-start with hierarchical partial-pooling priors** shrunk toward environment/aptitude subgroups, use **active learning to choose the next probe** while holding a randomized exploration reserve, and **quarantine the model from the behavior it measures** — all while banking a pre-registered longitudinal criterion so that in 2–4 years you can finally do the supervised check you can't do today.

---

## 2. Options with tradeoffs

### 2.1 How to establish validity *without* an outcome label

| Approach | What it buys | Cost / risk | Verdict for GT100K |
|---|---|---|---|
| **Construct validity / nomological net** (Cronbach & Meehl 1955; operationalized for ML by Jacobs & Wallach 2021) | The canonical answer to "validate when there is *no adequate criterion*." Reframes validity as accumulating evidence across ~7 facets (face, content, convergent, discriminant, predictive, hypothesis, consequential), not a one-time score. | Slow, judgment-heavy, never yields a single "accuracy %." | **Adopt as the backbone.** This is literally the discipline invented for the no-ground-truth case. |
| **Convergent/discriminant triangulation** (Campbell & Fiske 1959, multitrait-multimethod matrix) | Measure the same construct by ≥2 *independent methods* (behavior trace vs. guide judgment vs. self/family report). Same-construct methods should agree; different constructs (topic vs. work-mode) should separate. | Needs multiple instruments and enough n for a stable correlation matrix. | **Adopt.** `domain × work-mode` = the "multitrait" axes; behavior/guide/self-report = the "multimethod" axes. Perfect structural fit. |
| **Expert comparative judgment** (Pollitt 2012, Adaptive Comparative Judgement) | Turns unreliable expert *ratings* ("rate this child's interest 1–7") into reliable *pairwise choices* ("which of these two shows more genuine engagement?") → a Thurstonian scale, often more reliable than marking. Builds a defensible **silver-standard criterion** from human holistic judgment. | Requires many judgments (∝ n·log n); judges can share bias. | **Adopt as the interim criterion.** Cheaper and far more reliable than rating scales; also feeds convergent validity. |
| **Known-groups validity** | Check whether the read separates groups *known a priori* to differ (e.g., children who arrive already in a club/competition/portfolio in a domain vs. matched peers). | Small/edge known groups; risk of circularity if group membership leaks into features. | **Adopt as a fast sanity gate.** Cheap, interpretable, catches gross failure early. |
| **Weak supervision / proxy "silver" labels** (Ratner et al. 2017, Snorkel) | Encode expert heuristics as labeling functions ("≥3 unprompted returns across ≥2 contexts + rising depth ⇒ candidate") and *denoise them without ground truth* to bootstrap and stress-test the model before real labels exist. | Silver labels inherit heuristic bias; easy to mistake scaffolding for truth. | **Adopt for bootstrapping/tests only**, never as the accuser or as training truth. |
| Wait for real outcomes before claiming anything | Maximally honest. | Years of blind operation; the exact risk we're hardening against. | **Reject as the sole plan** — but *do* run it in parallel (bank the criterion, §3.6). |

### 2.2 Cold-start for the Bayesian/latent-trait read

| Strategy | Mechanism | Tradeoff |
|---|---|---|
| **Hierarchical partial-pooling priors (empirical Bayes / shrinkage)** — Efron & Morris 1977 | A new child's `(domain × work-mode)` cell is shrunk toward population/subgroup means until their own returns accrue; "priors from environment/aptitude" (PRD) = the group-level predictors of a multilevel model. | Shrinkage can **wash out a genuine early spike** and can **import population bias** into individuals — must audit for equity. |
| **Content-based cold-start** — Schein et al. 2002 | Predict affinity from probe *content features* × child covariates before any interaction; hybridize with collaborative signal as it arrives. | **Entirely dependent on tag validity** (C2) — the hidden critical dependency; garbage tags ⇒ garbage cold-start. |
| **Exploration policy: Thompson sampling / bandits** — Russo et al. 2018 | Posterior sampling balances trying new cells vs. exploiting apparent interest; naturally generates the off-policy data validation needs. | Exploration must be **capped for wellbeing** (no thrashing) and stay **reward-neutral**; pure regret-minimization is the wrong objective for a child. |
| Flat/uninformative priors | No imported bias. | High-variance early reads; slow; more likely to mislead in month 1. |

### 2.3 Honest uncertainty

| Option | Guarantee | Catch for us |
|---|---|---|
| **Conformal prediction** (Angelopoulos & Bates 2021) | Distribution-free, finite-sample coverage: 90% prediction *sets* contain the truth ≥90% of the time; large set = "many possibilities" = honest *"we don't know yet."* | Needs an **exchangeable labeled calibration set** — which the *ultimate* passion label never provides at launch. Apply it to **proxy targets that do get labeled** (e.g., "returns to cell within 14 days"); exchangeability is also broken by feedback loops/non-stationarity. |
| **Bayesian posterior credible intervals** | Native to C3; full uncertainty propagation. | Only as calibrated as the priors/likelihood; must be *checked* by conformal on proxies, not trusted blindly. |
| **Post-hoc calibration** (temperature scaling; Guo et al. 2017) | Cheap, keeps rankings, fixes over-confident probabilities on any classifier component. | Calibrates confidences, not the *construct*; a well-calibrated wrong proxy is still wrong. |

### 2.4 Active learning (which probe next)

| Option | Idea | Tradeoff |
|---|---|---|
| **Uncertainty sampling** (Settles 2009) | Probe the `(domain × work-mode)` cell where the model is least certain. | Simple; myopic; vulnerable to sampling bias. |
| **Information-theoretic / BALD** (Houlsby et al. 2011) | Pick the probe maximizing mutual information between the next observation and the latent factors — and it's derived for **classification *and preference* learning**, which is exactly interest. | Heavier compute; still needs a wellbeing cap. |
| **Disambiguation probes** | Choose the probe that best splits *competing* hypotheses (e.g., same work-mode in a new topic to separate topic-love from work-mode-love; PRD's disconfirming probe). | Can feel "testy" if overused; must stay playful. |
| Honest limit for all three | — | **Active querying biases the sample** (Dasgupta 2011): the more you chase informative probes, the less the data looks like the child's free behavior. → keep a **randomized exploration reserve** for unbiased validation. |

### 2.5 Anti-feedback-loop posture (model shaping what it measures)

| Failure mode (evidence) | GT100K instantiation | Mitigation |
|---|---|---|
| **Runaway loop** — Ensign et al. 2018 | Surface probes toward the inferred interest → count returns there as "confirmation" → narrower surfacing → false certainty. | Log **exposure propensities**; down-weight system-caused returns; inverse-propensity correction; keep exploration. |
| **Algorithmic confounding / homogenization** — Chaney et al. 2018 | Recommending cabins/resources narrows exploration and *reduces utility, worst for minority-preference kids* — then the model "confirms" the narrowing. | Randomized/round-robin exposure reserve; diversity floor across cells; audit per-subgroup. |
| **Performativity** — Perdomo et al. 2020 | Predictions shift the outcome distribution; naive retraining chases a moving target. | Treat "surfaced by system" as a *treatment*; **validate on the randomized-exploration stream the model didn't steer**; measure the causal lift of recommendation separately from organic interest. |

---

## 3. Recommended validation + calibration plan (concrete)

**Design stance:** the model **proposes revisable hypotheses; humans dispose** (PRD F1). Everything below serves two goals — (a) don't silently mis-read a child, and (b) generate the evidence that will eventually let us do a real supervised validation.

### 3.1 Instrument three independent methods (so triangulation is even possible)

Per child, per `(domain × work-mode)` cell, record:
1. **Behavioral read (C1→C3):** depth-weighted, novelty-subtracted, prompt-free voluntary-return trajectory (see [`05-assessment-measurement.md`](../05-assessment-measurement.md)). Method A.
2. **Blinded guide judgment:** periodic **pairwise comparative judgment** (Pollitt 2012) — "which of these two children shows more genuine, self-driven engagement in music-making?" — judges blind to the model output. Method B.
3. **Light self-report + family report:** short, low-frequency, never scored into the signal. Method C.

These are the rows/columns of a **multitrait-multimethod matrix** (Campbell & Fiske 1959): traits = the `domain × work-mode` cells; methods = A/B/C.

### 3.2 Metrics (what "valid enough to act" means)

**Reliability (is the read stable and self-consistent?)**
- **Test–retest** of the *ranked hypothesis* over short windows: stable ordering with room to revise (not jittery, not frozen).
- **Internal consistency** across the six active-construction signal families (C1); split-half of returns.
- **Tag inter-rater reliability (C2):** ≥3 independent taggers per item; report **Krippendorff's α** (handles ≥2 raters, any measurement level, missing data; Hayes & Krippendorff 2007). Targets: **α ≥ 0.80 ship / 0.667–0.80 provisional / < 0.667 block** (Krippendorff's convention), cross-checked against **Landis & Koch (1977)** κ bands ("substantial" 0.61–0.80, "almost perfect" 0.81–1.00). Adjudicate disagreements; monitor tagger drift.
- **Taxonomy content validity (C2):** **Lawshe CVR/CVI** (1975) from an expert panel — is each `work-mode`/`domain` tag *essential*, and does the taxonomy cover the space?

**Validity (is it the right construct?)** — the Jacobs & Wallach (2021) facets:
- **Convergent:** off-diagonal A–B–C agreement in the MTMM matrix on the same cell.
- **Discriminant:** topic vs. work-mode separate (a "debugging-everywhere" child ≠ a "robotics" child); the read is **not** explained by confounds — regress out novelty, ease/difficulty, praise/social pull, access/opportunity, and prompted returns, and require the signal to survive.
- **Known-groups:** faster/higher candidate reads for children with a documented pre-existing intense interest vs. matched peers.
- **Predictive (against *proxies*, pre-registered):** the early read predicts (i) later voluntary return in **new, unseen** contexts (out-of-sample), (ii) 6- and 12-month self/family-reported interest, (iii) specialization choices — **explicitly labeled proxies, not the durable-passion criterion.**
- **Consequential:** audit downstream effects — missingness treated as "no," subgroup disparities, any narrowing of exploration.

**Calibration (is the confidence honest?)**
- On **proxy tasks whose labels materialize** (e.g., 14-day return), report **conformal coverage** (does the 90% set cover ~90%?) and a **reliability diagram / ECE** (Guo et al. 2017).
- Map **conformal set size → lifecycle state:** wide set ⇒ keep `EXPLORING/EMERGING` (the machine-checkable form of "we don't know yet"); only a **narrow, stable, confound-survived** set may reach `CANDIDATE`; humans own any `ACTIVE`.

### 3.3 Cold-start configuration

- **Multilevel model with partial pooling** (Efron & Morris 1977): individual cell estimates shrink toward **environment/aptitude subgroup means** (the PRD's "priors"), relaxing toward the child's own data as returns accrue. **Report the shrinkage weight** so a guide can see "this is mostly prior, little evidence yet."
- **Content-based warm-up** (Schein et al. 2002) from probe tags × child covariates for the first sessions — **gated on C2 tag validity clearing §3.2 thresholds.**
- **Exploration via posterior/Thompson sampling** (Russo et al. 2018), **capped** (a bounded fraction of sessions, wellbeing-first, reward-neutral).
- **Trust rule:** early reads are **low-trust by construction** — prefer "insufficient evidence" and never let a cold-start estimate drive an irreversible action.

### 3.4 Active-learning probe selection (with a safety reserve)

- Next probe = **max expected information gain about the latent factors** (BALD, Houlsby et al. 2011) *and/or* the best **hypothesis-disambiguating** probe, subject to a **wellbeing cap** (frequency limit, always playful, never sacrifice a good experience for information).
- **Hold a randomized exploration reserve** (round-robin/ε across cells). This stream is (a) the unbiased set for validation and calibration and (b) the antidote to sampling bias (Dasgupta 2011) and feedback loops (§2.5).

### 3.5 First-cohort protocol (pre-registered)

1. **Pre-register**, before launch: the operational definition of the eventual criterion (a "durable spike" = sustained unprompted return + deepening + human-owned confirmation over ≥ *N* months), the proxy outcomes, the validity hypotheses, and all thresholds. (Pre-registration is what keeps a no-ground-truth program from rationalizing itself.)
2. **Dual-track every read**: model hypothesis + blinded guide comparative-judgment, stored side by side but **the guide never sees the model** during collection.
3. **Randomized exploration arm** from day 1 (§3.4) as the clean validation stream.
4. **Weekly**: tag IRR (α/κ) on newly authored content; block content that fails.
5. **Monthly**: refresh the MTMM matrix (convergent/discriminant), known-groups check, conformal coverage on matured proxies, confound-survival regressions, missingness-as-missing audit, subgroup disparity + homogenization audit.
6. **Quarterly**: recalibrate; review every `CANDIDATE`/`ACTIVE` promotion for evidence sufficiency; publish an internal validity report (G6) — including where the model was *wrong* vs. guides.
7. **Stop/scope rules**: if convergent validity is weak, if calibration coverage is off, or if tags fail IRR, the system **stays in low-commitment states and defers to humans** rather than promoting hypotheses.

### 3.6 Bank the criterion (so real validation becomes possible)

Start accruing the pre-registered longitudinal outcome now (G5). In 2–4 years this converts today's proxy/construct evidence into genuine **predictive validation** and lets C3 graduate from "principled Bayesian" to "ML-tuned" — the PRD's stated arc — **on labels, not vibes.**

---

## 4. Cited best-practices / evidence (real, verifiable)

**Validity without ground truth**
- **Cronbach, L. J., & Meehl, P. E. (1955). Construct validity in psychological tests.** *Psychological Bulletin* 52(4), 281–302. — The charter for validating measures of constructs with "no adequate criterion (no operational definition)"; build a nomological network. https://doi.org/10.1037/h0040957
- **Campbell, D. T., & Fiske, D. W. (1959). Convergent and discriminant validation by the multitrait-multimethod matrix.** *Psychological Bulletin* 56(2), 81–105. — Same-trait/different-method convergence + different-trait discrimination = triangulation, operationalized. https://doi.org/10.1037/h0046016
- **Jacobs, A. Z., & Wallach, H. (2021). Measurement and Fairness.** *FAccT '21*, 375–385. — Ports construct validity/reliability to ML measurement of unobservable constructs; the 7 validity facets used in §3.2. https://doi.org/10.1145/3442188.3445901 (arXiv:1912.05511)
- **Pollitt, A. (2012). The method of Adaptive Comparative Judgement.** *Assessment in Education* 19(3), 281–300. — Pairwise expert judgment → reliable Thurstonian scale; the interim silver criterion. https://doi.org/10.1080/0969594X.2012.665354
- **Lawshe, C. H. (1975). A quantitative approach to content validity.** *Personnel Psychology* 28(4), 563–575. — CVR/CVI from expert panels for the tag taxonomy. https://doi.org/10.1111/j.1744-6570.1975.tb01393.x

**Tag / inter-rater reliability**
- **Landis, J. R., & Koch, G. G. (1977). The measurement of observer agreement for categorical data.** *Biometrics* 33(1), 159–174. — The κ interpretation bands. https://doi.org/10.2307/2529310
- **Hayes, A. F., & Krippendorff, K. (2007). Answering the call for a standard reliability measure for coding data.** *Communication Methods and Measures* 1(1), 77–89. — Krippendorff's α: any number of raters, any level, missing data. https://doi.org/10.1080/19312450709336664

**Cold-start (Bayesian / latent-trait / recommender)**
- **Efron, B., & Morris, C. (1977). Stein's paradox in statistics.** *Scientific American* 236(5), 119–127. — Shrinkage/partial pooling toward a grand mean beats per-item estimates; the cold-start mechanism. https://www.scientificamerican.com/article/steins-paradox-in-statistics/
- **Schein, A. I., Popescul, A., Ungar, L. H., & Pennock, D. M. (2002). Methods and metrics for cold-start recommendations.** *SIGIR '02*, 253–260. — Content+collaborative hybrid for items nobody has rated yet. https://doi.org/10.1145/564376.564421
- **Russo, D. J., Van Roy, B., Kazerouni, A., Osband, I., & Wen, Z. (2018). A Tutorial on Thompson Sampling.** *Foundations and Trends in ML* 11(1), 1–96. — Posterior-sampling exploration for cold-start recommendation. https://doi.org/10.1561/2200000070
- **Ratner, A., Bach, S. H., Ehrenberg, H., Fries, J., Wu, S., & Ré, C. (2017). Snorkel: Rapid Training Data Creation with Weak Supervision.** *PVLDB* 11(3), 269–282. — Denoise heuristic labeling functions "without access to ground truth" to bootstrap. https://doi.org/10.14778/3157794.3157797

**Calibrated / honest uncertainty**
- **Angelopoulos, A. N., & Bates, S. (2021). A Gentle Introduction to Conformal Prediction and Distribution-Free Uncertainty Quantification.** arXiv:2107.07511. — Distribution-free prediction sets; large set = honest "don't know." https://arxiv.org/abs/2107.07511
- **Guo, C., Pleiss, G., Sun, Y., & Weinberger, K. Q. (2017). On Calibration of Modern Neural Networks.** *ICML*, PMLR 70, 1321–1330. — ECE, reliability diagrams, temperature scaling. https://proceedings.mlr.press/v70/guo17a.html

**Active learning**
- **Settles, B. (2009). Active Learning Literature Survey.** UW–Madison CS Tech Report 1648. — Uncertainty sampling, query-by-committee, and the sampling-bias caution. https://research.cs.wisc.edu/techreports/2009/TR1648.pdf
- **Houlsby, N., Huszár, F., Ghahramani, Z., & Lengyel, M. (2011). Bayesian Active Learning for Classification and Preference Learning.** arXiv:1112.5745. — BALD; derived for *preference* learning (i.e., interest). https://arxiv.org/abs/1112.5745
- **Dasgupta, S. (2011). Two faces of active learning.** *Theoretical Computer Science* 412(19), 1767–1781. — Sampling bias is "the most fundamental challenge" of active learning. https://cseweb.ucsd.edu/~dasgupta/papers/twoface.pdf

**Pernicious feedback loops**
- **Ensign, D., Friedler, S. A., Neville, S., Scheidegger, C., & Venkatasubramanian, S. (2018). Runaway Feedback Loops in Predictive Policing.** *FAccT*, PMLR 81, 160–171. — Acting on predictions makes them self-confirming; fix the inputs. https://proceedings.mlr.press/v81/ensign18a.html
- **Chaney, A. J. B., Stewart, B. M., & Engelhardt, B. E. (2018). How algorithmic confounding in recommendation systems increases homogeneity and decreases utility.** *RecSys '18*, 224–232. — Names the "pernicious feedback loop"; homogenizes behavior, worst for minority preferences. https://doi.org/10.1145/3240323.3240370
- **Perdomo, J., Zrnic, T., Mendler-Dünner, C., & Hardt, M. (2020). Performative Prediction.** *ICML*, PMLR 119, 7599–7609. — Predictions change the distribution they predict; calibrate to *post-action* outcomes. https://proceedings.mlr.press/v119/perdomo20a.html

---

## 5. Open risks + honest limits

1. **The deepest limit is structural, not fixable by cleverness.** Every method here is *convergent/construct* evidence; none is the durable-passion criterion, which doesn't exist yet. The honest posture is **calibrated humility + revisable hypotheses + banked criterion**, not "validated accuracy."
2. **Silver criteria can be confidently wrong together.** Guides, families, and the model can share the same cultural/access biases, faking convergent validity (a known MTMM weakness). Mitigate with blinding, diverse judges, subgroup audits, and treating agreement as necessary-not-sufficient.
3. **Conformal's exchangeability is violated exactly where we care.** Feedback loops and developmental non-stationarity break the i.i.d./exchangeable assumption; coverage guarantees hold for near-term proxies on the *randomized* stream, and degrade off it. Report which stream a guarantee came from.
4. **Shrinkage vs. the rare kid.** Partial-pooling can erase a genuine idiosyncratic early spike and can import majority bias into a minority-preference child (the Chaney 2018 harm). Always surface the shrinkage weight and audit per subgroup.
5. **Active learning can turn discovery into an exam.** Information-greedy probing biases the sample (Dasgupta 2011) *and* risks making the child feel tested — corroding the very voluntary signal (reward-neutrality, [`05`](../05-assessment-measurement.md)). Wellbeing cap + randomized reserve are non-negotiable.
6. **It all rests on tag validity (C2).** Content-based cold-start and the whole `domain × work-mode` read are only as good as the tags; if C2 IRR fails, the correct action is to *stop promoting hypotheses*, not to trust the model anyway.
7. **[TRANSFER]** Nye/Boeder/learning-analytics-style priors and every ML method here are adult/HE/industry in origin; treat all numeric thresholds (α ≥ 0.80, 90% coverage, 14-day proxy window, exploration fraction, *N* months) as **defaults to calibrate on GT100K's own first cohorts.**

### Uncertainty ledger (flagged honestly)
- **Verified this pass** (DOI/venue confirmed via publisher/arXiv/PMLR): Cronbach & Meehl 1955; Campbell & Fiske 1959; Jacobs & Wallach 2021; Pollitt 2012; Lawshe 1975; Landis & Koch 1977; Hayes & Krippendorff 2007; Schein et al. 2002; Russo et al. 2018; Ratner et al. 2017; Angelopoulos & Bates 2021; Guo et al. 2017; Settles 2009 (TR1648); Houlsby et al. 2011; Ensign et al. 2018; Chaney et al. 2018; Perdomo et al. 2020.
- **Locator verified, DOI not re-confirmed this pass:** Efron & Morris (1977) — cited via the *Scientific American* article page (vol. 236(5):119–127); the Nature DOI `10.1038/scientificamerican0577-119` is commonly listed but not re-verified here. Dasgupta (2011) — cited via the author-hosted PDF and journal locator (*TCS* 412(19):1767–1781); Elsevier DOI `10.1016/j.tcs.2010.12.054` is likely correct but not re-confirmed this pass.
- **Design defaults, not empirical constants:** every threshold in §3 (see risk #7).
- **Method-transfer assumption:** the biggest bet is that mature validity/UQ machinery transfers to *children's latent interest with a never-crisp criterion*; this memo treats that as a hypothesis to be monitored, not a settled fact.
