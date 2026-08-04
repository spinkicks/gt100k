# Writing scaffold — july31brainlift.md

Notes to write from. Nothing here is a sentence you can lift; that is on purpose.

## RULE 0 — the document is self-contained

**Never cite anything inside this repo.** No other brainlift, no research memo, no decision
record, no source file path. A reader outside the company must be able to check every claim.

- Allowed: published papers, standards documents, regulator guidance, court records, public URLs.
- Not allowed: "see our earlier brainlift", "per memo 09", "docs/decisions/...", a path into `passion/`.
- Facts about **our own system** are fine, stated as facts. "Our shred path is a stub" is a
  claim about the product, not a citation. Just do not point at the file.

Where the notes below came from an internal memo, I have replaced it with the primary paper.
Anything I could not resolve to a primary source is marked **[NEEDS PRIMARY CITE]** — either
track it down or leave the claim out. Do not cite the memo.

## Citation audit, 2026-08-04

Every link in `capstoneBL.md` was fetched and every DOI checked against CrossRef metadata.
Publisher 403s (Sage, Wiley, Taylor & Francis, ScienceDirect, ACM, Hogrefe, AEA, Human
Kinetics) are bot-blocks, not dead links. Those DOIs all resolve to the right papers.

**Four real errors found and fixed:**

| Was | Actually | Where |
|---|---|---|
| Smith & Smoll linked to `10.1080/10413209208406459` | That DOI is Jackson (1992), "Athletes in flow," a completely different paper. The 26%→5% attrition study is **Barnett, Smoll & Smith (1992)**, `10.1123/tsp.6.2.111` | SPOV 2, Experts |
| Chetty linked to `opportunityinsights.org/paper/diversifying-society-s-leaders/` | Hard **404**. Use `nber.org/papers/w31492` | SPOV 6, Experts |
| Barth et al. **2024** | Published **2023**. `10.1007/s40279-023-01906-0` | SPOV 3 |
| Rotgans & Schmidt in *Learning and Instruction* | *Contemporary Educational Psychology*, `10.1016/j.cedpsych.2017.02.003` | SPOV 1 |

Also confirmed: the CHI child-trust study is **Ragone et al. (2026)**, and the "Frontiers 2023"
specialization review is a **Güllich** paper, so citing "Frontiers 2023" and "Güllich 2022" as
two separate sources was double-counting one line of work.

## The bank was cut from 32 source blocks to 25

Dropped as repetitive or off-thesis: the RER 2022 SDT meta (mean age 16.55, and it supports a
hierarchy claim the argument then walks back), the Finnish and Barnett motor-skill studies
(three studies for one point, kept only the actual-vs-perceived one), Boeder (adult online
sample), Nye (duplicates Quested), rPPG and voice-stress (Barrett already carries the
biometric refusal; nobody proposed pulse), Volpe (measurement reliability, off-thesis), Saqr
and Henrie (duplicate "behaviour cannot say why"), McBee and Grissom (gifted identification,
adjacent), Curran & Hill perfectionism trend, the CBT/mindfulness meta (we do not run CBT),
Güllich 2022 (same line of work as the review), Lepper and Warneken (Deci's meta already
covers reward undermining), Rey (instructional design, not record design), the Australian
focus groups (secondary students, out of band), the CDT survey (teacher connection), and
Verhavert (comparative judgement, which we do not do).

**Pulled in from our earlier work, two only:** O'Keefe, Dweck & Walton (2018), because a child
who believes a passion is found rather than developed quits when it gets hard, and Credé,
Tynan & Harms (2017), because the perseverance facet of grit carries the weight while
consistency-of-interest carries none, which is the cleanest justification for letting a child
switch without calling it quitting.

## How to use this

1. Open this scaffold and `capstoneBL.md`. Not the old brainlift.
2. Write each field from the notes below, in your own words, in one sitting per section.
3. Retype rather than paste-and-edit. Editing an AI sentence leaves the AI sentence underneath.
4. Do not run the result back through an AI to smooth it. That undoes the whole exercise.
5. Paste the numbers and the direct quotes verbatim. Those are source material, not prose.

## What you do NOT need to rewrite (46% of the file)

- Every `**DOK 1 - Facts:**` block. Raw statistics and verbatim source quotes.
- Every `**Backing:**` citation list (the author-and-year strings, not the "Honest limit" prose).
- Every `**Link:**` and `**Where:**` line.
- All headings.

## What you DO need to rewrite (4,867 words)

Purpose, In/Out of scope, 6 SPOV headings, 6 Elaborations, 6 "Consensus it breaks",
6 "Honest limit" passages, 14 Expert `Focus` + `Why Follow` fields, 18 Insights,
23 `DOK 2 - Summary` blocks.

---

# CORRECTIONS — these are currently WRONG, fix while rewriting

Found by auditing the doc against the shipped product and against the rest of
`docs/research/`. Ranked by how badly they damage the argument.

