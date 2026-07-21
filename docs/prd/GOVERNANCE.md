> **GT100K Governance & Policy.** The rights, safety, consent, legal, and decision-authority rules extracted from `PRD.md` so the PRD stays software/product-focused. Companion to `PRD.md` (product/engineering) and `.specify/memory/constitution.md` (supreme invariants). Where this conflicts with the PRD on a rights/safety limit, this doc and the constitution win.

## G1. Prohibited product behavior

*(was PRD §3.3 — Prohibited product behavior)*

GT100K will not implement financial escrow, income-share agreements for minors, fixed-ability caste leaderboards, automatic expulsion, covert cameras or microphones, biometric truth claims, punishment for approved accommodations, or automated AI-authorship accusations. Staff cannot use a sensitive signal as the sole basis for admission, discipline, specialization, or route transition. Project agents cannot contact an adult, spend money, publish work, change access, or deploy to a public environment without an approved capability and a named human action.

Public-facing artifacts must not invoke third-party institutional brands. No student final project, credential, portfolio, public artifact, or marketing material may reference the MIT brand (or any other third-party institution's name or trademark) to imply affiliation or endorsement; outward-facing materials use neutral language such as "elite academic preparation." The phrase "MIT-level readiness" is an internal operational benchmark only (§2.5) and never appears in external branding.

## G2. Human decision bodies

*(was PRD §6.5 — Human decision bodies)*

The beta establishes five named bodies:

- an admissions review body of GT admissions officers using the anchored Track B rubric with benchmark calibration and accommodation expertise (operated by the admissions team, §3.4; this platform coordinates with it at the enrollment handoff);
- a learner-plan panel for contested specialization or intensity decisions;
- a safeguarding team with authority to pause any program action;
- a model and data governance board that approves features, releases, and research use;
- a public-release reviewer for identity, contact, rights, spending, and audience risk.

Each body records members, conflicts, evidence reviewed, decision, rationale, expiry, and appeal route.

The learner-plan panel may mediate logistics and required academic routes. It cannot override the child's veto over identity-linked specialization, increased pressure or rivalry, sensitive research, recording, optional mentor interaction, or public release.

## G3. Global policy and decision requirements

*(was PRD §8 — Global policy and decision requirements)*

### 8.1 Consequential decision boundary

A consequential decision changes access, intensity, cohort, specialization, privacy, public exposure, credential status, or program participation. GT100K requires a human owner for each such decision. A model may prepare evidence and a recommendation. A rules service may block an action that violates policy. Neither may issue the final decision during the beta.

| ID | Requirement |
|---|---|
| POL-001 | Each consequential decision must name a human owner, policy version, evidence set, rationale, expiry, and appeal route. |
| POL-002 | The system must show uncertainty and abstain when evidence falls outside the validated population or feature range. |
| POL-003 | Staff must record any override of a model or policy recommendation with a reason code and free-text rationale. |
| POL-004 | The platform must replay a decision as it appeared at the time without substituting current features, models, or policy. |
| POL-005 | Staff must not use undisclosed notes, protected-class proxies, or expired consent in a decision. |
| POL-006 | A child or guardian can correct factual evidence and appeal an interpretation. The system preserves the original record and attaches the correction. |
| POL-007 | A safeguarding hold pauses any conflicting workflow, token, cohort move, project action, or public exposure. |
| POL-008 | Model disagreement, missing data, or multi-informant disagreement must remain visible. The product must not average disagreement into a false consensus. |

### 8.2 Child assent and structured persistence

Parents provide legal consent where required. Children provide developmentally appropriate assent for intensive participation, interest-linked specialization, sensitive-signal research, recording, mentor interaction, and public release.

**What "intensity" means.** Intensity is not a single slider; it is a set of named dials, and assent is captured per dial rather than as one blanket yes:

- **daily load and session length** — how many focus blocks and how long the day runs;
- **difficulty ceiling and pace** — how far above grade level and how fast the child advances;
- **competition and rivalry exposure** — whether and how much the child takes part in rivalry events and visible standings (§15);
- **specialization commitment depth** — how much time is committed to one interest spine before renewal (§14.7, §14.8);
- **public-audience exposure** — whether work is shown beyond the cohort (§20).

Each dial is bounded by the MotivationDose caps and guide veto (§8.5, §13). Assent is asked in language and controls appropriate to the child's age, is revocable at any time, and applies per dial. **Raising** any dial requires fresh assent for that dial; higher intensity is never inferred from prior compliance, good performance, or a guardian's wish. Lowering a dial never requires justification.

For the **difficulty-and-pace dial** specifically, the child assents to a difficulty *band* — a floor-to-ceiling range, not a single level. Adaptive, learned titration **within** that assented band and within the dose caps (for example the practice engine tracking the 70–85 percent success band, or the bounded-automation controller in §8.5/§14.8) is normal operation, not "raising the dial," and needs no new assent. Moving the band itself — raising the ceiling — requires fresh per-dial assent, and no learned model may move the band or the ceiling; that stays a human decision consistent with §14.9 ("zero learned-model outputs change an intensity ceiling"). A checked guardian box cannot stand in for the child’s answer.

A refusal during a hard task starts inquiry rather than punishment or trait inference. Closing one task does not change an agreed required academic goal by itself. The guide records the child's account, offers another route, and checks whether assent to the broader activity remains.

The structured persistence workflow follows these rules:

1. A local resistance event starts a diagnostic record rather than an intensity penalty.
2. The guide checks task difficulty, missing knowledge, sensory access, tool failure, peer conflict, mentor fit, fatigue, family stress, and clarity of purpose.
3. The learner chooses among safe repair options. The program holds the goal for up to fourteen days while staff change one context variable at a time.
4. Sleep disruption, broad distress, injury, bullying, somatic complaints, panic, or safeguarding concerns trigger an immediate deload and human review. No diagnostic window delays this action.
5. The plan panel reopens exploration when low voluntary return continues for four to six weeks after rest and two reasonable context repairs, or when the child sustains explicit dissent through the review process.
6. A quarterly renewal asks the child to deepen, branch, park, or replace the specialization. None of these choices removes previously earned mastery or project evidence.

The fourteen-day hold applies only while the child assents to the broader goal. Withdrawal of assent to intensive participation pauses the program and starts a private review. Withdrawal stops sensitive research, recording, public exposure, optional specialization, and optional mentor interaction at once. Staff may request only closure needed for equipment safety, teammate handoff, or data integrity. A parent, guide, or panel cannot override these boundaries.

The product must not show parents a button that raises intensity. Parents can request a review. The guide and policy service apply the agreed tier and pressure budget. Children can request help, privacy, a different adult, or a safety review at any time.

### 8.3 Accommodation and access policy

GT100K is a gifted and accelerated program with a high cognitive-readiness bar, and it is fully committed to giving every admitted learner all the support they need. Being selective on readiness never reduces a learner's entitlement to accommodation. Twice-exceptional learners — gifted with a disability or learning difference — receive the same acceleration *and* the same accommodations as any other learner, and a support need is never read as a reason to slow a child down.

Admissions and learning services must support disability, language, sensory, motor, reading, and executive-function accommodations. The accommodation service stores the approved support separately from performance evidence and exposes only the minimum required instruction to the consuming service.

Approved support does not consume a help penalty. A screen reader, extended time, language clarification, alternate input, sensory break, calculator permitted by policy, communication aid, or human reader cannot reduce mastery credit unless the construct being measured requires the excluded skill and a psychometrician approves that rule. The decision record must state the construct and accommodation effect.

GT100K supplies devices, connectivity, project equipment, and schedule alternatives when a missing resource would block participation. The Family OS tests whether support restores feasibility before staff interpret missed obligations as low commitment. The Interest Lab equalizes exposure to costly fields through shared kits, remote labs, simulations, loaners, and regional partners.

### 8.4 Admission and route states

> **Admissions-team ownership (§3.4).** This section describes the admissions front door, owned and built by the separate admissions team and documented in [`ADMISSIONS_PRD.md`](ADMISSIONS_PRD.md). The states below mirror that plan; this platform consumes the resulting eligibility determination at the enrollment handoff (§3.5) and does not set or enforce these rules.

The admissions pipeline routes each applicant after an externally-administered CogAT and, where applicable, an independent Track B review. The applicant-visible states are:

| State | Meaning | Required next action |
|---|---|---|
| Application in progress | The base application is started but not submitted | Auto-save and restore; complete required steps and submit |
| CogAT pending | The application is complete; CogAT is administered outside the product | Import/enter the CogAT result to enable routing |
| Track A eligible | The CogAT composite meets GT's existing Track A cutoff (unchanged) | Continue through GT's existing Track A process |
| Track B invited | A below-cutoff but promising CogAT profile (promising band or strong battery profile) invites the Talent Evidence Snapshot | Complete the Snapshot (artifact or narrative route) in 10–15 minutes |
| Track B in review | The Snapshot is under independent blind review | Reviewers classify; a third blind reviewer adjudicates on disagreement |
| Pending correction | Evidence is invalid, inaccessible, or uninterpretable | Provide a factual/provenance correction or an equivalent accessibility route |
| Eligible (Track A or Track B) | The CogAT gate and, for Track B, the required reviewer majority are met | Human confirmation, then the enrollment handoff (§3.5) — seat allocation and aid are deferred (`B-08`) |
| Does not currently qualify | The evidence does not meet the Track A cutoff or the Track B rule at this time | Explanation, correction/re-entry information, and reapplication policy |

Reviewer votes are `qualifies` or `does not currently qualify`; `pending correction` is a workflow state, not a reviewer vote. A "does not currently qualify" outcome cannot present the child as incapable or deficient, and no message may imply admission, a "not gifted" status, or program effect. The program reports the applicable rule, evidence, and available paths. An ineligible or withdrawing family can export its records and request deletion according to retention law. Track B eligibility broadens the eligible pool but does not guarantee a seat; allocation, offers, and any program-effect evaluation are outside the admissions MVP (`B-08`).

Substantive rubric-application appeals (re-scoring the same evidence for a disputed rubric judgment) are deferred beyond the admissions MVP; only factual/procedural correction and staff-initiated re-entry into a later cycle are supported. After enrollment, a learner may move to a reduced-intensity plan, partner program, temporary leave, or full exit. The plan panel uses current wellbeing, motivation, learning, and family evidence. A predictive risk score cannot trigger the move. The child keeps earned credentials and can export project work.

### 8.5 Research and model authority

Each model has a declared authority level:

| Level | Use |
|---|---|
| Lab | Offline development on synthetic, public, or consented research data |
| Shadow | Runs on live inputs but cannot change a user-visible decision or action |
| Advisory | Shows a recommendation to an authorized human who owns the decision |
| Bounded automation | Acts inside a narrow, reversible envelope with monitoring and a human kill switch |
| Retired | Receives no new data and cannot serve decisions |

The Month 4 beta permits bounded automation for low-risk scheduling, reminders, content routing, resource cleanup, and previously approved project actions. Beyond these, the beta promotes a model from Shadow to **Bounded automation** when its action is reversible, low-harm, human-kill-switched, and validated on a short-horizon proxy outcome — for example measured weekly skill gain, flow-band residence, or voluntary return — rather than the eight-year outcome. Under this rule the beta runs the following in bounded automation, each with a guide veto window and one-click revert: passion-probe selection (§14.4), cohort repair within the churn budget (§15), difficulty-and-friction titration within the rules-engine dose caps (§14.8), retrieval scheduling (§12), and mentor-attention allocation (§18). It keeps at Shadow every irreversible, identity-defining, or only-eight-year-verifiable decision: learned cognitive-readiness models, intensity ceilings, passion specialization commitment, cohort causal uplift, safeguarding, sensitive signals, authenticity anomalies, and public release. (The Cognitive Floor Engine's readiness result — produced by adaptive item selection but a fixed, human-owned decision rule and cut, §11 — itself runs **Advisory** and human-owned, informing placement only; only learned readiness challengers stay at Shadow.) The platform's family-execution commitment signal (§10.1, RF-04) may run **Advisory** to guides for support and retention, never as an admissions input. The admissions decision itself is the admissions team's and is made by human reviewers on externally-administered CogAT and the anchored Track B rubric, not by any learned model here (§3.4, §8.4); this platform's readiness decision rule and cut are fixed and human-owned — they do not adapt online and do not issue the admission decision — and may at most supply supplementary readiness evidence. (Empirical item-parameter calibration under §11 is a separate, psychometric-governance-gated process applied through versioned parameter releases; it improves measurement but does not let the readiness decision rule change itself online.)

The model governance board must approve a move between levels. The release packet includes the intended population, data lineage, feature list, evaluation protocol, subgroup results, calibration, known failure modes, abuse tests, privacy review, safety review, monitoring thresholds, rollback method, and owner. A model trained on adult learners, public emotion corpora, or synthetic students cannot receive child-facing authority from benchmark performance alone.

### 8.6 Sensitive-signal policy

The Sensitive Signal Lab is R-class research governed by Section 14.11. It requires separate parent consent and child assent, uploads no raw research media, and grants no beta decision-support authority. Staff making or advising child decisions cannot view its outputs. Refusal, missingness, device quality, or withdrawal cannot change admission or program access.

A project recording is not Sensitive Signal Lab collection. It follows a separate, visible consent flow and the private project-evidence domain. Any post-beta advisory proposal requires external scientific, legal, privacy, subgroup, and child-impact review plus a no-signal path; it cannot authorize a single-signal or automated decision.

### 8.7 Staff service levels

| Workflow | Beta service target |
|---|---|
| Safeguarding alert | Human acknowledgement within 15 minutes during program hours |
| Child request for a different adult | Same-day private response |
| Accommodation or post-enrollment appeal | Intake within 2 business days; decision target within 10 business days |
| Sensitive-data access request | Logged approval before access; quarterly entitlement review |
| Public exposure emergency | Lease revocation under 5 seconds at p99; human incident response at once |
| Project tool or spend escalation | Human decision before the current lease expires |
| Model safety threshold breach | Automatic traffic halt or shadow fallback, followed by owner review |
| Data correction or export | Status visible to the requester; completion within the legal deadline |

## G4. Motivation and wellbeing measurement

*(was PRD §14.9 — Motivation and wellbeing measurement)*

The program separates autonomous motivation, learning, output, and wellbeing. A single engagement score would hide harmful tradeoffs.

| Measure family | Measures | Required interpretation |
|---|---|---|
| Autonomous return | Return after 7 or 30 days without reminder, reward, deadline, or parent prompt | Strong interest evidence only after access and schedule checks |
| Self-authorship | Child-proposed questions, milestones, revisions, or constraints | Distinguish genuine scope from mentor-authored wording |
| Competence growth | Independent mastery, artifact quality, transfer, and explanation | Low initial skill does not mean low interest |
| Recovery | Time and behavior after error, critique, or failed build | Examine task and social context before trait inference |
| Prompt dependence | Starts or advances per adult or system prompt | Rising dependence can signal excess external control or an access need |
| Pressure exposure | Token count and dose, rivalry, public comparison, parent nudges, help restrictions | Compare output after dose tapers, not only during dose |
| Child pulse | Desire to return, sense of choice, competence, belonging, pressure, fatigue, and wish for change | Use age-appropriate text, icons, or supported communication |
| Rest and health | Protected rest kept, child or family report of sleep disruption, injury, or broad distress | Start human review; do not diagnose from telemetry |
| Belonging and safety | Cohort inclusion, mentor trust, conflict, bullying, ability to ask for help | Safety reports override productivity goals |

Operations dashboards shall report median and tail values by age band, accommodation status, device class, program site, and other approved audit groups where sample size protects privacy. Staff shall monitor missingness because children with the least access can look disengaged. Cohort wellbeing dashboards shall use the threshold secure-aggregation service in Section 29 (minimum five valid contributors); the six-member pod floor (§15) keeps a normal pod above that minimum even when one child abstains, and any view that still falls below it is suppressed.

Beta acceptance criteria include:

- 100 percent of pressure-bearing machine actions present a valid token and auditable human or rule authority.
- Zero learned-model outputs change a specialization commitment, route, admissions decision, or intensity ceiling. Bounded-automation controllers may act only within rules-engine caps, with a guide veto and one-click revert (§8.5).
- Each active plan offers an accessible child pulse, review date, rest window, wildcard allocation, and lower-intensity request path. A declined or omitted pulse creates missing data, never an adverse signal.
- Dashboards distinguish prompted and unprompted work and show post-incentive behavior.
- Staff can replay the evidence available for any plan change and see later corrections.
- A child can request a lower pressure setting in two interactions or fewer, and the setting takes effect before the next pressure-bearing action.
- The program sets calibration, false-alarm, subgroup, and intervention-lift thresholds before a learned policy receives any live authority.

## G5. Sensitive Signal Lab boundaries

*(was PRD §14.11 — Sensitive Signal Lab boundaries)*

The Sensitive Signal Lab is a separate research surface that operates **only on school premises, under supervision**. No sensitive-signal information is ever collected outside the school — there is no home or other out-of-school sensitive-signal collection of any kind, and none of these signals may be gathered during remote or after-school work (§10.2, §15). Within school, and only under purpose-specific consent, it may study voice prosody, gaze, remote photoplethysmography (rPPG), or interaction biometrics. These signals cannot establish truth, deception, commitment, passion, attention, mental state, diagnosis, or eligibility. Research on facial and vocal expression does not support universal one-to-one emotion decoding across people and contexts. **[E1]** See [Barrett et al., 2019](https://doi.org/10.1177/1529100619832930).

Remote photoplethysmography can estimate pulse-related signals under controlled conditions, but device, lighting, motion, physiology, and skin appearance create error. **[R]** See [Wang et al., 2017](https://doi.org/10.1109/TBME.2016.2609282). GT100K treats such a technical pulse estimate as insufficient to validate any wellbeing inference; that constraint is program policy, not a claim of the cited paper.

The Lab shall enforce these controls:

- **SENS-001 [G]:** Parent consent and child assent shall name one signal, purpose, retention period, reviewers, and consequence of refusal. Bundled “multimodal consent” is invalid.
- **SENS-002 [G]:** A visible indicator shall remain on during collection. The platform shall provide a hardware or software stop control and prohibit background collection.
- **SENS-003 [G]:** Raw camera and microphone buffers (captured only on school premises) shall stay on device and be discarded after feature extraction. If a child saves audio as a project artifact, the artifact follows a separate content-consent path.
- **SENS-004 [G]:** Derived research features shall use a pseudonymous identifier, encryption, purpose-bound access, and a protocol-specific numeric expiry approved before collection. Storage shall fail closed when consent or expiry is absent. Withdrawal starts crypto-shredding.
- **SENS-005 [G]:** Sensitive features shall remain outside admissions, mastery, discipline, family-fidelity, pressure, cohort, safeguarding, credential, and public portfolio stores.
- **SENS-006 [G]:** Missing, noisy, refused, or incompatible sensor data shall never count against a child.
- **SENS-007 [G]:** The Lab shall prohibit face recognition, identity matching, lie detection, covert surveillance, medical diagnosis, advertising, sale, and training unrelated foundation models.
- **SENS-008 [R]:** Researchers shall evaluate device, lighting, motion, skin appearance, age, accent, language, disability, and communication-mode performance before interpreting any derived feature.
- **SENS-009 [G]:** During beta, sensitive models shall run in shadow mode. Their outputs may appear only to approved research reviewers and cannot alter the child experience.
- **SENS-010 [G]:** A jurisdiction service shall disable protocols that conflict with applicable law or school policy. The review shall cover the [FTC COPPA Rule](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa), state biometric laws, and the [EU AI Act](https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng) before expansion outside the US beta.
- **SENS-011 [G]:** Governance shall follow a documented risk process aligned with the [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework), including model cards, data sheets, incident response, subgroup audits, and an independent release review.

Sensitive Signal Lab acceptance tests shall confirm that a packet capture contains no raw media egress; withdrawal stops collection before the next session and removes derived features under policy; an admissions or specialization service cannot query the sensitive store; a refused sensor produces no degraded offer, score, or message; and the jurisdiction gate blocks a prohibited protocol. Red-team tests shall attempt covert restart, consent-token replay, cross-purpose joins, raw-buffer persistence, model-output leakage, and inference from missingness.

The Month 4 beta tests consented collection, limits, deletion, and isolation from authority. Any later decision-support proposal requires a new evidence review, subgroup validation, child and parent research, legal review, and human-panel policy. No validation can authorize a single-signal or automatic consequential decision.

## G6. Global exclusions

*(was PRD §23 — Global exclusions)*

The product excludes financial escrow for family compliance, income-share underwriting for minors, irrevocable participation contracts, fixed-ability caste leaderboards, automatic expulsion, automated admissions, automated rejection, covert surveillance, continuous home sensing, biometric truth or motivation claims, emotion-based discipline, single-signal decisions, and AI-authorship accusations. It also excludes agent access to open-ended funds, unrestricted internet, cross-student data, or public release authority.

Cross-cohort visible standings ranked on velocity, mastery-gain, and effort — sprint-reset, **opt-in (default off)**, **near-peer-band and anonymized**, **never surfacing a child's bottom-rank position**, and safeguarding-gated (§15) — are permitted and are not "ability leaderboards" within the meaning of this exclusion (v1.2; guardrails tightened v1.10). Standings that expose fixed ability, show the full program field, identify a child's academic-gain rank to peers outside their own cohort, build a durable caste, or reach an audience outside the enrolled program remain prohibited; any external exposure follows the `ExposureLease` consent flow (§20).

The Month 4 beta does not claim that its short observation window causes MIT-level readiness, that a learned `InterestHypothesis` update reveals a child's permanent vocation, that an assessment score fixes a ceiling, or that more pressure produces more learning. Product reports must name the evidence window, uncertainty, subgroup limits, and human decision owner.

## G7. Privacy, data separation, and policy as code

*(was PRD §29 — Privacy, data separation, and policy as code)*

GT100K maintains seven data zones: identity, admissions-eligibility reference, learning, wellbeing, sensitive research, private project evidence, and public portfolio. Each zone uses a separate database role, KMS key hierarchy, storage prefix, service account, retention schedule, and audit stream. The admissions-eligibility zone holds only the eligibility-evidence reference received at the enrollment handoff — rule version, reason codes, reviewer classifications, and timestamps (§3.5) — not raw admissions responses, CogAT items, or artifacts, which remain the admissions team's under their own retention (§3.4). The identity service alone maps a legal identity to a pseudonymous learner reference. Public portfolio identifiers have no reversible relation to internal identifiers outside that service.

The US-first legal map covers COPPA, FERPA where GT100K acts for an educational institution or maintains education records, applicable state student-privacy and biometric laws, disability and accessibility duties, records-access rights, research review, and breach notice. A jurisdiction owner records applicability and approved data flow before a site or partner launches.

Purpose-based authorization evaluates role, tenant, purpose, jurisdiction, consent, assent, record sensitivity, and requested fields. APIs return field-filtered views. Staff cannot export raw assessment responses, passion evidence, wellbeing notes, or private project traces through analytics tools. Cohort metrics use threshold secure aggregation with contribution clipping, ephemeral client keys, and a minimum of five valid contributors (the six-member pod floor in §15 keeps a normal pod above this minimum even if one child abstains). The aggregation service receives encrypted shares, not individual values; missing shares abort the aggregate, and sparse results remain suppressed. A cohort member receives no individual wellbeing estimate about another child, and no individual academic-gain standing that identifies a child outside their own cohort; cross-cohort standings are anonymized and near-peer-band-limited (§15).

A packet-capture and compromised-aggregator test must prove that the central service cannot reconstruct one child's value from a valid, incomplete, replayed, or malicious five-person aggregation.

Retention applies at field level. Raw assessment media remains on device and leaves only a bounded derived feature under a separately consented protocol. The beta discards voice, gaze, and rPPG source media after local processing. Each sensitive protocol declares an absolute feature-expiry time before collection, and storage fails closed when it is absent. Sensitive features cannot enter admissions or discipline. Envelope encryption assigns per-subject or per-project data keys. Withdrawal starts crypto-shredding; the deletion workflow also tombstones rows, removes vectors and features, and verifies downstream erasure. Only nonidentifying integrity hashes may remain where law permits.

OPA evaluates signed Rego bundles at ingress, domain commands, model feature access, workspace capabilities, resource grants, credential issuance, and audience routing. Git stores policy source, test cases, owner, evidence label, and effective date. CI runs decision tables, subgroup fixtures, historical replay, and deny-by-default tests. Two authorized reviewers sign high-stakes bundle releases. Each evaluation writes input hashes, result, reason codes, bundle digest, and decision ID. Emergency policies can revoke exposure, agent capabilities, and MotivationDose tokens without waiting for a deployment.

## G8. Radical-Dose R&D Track

*(was PRD §31.1 — Radical-Dose R&D Track)*

The Radical-Dose R&D Track is a quarantined research surface that studies the Brainlift's full-intensity design past today's defensible production line: stronger retrieval friction, ability-stratified near-peer and cross-cohort rivalry *intensity*, a higher and harder selection bar, denser dosing, and faster specialization. "Ability-stratified" means matching contestants by ability so contests stay near-peer (as in §15) and studying how much rivalry intensity helps — never a fixed-ability caste ranking. It exists so the production program can stay at the max-defensible ceiling while the organization keeps learning where the true frontier is.

The track operates under four hard rules:

1. **Simulation first.** Radical policies run against GT-Twin populations (§31) with doubly robust off-policy evaluation, subgroup analysis, and high-confidence lower bounds before any human subject is involved.
2. **Separate research consent.** Any study involving real children requires purpose-specific parent consent and child assent, an independent research-ethics review, and a no-participation path with no effect on the child's program status, admission, cohort, or credentials.
3. **No live-status effect.** A radical-track output can never change a live child's admission, intensity, specialization, cohort, route, or credential. It produces evidence, not decisions.
4. **Bounded by §23.** The track may vary intensity dials only. It may not use any mechanism prohibited in §23 — no surveillance, biometric-truth claims, irrevocable contracts, automated rejection, or single-signal decisions — even under research consent. In particular, the ability-stratified rivalry it studies never becomes a fixed-ability caste leaderboard, public tier name, or protected-attribute ranking; that §23 prohibition holds in simulation as well as production.

Validated findings feed a governance roadmap. The model and data governance board may, on the strength of that evidence plus legal, subgroup, and child-impact review, approve loosening a specific production control past the current defensible setting through the normal promotion process (§8.5). The roadmap is explicit that today's production ceiling is a starting line, not a permanent bound, and that every move past it must clear the same rights limits that constrain the current design.

## G9. Safeguarding operations and mandatory reporting

*(new in PRD v1.13 — the rights/legal-class companion to the PRD §30 safeguarding-operations requirement and the §3.7 legal-operating-model decision.)*

At 100,000 children the program carries a large absolute volume of safeguarding disclosures (abuse, neglect, self-harm, bullying), and every guide and mentor is a **mandated reporter** whose legal duty attaches personally and cannot be discharged by the platform. The program operates under these hard rules:

1. **Disclosure is not sensing.** GT100K performs no home sensing of any kind (G5, G6). *Sensing* is the program instrumenting the home to extract data a child did not volunteer, and is forbidden. *Disclosure* is a child's own account, given to a trusted adult, and is the child exercising the voice G3 §8.2 protects. The no-home-sensing rule forbids reaching into the home; it never forbids acting on what a child chooses to tell us — mandatory reporting makes that action a legal duty.
2. **A dedicated safeguarding operation.** Staffing is set by a ratio-based rule (safeguarding case-managers per 1,000 enrolled, a 24/7 on-call rota, and a mandated-reporter support desk), with a per-specialist active-caseload ceiling that fires the standing enrollment governor (§6.6, §32.4.1) when breached. Mandated-reporter certification, jurisdiction-specific training, and annual recertification are required of all guides and mentors, and the in-product reporting-decision aid may never *block* an individual's independent report.
3. **Triage to the statutory authority.** A defined workflow escalates guide → safeguarding team → CPS / law enforcement, with a jurisdiction service resolving the reporting rule by the child's residence / where harm occurred, hard statutory-deadline timers, contemporaneous quote-the-child documentation, and chain-of-custody on a legal-hold path distinct from routine retention and crypto-shred (G7, §29). Imminent-danger and on-program-actor cases auto-escalate to the child-safety incident commander (§30).
4. **The safeguarding data zone.** Safeguarding is the sole zone that may hold home-origin, family-identifying, legal-identity-linked content (names, addresses, case numbers), quarantined in its own database role, key hierarchy, and audit stream, legal-hold-exempt from routine crypto-shred, and one-way-firewalled from admissions, mastery, motivation, and sensitive-signal stores (G5, G7). It is intake-only from the child, never an outbound sensing capability.

This section is G-class: it is enforced regardless of measured product lift, and where it is stricter than any workflow or product rule, the stricter rule wins (authority order in the Constitution's Governance section).
