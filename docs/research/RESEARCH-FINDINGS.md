# GT100K Research Findings

| Field | Value |
|---|---|
| Purpose | Topic-ordered evidence record for product and policy decisions |
| Date | 2026-07-17 |
| Related product document | [PRD.md](../prd/PRD.md) |
| Prior research synthesis | [RESEARCH-implementation-blueprint.md](RESEARCH-implementation-blueprint.md) |

## 1. Scope and provenance

This document records research used while consolidating the GT100K PRD. It separates three forms of input:

- **Independent PRD synthesis:** sources brought into the consolidation to test passion, motivation, acceleration, sensitive-signal, mentoring, and child-agency claims. “Independent” means independent of the ten proposal files. GT100K did not run the underlying studies.
- **Inherited research synthesis:** findings already assembled in the implementation blueprint, including knowledge tracing, answer-withholding tutors, adversarial testing, and model-serving guidance.
- **Program hypothesis:** a mechanism proposed by GT100K that lacks direct validation in this population, such as an eight-to-twelve-week Interest Lab, a `MotivationDoseToken`, passion-state inference, causal cohort matching, or a digital twin.

This is a product evidence review, not a systematic review or clinical standard. The team must check source quality, population fit, recency, and replication before granting a model or policy more authority.

The consolidation pass did not rerun the repository’s deep-research workflow or read the full text of every linked paper. It audited the claims and source trail already present, added topic-specific sources for passion and safety, and recorded where a claim exceeds that trail. A research owner should complete full-text review and citation verification before publication or a consequential policy release.

### 1.1 Evidence labels

| Label | Meaning | Product use |
|---|---|---|
| E1 | Meta-analysis, replicated evidence, or a strong research synthesis | Supports a design principle; local validation still applies |
| E2 | Credible but narrower evidence, longitudinal evidence, or a mature standard | Supports a bounded implementation with monitoring |
| E3 | Plausible transfer from adjacent evidence | Use in a reversible pilot or shadow comparison |
| R | Unvalidated GT100K construct or model | No child-facing authority |
| G | Rights, law, safety, or governance requirement | Enforce regardless of product lift |
| ENG | Engineering decision | Prove through tests, benchmarks, and operations |

## 2. Passion and interest development

**Provenance:** Independent PRD synthesis.

### 2.1 Interest develops; a survey does not discover a fixed vocation

Hidi and Renninger describe four phases: triggered situational interest, maintained situational interest, emerging individual interest, and well-developed individual interest. A compelling first encounter can start the process, but repeated engagement, knowledge, and value sustain it. GT100K therefore treats “I like speakers” as a starting claim rather than a permanent label. **[E2]**