### C0. Five findings that belong in this document and are not in it

All primary sources. Cite the papers.

**Sharpens Insight 18.** The brainlift says a quadrant keyed on intensity "cannot be built."
The harder reason is that the Dualistic Model of Passion never described a tipping point at
all. Harmonious and obsessive passion are two dimensions measured simultaneously and a person
can score high on both, so "the moment one becomes the other" asks for a date the source
theory does not contain. Supporting: the nearest behavioural-detection attempt measured
obsessive passion **by self-report first** and used behaviour as the outcome, which does not
license the inverse inference (131 online workers, mean age 23), and rigid persistence
related *negatively* to performance. **[NEEDS PRIMARY CITE]** for that last study.

**Kills the "sleep floors" line in SPOV 3.** See C2.
- best published attempt to read exhaustion from behavioural traces: **ROC AUC 0.56** against chance of 0.50 (239 workers, nine months, adults, far richer sensing than session logs); the dimension closest to what we mean performed *worst*. **[NEEDS PRIMARY CITE]**
- models that beat that are subject-dependent, trained on the person's own labelled self-reports, which requires exactly the ground truth the sensing was supposed to avoid collecting
- the School Burnout Inventory does not measure sleep timing. Its item reads "I often sleep badly because of matters related to my schoolwork," so the child must notice bad sleep **and** attribute it to the activity (Salmela-Aro et al. 2009, already cited in the doc)
- reported sleep tracks mental health better than actigraphy does, and children aged 8–9 misestimate their own sleep duration by **over ninety minutes**. **[NEEDS PRIMARY CITE]**
- Mind Garden withdrew **all** Maslach Burnout Inventory cut-off scores in 2016 for having no diagnostic validity (MBI Manual, 4th ed.); WHO ICD-11 classifies burnout as an occupational phenomenon, not a medical condition. So a burnout boolean has no scientific referent
- validated age floors: BAT-C covers 9–13; the SBI was built on 16-year-olds and up; the athlete-burnout literature states no child-validated tool exists

**Three findings the document does not have at all:**

1. **Who speaks first, on the ride home.** A conversation-analysis study recorded roughly four and a half hours of real car journeys home from youth tennis competitions. Children resisted and disengaged whenever a **parent** opened a review of their performance, *including when the parent was being supportive*. When the **child** opened the subject, extended affiliative talk followed, win or lose. The rule is about who speaks first, not about tone, which makes it implementable in a way "be encouraging" is not. **[NEEDS PRIMARY CITE]** — worth the search, it is the best adult-behaviour finding after Smith & Smoll.

2. **Butler (1988), and it lands in our exact age band.** Fifth and sixth graders randomly assigned to receive grades, comments, or both. Interest was highest after comments, and **grades-plus-comments performed like grades alone**. The number did not dilute the comment, it erased it. SPOV 4 currently argues anti-gamification from college samples; this one is 10 to 12 year olds and it is stronger. Butler, R. (1988), *British Journal of Educational Psychology* 58, 1–14.

3. **A parent-visible return metric would destroy the only instrument we have.** Once a child knows a parent can see whether they came back, coming back becomes evidence of compliance, indistinguishable from the introjected return SPOV 2 already worries about. We would spend our one valid signal to build a feature that also harms the child. This is a SPOV 1 × SPOV 4 argument and it currently sits in neither. It needs no external citation because it is an internal-consistency argument about our own design, which makes it the safest strong claim in the whole document.

Also worth having: conditional *positive* regard associates with introjected regulation more
strongly than conditional negative regard does (meta-analysis across 31 samples), so "show
parents only the good news" fails too. **[NEEDS PRIMARY CITE]**

### C1. SPOV 2 ends on "ask the guide" and never tests whether adults can answer
Adults are weak informants, and the literature is large and old:
- cross-informant agreement **r ≈ .28**, stable for forty years across 341 studies. Achenbach, McConaughy & Howell (1987), *Psychological Bulletin* 101(2), 213–232; confirmed by De Los Reyes et al. (2015), *Psychological Bulletin*
- parent report against device telemetry **r = 0.35**, with systematic over-report (N=216, ages 4–5). **[NEEDS PRIMARY CITE]**
- a single global retrospective activity question against a week of accelerometry: **r = −0.11, ns** (mean age 6.9). **[NEEDS PRIMARY CITE]**
- teachers judge *achievement* well and **interest poorly**: accuracy about **r = .63** for achievement, low for interest. Südkamp, Kaiser & Möller (2012), *Journal of Educational Psychology*
- Dizon-Ross (2019), *American Economic Review* 109(8), N>2,700: parents are 30% wrong about which of their own two children is academically stronger, and correcting the belief causally reallocates real investment

The gifted-identification literature (nomination false negatives above 60%, referral gaps by
race) was cut from the bank as adjacent rather than load-bearing, but it is the natural
experiment in making adult report decisive and it went badly. Worth one clause if you want it.

