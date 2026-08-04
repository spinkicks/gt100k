# 09 — Adult Observation: How Much to Trust `external_report`, and How to Capture It

> Hardening memo for GT100K PassionLab. `external_report` (E10) exists in `@gt100k/interest-inference` as an `EventKind` with `reportScope: "focused" | "broad"` and a required `reporter`, scoring `A_REPORT_BROAD = 0.25` for `broad` and zero for `focused`, and buying **no distinct day**. Nothing can emit one. This memo asks what the evidence says about (a) how accurate an adult is about a child's interests, (b) which biases the channel will import, (c) whether asking changes the adult or the child, (d) how the multi-informant literature says to combine a report with behaviour, and (e) what question wording holds up. It ends with a capture design and a weight recommendation.

**Owners:** Passion Pipeline research track · C3 Interest Inference (`specs/011-interest-inference`), the emission side in `passion/apps/discovery`, and any future parent/guide surface
**Status:** Research input. Answers open question #4 in [`docs/proposals/interest-engine-data-collection-v2.md`](../../../proposals/interest-engine-data-collection-v2.md) §7 ("how much should a parent report move a posterior… possibly zero weight and report-only").
**Companions:** [`06-measurement-validity-coldstart.md`](./06-measurement-validity-coldstart.md) (the construct-validation backbone and the anti-feedback posture this memo inherits), [`05-assessment-measurement.md`](../05-assessment-measurement.md)
**Scope honesty:** **There is no study of parent accuracy about a child's interest measured against that child's observed free-choice behaviour.** Every number below is transported from an adjacent literature — informant discrepancy in child mental health, teacher judgment accuracy, proxy-vs-log measurement of children's activity, and vocational interest in adolescents. Transport risks are flagged **[TRANSFER]**. The §8 ledger states what we do not know.

---

## 1. Thesis (one line)

An adult's account of a child's interest is a **weak-to-moderate** signal — expect `r ≈ .2–.4` against any independent criterion, and about **zero** when it is elicited as one global retrospective question — so it must never be able to establish an interest, only corroborate one the child's own behaviour already earned; the way to make it worth having is not to weight it higher but to **change what is asked** from "what is your child interested in" to a dated, single, recent, free-choice episode, and to make the channel **write-only from the adult's side**, because the well-evidenced danger is not inaccuracy but the belief→investment→pressure loop that a visible report would close.

---

## 2. Q1 — How accurate are parents and teachers about a child's interests?

### 2.1 The base rate for any adult report about a child

The informant-discrepancy literature is the largest and most stable body of evidence on this question, and its central number has not moved in forty years.