Source: Hidi, S., and Renninger, K. A. (2006), [The Four-Phase Model of Interest Development](https://doi.org/10.1207/s15326985ep4102_4).

Harackiewicz, Smith, and Priniski review how educators can promote interest through context, value, and continued engagement. Their review supports active interest development instead of waiting for a child to arrive with a fully formed specialty. **[E2]**

Source: Harackiewicz, J. M., Smith, J. L., and Priniski, S. J. (2016), [Interest Matters](https://doi.org/10.1177/2372732216655542).

**Product consequence:** Interest Lab provides broad encounters before specialization. `InterestHypothesis` remains mutable, records counterevidence, expires, and gives the child a way to reject its wording.

### 2.2 Utility and competence can increase interest

Students can develop interest when they connect academic material to personal value. Hulleman and Harackiewicz found benefits from a utility-value intervention in high-school science, with effects that varied by prior performance. The study supports asking children to connect a prerequisite to their project. It does not prove that every child will develop a passion through relevance prompts. **[E2]**

Source: Hulleman, C. S., and Harackiewicz, J. M. (2009), [Promoting Interest and Performance in High School Science Classes](https://doi.org/10.1126/science.1177067).

**Product consequence:** John’s audio spine creates reasons to learn ratios, logarithms, waves, circuits, code, and technical writing. Morning mastery checks remain independent because project enthusiasm cannot substitute for academic evidence.

### 2.3 Bounded choice supports motivation

Patall, Cooper, and Robinson found positive average effects of choice on intrinsic motivation, effort, performance, and perceived competence. Effects depended on how adults framed and constrained the choice. A large unstructured catalog can burden a child; two or three safe, prerequisite-valid options preserve agency without removing instructional structure. **[E1]**

Source: Patall, E. A., Cooper, H., and Robinson, J. C. (2008), [The Effects of Choice on Intrinsic Motivation and Related Outcomes](https://doi.org/10.1037/0033-2909.134.2.270).

**Product consequence:** Interest Lab offers bounded choices and keeps an exploration floor. The Specialization Planner reserves wildcard time. Models cannot close untested domains.

### 2.4 Fixed “find your passion” beliefs can increase withdrawal

O’Keefe, Dweck, and Walton found that a fixed theory of interests can create expectations of immediate fit and reduce persistence when a field becomes difficult. Their studies support developmental language: children build interests through knowledge, work, and repair. **[E2]**

Source: O’Keefe, P. A., Dweck, C. S., and Walton, G. M. (2018), [Implicit Theories of Interest](https://doi.org/10.1177/0956797618780643).

**Product consequence:** Interfaces say “current evidence suggests” and “next probe.” They avoid “you are an audio person,” career destiny, and passion scores.

### 2.5 Harmonious and obsessive passion have different risk profiles

Vallerand and colleagues distinguish harmonious passion, which fits alongside the rest of a person’s life, from obsessive passion, which can bind identity and external approval to continued pursuit. Curran and colleagues synthesize later work on passion and motivation. GT100K should develop flexible depth: the child can rest, change direction, keep relationships, and retain worth after stopping. **[E2]**

Sources:

- Vallerand, R. J., et al. (2003), [On Obsessive and Harmonious Passion](https://doi.org/10.1037/0022-3514.85.4.756).
- Curran, T., et al. (2015), [The Psychology of Passion](https://doi.org/10.1007/s11031-015-9503-0).

**Product consequence:** Specializations renew each quarter. Rest windows, wildcard exploration, child vetoes, and parking rules protect against identity foreclosure.

### 2.6 The proposed passion signals remain research hypotheses

No reviewed source validates GT100K’s proposed combination of delayed voluntary return, self-authored scope, novelty decay, competence growth, and recovery after failure as a diagnostic passion measure for children ages 6 to 14. These signals make more sense than clicks or session time, but the combined construct remains unvalidated. **[R]**

**Product consequence:** The Bayesian state model and contextual bandit remain in shadow mode. A guide and child author the operative hypothesis. The program must compare the model against child accounts, missing-context checks, and later behavior before considering advisory use.

## 3. Motivation, autonomy, pressure, and persistence

**Provenance:** Independent PRD synthesis.

### 3.1 Autonomy, competence, and relatedness support internalized motivation

Self-Determination Theory identifies autonomy, competence, and relatedness as core supports for self-directed motivation. Later synthesis links more autonomous forms of motivation with persistence, wellbeing, and performance, while controlled motivation carries different costs. **[E1]**

Sources:

- Ryan, R. M., and Deci, E. L. (2000), [The “What” and “Why” of Goal Pursuits](https://doi.org/10.1207/S15327965PLI1104_01).
- Ryan, R. M., and Deci, E. L. (2020), [Intrinsic and Extrinsic Motivation from a Self-Determination Theory Perspective](https://doi.org/10.1016/j.cedpsych.2020.101860).
- Howard, J. L., et al. (2021), [Student Motivation and Associated Outcomes](https://doi.org/10.1177/1745691620966789).

**Product consequence:** GT100K measures pressure, belonging, competence, and choice separately from output. A deadline that raises completion while damaging autonomy or belonging counts as a harmful intervention.

### 3.2 Controlling rewards can undermine intrinsic motivation

Deci, Koestner, and Ryan found that expected tangible rewards can reduce intrinsic motivation under some conditions. Effects vary by reward type, task, age, and interpretation. The evidence does not support eliminating feedback, recognition, or all external structure. It supports caution when adults use rewards as control. **[E1]**

Source: Deci, E. L., Koestner, R., and Ryan, R. M. (1999), [A Meta-Analytic Review of Extrinsic Rewards and Intrinsic Motivation](https://doi.org/10.1037/0033-2909.125.6.627).

**Product consequence:** GT100K meters parent nudges, public comparison, rivalry, deadlines, and help refusal. Accessibility and safety support never consume the pressure budget.

### 3.3 Learning difficulty and current performance are different

Soderstrom and Bjork review conditions in which strong performance during practice can fail to produce durable learning, while harder practice can improve later retention. Difficulty earns the label “desirable” only when later learning improves. **[E1]**

Source: Soderstrom, N. C., and Bjork, R. A. (2015), [Learning Versus Performance](https://doi.org/10.1177/1745691615569000).

Wilson and colleagues derived an 85 percent accuracy result for specific stochastic classification settings. Their result does not establish a universal success target for children, complex projects, or wellbeing. **[E3]**

Source: Wilson, R. C., et al. (2019), [The Eighty-Five Percent Rule for Optimal Learning](https://doi.org/10.1038/s41467-019-12552-4).

**Product consequence:** The 70-to-85-percent practice band acts as a starting policy. The 90-percent independent mastery gate serves a different purpose. Teams must tune both through retention, transfer, frustration, and subgroup evidence.

### 3.4 Persistence thresholds are operating defaults

The fourteen-day diagnostic window and four-to-six-week low-return threshold do not come from a study that validates those exact periods for GT100K. They are review cadences that make context repair concrete. **[E3]**

**Product consequence:** Child assent and safety override each clock. Sleep loss, injury, broad distress, bullying, or safeguarding risk triggers an immediate deload. The team can shorten or revise the operating defaults after Month 4 evidence review.

### 3.5 MotivationDose control is unvalidated

The `MotivationDoseToken`, cumulative pressure budget, and learned model-predictive controller are original program mechanisms. No cited study validates the token unit, dose cap, or controller objective. **[R]**

**Product consequence:** Deterministic caps and human vetoes ship as governance controls. The learned controller runs in shadow. Promotion requires prospective evidence that it improves learning or recovery without subgroup harm or reduced autonomous motivation.

## 4. Acceleration, readiness, and grouping

**Provenance:** Independent PRD synthesis for acceleration and wellbeing; inherited synthesis for cohort algorithms.

### 4.1 Acceleration can benefit advanced learners

Steenbergen-Hu, Makel, and Olszewski-Kubilius reviewed a century of research on ability grouping and acceleration. Their synthesis reports positive academic effects on average for high-ability students. The result supports acceleration as a legitimate educational option. It does not validate GT100K’s pace, selection rule, software, or age-14 benchmark. **[E1]**

Source: Steenbergen-Hu, S., Makel, M. C., and Olszewski-Kubilius, P. (2016), [What One Hundred Years of Research Says About Ability Grouping and Acceleration](https://doi.org/10.3102/0034654316675417).

Bernstein, Lubinski, and Benbow studied long-run psychological wellbeing among academically gifted people who experienced acceleration. They did not find average wellbeing harm attributable to acceleration in that sample. The population and program differ from GT100K, so staff must still monitor each child’s sleep, distress, belonging, and dissent. **[E2]**

Source: Bernstein, B. O., Lubinski, D., and Benbow, C. P. (2021), [Academic Acceleration and Psychological Well-Being](https://doi.org/10.1037/edu0000500).

**Product consequence:** GT100K can offer accelerated paths while preserving deload, route changes, accommodations, and child assent. The product must not cite group averages to dismiss an individual safety signal.

### 4.2 MIT-level readiness is a program target, not a researched causal claim

No source reviewed for the PRD shows that GT100K’s proposed system can produce SAT 1570, AP Calculus BC 5, AP Physics C 5, AP English Literature 5, and an independently defended masterpiece by eighth grade. The benchmark defines the product goal. It does not describe an observed treatment effect. **[R]**

**Product consequence:** The Month 4 beta can validate measurement, software, safety, staffing, and early learning indicators. Only multi-year longitudinal comparison can test the age-14 outcome.

### 4.3 Near-peer cohorting has weaker evidence than the acceleration case

Ability grouping research supports some forms of grouping, but it does not establish the PRD’s exact five-or-six-person, level-plus-velocity, rivalry-managed cohort design. Causal peer effects also face interference: changing one child’s peers changes the treatment for several children. **[E3/R]**

**Product consequence:** Deterministic safety, schedule, accommodation, pace, rivalry-dose, and churn rules govern the beta. Peer-effect forecasts stay in shadow. The program must collect solo checkpoints, child reports, and cohort-level outcomes before it tests a causal assignment policy.

## 5. Cognitive ability, selection, and assessment

**Provenance:** Inherited brainlift claims with primary-source links recorded for follow-up.

### 5.1 Cognitive ability predicts later educational attainment

Childhood cognitive measures predict later educational achievement, including variation within high-ability samples. Population prediction can support readiness assessment; it cannot define a child’s ceiling or derive a GT100K admission cut. **[E2]**

Sources:

- Deary, I. J., et al. (2007), [Intelligence and Educational Achievement](https://doi.org/10.1016/j.intell.2006.02.001).
- Robertson, K. F., et al. (2010), [Beyond the Threshold Hypothesis](https://doi.org/10.1177/0963721410391442).

Deliberate practice explains only part of performance differences. Hours alone cannot erase differences in prior knowledge, learning rate, access, or support. **[E1]**

Source: Macnamara, B. N., Hambrick, D. Z., and Oswald, F. L. (2014), [Deliberate Practice and Performance](https://doi.org/10.1177/0956797614535810).

### 5.2 Structured knowledge supports advanced performance

Long-term working-memory theory describes how experts use organized retrieval structures in familiar domains. It supports coherent competency graphs and domain-specific automaticity rather than a generic “brain power” score. **[E2]**

Source: Ericsson, K. A., and Kintsch, W. (1995), [Long-Term Working Memory](https://doi.org/10.1037/0033-295X.102.2.211).

### 5.3 The proposed 120-to-125 floor lacks a derivation

No repository source derives an IQ-equivalent threshold of 120 to 125 for the stated SAT, AP, and masterpiece targets by eighth grade. **[R]**

**Product consequence:** Cognitive Floor Engine estimates several constructs with uncertainty, learning rate, transfer, retention, accommodations, and retests. A psychometrist and human panel own the live rule. Month 4 must test criterion validity, DIF, reliability, and subgroup false exclusion before enrollment.

## 6. Family environment and partnership

**Provenance:** Inherited brainlift claims and PRD design.

### 6.1 The original family-fidelity claim exceeds its evidence

Twin-study estimates, a famous family case, and general claims about home environment do not validate screening for a “fanatical” household or predicting eight-year compliance from a short trial. Heritability does not identify a program intervention. **[R]**

Source anchor: Polderman, T. J. C., et al. (2015), [Meta-analysis of the Heritability of Human Traits](https://doi.org/10.1038/ng.3285).

**Product consequence:** GT100K uses observed schedule feasibility, honest escalation, disruption recovery, and the effect of an offered support package. It excludes wealth, accent, household structure, ideology, and surveillance proxies.

### 6.2 The 21-to-28-day trial is an operating hypothesis

A compensated shadow-enrollment period can produce useful logistics evidence, but the repository provides no study that validates its predictive accuracy or fairness. Compensation also cannot remove all burden. **[E3]**

**Product consequence:** The program logs support offers, constraints, disruption, recovery, and missingness. It audits subgroup false exclusion and compares support-adjusted trial evidence with later continuation. Learned family-risk models remain shadow-only.

## 7. Mastery, knowledge tracing, and retrieval

**Provenance:** Inherited from the implementation blueprint with its primary-source links recorded.

### 7.1 Interpretable knowledge tracing fits consequential gates

The knowledge-tracing literature includes Bayesian Knowledge Tracing, logistic models such as Performance Factors Analysis, and deep sequence models. BKT and PFA expose per-skill parameters and evidence that a reviewer can inspect. Deep models may improve prediction in some settings but can make a hard unlock difficult to explain. **[E2]**

Sources:

- Shen et al. (2024), [A Survey of Knowledge Tracing](https://doi.org/10.1109/TLT.2024.3383325).
- Pavlik, Cen, and Koedinger (2009), [Performance Factors Analysis](https://eric.ed.gov/?id=ED506305).
- Liu et al. (2022), [Interpretable Knowledge Tracing](https://arxiv.org/abs/2112.11209).

**Product consequence:** PFA serves as the beta gating baseline. BKT and IKT run as challengers. Deep sequence models can recommend practice in shadow mode but cannot unlock a competency.

### 7.2 A 90-percent gate needs local error analysis

The reviewed literature does not establish 90 percent as a universal mastery threshold. A gate can create false unlocks and false lockouts, and reading demand can distort skill estimates. **[E3]**

**Product consequence:** GT100K treats 90 percent independent performance as a policy starting point. Psychometric owners track calibration, delayed retention, transfer, item-family diversity, per-skill reading demand, and subgroup lockout. They freeze a gate that exceeds the signed error threshold.

### 7.3 Retrieval and transfer matter more than session fluency

Learning-versus-performance research supports delayed checks and changed-context tasks. A supported correct answer during a tutoring session cannot establish independent mastery. **[E1]**

Source: Soderstrom and Bjork (2015), [Learning Versus Performance](https://doi.org/10.1177/1745691615569000).

**Product consequence:** `HelpReceipt` follows assisted work. FSRS-style schedules determine when to revisit a concept, while fresh unassisted items test retention and transfer. The exact scheduler remains an engineering choice that requires local calibration.

## 8. Socratic tutoring and answer withholding

**Provenance:** Inherited from the implementation blueprint.

### 8.1 General language models tend to provide answers

LearnLM’s authors describe a mismatch between information-delivery behavior and learning-oriented dialogue. The implementation blueprint also identified studies in which frontier models reveal full solutions. Prompt wording alone cannot create a reliable answer-blind tutor. **[E2]**

Source: Google DeepMind (2024), [LearnLM: Improving Gemini for Learning](https://arxiv.org/abs/2412.16429).

**Product consequence:** A deterministic controller selects the pedagogical action. The renderer receives no answer key. A separate grader owns correctness, and later unassisted work determines mastery.

### 8.2 Small tuned models can support Socratic behavior

SocraticLM reports results from fine-tuning a 7B-scale model on Socratic dialogues. ConvoLearn studies QLoRA tuning for learning-science-grounded dialogue. The sources support experiments with smaller models, but benchmark or rater preference does not establish learning gains for GT100K children. **[E3]**

Sources:

- [SocraticLM](https://openreview.net/forum?id=qkoZgJhxsA), NeurIPS 2024 Spotlight.
- [ConvoLearn](https://arxiv.org/abs/2601.08950), 2026 preprint.

**Product consequence:** The team can compare QLoRA and related parameter-efficient methods. A tuned renderer still sits behind deterministic intent, leakage checks, citations, and human help.

### 8.3 Reinforcement learning can tune answer withholding, but carries policy risk

PedagogicalRL uses simulated tutor-student interactions and a reward parameter to trade off direct solving against teaching behavior. The work supports an offline GRPO-style research program. It does not justify letting a learned policy decide how much help a child receives. **[E3]**

Source: [From Problem-Solving to Teaching Problem-Solving](https://arxiv.org/abs/2505.15607).

ES-LLMs explores a separated decision and response architecture. It provides an architecture lead, not production evidence for this population. **[E3]**

Source: [ES-LLMs](https://arxiv.org/abs/2603.23990).

**Product consequence:** Learned tutor policies run offline or in shadow. Rules guarantee a help path, accessibility exemptions, hint caps, and human escalation.

### 8.4 Students can jailbreak answer-refusal prompts

The adversarial answer-extraction work cited in the implementation blueprint shows that prompt-only refusal remains vulnerable. OWASP classifies prompt injection as a primary LLM application risk. **[G/ENG]**

Sources:

- [Adversarial Answer Extraction](https://arxiv.org/abs/2604.18660).
- [OWASP LLM01: Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/).

**Product consequence:** GT100K uses separate trust domains, no answer access in the tutor, fixed output checks, RAG isolation, a jailbreak suite, help receipts, and later independent verification. It does not punish a child based on a detector.

### 8.5 Tutoring efficacy must be measured through learning

VanLehn’s review compares human tutoring and intelligent tutoring systems and supports structured tutoring as a serious learning mechanism. LearnLM and the Eedi work provide newer evidence on expert preference and transfer, but some estimates remain exploratory. **[E1/E2]**

Sources:

- VanLehn, K. (2011), [The Relative Effectiveness of Human Tutoring and Intelligent Tutoring Systems](https://doi.org/10.1080/00461520.2011.611369).
- [Eedi Socratic-tutor study](https://arxiv.org/abs/2512.23633).

**Product consequence:** Release evaluation includes later independent performance and transfer. Tutor ratings, answer-refusal rate, and session completion serve as diagnostics, not learning outcomes.

### 8.6 Decayed-Elo help penalties lack direct evidence

Educational Elo models can update learner and item estimates, including multiconcept tasks. The proposal to reduce rewards after AI help is a GT100K extension; the repository contains no study showing that it improves learning or motivation. **[R]**

Source for the underlying model family: [Multivariate Elo](https://arxiv.org/abs/1910.12581).

**Product consequence:** GT100K records help and schedules independent verification. It rejects punitive score decay and tests any incentive against help-seeking, retention, autonomy, and subgroup effects.

## 9. Projects, productive failure, feedback, and mentoring

**Provenance:** Independent PRD synthesis.

### 9.1 Discovery works best with guidance

Alfieri and colleagues found that unassisted discovery underperforms more guided forms, while enhanced or assisted discovery can support learning. **[E1]**

Source: Alfieri, L., et al. (2011), [Does Discovery-Based Instruction Enhance Learning?](https://doi.org/10.1037/a0021017).

Kapur’s productive-failure work supports problem solving before instruction under designed conditions. It does not support withholding all help or allowing repeated failure without consolidation. **[E2]**

Source: Kapur, M. (2008), [Productive Failure](https://doi.org/10.1080/07370000802212669).

**Product consequence:** Foundry projects ask for predictions and initial attempts, then provide scaffolds, worked examples, prerequisite repair, critique, and later independent application.

### 9.2 Feedback quality and context determine its value

Wisniewski, Zierer, and Hattie’s synthesis reports substantial variation in feedback effects. Task information, timing, credibility, and the learner’s ability to act on the feedback matter. **[E1]**

Source: Wisniewski, B., Zierer, K., and Hattie, J. (2020), [The Power of Feedback Revisited](https://doi.org/10.3389/fpsyg.2019.03087).

**Product consequence:** Mentor critique must cite a milestone, evidence, and next decision. The system should track whether the child can use the critique rather than count comments delivered.

### 9.3 Youth mentoring has positive average effects with wide variation

Raposa and colleagues found positive average effects across youth mentoring programs, with program and relationship factors affecting results. The meta-analysis does not validate AI mentors or any specific expert-matching algorithm. **[E1]**

Source: Raposa, E. B., et al. (2019), [The Effects of Youth Mentoring Programs](https://doi.org/10.1007/s10964-019-00982-8).

**Product consequence:** GT100K verifies experts, limits contact, records conflicts, permits child reassignment, and supervises the relationship. The program measures trust, continuity, safety, and usable critique.

## 10. Alpha School and the two-hour operating structure

**Provenance:** Inherited implementation-blueprint synthesis.

### 10.1 The operating structure has external corroboration

Several sources describe Alpha School using a short adaptive academic block followed by afternoon projects, mastery gating, and adults acting as guides. This supports the existence of the model, not its efficacy. **[E2 for structure; R for transfer]**

Source: [Alpha School program description](https://alpha.school/the-program/). The implementation blueprint lists press coverage and an independent parent review but does not provide stable links for each item.

**Product consequence:** GT100K can adopt a two-hour mastery block plus an afternoon passion and project block as an operating hypothesis.

### 10.2 Reported outcomes remain marketing evidence

Reported growth multiples and percentile outcomes come from internal or promotional material and face selection, attrition, comparison, and measurement confounds. GT100K’s own selection policy would add another confound. **[R]**

**Product consequence:** GT100K must establish baselines, pre-register outcome definitions, report attrition, and separate selection from within-program change. Month 4 can validate software and leading indicators, not the eight-year outcome.

### 10.3 The incentive system remains unresolved

The inherited research did not determine how gamified rewards interact with deliberate difficulty, competition, intrinsic motivation, and help penalties. Completion alone cannot identify a safe policy. **[R]**

**Product consequence:** GT100K keeps the two-hour schedule separate from Alpha’s reward mechanics and measures autonomous return, help-seeking, retention, wellbeing, and subgroup effects before testing an incentive.

## 11. Sensitive signals, emotion inference, and physiological sensing

**Provenance:** Independent PRD synthesis.

### 11.1 Facial and vocal behavior cannot reveal a universal inner state

Barrett and colleagues review evidence against simple one-to-one mappings from facial movements to emotion categories. Context, culture, individual variation, task, and measurement choices affect interpretation. The same caution applies to claims that prosody reveals conviction, passion, honesty, or commitment. **[E1]**

Source: Barrett, L. F., et al. (2019), [Emotional Expressions Reconsidered](https://doi.org/10.1177/1529100619832930).

**Product consequence:** GT100K prohibits biometric truth claims, emotion-based discipline, and single-signal decisions. Voice or gaze features can enter a separately consented research protocol only.

### 11.2 Remote PPG can estimate a pulse-related signal under constrained conditions

Wang and colleagues describe algorithmic principles for camera-based remote photoplethysmography. Motion, lighting, device properties, physiology, and skin appearance affect the estimate. A pulse estimate does not establish stress, burnout, motivation, or truth. **[E3/R for GT100K use]**

Source: Wang, W., et al. (2017), [Algorithmic Principles of Remote PPG](https://doi.org/10.1109/TBME.2016.2609282).

**Product consequence:** Raw media remains on device and expires after feature extraction. Derived features have a numeric expiry, purpose isolation, subgroup audit, and no beta decision authority.

### 11.3 Missing sensor data carries no negative meaning

Refusal, incompatible hardware, lighting, disability, accent, communication style, or network quality can create missing or noisy inputs. Treating missingness as low motivation would convert access and consent into adverse evidence. **[G]**

**Product consequence:** The no-signal path must offer the same admissions and learning access. Sensitive research services remain inaccessible to admissions, mastery, specialization, discipline, and credentials.

## 12. Child privacy, consent, AI governance, and portable evidence

**Provenance:** Independent standards and governance review.

### 12.1 Consent must name the purpose and support withdrawal

COPPA governs online collection from children under 13 in the United States. FERPA can apply when GT100K maintains education records for an educational institution. State biometric and student-privacy laws can impose further duties. **[G]**

Sources:

- [FTC Children’s Online Privacy Protection Rule](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa).
- [U.S. Department of Education FERPA guidance](https://studentprivacy.ed.gov/ferpa).

**Product consequence:** GT100K separates guardian consent from child assent, binds use to purpose, stores withdrawal state, applies field-level retention, and uses crypto-shredding.

### 12.2 High-risk AI rules favor documentation and human control

The NIST AI Risk Management Framework supplies a voluntary governance structure for mapping, measuring, managing, and governing AI risk. The EU AI Act adds legal duties by system category and restricts some biometric and emotion uses. The final legal classification depends on jurisdiction and deployment context. **[G]**

Sources:

- NIST (2023), [AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework).
- [Regulation (EU) 2024/1689, Artificial Intelligence Act](https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng).

**Product consequence:** Model cards, data sheets, authority levels, subgroup evaluation, incident response, rollback, decision replay, and named human ownership enter the release process.

### 12.3 Credentials and artifact provenance have mature standards

1EdTech CASE identifies competencies. Open Badges 3.0 and Comprehensive Learner Record support portable learning claims. W3C Verifiable Credentials support issuer-signed claims and selective disclosure patterns. C2PA and in-toto support artifact and supply-chain provenance. **[E2/ENG]**

Sources:

- [1EdTech CASE](https://www.1edtech.org/standards/case).
- [Open Badges 3.0](https://www.1edtech.org/standards/open-badges).
- [Comprehensive Learner Record](https://www.1edtech.org/standards/clr).
- [W3C Verifiable Credentials Data Model 2.0](https://www.w3.org/TR/vc-data-model-2.0/).
- [C2PA specification](https://c2pa.org/specifications/specifications/2.1/index.html).
- [in-toto](https://in-toto.io/).

**Product consequence:** Mastery Passport can use public standards instead of a closed transcript. Selective disclosure keeps family, wellbeing, cohort, and private-draft data outside the credential.

## 13. Systems and model-serving findings

**Provenance:** Inherited engineering synthesis from the implementation blueprint.

### 13.1 Most platform choices are engineering decisions

The research workflow did not establish educational evidence for Next.js, FastAPI, Go, Rust, PostgreSQL, Redpanda, Kubernetes, Terraform, or Grafana. Those tools should win through operational fit, benchmarks, team skill, security, and maintainability. **[ENG]**

**Product consequence:** The PRD assigns languages by runtime boundary and records decisions through architecture decision records. Month 4 verifies SLOs, isolation, restore, and cost.

### 13.2 Queue pressure is a better inference-scaling signal than generic CPU use

The implementation blueprint found that GPU inference servers can preallocate memory and keep utilization high even when queue pressure changes. Queue depth and queue-to-compute ratios provide more useful autoscaling signals for vLLM and Triton workloads. This finding came from engineering documentation and practitioner material, not an educational study. **[ENG]**

**Product consequence:** KEDA scales model workers from `num_requests_waiting` or the Triton queue-to-compute ratio. Load tests must confirm the policy on the selected GPU and model.

### 13.3 Data separation has stronger value than a single learner warehouse

Identity, admissions, learning, wellbeing, sensitive research, private project evidence, and public portfolio data serve different purposes and audiences. A single unrestricted learner profile would make later privacy controls difficult to enforce. **[G/ENG]**

**Product consequence:** Each domain receives a separate service role, encryption key hierarchy, retention schedule, and audit stream. Analytics consumes purpose-filtered views rather than operational tables.

### 13.4 Rust versus C++ is an engineering decision

No local source compares Rust and C++ for GT100K’s browser audio, assessment, verifier, or gateway workloads. Claims about speed, safety, build cost, and browser support therefore need prototypes and benchmarks. **[ENG]**

**Product consequence:** The PRD chooses Rust for new AudioWorklet/WASM DSP, assessment delivery, deterministic verifiers, and capability gateways because one memory-safe toolchain can serve browser and native targets. GT100K writes no first-party C++ during Months 1 through 4. It can consume mature C or C++ libraries such as OR-Tools, browser WebRTC, or media codecs through a Python wrapper, browser API, narrow C ABI, or isolated process.

Month 4 benchmarks dropout rate, callback time, startup, memory growth, cross-browser behavior, device thermals, numerical error, fuzz results, and developer burden. A required library or measured failure can reopen the language decision through an architecture decision record.

### 13.5 The engineering skills matrix is not research evidence

The repository’s `impactful.md` ranks technology skills and proposes portfolio projects. It gives useful coverage ideas for SQL, cloud, gRPC, MLOps, ML, RAG, and systems work, but it provides no citations for job-market percentages or product suitability. **[ENG]**

**Product consequence:** GT100K uses it as a completeness checklist. Benchmarks, threat models, SLOs, staff expertise, and ownership decide the production stack.

## 14. Findings that remain unproven

The reviewed evidence does not establish:

- that the family trial predicts eight-year continuation;
- that an IQ-equivalent 120-to-125 boundary identifies all children who could benefit;
- that GT100K causes MIT-level readiness by eighth grade;
- that five-or-six-person rivalry cohorts improve every member;
- that the proposed passion signals measure a stable latent construct;
- that MotivationDose units or caps preserve autonomous motivation;
- that digital twins can authorize child-facing policy;
- that voice, gaze, rPPG, interaction telemetry, or home audio reveals passion, truth, commitment, burnout, or mental state;
- that provenance can prove authorship without a human defense;
- that a four-month build and beta validates an eight-year educational outcome.

Each claim remains a program hypothesis. The PRD uses shadow models, explicit uncertainty, human authority, appeals, assent, and rollback to keep these unknowns from becoming facts about a child.

## 15. Research priorities for Month 4 and the longitudinal program

### 15.1 Month 4 validation questions

1. Can every consequential action replay from consent, policy, evidence, software, model, and human-decision versions?
2. Do accommodations preserve construct validity and access across device and language groups?
3. Does the tutor reduce answer leakage while preserving a reachable help path and later independent learning?
4. Can Interest Lab deliver balanced coverage without recommender foreclosure?
5. Do children understand, reject, and correct `InterestHypothesis` records?
6. Does pressure accounting expose all deadlines, rivalry, comparison, help refusal, and parent nudges?
7. Do cohort rules prevent hard-constraint violations and support rapid safety separation?
8. Can ProofGraph reproduce claims and disclose assistance without accusing a child?
9. Can a child revoke exposure, withdraw consent, export credentials, and delete eligible data?
10. Do staffing, queues, restore, revocation, and 100,000-learner load remain inside signed thresholds?

### 15.2 Longitudinal questions

- Which early mastery measures predict far transfer rather than test familiarity?
- Which interest signals predict later voluntary return after prompts and incentives end?
- Which context repairs restore motivation, and for whom?
- How do acceleration, rest, family burden, and belonging interact over years?
- Do cohort benefits survive solo checkpoints and cohort changes?
- Which masterpiece evidence predicts outside use, expert validation, or later independent work?
- How often do child appeals correct model, guide, or policy errors?
- Which subgroups face false exclusion, false lockout, excess pressure, or unequal access to costly domains?

## 16. Research-to-product summary

| Topic | Strongest supported product decision | Main unresolved bet |
|---|---|---|
| Passion | Develop interest through exposure, value, competence, choice, and revision | Inferring a latent passion state from behavior |
| Motivation | Protect autonomy, competence, belonging, rest, and help | MotivationDose units and learned MPC |
| Acceleration | Offer accelerated paths with individual monitoring | GT100K’s age-14 causal outcome |
| Mastery | Use interpretable per-skill evidence, delayed checks, and transfer | Universal 90-percent threshold |
| Tutor | Separate deterministic pedagogy, rendering, and grading | Learned answer-withholding policy |
| Projects | Combine attempts with guidance, feedback, and later independence | Cross-domain masterpiece scoring |
| Cohorts | Use hard safety and access constraints | Causal peer-effect optimization |
| Sensitive signals | Keep research separate, consented, local, and non-authoritative | Any incremental decision value |
| Credentials | Use CASE, Open Badges, CLR, VC, and provenance standards | Long-term verifier adoption |
| Architecture | Benchmark engineering choices against SLOs and threats | Simulators and models generalizing to live children |