**Why this matters:** SPOV 2 ends on "the software asks the guide." The literature above
says the guide is also a weak instrument. Either address it or the SPOV has a hole a
reviewer will find immediately.

**The resolution is in the numbers above, and it is the strongest move available.** The
spread *within* adult report is larger than the gap between kinds of adult. The same
parents managed r = 0.35 reporting against telemetry and **r = −0.11** answering one
global retrospective question. Reporting in the moment tracked the objective measure
well. **The problem is retrospection, not the parent.** So the design asks for an
episode, never an impression: "what did you see them do last week" rather than "what are
they interested in," because the second invites the inferential leap where halo and
stereotype enter and produces nothing auditable.

Two further constraints. Adults judge what a child is **good at** far better than what a
child **likes**, so this channel will over-name academically legible interests. And part
of the well-known gender gap appears to live in the instrument, since parent-report
studies find boys roughly six times as likely to have conceptual interests while
observation and child-interview studies of the same ages find no such gap. **[NEEDS
PRIMARY CITE]** for the gender-gap comparison.

Hence the channel is **write-only**: the adult is never shown that their report changed
anything. Changing a parent's belief causally reallocates real investment (Dizon-Ross),
so a visibly-moving number would be a machine for manufacturing exactly the parental
over-valuation the rest of the design exists to avoid.

### C2. SPOV 3's operational list describes features we deliberately refused to build
The doc claims sleep floors of 9–12h and scheduled deloads are "tracked like any other
metric." We do not track them, and this is not a roadmap gap. We considered sensing them
and rejected it on the evidence in C0. What exists instead is a behavioural plus
adult-reported escalation, no burnout questionnaire, no sleep tracker, no deload feature.

The fix is stronger than softening "track" to "will track." Say we tried to make burnout
sensable, found the ceiling was an AUC of 0.56, and turned it into a question an adult
answers, producing a direction rather than a verdict.

**And SPOV 3's own thesis is already built into the system, which is worth saying.** The
wellbeing engine carries two independent knobs, a challenge move and a pressure move, with
the rule that backing off means **pressure comes down before challenge is touched**. That
is "the harm runs through pressure, not volume" turned into an interface. The challenge
setpoint sits at a success band of 0.8 to 0.9, scaffolding below 0.7, which is the ~85%
optimal-error finding made concrete (Wilson et al. 2019, *Nature Communications*,
"The Eighty Five Percent Rule for optimal learning"). Devaluation is a first-class signal
weighted above exhaustion, which is the Athlete Burnout Questionnaire triad in production
(Raedeke & Smith 2001). None of that is in the document, and all of it is evidence the
SPOV is load-bearing rather than decorative. State it as fact about the product. No paths.

### C3. SPOV 5 under-discloses. Three things are stubs, not one
The doc admits only the shred path. Also deferred:
- **shred and key lifecycle** — the erasure service returns a stub tombstone; there is no key create, rotate, or destroy path anywhere
- **transparency log** — returns an empty proof
- **attestation signing** — attestations are in-toto-*shaped* but **unsigned**

And Open Badges, W3C Verifiable Credentials, and C2PA appear in **zero lines** of our code.
They are things we would reuse, not things we run. Phrase accordingly, because a document
arguing that provenance must be honest cannot overstate its own provenance.

What is real and worth claiming: a content-addressed DAG with SHA-256 identifiers,
RFC-6962 Merkle roots, and a deterministic verifier that re-derives content ids.

### C4. The EDPB citation is stale
DOK 2 calls Guidelines 02/2025 a "public-consultation draft." **Version 2.0 was adopted
2026-07-07.** Update it and link the adopted version. Two things worth adding alongside:
the guidance that PII must never be placed on an immutable structure *even hashed*, and
NIST SP 800-88 Rev. 2 (2025), which treats Cryptographic Erase as Purge only when every
copy of the key is destroyed. That second one is the actual bar our key lifecycle has to
clear, and it is a public standard.

### C5. Two DOK 2 entries cite internal reports, which Rule 0 now forbids outright
The rPPG numbers and the Yerkes-Dodson critique currently point to a "2026-07-21 burnout
research report," and the Barnett/Finnish competence figures to a "2026-07-29 competence
research report." Both must go. Replace with the primary papers:
- rPPG skin-tone bias → the *npj Digital Medicine* (2025) paper itself
- Yerkes-Dodson critique → the *Trends in Cognitive Sciences* (2024) article itself
- Barnett et al. (2008) object-control skill → the original paper
- the Finnish 6-year longitudinal → *Journal of Science and Medicine in Sport* (2015)
- actual-vs-perceived competence → PubMed 29016237

If you cannot find one, cut the claim. A document about provenance cannot have a dangling
citation in it.

### C6. Name the reversal without naming the document
SPOV 3 says it "reverses a position we ourselves once held." Keep the self-correction and
describe the old position in words: that we previously argued for specializing hard and
early and cutting breadth deliberately. Do not cite where we said it. A self-correction
stated plainly is one of the strongest things in the document, and it does not need a
footnote pointing inward.