| Source | Design | Result |
|---|---|---|
| Achenbach, McConaughy & Howell 1987 (via [Martel et al. review](https://pmc.ncbi.nlm.nih.gov/articles/PMC5247337/)) | 119 studies, 1960–1986 | Mean cross-informant `r = .28`. **Same-type informants (two parents) `r = .60`; different-type (parent–teacher) `r = .28`; self-vs-other `r = .22`.** |
| [De Los Reyes et al. 2015, *Psychological Bulletin*](https://psycnet.apa.org/manuscript/2015-18640-001.pdf) ([SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2632484)) | 341 studies, 1989–2014, 1,218 data points | Mean overall `r = .27–.28` (internalizing `.25`, externalizing `.30`). **Identical to the 1987 estimate.** |
| [De Los Reyes et al. 2019, via the 2022 special issue](https://doi.org/10.1080/15374416.2022.2158843) | Hundreds of studies, 30+ countries, every inhabited continent | `r = .28` [95% CI .24–.31]. Not a WEIRD artifact. |
| [*Discordance in parents' and adolescents' reports of parenting*, 2020, *American Psychologist*](https://doi.org/10.1037/amp0000463) | 313 studies | `r = .276` [.262, .290]; parents report more favourably than adolescents (`g = .242`). Discordance **higher for younger** adolescents. |
| [*Meta-Analysis on Parent–Teacher Agreement on Preschoolers' Emotional and Behavioural Problems*, 2020](https://doi.org/10.1007/s10578-020-01044-y) | Parent–teacher agreement, preschoolers, 13 societies | Caregiver–teacher `≈ .35`; higher for externalizing than internalizing. |

Read that as a ceiling, not a floor. These are constructs adults are *trained and motivated* to report on, with validated instruments, and they still land near `r = .28`.

### 2.2 The closest analogue we have: adult report vs. logged child behaviour

This is the comparison the product actually faces — an adult's account versus telemetry — and it is worse than the psychopathology numbers.

- **Parent report vs. tablet telemetry.** In an 8-week digital media intervention with 4- and 5-year-olds (N = 216), parent weekly reports of their child's use of the intervention apps correlated with tracking-software logs at **`r = 0.35`**, with parents **systematically over-reporting** in every one of the seven weeks; only 41% of data points were within one hour of the logged value. The authors conclude parent report "is not a reliable substitute for telemetry." ([SRI, *Comparing Parent Report and Telemetry Measures*](https://www.sri.com/wp-content/uploads/2023/05/Comparing-Parent-Report-and-Telemetry-Measures.pdf))
- **Self/proxy report vs. usage logs, generally.** [Parry et al. 2021, *Nature Human Behaviour*](https://doi.org/10.1038/s41562-021-01117-5), 106 effect sizes: reported media use "correlates only moderately with logged measurements" and "was rarely an accurate reflection" of it.
- **A single global question is worth nothing.** Asking 115 parents one question — average minutes per day their child (mean age 6.9) is physically active — against 7 days of accelerometry produced **`r = −0.11`, ns**, despite nearly identical group means. Accuracy tracked *co-presence*: `r = .27` where the parent did the activity with the child most often, `r = −.33` where they did so least. ([Med Sci Sports Exerc 2008](https://doi.org/10.1249/01.mss.0000322733.37506.ea)) A structured 7-day parent proxy *record* did better but still only "poor to fair," with consistent over-reporting ([2005](https://doi.org/10.1249/01.mss.0000174906.38722.2e)); a typical-day proxy report was acceptable against pedometry and unacceptable against accelerometry, `r = .26` ns ([2010](https://doi.org/10.1249/01.mss.0000385090.08787.b8)).
- **And the diagnosis: it is retrospection, not the parent.** When the same parents reported *in the moment* via ecological momentary assessment, their reports of the child's activity were **strongly** associated with concurrent accelerometry ([JMIR mHealth 2020](https://doi.org/10.2196/15458)). Parents watching their children are decent observers. Parents remembering a fortnight are not.

**This is the single most decision-relevant finding in the memo.** The spread between `r ≈ 0` (one global retrospective question) and `r ≈ .35` (dated weekly reports of specific activity) and "strong" (momentary) is produced entirely by *how you ask*, and it is far larger than any difference between kinds of adult.

### 2.3 Does accuracy differ by domain, age, or temperament?

**By domain — yes, and lawfully.** Agreement is consistently higher for *observable* behaviour than for internal states (Achenbach: externalizing `.41` vs internalizing `.32`; replicated across the meta-analyses above). [Funder's Realistic Accuracy Model](https://doi.org/10.3390/bs14111080), invoked repeatedly in this literature, gives the mechanism: accuracy depends on a trait's **visibility** and its **relevance to that informant**. Applied here: a child who talks about dinosaurs constantly is highly visible; a child who quietly reads about them is not. Expect the channel to systematically under-report private, low-noise interests — which is a real bias, not just noise, because low-noise interests are not less durable.

**By age — genuinely unclear.** The literatures point in different directions. [PedsQL parent-proxy ICCs](https://link.springer.com/article/10.1186/1477-7525-4-58) ranged `.02–.23`, higher for the *oldest* group on psychosocial domains and the *youngest* on physical. The parenting-discordance meta-analysis found discordance *higher* for younger adolescents. The gifted-nomination meta-analysis found nomination–criterion agreement *stronger in primary than secondary school* (p < .09). A cohort followed childhood→adulthood concluded correlations "depend more on the informant pair than on problem type or age group," though informant differences on internalizing widen with age ([Erasmus, ch. 3](https://repub.eur.nl/pub/120273/120273_Chapter_3-Agreement_of_informants_on_emotional_and.pdf)). **No defensible age gradient across 6–14. Do not build one into the weight.**

**By temperament — one direct test, null.** A [2026 study of parent/child/teacher temperament ratings](https://link.springer.com/article/10.1007/s10578-026-01994-9) explicitly tested whether behavioural inhibition moderates parent–teacher agreement and found no evidence for it. Separately, agreement *about* inhibited children is poor: parents and teachers placed only ~40% of kindergarteners in the same BI category and 33% differed by more than one category ([Behav Sci 2024](https://doi.org/10.3390/bs14111080)); Ballespí et al. found both parents and teachers have "moderate-to-low ability to identify behaviorally inhibited children" ([Front Psychiatry 2024](https://doi.org/10.3389/fpsyt.2024.1457479)). So: no evidence temperament changes *agreement*, decent evidence that quiet children are harder for any adult to read. Consistent with the visibility mechanism in §2.3.

### 2.4 The one piece of genuinely interest-specific validity evidence

Parent report of a child's interest is not noise. In a 2-year longitudinal study, **parent-reported intense science interest at ages 4–6 predicted science self-concept and science achievement at age 8 — for girls, and not for boys** — and early interest was a *stronger* predictor than concurrent interest ([Leibham, Alexander & Johnson 2013, *Science Education*](https://doi.org/10.1002/sce.21066)). The same programme established that parent-reported conceptual interests are sustained at meaningful rates and decline after the transition to formal schooling ([Alexander et al. 2008](https://doi.org/10.1016/j.cogdev.2007.11.004)).

That is **predictive** validity, not convergent validity. It says the channel carries real signal about *something* durable. It does not say the parent is describing the child's behaviour accurately — a parent's belief that their daughter loves science may predict her age-8 science self-concept partly *because the belief caused it* (§4.3). Both readings are alive, and this literature cannot separate them.

---

## 3. Q2 — Known biases in adult reports of children

Every bias below points the same direction: toward what adults *value* and toward what adults *expect*.

### 3.1 Adults are good at judging what a child is good at, and bad at judging what a child likes

This is the most important bias finding for this product, and it is well quantified.

| Judgment target | Accuracy | Source |
|---|---|---|
| Academic achievement | `r = .63` | [Südkamp, Kaiser & Möller 2012, meta-analysis, 75 studies](https://doi.org/10.1037/a0027627) |
| Intelligence | `r = .50` | [Machts et al. 2016, meta-analysis, 33 studies / 106 ES](https://www.sciencedirect.com/science/article/abs/pii/S1747938X16300276) |
| Other cognitive abilities | `r = .42` | ibid. |
| Giftedness | `r = .36` | ibid. |
| Creativity | `r = .34` | ibid. |
| Motivation | moderate | [Urhahne & Wijnia 2021, 40-year review](https://doi.org/10.1016/j.edurev.2020.100374) |
| **Interest** | **low** | Zhu & Urhahne, via [Teacher Judgement Accuracy chapter](https://doi.org/10.1007/978-3-658-43414-4_10) |

Urhahne & Wijnia's ordering is explicit: teachers judge achievement more accurately than academic self-concept, and self-concept more accurately than motivation and emotion. Zhu & Urhahne, testing all of these on the same children, found competence judged with *high* accuracy and **interest with *low* accuracy**.

And the mechanism is named. Machts et al. report an **academic achievement bias**: teachers' judgments of *intelligence* correlated more strongly with *achievement* measures (`r = .61`) than with actual intelligence measures. When an adult is asked to judge a latent attribute, they answer with the school-visible proxy.

The direct consequence: **an unstructured `external_report` will preferentially name academically legible interests.** A child who is drawn to reading will be reported as "interested in books"; a child who is drawn to taking apart the vacuum cleaner may be reported as nothing at all. [Siegle & Powell 2004](https://doi.org/10.1177/001698620404800103) found the same weighting in the nomination context: the ability to do mental computation overshadowed schoolwork completion, "esoteric" interest was worth about as much as completing schoolwork, and classroom teachers were more inclined than gifted specialists to focus on weaknesses rather than strengths.

### 3.2 Halo

Halo is the mechanism that makes a single adult impression bleed across every rating they give. It is old and well established ([Cooper 1981, "Ubiquitous halo"](https://doi.org/10.1037/0033-2909.90.2.218)), and current work distinguishes *true* halo (genuinely correlated performance) from *illusory* halo (rater error), finding experienced raters still subject to the illusory kind and the effect shrinking as the number of distinct rating criteria rises ([Behav Res Methods 2022](https://doi.org/10.3758/s13428-021-01721-3)). In school settings a "general impression halo" loads as a second-order latent factor over supposedly independent quality dimensions ([Springer 2021](https://springerlink.fh-diploma.de/chapter/10.1007/978-3-030-75150-0_3)).

The countermeasure is the reason behaviourally anchored rating scales exist: they ask raters "to perform less of an inferential leap by focusing on what ratees *do* — concrete actions — rather than who they *are*", which is what reduces illusory halo ([ETS RR on BARS](https://doi.org/10.1002/ets2.12152), citing Smith & Kendall 1963; Borman 1991). This is the single strongest theoretical argument for the wording recommendation in §6.

### 3.3 Gender stereotyping — and evidence that some of it lives in the instrument

The parent-report interest literature has a large, consistent gender skew:

- **75%** of children whose parents reported an "extremely intense interest" were boys, and parents rated boys' interests as more extreme (M = 3.88 vs 3.33); ~1/3 of children had such an interest, mean onset 18 months ([DeLoache, Simcock & Macari 2007, *Developmental Psychology*](https://doi.org/10.1037/0012-1649.43.6.1579)).
- **Boys were six times as likely as girls** to be reported as having an interest in a conceptual domain, in a longitudinal study of 211 four-year-olds ([Johnson, Alexander, Spencer, Leibham & Neitzel 2004](https://doi.org/10.1016/j.cogdev.2004.03.001)).

Now the tell. Reviewing the same age band, Pattison notes: *"The discrepant findings across studies may be due to caregivers' tendency to self-report interest based on cultural stereotypes. Recent studies using caregiver self-report methods have shown significant gender differences, while studies using observation or child interview methods have not."* ([Pattison, OSU](https://ir.library.oregonstate.edu/downloads/sx61dp688); [Pattison & Dierking 2018](https://informalscience.org/wp-content/uploads/2019/03/PattisonDierking2018_EarlyChildSciInterest_PrePub.pdf)) The gender gap in early interest is **present in adult report and absent in observation**. Some unknown share of it is the instrument.

Corroborating, from ability judgment where a blind criterion exists:

- Parents over-estimate all children's skills, but over-estimate **boys** more in mathematics and not in reading; the boy-over-girl premium in maths relative to reading is **15.7% of a standard deviation**, and it *disappears* for parents interviewed after being shown the child's blind-graded test scores ([*Gender Stereotypes in the Family*, IZA DP 15773](https://eprints.soton.ac.uk/494159/1/dp15773.pdf)).
- In Growing Up in Ireland, **at age nine both teachers and primary caregivers underestimate girls' maths** relative to standardised tests, with a gender differential remaining after controlling for actual performance, attitudes and academic self-concept ([McCoy, Byrne & O'Connor](https://esri.ie/publications/gender-stereotyping-in-parents-and-teachers-perceptions-of-boys-and-girls-mathematics)).
- Grey literature, flagged as such: an Australian survey found parents rate boys' STEM suitability (78%) *above* the boys' own observed interest (74%) and girls' suitability (60%) *below* theirs (65%) ([UNSW Future You](https://www.unsw.edu.au/future-you/about-us/news-and-updates/new-data-reveal-that)). Directionally consistent; not peer-reviewed.
- Older nomination work found teachers judged boys stronger in physical/technical areas and girls in artistic/socioaffective ones, and nominated introverted, absent-minded *girls* with less confidence than identically described boys ([Gagné 1993; Siegle & Powell, summarised by NRC/GT](https://nrcgt.uconn.edu/newsletters/spring005/)).

### 3.4 What the giftedness-identification literature shows, since nomination is its standard first gate

This is the closest thing we have to a natural experiment in *making adult report load-bearing*. It went badly.

- **Nominations agree with traditional measures at `r = .32`.** By form: teacher `.30`, self `.32`, peer `.24`, **parent `.29`** — and nomination form was *not* a significant moderator, i.e. **teachers were no better than parents.** Agreement was stronger in primary than secondary school and larger for achievement than for ability criteria ([*The relation between nominations and traditional measures in the gifted identification process*, 2022, meta-analysis of 29 studies, *School Psychology International*](https://doi.org/10.1177/01430343221105398)).
- **Structured rating scales beat open nomination.** In a separate meta-analysis, overall performance/non-performance consistency was `r = .30`, with **teacher *ratings* significantly more consistent with performance measures than teacher or parent *nomination* or self-ratings**; non-performance methods reached specificity 70%, sensitivity 59%, efficiency 39%, and the two families "cannot replace each other" ([*Consistency of the Performance and Nonperformance Methods in Gifted Identification*, 2016](https://doi.org/10.1177/0016986216634438)).
- **Gating on nomination is catastrophic for recall.** A psychometric simulation of realistic identification systems found that requiring nomination before testing "can cause the false negative rate to easily exceed 60%" ([McBee, Peters & Miller 2016](https://doi.org/10.1177/0016986216656256)).
- **And the misses are not random.** Among elementary students with high standardised test scores, Black students are about **half as likely** to be assigned to gifted services; the gap largely closes when the child has a same-race teacher, who identifies them at roughly **three times** the rate ([Grissom & Redding 2016, *AERA Open*](https://doi.org/10.1177/2332858415622175)).

**The lesson transfers directly:** the failure mode is not that adult report is noisy, it is that adult report as a *gate* produces structured, demographic false negatives. The current engine's `MIN_DISTINCT_DAYS` exclusion is the architectural reason we do not inherit this — an adult can strengthen but never open a cell. That decision is now much better justified than it was when it was made.

### 3.5 Parental projection

Direct evidence is thinner than the other biases, and it comes from adolescents and young adults rather than 6–14s **[TRANSFER]**. In 271 student–parent dyads rating both their own and each other's vocational interests, profile correlations showed **high self–other agreement, moderate *assumed similarity*, and low actual similarity** — parents partly report the interests they themselves have — and **same-gender dyads over-estimated their similarity more than different-gender dyads** ([*Perceptions of Vocational Interest: Self- and Other-Reports in Student–Parent Dyads*, 2017, *Journal of Career Assessment*](https://doi.org/10.1177/1069072717692745)).

The same paper delivers a second, immediately actionable finding: **profile *elevation* — how enthusiastic the whole profile is — behaves "mostly as an artifact/rater bias and not a substantive factor,"** and ipsatising the scales reduces it. Translation: *"how strongly is your child interested in X, 1–7"* is measuring the reporter, not the child.

---

## 4. Q3 — Does asking an adult to report change anything?

Three distinct mechanisms, with very different evidence quality. Keeping them separate is what makes the design decision tractable.

### 4.1 Does merely being asked change the asker? Small, real, and untested for proxy reports

The question–behaviour effect (a.k.a. mere-measurement, self-prophecy) is one of the better-replicated small effects in social psychology.

| Meta-analysis | k | Effect |
|---|---|---|
| Rodrigues et al. 2015, as reported in Wilding | — | `d = 0.09` [.04, .13] |
| [Wilding et al. 2016](https://doi.org/10.1080/10463283.2016.1245940) ([PDF](https://eprints.whiterose.ac.uk/id/eprint/105928/10/Wilding_et_al.__2016_.pdf)) | 94 tests, N = 116,087 | `g = 0.14` [.11, .18]; **smaller in better-controlled, lower-risk-of-bias studies** |
| [Wood et al. 2016, *Pers Soc Psychol Rev*](https://doi.org/10.1177/1088868315592334) | 116 tests | `d = 0.24`; **larger for easy and socially desirable behaviours** |
| [Spangenberg et al. 2016, *J Consumer Psychol*](https://doi.org/10.1016/j.jcps.2015.12.004) | 104 studies / 51 papers | `d = 0.28` [.24, .32] |
| [Systematic review update, *J Clin Epidemiol* 2020](https://doi.org/10.1016/j.jclinepi.2020.03.014) | 43 RCTs, n = 104,388 | `SMD = 0.06` [.02, .09], I² = 54%, **positive evidence of publication bias** |

So: real, small, shrinking under scrutiny, and **largest exactly in our regime** — "encourage your child's enthusiasm" is about as easy and socially desirable as a behaviour gets.

**The honest gap: every one of these studies asks a person about their *own* behaviour.** An extensive search turned up no study testing whether asking a parent to report on their *child* changes the parent's subsequent behaviour toward that child. Treat the QBE here as a plausible mechanism, not a measured one.

### 4.2 Does a belief about the child move parental investment? Yes, causally, and this is the real risk

This is the strongest evidence in the memo and it does not come from asking — it comes from *changing* beliefs.

[Dizon-Ross 2019, *American Economic Review*](https://doi.org/10.1257/aer.20171172) ([NBER PDF](https://www.nber.org/system/files/working_papers/w24610/w24610.pdf)) ran a field experiment with 2,700+ families. Parents' baseline beliefs about their own children's academic performance were **inaccurate — 30% were wrong about which of two of their own children was the stronger performer.** Giving parents clear performance information caused them to update and **reallocate real investment**: enrolment up for higher-performing children, down for lower-performing ones, educational inputs matched to level.

The implication for us is precise. It does not much matter whether *asking* nudges the parent. What matters is that **a parent's belief about their child is causally upstream of what that parent buys, enrols in, and makes time for** — so any surface that *confirms, ranks, or visibly acts on* a parent's stated belief is an investment-reallocation lever. That is the mechanism to design against.

### 4.3 Does an adult's belief change the child? Real, but smaller than the folklore

[Jussim & Harber 2005](https://doi.org/10.1207/s15327957pspr0902_3) ([PDF](https://gwern.net/doc/statistics/bias/publication/2005-jussim.pdf)), reviewing 35 years: self-fulfilling prophecies in classrooms occur, but effects are typically `r = .1–.2` (mean between `.07` sample-weighted and `.17` unweighted), affect roughly **5–10% of students**, and "may be more likely to dissipate than accumulate." Larger effects concentrate among stigmatised groups. And their fourth conclusion is the important one: **teacher expectations predict student outcomes more because those expectations are *accurate* than because they are self-fulfilling.**

On the parent side the longitudinal record is stronger. Mothers' gender-stereotypic beliefs shaped both mothers' and children's ability perceptions ([Jacobs & Eccles 1992](https://doi.org/10.1037/0022-3514.63.6.932); [Eccles, Jacobs & Harold 1990](https://doi.org/10.1111/j.1540-4560.1990.tb01929.x)), and mothers' earlier perceptions of their children's abilities predicted maths/science self-efficacy two years *after high school* and later career choices, mediated by the child's 10th-grade self-perceptions ([Bleeker & Jacobs 2004](https://doi.org/10.1037/0022-0663.96.1.97)).

### 4.4 The specific way this could destroy the thing it measures

Parental investment in a child's interest is genuinely causal — in *both* directions.

- **Helpful:** parents' prioritisation of the child's interests, educational emphasis, valuing of consistency and communication, and provision of free-play time predicted whether preschoolers *sustained* conceptual interests ([Johnson et al. 2004](https://doi.org/10.1016/j.cogdev.2004.03.001); [Leibham et al. 2005](https://doi.org/10.1016/j.appdev.2005.05.001)).
- **Harmful:** expected tangible rewards substantially undermine intrinsic motivation (`d ≈ −0.34` on free-choice behaviour across 128 studies), and **the undermining is significantly larger for children than for college students**, on both behavioural and self-report measures ([Deci, Koestner & Ryan 1999](https://doi.org/10.1037/0033-2909.125.6.627); [2001 restatement](https://doi.org/10.3102/00346543071001001)). The founding demonstration used exactly our construct: children who expected a reward for drawing spent about half as much free-choice time drawing afterwards ([Lepper, Greene & Nisbett 1973](https://doi.org/10.1037/h0035519)).

So a parent who, having reported "she loves dinosaurs," responds with autonomy-supportive provisioning (a library trip, more unstructured time) is doing the thing the literature says maintains interests. A parent who responds with contingent structure (dinosaur worksheets, a reward chart) is doing the thing the literature says destroys them, more so in children than in anyone else. **The product cannot control which one happens, and therefore should not be in the business of triggering either.**

**Verdict on Q3:** the act of asking is a small, unmeasured-for-proxies risk. The act of *responding* — confirming the report, showing it moved the model, surfacing the named domain to the child — is a well-evidenced risk. Design accordingly (§7).

---

## 5. Q4 — How should adult report be weighted against behavioural evidence?

### 5.1 What the multi-informant field actually recommends

The field's position has moved decisively, and the move matters for us: **discrepancy is treated as information about context, not as error to be resolved** ([De Los Reyes et al. 2022, "A Dozen Years of Demonstrating That Informant Discrepancies are More Than Measurement Error"](https://doi.org/10.1080/15374416.2022.2158843)).

| Approach | Standing in the literature |
|---|---|
| **OR / AND algorithms** (symptom counts if either / both endorse) | Widely used, widely criticised. Perform worse as informants increase; ignore measurement error ([Martel et al. review](https://pmc.ncbi.nlm.nih.gov/articles/PMC5247337/), citing Horton & Fitzmaurice 2004; Solanto & Alvir 2009; Valo & Tannock 2010). |
| **Differential weighting** (PCA/CFA weights, or "the informant who knows best") | "Historically have not outperformed equal ratings," are more complex, and depend on sample-specific weights or clinician judgment (Piacentini, Cohen & Cohen 1992, via the same review). |
| **Simple averaging** | "Possibly the strongest option based on psychometric criteria" (Horton & Fitzmaurice 2004) — but assumes every informant measures the same construct with the same error, which is exactly what the discrepancy literature denies. |
| **Enter all informants simultaneously as separate predictors** | Best available head-to-head evidence. In 2,264 clinic-referred youth aged 6–18, simultaneously modelling parent, teacher and youth ratings **beat taking the highest score (the "or" rule)** on predictive validity; collapsing "may omit clinically relevant information" ([Res Child Adolesc Psychopathol 2023](https://doi.org/10.1007/s10802-023-01119-z)). |
| **Trifactor models** (common + informant-perspective + item-specific variance) | The research-grade answer ([Bauer et al. 2013](https://doi.org/10.1037/a0032475)); convergence problems and hard to combine with longitudinal models. |
| **Kraemer's Satellite / PTS model** | An informant's report = **T**rait + **C**ontext + **P**erspective + **E**rror. Choose informants who vary in context and perspective "so the weaknesses of one are cancelled by the strengths of another"; the first principal component is the trait. Kraemer's headline: *"the issue is not determining how many informants are needed but choosing the right set."* ([Kraemer et al. 2003, *Am J Psychiatry*](https://doi.org/10.1176/appi.ajp.160.9.1566)). First construct-validation test supported it — trait α = .90, context α = .84, perspective α = .83, with distinct criterion patterns ([Makol et al. 2022](https://doi.org/10.3389/fpsyg.2022.911629)). |

### 5.2 What that means for a Beta-Bernoulli engine at this n

Do not build a latent-variable multi-informant model. Do borrow the *logic*, which maps onto the existing design almost exactly: in-product behaviour is one context (product) × one perspective (observed); an adult report is a different context (home or class) × a different perspective (other-report). The channel exists precisely because it reaches a context the telemetry cannot. That is Kraemer's C dimension, and it is the whole justification for `external_report`.

Three structural constraints follow, and the literature supports all three:

1. **Report weight stays strictly below behaviour weight.** The empirical bracket from §2.2: `r ≈ .35` for dated weekly parent reports vs. logs, `r ≈ 0` for a single global retrospective question. `A_REPORT_BROAD = 0.25` against `A_RETURN = 1.0` sits inside that bracket, nearer the pessimistic end — which is right, because a parent report is also *not independent* of the behaviour (a parent may be describing the child using our app). **Keep 0.25. Do not raise it.**
2. **Keep the no-distinct-day rule.** This is the most defensible decision in the current design and §3.4 is now its justification: nomination-gated systems produce >60% false negatives and halve identification rates for Black students at equal test scores. An architecture where the adult's voice can be *sufficient* inherits that. The existing structural guarantee — a child must have *done something* — is what keeps us out of it.
3. **Keep `focused` at zero.** It is the discrimination the coding exists to make, and scoring both sides discards it.

**One addition the multi-informant literature argues for:** the field's whole point is that you learn most from the *disagreement*. A `broad` report in a cell with no behaviour is correctly excluded from belief — and is simultaneously the highest-information event in the system for a human, because it is the clearest evidence of an interest living somewhere the product cannot see. Recommend a **`report_without_behaviour` view in the guide console**: no model change, no weight, pure signal to a human about where to look. Cheap, and it converts the channel's biggest weakness into its distinctive contribution.

---

## 6. Q5 — What question wording produces the most reliable adult report?

### 6.1 The mechanisms

[Schwarz & Oyserman 2001, *American Journal of Evaluation*](https://dornsife.usc.edu/daphna-oyserman/wp-content/uploads/sites/232/2023/11/schwarz_oyserman_askingquestionsaboutbehavior.pdf) is the canonical treatment and nearly every recommendation below traces to it:

- **People do not "recall and count."** They estimate, "unless the events in question are highly memorable and their number is small." Short, recent reference periods make people actually try to recall episodes; long ones "encourage guessing and estimation."
- **Response scales carry meaning.** A high-frequency scale implies you want minor instances; a low-frequency scale implies major ones. Respondents given different scales **report on substantively different behaviours** (Schwarz, Strack, Müller & Chassein 1988).
- **Reference periods carry meaning too.** Asked about "last year" versus "last week," respondents report *more intense* instances for the longer window (Winkielman, Knäuper & Schwarz 1998) — the period tells them what counts.
- **The date is the *worst* recall cue.** Cues about *what* happened, *where*, and *who was involved* are far more effective (Wagenaar 1986, 1988).
- **But cues constrain the search.** Respondents limit recall to behaviours matching the cues; a domain checklist would import the taxonomy's blind spots (and, per §3.3, its gender profile).
- **Small counts get over-estimated; large counts get under-estimated.** Shortening the window and specifying the behaviour both shrink the episode count into the over-estimation regime.
- **Question context redefines terms.** Asked after delinquency items, teens read "fight with your parents" as physical violence; asked first, they did not.

### 6.2 The counter-evidence, which matters

"Ask about last week" is **not** universally right. [Chang & Krosnick 2003](https://doi.org/10.3386/w19543) found *"typical week"* questions outperformed *"last week"* questions for media-consumption frequency. The reconciliation: **recent-and-specific wins when you want a verifiable episode; typical wins when you want a rate.** We want an episode, so recent-and-specific is correct here — but it is correct for a reason, not by default, and we should not generalise it to any future rate question.

### 6.3 Structure beats openness, and a frame of reference beats none

- **Rating scales beat nominations.** Teacher *ratings* were significantly more consistent with performance measures than teacher or parent *nominations* ([*Consistency of the Performance and Nonperformance Methods*, 2016](https://doi.org/10.1177/0016986216634438)). Structure is worth real accuracy.
- **Behavioural anchors reduce halo** by removing the inferential leap from action to trait ([ETS RR](https://doi.org/10.1002/ets2.12152)).
- **Frame-of-reference training works.** Meta-analysis of 36 studies: FOR training improves rating accuracy (`d ≈ .50`), most for differential and behavioural accuracy, and holds after a two-week delay; adding behaviour-observation training improves the *quality* of recalled behaviour ([Roch, Woehr, Mishra & Kieszczynska 2012](https://doi.org/10.1111/j.2044-8325.2011.02045.x)). Machts et al. separately found judgments made "without eligible frames of reference" were *less* accurate. We cannot train parents — but we can supply the frame inside the question.
- **Momentary beats retrospective** (§2.2): parent EMA tracked accelerometry where retrospective questionnaires did not.

**So yes: "what did you see them do last week" beats "what are they interested in."** The reason is threefold, and worth stating because it governs every wording choice — it removes the inferential leap where halo and stereotype enter (§3.2, §3.3); it forces episodic retrieval instead of estimation, where recall error enters (§6.1); and it produces something a human can audit.

---

## 7. Recommendation: the instrument

### 7.1 Shape

**"One thing you saw."** A short, prompted, two-part capture. Not a standing "tell us about your child's interests" field.

| Decision | Rule | Why |
|---|---|---|
| Trigger | Prompted at a fixed cadence. **Never triggered by, and never naming, the cell the model is uncertain about.** | Active querying biases the sample ([06 §2.4](./06-measurement-validity-coldstart.md)); that applies to human informants too. A cell-targeted prompt turns the report into confirmation of our own hypothesis. |
| Two reference periods | **Episode question: last 7 days. Transfer question: the existing 32–67 day window (mean 51).** | The delayed window is the validated timing for the `focused`/`broad` discrimination (E10) but is the *worst* window for episodic recall. Splitting resolves the conflict instead of trading one construct off against the other. |
| Order | Episode **first**, topic never named by us. | Question context redefines terms (§6.1). Ask "is she interested in X?" first and everything after is a rationalisation of that answer. |
| No domain checklist | Free recall, cued by what/where/who. | Checklists constrain the memory search and would import the taxonomy's gender profile (§3.3, §6.1). |
| No intensity rating | Do not ask "how strongly, 1–7." | Profile elevation is rater artifact, not substance ([the student–parent dyad study, §3.5](https://doi.org/10.1177/1069072717692745)). If magnitude is ever needed, use forced comparison, per the comparative-judgment approach already adopted in [06 §2.1](./06-measurement-validity-coldstart.md). |

### 7.2 Proposed wording

**1 — Episode (last 7 days, free recall, no topic supplied)**

> *"Think about the last week. Tell us about one time your child did something on their own that nobody asked them to do. What were they doing, where were they, and who else was there?"*

`one time` avoids a count entirely, since small counts are systematically over-estimated. `on their own / nobody asked them to` is the free-choice framing that matches the construct the engine already encodes by excluding `prompted_return`. `what / where / who` are the effective recall cues; the date is deliberately not asked, being the weakest cue.

**2 — Repetition (absolute, low-frequency, capped)**

> *"In that same week, how many separate days did you see this happen?  1 / 2 / 3 or more"*

Absolute counts, not "often / sometimes": vague quantifiers are interpreted against an assumed norm, and a low-frequency scale also signals that we mean notable instances rather than trivia (§6.1). Capping at "3 or more" keeps the respondent out of the estimation regime. **This field is what gates any non-zero weight (§7.4).**

**3 — Transfer, at the ~7-week point (this is the existing `focused`/`broad` coding, asked behaviourally)**

> *"Away from [product], does this turn up anywhere else — talking about it, drawing it, asking for books or videos, bringing it up with other people? Or does it stay with the [product] activity itself?"*

Same discrimination E10 already specifies, expressed as observable behaviours rather than as an abstract judgment about breadth.

**4 — Disconfirmation (new; recommend adding)**

> *"In the last week, was there something they used to do a lot and didn't? What was it?"*

Every bias in §3 points toward over-reporting, and the QBE is largest for socially desirable behaviours. A channel that can only ever say "yes, my child loves X" is a ratchet. This is the cheapest available correction. **Record it; score it zero initially.** It must *not* map to `skip` or `decline`, which are behavioural and choice-set-derived — collapsing an adult's recollection into a disconfirming behavioural kind would repeat, in reverse, the error the `broad`/`focused` split exists to avoid.

### 7.3 Reporter handling

**Do not weight `guide` and `parent` differently.** Teacher and parent nominations agree with criteria at `.30` and `.29` respectively, and nomination form was not a significant moderator ([the 2022 nomination meta-analysis, §3.4](https://doi.org/10.1177/01430343221105398)). There is no evidence base for a split, and inventing one would be a constant with nothing behind it. Keep `reporter` for analysis and exclusion, not for scoring.

**Do add the observation context** (home / class / other). That is Kraemer's C dimension and the only reason the channel is worth having. It costs one enum.

### 7.4 Weight

| Item | Recommendation | Basis |
|---|---|---|
| `A_REPORT_BROAD` | **Keep at 0.25.** Do not raise. | Bracketed by `r ≈ .35` (dated parent report vs. telemetry) and `r ≈ 0` (single global retrospective question), and further discounted for non-independence from the behaviour. |
| `focused` reports | **Keep at zero.** | Preserves the wrapper-vs-domain discrimination. |
| Distinct-day exclusion | **Keep. Treat as non-negotiable.** | §3.4 — nomination-as-gate produces >60% false negatives and demographically structured misses. |
| **New condition** | Score 0.25 **only** when the report carries a dated episode **and** repetition ≥ 2 days. A topic-only report is recorded and scores **zero**, exactly like `focused`. | The only wording distinction with a real effect size behind it: parent report tracks behaviour at `r ≈ .35` when it is about specific recent activity and at `r ≈ 0` when it is one global question (§2.2). This is where the evidence says to spend the discrimination. |
| **New cap** | At most **one scoring report per cell per `HALFLIFE_DAYS`** (14). | **Ours, not the research's.** Both the QBE and simple commitment predict that an adult who reported once will report again; repeated reports from the same informant are not independent observations, and the recency decay assumes they are. |
| Reporter multiplier | **None.** | No evidence base (§7.3). |

### 7.5 Anti-feedback rules — these matter more than the number

1. **Never show the adult that their report changed anything.** No "thanks, we've noted her interest in dinosaurs," no confirmation of the domain, no visible effect. Dizon-Ross shows belief changes move real parental investment; Deci/Koestner/Ryan show that investment, when it becomes contingent, undermines interest *more in children than in anyone else*.
2. **Never let a report change what is surfaced to the child.** If it did, the engine would later observe the child engaging with what the parent named and score it as behavioural confirmation. This is precisely the feedback loop [06 §2.5](./06-measurement-validity-coldstart.md) forbids, and the report channel is the widest new door into it.
3. **Never prompt about a specific cell.** Generic prompts only (§7.1).
4. **Report content is not shown to the child.** Follows from 1 and 2; worth stating separately because it is the failure a well-meaning UI writer would introduce.

Together these make the channel **write-only from the adult's side**. That is the design property that lets us take the report at all.

---

## 8. Uncertainty ledger — where the evidence is thin

Stated plainly, because the product publishes its limits.

1. **No direct evidence exists for the actual question.** No study measures parent or teacher accuracy about a child's *interest* against that child's *observed free-choice behaviour*. Everything in §2 is transported from informant discrepancy in mental health, teacher judgment of ability, and proxy-vs-log measurement of children's media and activity. **[TRANSFER]** The `r ≈ .28–.35` band is a reasonable prior, not a measurement of us.
2. **Nobody has tested whether asking a parent to report their child's interest changes the parent's behaviour.** The entire QBE literature concerns self-reports of one's own behaviour. §4.1 plus §4.2 is an argument by analogy and mechanism. Treat it as an assumption to be tested on the first cohort, not a finding.
3. **The weight is still ours.** The literature validates the instrument and its timing and now, additionally, the *wording*; it supplies no pseudo-count. `0.25` remains a calibratable default. The §7.4 bracket is the best defence available for it and is not a derivation.
4. **Age moderation across 6–14 is unresolved** (§2.3). Different literatures point different directions. Do not encode an age gradient.
5. **Temperament moderation rests on one direct null.** Insufficient either way. The visibility mechanism (quiet interests under-reported) is better supported than the temperament-moderates-agreement claim, and is the one worth designing against.
6. **The `focused` / `broad` coding has no independent psychometric validation** beyond the source E10 drew on, as far as this search reached. Its inter-rater reliability is unestablished. If one thing here deserves a pilot, it is this — two adults coding the same child, before the coding is trusted to be the difference between 0.25 and 0.
7. **Some §3.3 evidence is grey literature** (the UNSW survey) and is flagged inline. The peer-reviewed gender findings (DeLoache; Johnson et al.; the IZA blind-grading paper; Growing Up in Ireland) stand on their own; the survey only corroborates.
8. **The observation/report divergence in §3.3 is a review's inference, not a within-study comparison.** Pattison compares *across* studies using different methods. It is a strong hint that part of the reported gender gap is instrumental. It is not a controlled test, and no controlled test appears to exist.
9. **`r` is not the right currency for a pseudo-count.** Converting a correlation into a Beta-Bernoulli weight involves assumptions this memo does not discharge. §7.4 uses the correlations as an ordering and a bracket, which is what they can support.