---

# PURPOSE (~150 words)

Beats to hit:
- three premises, already settled from earlier brainlifts → floor / spike above it / proven by defending, not submitting
- pivot → premises settled, the *how* is not
- the four shortcuts on sale → face-reading; badges; "intensity self-regulates"; "the log explains why"
- verdict on all four → wrong, and expensive for the school too
- what an SPOV had to survive → breaks consensus AND holds up

## In scope — 4 bullets
- durable-interest signal ← skill + behaviour. NOT self-report, NOT face/voice/pulse. + limits of behaviour (SPOV 1, 2)
- what elite admissions rewards ← court record, not consultants (SPOV 6)
- burnout as tracked number, designed against
- record legible + wanted + never punitive

## Out of scope — 3 bullets
- academic floor & its teaching; case for a spike at all; family selection → premises, argued elsewhere
- biometric emotion reading → rejected on evidence (SPOV 2), not explored
- final legal calls → we name binding rules, not advice

---

# SPOV 1 — free choice is a broken instrument

**Heading claim:** "let them choose, watch what they pick" fails at 9–12. AND the tidy fix
("build skill instead") fails too. Build skill because it is buildable. Watch one thing:
unprompted return.

**Elaboration beats:**
1. the intuitive instrument → menu, watch the pick
2. Quested et al. 2013 → ~8,000 kids, 5 countries, >88% endorsed "this is my choice" in EVERY country → researchers dropped the item → could not separate lover-of-sport from about-to-quit
3. so try skill instead → also fails. Skjesol 2025 RCT, n=175, 11 weeks → moved neither competence nor interest
4. the split → Mabbe 2018: competence → challenge-seeking (b=.31). But Deci 1999: verbal reward on children d=0.11 ns vs adults d=0.43. Patall 2008: choice → IM d=0.30 overall, d=0.51 primary
5. conclusion → parallel, not a hierarchy. Skill = buildable + measurable. Choice = protectable only
6. second paragraph, the objection → does this condemn our own discovery wall? No. 88% rules out reading the pick, not offering the menu. First click = exposure, moves no estimate. Menu is the precondition for a return

**ADD — voluntary return currently looks invented. It isn't. Give it its theory:**
- Hidi & Renninger (2006) four-phase interest model → later phases are defined by *self-generated re-engagement*. "Voluntary return" IS their later-phase marker. Right now the doc uses the concept with no theoretical home
- Harackiewicz et al. (2008), N=858 → situational interest during a course predicted course choice across 7 semesters; lecture *enjoyment* did not. Enjoyment is not the signal; return is
- O'Keefe, Dweck & Walton (2018) → a child who believes a passion is *found* rather than *developed* disengages the moment it gets hard. This is why the program develops interest instead of hunting for a pre-existing one

**ADD — the "first click is only exposure" claim has hard evidence:**
- Habgood & Ainsworth (2011): free-choice play 75.7 min (intrinsically integrated) vs 10.28 min (extrinsic), n=16 ~age 10. Then at ages 7–8 (n=58) **only the delayed probe discriminated** (partial η² = .24). In-session engagement did not
- Rotgans & Schmidt (2017): 4 triggers over 4 weeks → treated slope +.03, **control slope −.03**. Untriggered interest actively decays. This is the argument FOR the menu, not merely a defence of it

**Consensus it breaks:** (a) what a child picks reveals what they love (b) skill-building is
the master lever for lasting interest

**Honest limit:** two best direct tests at 9–12 point opposite ways → the negative claim is
firmer than any ranking of skill over choice. Add: Habgood/Rotgans/Poli samples are 4–10,
below or at the edge of our band.

---

# SPOV 2 — behaviour is all you get, and it still can't say why

**Heading claim:** behaviour is the only thing worth instrumenting; it still cannot tell you
why; software reports, guide interprets.

**Elaboration beats:**
1. the pitch → camera/wearable senses interest or stress
2. refusal → Barrett 2019, emotion "cannot be reliably read from facial configurations" (quote verbatim). EU AI Act Art. 5(1)(f), banned in education since 2 Feb 2025
3. rPPG numbers if you want them → MAE 4.23 bpm on Fitzpatrick I–V rising to 13.58 on VI; in-the-wild r ≈ 0.58
4. so we watch behaviour → returns, depth, duration. Measurable, predicts learning
5. **the turn** → most builders stop here. They shouldn't
6. Guay/Vallerand/Blanchard 2000 → SDT's own authors: free-choice measure "is unidimensional and consequently cannot assess other important motivational concepts" (verbatim)
7. the inversion → Ryan/Koestner/Deci 1991, 3 experiments: ego-involved persisted LESS after positive feedback, MORE after nonconfirming. Enjoyed neither. Adults only → we are extrapolating, say so
8. the implication, concretely → coach praises Tuesday, child returns Thursday, meaning flips. We don't log what the adult said. Cheapest fix remaining
9. "over-motivated" doesn't live in volume → Curran 2015 meta, 94 studies, 1,308 effect sizes: harmonious vs obsessive → deliberate practice indistinguishable (Hotelling's T = .48, ns)
10. what survives → probes, not detectors: interruption test; real cost-free exit (Raedeke 1997, attraction declines it, entrapment can't hear it); intervene on adults → Smith/Smoll: 18 Little League coaches, dropout 26% → 5%, no change in win-loss

**ADD — the adult-validity block in C1.** SPOV 2 hands the "why" to the guide, so it has to
survive the evidence that adults are weak informants. Do not skip this. It is the only
addition SPOV 2 needs; the trace-portability literature was cut as duplicative of
Guay and Fredricks, which already establish that behaviour cannot name a motive.

**Consensus it breaks:** wearable/camera premise; the learning-analytics premise that a rich
log infers *why*; "over-motivated" as one detectable state

**Honest limit:** sensors ARE valid for narrow lab targets — the break is the leap to emotion
and to real classrooms. Excluding self-report is our choice, not a finding. And the guide we
hand the question to agrees with other adults at only r ≈ .28 (Achenbach 1987), so the
division of labour buys accountability rather than accuracy.

---

# SPOV 3 — burnout is a number; "good stress" is a myth

**Heading claim:** burnout measured and designed against; "good stress" myth; early START
required, early LOCK-IN not.

**Elaboration beats:**
1. false binary → damage-or-mediocrity. Neither survives
2. split the term → "early specialization" = two claims
3. START holds → Gobet & Campitelli 2007: IM odds 1 in 4 if serious by 12, vs 1 in 55 later (N=104). Music graded ladders assume years before juniors open at 13
4. LOCK-IN fails → junior predictors ≈ opposite of senior predictors; most elite specialize mid-to-late adolescence
5. we reversed our own earlier position → product now carries several live hypotheses per child, parking is reversible
6. damage channel is NOT volume → pressure + contingent self-worth. Music schools: controlled motivation β ≈ .19 dropout; autonomous β ≈ −.17; encouraging parent β ≈ −.39 (strongest); autonomy-supportive coaching → resilience β ≈ .52
7. kill "good stress" → Yerkes-Dodson = 1908 study, 2–4 mice, never measured arousal. Challenge AND hindrance stress both relate negatively to strain
8. the operational list → School Burnout Inventory & kin; sleep floor 9–12h for 6–12s; distributed practice; scheduled deloads; autonomy-supportive delivery
9. the stakes → school burnout ≈ 4× dropout risk; high-pressure environments 2–3× population norms anxiety/depression

**ADD — the review currently cited only says "predictors differ." Quantify it:**
- Barth et al. (**2023**, not 2024): junior→senior performance pooled **r = 0.148**, about 2.2% of variance. At ages ~11–13, **r ≈ −0.05**. This is the number the SPOV needs
- Brenner / AAP (2016): ~**70%** drop organized sport by 13; prescribes ≥1–2 rest days per week and ~3 months per year off. NOTE this contradicts the Güllich review on the direct specialization-to-burnout link. Keep the tension visible rather than resolving it

**ADD — "don't quit" is an adult bias, and switching is not quitting:**
- Arkes & Ayton (1999): sunk-cost reasoning is largely absent in young children and in animals, and increases with age. The bias belongs to the adult
- Credé, Tynan & Harms (2017), 88 samples / 66,807 people: grit correlates with conscientiousness at ρ ≈ .84, and the **perseverance** facet carries the predictive weight while **consistency of interest** carries almost none

→ Together these say reversibility is native to the child, the lock-in pressure comes from
us, and the part of grit worth keeping is the part that survives a change of subject.

**ADD — stronger burnout-to-exit evidence than Raedeke 1997 alone:**
- Isoard-Gautheur et al. (2016), n=458, ages 14–18: higher-burnout profile → **2.2–2.4× dropout six years later**
- Raedeke & Smith (2001) ABQ triad: exhaustion, reduced accomplishment, and **sport devaluation**. Devaluation is the earliest warning, and it is quiet. It is also already a first-class signal in our own engine

**See C6.** Describe the reversed position in words. Do not cite where we said it.

**Consensus it breaks:** damage is either inherent (cap ambition) or trivial (push harder);
and that "good stress" exists

**Honest limit:** chess sample is title-enriched, not a base rate; no validated self-report
instrument at 8; "deload" transfer to academics is reasoned not tested; one review finds no
direct specialization→burnout link while AAP finds the opposite; Isoard-Gautheur and
Barth are adolescent/athlete samples, not 6–12.

---

# SPOV 4 — the record must be legible and wanted, or it's surveillance

**Heading claim:** child must read it and want it, else surveillance. Badges/points/dashboards
make it worse.

**Elaboration beats:**
1. the asset only counts if the child can read it and wants it
2. default EdTech move → gamify, badge, dashboard
3. it backfires, harder on children → Deci 1999: expected contingent rewards undermine IM more in children than college students, age difference Qb(1) = 5.14, p < .02
4. Balci & Morris 2026 badge RCT n=210 → badges reduced IM, satisfied no competence need (caveat: college sample)
5. 38-study systematic review → NO evidence dashboards improve achievement. 2025 meta-analyses: ES ≈ 0.36 (23 studies, 9,710 participants), heavily moderated by developmental level
6. even encouragement costs → task-value prompts raised anxiety in already-anxious learners
7. what helps, narrow → self-referential progress, actionable, never a leaderboard → rules out cumulative scores, streaks, tokens, cross-child comparison
8. the evidence gap → no study tests a learning-record UI on 8–14s. We looked
9. adjacent levers → CHI-2026, N=289 ages 9–11: consent lands when framed concretely ("asking before taking" not "data sharing"); kids object to "taking things without asking"
10. Agesilaou & Kyza 2022, n=63 → children misunderstand who owns their own data
11. Australian secondary focus groups, n=62 → "power, surveillance and affect", digital resignation. Secondary sample → may not reach our band
12. disclosure → simple AI-use label beat detailed one; cheating-accusation anxiety rises with grade level

**ADD — two things, both stronger than what is there:**
- **Butler (1988)** is the headline and it is in our age band. See C0
- Wolf (2008): at ages 6–7 a child understands ~**4,000** heard words against ~**600** read. If the record must be legible *to the child*, at the young end it has to be **audible**. The doc treats legibility purely as a consent problem and misses that it is first a literacy problem

**Consensus it breaks:** gamification and dashboards as safe motivating defaults; and richer
record = more trustworthy record

**Honest limit:** no located study on 8–14s for record/credential/authorship UI → this pillar
we must evidence ourselves. Also: the badge RCT (Balci & Morris) is a **college** sample, so
it is being extrapolated downward.

---

# SPOV 5 — every part is off the shelf; deletion is the hard problem

**Heading claim:** all components commodity; moat = composition + in-person defense; hard
problem = verifiable deletion, not tamper-evidence.

**Elaboration beats:**
1. two opposite assumptions, both wrong
2. first: someone built it → no. No product combines content-addressed provenance + attestation + transparency logging + verifiable credentials into one tamper-evident learning DAG
3. second: authenticity is hard → it's solved and free. List: W3C VC, Open Badges 3.0, CLR 2.0, in-toto/SLSA, Rekor/Trillian, RO-Crate↔PROV, C2PA, Grammarly Authorship (per-sentence, version-history not crypto)
4. the thing none of them do → prove a human authored unaided. C2PA says so itself: "makes no judgment about whether provenance is 'true'"
5. detectors don't rescue it → Weber-Wulff 2023: 14 detectors, 754 cases, none above 80%. Liang 2023: 61.3% false-positive on TOEFL essays. Zhang 2024 ICML: strong watermarking formally impossible
6. so trust root = 5-minute in-person defense on a sample. Remote artifact-only competitor cannot run it. Value rises as AI makes files easier to fake
7. the real hard problem → verifiable deletion on an append-only store holding child data. EDPB 02/2025: immutability "cannot be invoked to justify non-compliance". Crypto-shredding is a supplement, not a guarantee
8. our architecture → commitments on the append-only log, erasable data in separately-keyed store
9. **admit it isn't built** → shred path is a stub, no key lifecycle

**ADD — public standards and regulator guidance the doc barely touches:**
- **EDPB Guidelines 02/2025 v2.0, adopted 2026-07-07** (not the draft; see C4). Adds: never put PII on an immutable structure, *even hashed*
- NIST SP 800-88 Rev.2 (2025): Cryptographic Erase counts as Purge only if every copy of the key is destroyed. That is the actual bar our key lifecycle has to clear
- SoK crypto-erasure, IACR ePrint 2026/1109 **[preprint, flag it]**: Destruction-IND ≈ the EDPB "render unrecoverable" standard
- COPPA 2025 amendments: indefinite retention banned, written retention policy required, compliance date **2026-04-22** (already passed)
- Rekor v2 GA (Oct 2025) and Tessera → the transparency log we stubbed has a shipped implementation available

**See C3.** Disclose all three stubs, not one.

**Consensus it breaks:** already built, or authenticity is the hard part

**Honest limit:** novelty inferred from absence in surveyed corpus → private build not ruled
out. Oral-defense evidence is largely higher-ed. And our own attestations are currently
unsigned, our transparency log returns an empty proof, and Open Badges / VC / C2PA appear
in zero lines of our code, so "the stack is commodity" describes what we could reuse rather
than what we run.

---

# SPOV 6 — the spike sorts, it does not substitute

**Heading claim:** spike does not beat the floor; it differentiates among those who cleared it.

**Elaboration beats:**
1. pitch-deck version → spiky profile > scores. Litigation record says narrower and more useful
2. four separate ratings, Card Exhibit 4 → four 2s = 68%; extracurricular 1 with no other 1s = 48%; academic 1 with no other 1s = 68%; athletic 1 = 88%; no 1 or 2 anywhere (n ≈ 56,000) = 0.1%
3. skim it → breadth appears to win
4. the trap → EVERY row conditions on "no other 1s" → pits a spike WITHOUT the floor against balanced competence. Our profile absent from the table entirely
5. additive not substitutive → academic-1 logit 4.094; extracurricular-1 4.232. Bottom of scale reverses: weak academic ≈ 3× as damaging as weak extracurricular
6. scarcity → only 7% earn a 2 or better on three dimensions (Card Exhibit 5); ~42% earn academic 1 or 2
7. finding one, the rubric → grades LEVEL never DOMAIN. Verbatim: "1. Unusual strength in one or more areas. Possible national-level achievement or professional experience… Truly unusual achievement." Zero approved activities listed anywhere
8. finding two, where domain DOES bite → verification machinery. Separate academic rating triggered only by academic competition; faculty portfolio review for music/art/dance/academic; athletic recruiting. MIT has exactly 4 portfolios. Common App has 29 activity categories, none for games/puzzles/tabletop
9. therefore → prestige = who can check your claim. EvidenceGraph closes exactly that gap

**Consensus it breaks:** consultant orthodoxy (spike > all-round); counselor reflex
(activities are decoration); and that the spike's value depends on a prestigious subject

**Honest limit:** all correlational. Rating = one reader's judgment of a whole file, not an
attribute of a child → improving a pursuit ≠ improving the number written down. Nothing in
this literature observes anyone under 17 → the six-to-seventeen link is unevidenced here.
Chetty is the uncomfortable half: ~30% of top-1% advantage explained by non-academic ratings;
private-school students have no higher academic ratings but much higher non-academic ones;
non-academic ratings uncorrelated or negatively correlated with post-college outcomes.

---

# EXPERTS (14 entries — `Focus` + `Why Follow` only)

One line each. What each person is for:

| Person | Focus | Why they're here |
|---|---|---|
| Lisa Feldman Barrett | emotion science; faces don't encode emotion | basis for refusing face-reading |
| Katariina Salmela-Aro | school burnout; the SBI | the instrument that makes burnout a number |
| Suniya Luthar | achievement pressure in high-achieving schools | names the harm: worth contingent on performance |
| Curran & Hill | perfectionism over time | socially-prescribed perfectionism up ~33% since late 80s → the trend to counter |
| Deci & Ryan | SDT; autonomous vs controlled | the master variable under all four pillars |
| Inge Molenaar | SRL dashboards for young learners | what *does* help a child read progress |
| Sonia Livingstone | children, data, consent, datafication | legibility is a design duty; digital resignation |
| Phillip Dawson | assessment security, interactive orals | basis for the 5-min defense |
| 1EdTech / Sigstore / C2PA / RO-Crate | credentials, attestation, transparency logs | the machinery we reuse + the claim we refuse |
| EDPB & CNIL | immutability vs right to erasure | sets the deletion requirement; kills the immutability excuse |
| Card & Arcidiacono | 6 yrs Harvard applicant data | disagreed on meaning, agreed on facts → firmest evidence; only public rubric |
| Chetty, Deming & Friedman | Ivy-Plus causal effect via waitlists | only causal design; the uncomfortable finding |
| Vallerand & Curran | dualistic passion model + 94-study meta | the distinction can't be made from outside |
| Smith & Smoll | coach training, changing adults not kids | 26%→5%; strongest controlled child evidence in the field |

---

# INSIGHTS (18 — one short paragraph each)

Each needs: the claim, the number that carries it, the arrow to its SPOV.

1. free choice is a near-constant not a signal → >88% → "watch what they pick" measures noise → SPOV 1
2. skill + choice jointly necessary, no hierarchy at 9–12, unequal actionability → SPOV 1, 3
3. actual skill > perceived skill in the youngest (9–30% vs 0–5% variance explained, ages 6–9) → SPOV 1, 2
4. inner state unreadable + illegal; behaviour readable + predictive; field conflates the two → SPOV 2
5. junior and senior predictors near-opposite → keep start, drop commitment, no achievement cost → SPOV 3
6. harm runs through pressure + contingent worth, not hours → SPOV 3
7. "good stress" unsafe; recovery is a design element → SPOV 3
8. instruments work ~9–10 up, not 8 → youngest need observer report; cutoffs are population-specific → SPOV 3
9. gamification is a trap for this band → restrain features rather than add → SPOV 4
10. one progress view helps: self-referential, actionable, no leaderboard; encouragement isn't free → SPOV 4
11. zero located studies on 8–14s → open design problem + the four adjacent levers → SPOV 4
12. stack is commodity, integration is the novelty → SPOV 5
13. hard problem inverted: deletion not tamper-evidence; designed against, not built → SPOV 5
14. the quoted comparison is the wrong comparison (every row conditions on no other 1s) → SPOV 6
15. rubric grades level never domain; prestige lives in verification machinery → SPOV 6, 5
16. refusing biometrics bought less than it looked → division of labour, not better inference → SPOV 2
17. core signal inverts under adult praise → feedback history + alternatives are preconditions → SPOV 2, 1
18. "over-motivated" isn't one state; the visible axis carries no information → probes + adult intervention → SPOV 2, 3

---

# DOK 2 SUMMARIES (23 — 1 to 3 sentences each)

Write in your own words. The DOK 1 facts above each one stay exactly as they are.

1. Quested → near-universal endorsement separates nobody
2. RER 2022 meta → competence largest share (43.21%) but autonomy close (34.49%)
3. Finnish/Barnett/actual-vs-perceived → actual competence out-predicts, self-report weak young
4. Mabbe/Patall/Deci/Skjesol → the 9–12 split; parallel not hierarchy
5. Barrett + EU AI Act → unfounded and illegal
6. rPPG + voice stress → partly valid, skin-tone biased, brittle; the leap is unsupported
7. Guay/Ryan/Fredricks/Skinner/Volpe → reason isn't in the stream; praise inverts; behaviour lags emotion
8. Curran/Raedeke/Smith-Smoll → the visible axis can't separate; run probes, fix adults
9. Salmela-Aro → burnout becomes trackable; floor ~9–10 not 8
10. Yerkes-Dodson critique → good stress unsafe; recovery required
11. Luthar/Curran-Hill/CBT meta → real, rising, treatable → build safeguards in
12. Frontiers 2023 → lock-in not required; keep start, engineer out lock-in; one review dissents
13. music dropout / coaching SEM / Saarinen → autonomy + motivation quality decide, not volume; U-shaped parental harm
14. Deci/Balci/dashboard review → gamified playbook counter-productive here
15. MyReadscape/Molenaar/ICO/COPPA → self-referential helps, competitive doesn't, inside binding rules
16. CHI-2026 / Agesilaou / Livingstone / Australian focus groups → gap confirmed, four levers, must self-evidence
17. Weber-Wulff/Liang/Krishna → detection inaccurate, defeated, biased → never trigger consequences
18. Zhang/C2PA/Dawson → no artifact test proves human authorship → process + sampled defense
19. Open Badges/in-toto/Sigstore/RO-Crate/C2PA/Grammarly → blocks mature, composition is the asset
20. EDPB/CNIL/crypto-shredding → deletion is the hard problem, handled in architecture
21. SFFA discovery → rubric grades attainment not type; 68-vs-48 is not breadth beating depth; domain bites at verification
22. Arcidiacono/Chetty/Schmill → academics filter, activities sort; additive; Chetty is the uncomfortable half
23. chess + causal limits → correlational only; chess sample title-enriched

---

# DO NOT ADD THESE (deliberate exclusions)

The corpus is much bigger than this brainlift. Leaving things out on purpose is a
position; leaving them out by accident is a gap. These are on purpose:

| Topic available in our wider research | Why it stays out |
|---|---|
| IQ floor, acceleration, heritability (Polderman, Deary, Schmidt & Hunter) | The academic floor is an explicit out-of-scope premise |
| Family selection, tiger parenting, commitment devices | Family ranking is out of scope |
| The full four-phase interest apparatus, far-transfer (Sala & Gobet, Gentner) | Take only the return marker from Hidi & Renninger. The rest is a different argument |
| Talent-development spine (Bloom, Subotnik, Côté, PCDEs, Renzulli) | That answers "how a spike becomes expertise." This doc answers how we read, sustain, and prove one |
| Child-safe retrieval, companion-AI harm, prompt injection | Conversational safety, not the signal/record/proof spine |
| MTMM, conformal prediction, comparative-judgement cold start | Methods for validating the model, one layer below the SPOVs |
| Touch targets, visual search, motion budget | UX implementation. Exception: keep the listening-over-reading gap, which is a legibility argument |
| The pursuit catalogue and its venue facts | Operational. Worth ONE sentence in SPOV 6 naming which pursuits have no verification route |
| Productive-failure age reversal (Sinha & Kapur 2021) | Only needed if process grading enters the document |

**If you add everything flagged above, the doc roughly doubles.** Recommendation: take C1
through C6 plus the SPOV 1 theory block and the Barth number. Those close real holes. The
rest are available and can stay in their memos.

---

# WRITING NOTES

- Your own tics are the asset. The emphatic capital, the question you answer yourself, the
  short fragment after a long sentence. Those are yours and no model produces them the same way.
- Vary paragraph length hard. Some one sentence, some eight.
- Where you are uncertain, write the uncertainty in your own voice rather than in hedge words.
- Do not aim for polish. Polish is the tell.
- Numbers, β values, and anything inside quotation marks: copy exactly, no paraphrase.
