# Design: The Warm-Demanding Parent Playbook (parent-guide)

**Date:** 2026-07-24
**Status:** Draft v2 (approved in brainstorming; revised after a 3-subagent gap review; pending written-spec review)
**Owners:** us (the parent/guide side of GT 100k). Teammate owns the kid platform.

## 1. Why this exists

Manager's framing:
- **MVP #2:** a guide for homeschool parents to make sure their kids are set up for success.
- **Long term:** an end-to-end system (discover → outline for guides/parents → guides run workshops → an MIT-credible mastery portfolio) plus an **"outline of the successful parent"** reusable for applications, guides, and onboarding.

This is the first artifact on the parent/guide side. It consolidates three things we already have into one plain-language, parent-facing page:

1. **The family-coaching engine** (`@gt100k/family`, spec 019): a pure decision engine that turns per-child signals into a **warm-demanding coaching read** (posture + door-opening offers + shared activities + a family-driven-pressure watch), guide-facing, "system proposes, human disposes."
2. **The brainlifts** (`docs/research/familyBrainlift.md` "Select the Family, Not the Child"; `passionBrainlift.md`; `gtBrainlift.md`): the thesis that the **family is the lever** that converts a child's ceiling into real achievement, the successful parent is warm-demanding / autonomy-supportive / non-contingent / whole-household-aligned, and harm runs specifically through **contingent self-worth and control**.
3. **The research memos** (`docs/research/passion-pipeline/01–04`): interest is built not found and read from voluntary return; decouple worth from outcome; back off pressure before difficulty; keep pursuits plural and reversible; talent develops through a staged, mentor-relayed climb.

In GT 100k the homeschool parents *are* the educators, so the guide-facing wisdom in our engine is exactly what a parent needs pointed at them directly. This page is that wisdom, made readable and usable by a parent, and it stands alone as the "successful parent outline."

## 2. Audience, voice, purpose

- **Reader:** a committed homeschool parent, **both applicants and admitted families**. Where the copy would say "your guide," it reads "your guide or a trusted mentor or professional," so an applicant with no assigned guide is never stranded.
- **Job:** after reading, a parent can (a) state the one stance that matters, (b) start concrete moves this week (with scripts and a sample rhythm, not just principles), (c) catch the traps in themselves, (d) know what to do in the hard moments, and (e) fill in a short **self-assessment** they could attach to an application.
- **Voice:** warm, direct, second person, plain language. We **translate the jargon** ("warm-demanding" → "demanding and warm at once"; "non-contingent warmth" → "your warmth never depends on how it goes"; "autonomy support" → "they keep choosing"). Honest about limits, **never preachy or judgmental** (a parent should feel equipped, not graded). **No em-dashes** in the copy.
- **Guardrails carried from the engine:** no score, no label, no reward/gamification anywhere; the page proposes, the parent decides; warmth is never framed as conditional; the serious moments route to a human, not to a verdict from a webpage.

## 3. Approach (chosen)

**A + widget:** a single self-contained static HTML page (the playbook), plus a small interactive **Family Check-In** widget that mirrors the engine. Rejected alternatives: playbook-only (loses the "explain our engine" value) and a dense one-pager (too terse to change behavior). The widget is a self-contained JS **mirror** of the engine's branch logic, not a live import.

## 4. Content spine (the page, top to bottom)

Short, plain-language **chapters**. **Every strong claim carries an inline, checkable citation**, and §11 lists each with a link, so a parent can confirm nothing is invented. A sticky in-page table of contents lets them jump around. Where the evidence is limited we say so in one clause (honesty beats overclaim, and it is what makes this credible).

**Part 0 — Start here.** A 30-second version: the one idea, plus an 8-line "successful parent" snapshot (the stance, the five moves, the four traps, the one rule for hard moments). This doubles as the top of the self-assessment (§ Part 9) so a busy parent or an application reviewer gets the whole thing immediately, before the deep chapters.

**Part 1 — Why (the case).**
1. **The one idea (hero).** "You are your child's biggest advantage. Handled wrong, you are also the biggest risk. The whole difference is *how*." [Pinquart & Ebeling 2020; Kim 2013]
2. **Why the home matters.** An engaged, autonomy-supportive home turns a child's *potential into realized achievement*. Honest scope: the strongest environment effects show up where homes differ a lot (for example, moving a child out of a deprived setting), and they are about **childhood achievement, not raising an adult IQ ceiling**; what a committed home reliably does is convert a given ceiling into the grades and skills ordinary homes leave on the table. Parents' expectations also predict *gains*, not just current levels. [Pinquart & Ebeling 2020; Hill & Tyson 2009; Capron & Duyme 1989 (adoption, scoped); Turkheimer 2003 (deprivation, scoped)]
3. **The stance: demanding and warm.** Warm-demanding beats "tiger" on the child's own grades *and* wellbeing; the harm comes from control and warmth-that-depends-on-results, not from high standards. Honest note: parenting-style effects on grades are small, so we lean on this for wellbeing and durable motivation, not as a big grades lever. [Kim 2013; Assor 2004; Pinquart 2016; Grolnick & Pomerantz 2009]
4. **Let it become theirs (motivation).** The goal has to become the child's own (harmonious, not obsessive, passion) through autonomy support. And **be careful with rewards on something they already like**: expected, contingent prizes and streaks tend to undermine real interest, and the effect is worse in young children. Honest limit: this is debated (rewards can help *start* a genuinely low-interest task), and sincere, specific praise for the process is fine; it is *contingent prizes on the thing they already love* that backfire. [Vallerand 2003; Ryan & Deci 2000; Deci/Koestner/Ryan 1999; Lepper 1973; Warneken & Tomasello 2008; Cameron/Banko/Pierce 2001 (the dissent)]
5. **Push the challenge, not the child (pressure).** Two separate dials. Keep difficulty in the "hard but doable" zone (roughly 85% success), and when they strain, turn *pressure* down before you lower the *challenge*. When stakes rise, add *more* freedom and less evaluation, the opposite of the adult reflex. Sustained achievement pressure is now a top adolescent-health risk. [Wilson 2019; Wood 1976; Bartholomew 2011; Mageau 2009; Grolnick & Pomerantz 2009; Luthar 2020]

**Part 2 — How to actually read your child (the signal).** *(New; this is the operational heart of our whole system.)*
6. **Interest is built, not found.** You do not wait to discover a pre-existing passion; you manufacture the conditions for one through repeated, varied exposure, and interest deepens in phases. Treat "I'm not a math person" as a hard patch to scaffold, not a verdict. [Hidi & Renninger 2006; O'Keefe/Dweck/Walton 2018]
7. **Trust what they come back to, not what they say.** Stated interest predicts behavior only weakly; the real signal is **voluntary return after the novelty fades** and after you stop prompting. Watch what they choose unprompted, not what they (or you) claim. [Nye et al. 2012; Harackiewicz et al. 2008]
8. **How do you know it's working, without grades?** Because we never score the passion, "working" is not a number. It is three behavioral things: they keep coming back on their own, they go **deeper** over time, and at least once they **pushed past a failure and made something**. That last one (iteration past a wall) is the signal that a light interest is becoming a real one. Grade the *process*, not the polish. [Nye et al. 2012; Kapur 2008; Sinha & Kapur 2021]

**Part 3 — How talent develops (the ideas behind our coaching).**
9. **What actually makes a "grandmaster."** Drive and an enriched, supportive environment matter more than raw gifts. In Bloom's study of 120 world-class performers, early on "motivation and effort count far more than the particular gifts," and the talent was *developed*, not simply found. The kids who go far show a "rage to master," but that only pays off *inside* a supportive environment; neither drive nor talent alone is enough. One family famously *designed* their home around chess and raised three prodigies (an existence proof). Ability still matters, yet drilling hours explain only a minority of the difference. [Bloom 1985; Winner 1996; Polgar; Macnamara 2014; Robertson/Lubinski/Benbow 2010]
10. **The environment does the quiet work (the "complex" home).** The homes that grow talent are *both* highly supportive *and* highly challenging at once, and they make using the skill feel good (flow). That combination, not pressure, converts ability into sustained development. [Csikszentmihalyi/Rathunde/Whalen 1993]
11. **The mentor is a relay, and outside people matter (you cannot be all of them).** A warm first teacher, then a technical one, then a master, and the most valuable thing each hands over is *the next one* (an introduction, an audition, a door). A big part of your job, and of what our system helps with, is bringing in mentors, near-peers, and community you cannot personally be. [Bloom 1985; Subotnik/Olszewski-Kubilius/Worrell 2011]
12. **The climb is staged.** Fall in love → get precise → make it real for a community → find their own voice. Sample widely and playfully when young, specialize around the mid-teens, save the heavy investment for later adolescence. Progress by *widening the audience*, not piling on hours. [Côté 1999; Subotnik 2011; Renzulli 1977; Bloom 1985]
13. **The real bottleneck is psychosocial skill, and it is teachable.** Goal-setting, quality practice, coping with feedback and pressure, self-advocacy: a curriculum, not a fixed personality, buildable from early on. [MacNamara/Button/Collins 2010; Subotnik 2011]

**Part 4 — What to do (the five moves), made concrete.** From the engine's offers + shared activities, each with an example script and a place in a sample week:
- Open doors, do not assign them (offer access/time/community; they can decline).
- Be a co-learner, not a judge (build nights; "demo nights" where they teach you; visits to see the field).
- Protect their ownership (they choose problem, method, pace).
- Keep it plural and reversible (offer a second, unrelated door; stepping back is allowed).
- Handle logistics, not the outcome (do the driving and the access; do not attach your pride to the result).
Plus a **sample week** (what a warm-demanding week actually looks like in a homeschool) and **swap-these-phrases** examples ("How did it go?" → "What did you try that was tricky?"). [Grolnick & Pomerantz 2009; Mageau 2009; Renzulli 1977]

**Part 5 — What to avoid (the four traps).** A self-check ("what it looks like → do this instead"): over-valuing it; approval that rides on performance; control and hovering; letting one pursuit become their whole identity. [Mageau 2009; Assor 2004]

**Part 6 — The big questions parents actually ask (each answered with research).**
14. **Deep or well-rounded?** A genuine deep spike is what pays, and most children have a real strongest area ("good at everything" is largely a testing illusion). But breadth helps only up to a point (an inverted-U) and skills do not transfer across unrelated fields, so hold **two or three** pursuits early and **narrow by around age 13**. (At the elite-admissions end, a deep differentiated profile tends to beat an equally-credentialed well-rounded one, though that is a strategic bet, not a settled result.) [Achter/Lubinski/Benbow 1996, 1997; Fredricks 2012; Busseri 2006; Sala & Gobet 2017; Côté 1999; Robertson/Lubinski/Benbow 2010; passionBrainlift Category 5 (our bet)]
15. **What if they like nothing, or everything?** "Nothing" means not enough varied exposure yet, so widen the menu and watch for unprompted return; "everything" is usually an unresolved tilt, so keep 2–3 doors open and let real return narrow it. [Hidi & Renninger 2006; Achter/Lubinski/Benbow 1996]
16. **Should I let them quit?** The real danger is *foreclosure* (all-in with no exploration), not switching. The "you've put too much in to stop now" instinct is the adult's bias; young children do not have it. Ask for *effort within the attempt*, never *loyalty to a domain*. A healthy switch is a calm move *toward* something they already return to, after clearing at least one real difficulty. Default to "park," never "quit." [Marcia 1966; Kroger 2010; Sehl 2021/2024/2026; Arkes & Ayton 1999; Credé 2017; Duckworth 2007; O'Keefe/Dweck/Walton 2018]
17. **How much practice, and how much rest?** Practice matters but explains a limited share of performance, so *bounded* practice serving a real project beats endless drilling; and real rest (days off each week, weeks off each year) is part of the plan, not a lapse. [Macnamara 2014; Ericsson 1993; AAP/Brenner 2016]
18. **Am I too late, or pushing too early?** Start early with wide, low-stakes sampling; heavy investment belongs to adolescence. A true "start-before-7" window exists only for music and rhythm/motor skills. [Côté 1999; Watanabe 2007; Steele 2013]
19. **What about screens, games, and rewards for practice?** A screen can be real exposure (game design, music production, coding) or just novelty; judge it by unprompted return and depth, not by the device. Do not turn their interest into a chore with sticker charts or paid practice; keep the passion reward-neutral and let the doing be the reward. [Nye et al. 2012; Deci/Koestner/Ryan 1999]
20. **The other adults: getting the household aligned.** The two-parent advantage runs through *cooperation*, not the certificate, and one adult who quietly disagrees is a standing, measurable risk. Get every adult in the home on the same page (aligned expectations, one posture), at any household size. [Amato 2005; Teubert & Pinquart 2010; Buehler et al. 1997]
21. **When should I get outside help?** Persistent quiet devaluation, loss of sleep or joy, or anything that looks like real distress is a moment to bring in your guide or a professional. This webpage is not a diagnosis and never replaces a human. [Luthar 2020; Coakley 1992]

**Part 7 — When it gets hard.** Short "if this → do this" for the four moments the engine watches (stakes rising, gone quiet, stuck, little shared time), plus the **Family Check-In widget** (§5). [memo 02 signal→action; Raedeke & Smith 2001; Mageau 2009]

**Part 8 — Sources.** "Check it yourself" (§11): every claim above, grouped, with links, plus the honest-limits note.

**Part 9 — Your self-assessment (the "successful parent outline").** A short, printable self-check a parent scores themselves on (stance, the five moves, the four traps, the household-alignment items). This is the concrete "successful parent outline" the manager named, usable in an application, and it opens (in brief) at the top as Part 0.

## 5. The Family Check-In widget (a faithful parent-facing mirror of `assessFamily`)

A small, self-contained interactive block. The parent answers a few plain questions about *right now*; it returns the same warm-demanding read a guide would get. It **reimplements the engine's exact 5-branch priority ladder in vanilla JS**, mirroring `packages/family/src/assess.ts` `decide()` (§5.3), so the page stays one static file with no imports or network.

**Delivery note (deliberate inversion).** The engine is *guide-facing* ("system proposes, human disposes; nothing is auto-sent to a parent"). This widget points the same logic at the parent as a **self-reflection** tool, so to preserve "a human disposes," the two escalating branches (elevated pressure, strain) explicitly tell the parent **"this is a moment to talk to your guide or a trusted professional,"** and the widget never renders a score, label, or verdict.

**Framing (guardrails):** guidance, never a diagnosis, score, or grade. Nothing is stored or sent.

### 5.1 Questions → engine signals (faithful to `model.ts`)

Each is a plain toggle a parent can self-observe. Wording stays **behavioral** (no mind-reading, no affect inference, per our hard refusal).

| Question (plain, behavioral) | Engine signal |
|---|---|
| Is a big test, competition, showcase, or deadline coming up soon? | `anyStakesEvent` |
| Lately are they doing it flatly, canceling, or not sharing it anymore? | `anyDevaluation` |
| Do they seem worn out, or asking for a break? | `anyBackOffOrRest` |
| Is the schedule pushing them *harder* into this even as their interest in it seems to be fading? | `pressuredSpecialization` |
| Is this the only thing they'll do or talk about, with no other live interest? | `overIdentification` |
| Honestly, are you more invested in this than they are? | `parentalOverValuation` |
| Does your warmth or approval shift with how they perform? | `conditionalRegardObserved` |
| Do you catch yourself hovering, correcting, or taking over? | `familyControlObserved` |
| Is there little you actually do together around their interests? | `lowFamilyEngagement` |

### 5.2 Guardrail on the "only thing" question
`overIdentification` in the engine is a *behavioral* proxy (one pursuit dominates), so the question asks about observable behavior ("the only thing they'll do or talk about"), never about the child's inner identity or feelings.

### 5.3 Branch ladder — EXACT mirror of `decide()` (first match wins)

The elevated antecedents must match `assess.ts:85–97` precisely (this was wrong in v1):
- **Elevated pressure** if ANY of: `parentalOverValuation`; `conditionalRegardObserved`; `familyControlObserved`; (`pressuredSpecialization` AND `anyDevaluation`); (`overIdentification` AND `anyStakesEvent`).
  → autonomy support **up**, structure steady, warmth non-contingent, **decouple worth from outcome**, **escalate to a human**. Offers: keep warmth identical before/after; cut evaluative talk; **offer a second unrelated door only if `overIdentification`**; handle logistics only. Message: "talk to your guide or a trusted professional."
- else **Rising stakes** if `anyStakesEvent`.
  → autonomy support **up**, **decouple worth from outcome** (do not omit this), warmth non-contingent, a "watch," not an escalation. Offers: reduce evaluation; handle logistics only; offer access.
- else **Strain** if `anyBackOffOrRest` OR `anyDevaluation`.
  → autonomy support **up**, **escalate to a human**. Offers: a genuinely guilt-free, reversible break; keep access and a regular time available. Message: "a warm, non-evaluative check-in; loop in your guide or a professional if it persists."
- else **Low engagement** if `lowFamilyEngagement`.
  → **structure up** (surface this knob), warmth non-contingent. Offers: a regular low-stakes time and place; shared co-learning (build night, visit, teach-back).
- else **Healthy baseline.**
  → hold steady, warmth non-contingent. Offers: open a door they cannot reach alone; offer a community.

Any invalid/empty input falls back to the healthy baseline (mirrors the engine's safe default). Every result uses the same plain, offer-framed language as the body, and surfaces the posture in words (autonomy support, structure, warmth stays the same).

## 6. Visual direction

Calm, editorial, trustworthy (for parents and for applications; not the kid cartoon or the dark tech theme).
- A **committed warm palette** (a real off-white or a warm brand tone, not the default AI cream), deep ink text, one warm accent used sparingly.
- Type: a serif for headings paired with a clean sans for body, or one strong family in weights. Reading measure 65–75ch, generous whitespace, clear section rhythm.
- Restraint: light cards only where they earn it (the traps self-check, the widget, the self-assessment). No gradient text, no glassmorphism.
- **Print-friendly** (Part 0 + Part 9 print as a clean two-page handout).
- **Accessible:** WCAG AA contrast, semantic HTML, keyboard-operable widget, `prefers-reduced-motion` respected.

## 7. Tech and delivery

- **One file:** `parent-guide/index.html`, self-contained: inline `<style>`, semantic HTML, a small inline `<script>` for the widget only.
- **No external fetches** (system font stack, no CDN, no analytics), **no build step**, **no backend**. Opens by double-click; hostable or emailable as-is.
- The widget is a vanilla-JS mirror of `decide()`; all prose is readable with JS disabled; only the widget needs JS.
- A **sticky in-page table of contents** keeps the long page navigable; the same anchors let each body claim link to its Sources entry.

## 8. Out of scope (YAGNI)

- No live import of `@gt100k/family` (the widget mirrors the branch logic to stay one portable file).
- No backend, persistence, per-child/real data, theme switcher, or multi-page site.
- No connection to the kid platform or the guide console.
- No new engine logic: the widget only re-expresses the existing 5 branches.

## 9. Success criteria

- A parent with no background reads it and can state the stance, name two moves, catch one trap, and knows how to tell it is working *without* a grade.
- **The widget is an exact mirror of `decide()`:** for a representative set of signal combinations, the widget's branch equals `assessFamily`'s branch (a small golden check against `assess.ts` at build). The v1 divergences (dropped `pressuredSpecialization`; an invented "worn-out + event" trigger; missing `decouple` on rising stakes; missing `structure` knob) are fixed.
- The two escalating branches route the parent to a human; the widget never shows a score/label/verdict.
- It opens by double-click with no network, prints cleanly (Part 0 + Part 9), and passes AA contrast.
- **Every strong claim has an inline citation** resolving to a working §11 link; a skeptical parent verifies any claim in about two clicks. Overclaims are scoped honestly (the home/IQ evidence is deprivation/childhood-scoped; reward-undermining notes the dissent; parenting effects are small; admissions edge is a bet).
- It covers the full topic set: reading the child (interest built + voluntary return + "working without grades"), motivation, pressure, parenting, the whole household, how talent develops, specialization, well-roundedness, quitting/switching, timing, screens/rewards, and when to get outside help.
- It works for **applicants and admitted** families, and produces a usable **self-assessment outline**.
- No em-dashes; no score/label/reward; warmth never framed as conditional.

## 10. Grounding references

- Engine: `passion/packages/family/src/{model,assess,derive}.ts`; console surface: `passion/apps/guide-console/app/{family.ts,family-panel.tsx}`; engine spec `specs/019-family-coengagement/spec.md`.
- Research: `docs/research/{familyBrainlift,passionBrainlift,gtBrainlift}.md`; `docs/research/passion-pipeline/{01-interest-consolidation-graduation,02-push-vs-backoff-burnout,03-talent-development-spine,04-reversibility-plurality-switching,05-assessment-measurement}.md`.
- PRDs: `docs/prd/{DISCOVERY-APP-PRD,SPECIALIZATION-PIPELINE-PRD}.md`.

## 11. Sources the page must cite (claim → source → link)

Grouped to match the chapters; rendered as a "Check it yourself" section with links. **Honest-limits note (also shown on the page):** much of the passion/burnout evidence is adolescent-weighted; parenting-style effects on grades are small; the strongest home-environment effects are scoped to deprivation/childhood achievement, not an adult IQ ceiling; reward-undermining is contested (Cameron/Banko/Pierce); and the elite-admissions edge for a deep spike is a strategic bet, not a proven result. We state limits rather than overclaim. (Any DOI is verified to resolve at build.)

**Reading the child (interest + the signal)**
- Interest develops in phases; it is built, not just found — Hidi & Renninger (2006). https://doi.org/10.1207/s15326985ep4102_4
- Stated interest predicts behavior only weakly; watch behavior — Nye, Su, Rounds & Drasgow (2012). https://doi.org/10.1177/1745691612449021
- Interest and its development predict achievement — Harackiewicz et al. (2008). https://doi.org/10.1037/0022-0663.100.1.105
- "Develop your interest" beats "find your passion" — O'Keefe, Dweck & Walton (2018). https://doi.org/10.1177/0956797618780643
- Grade the process; productive failure — Kapur (2008) https://doi.org/10.1080/07370000802212669 ; Sinha & Kapur (2021) https://doi.org/10.3102/00346543211019105

**The home is the lever (scoped honestly)**
- Parents' expectations predict *gains* — Pinquart & Ebeling (2020). https://doi.org/10.1007/s10648-019-09506-z
- Communicating expectations/strategy beats monitoring — Hill & Tyson (2009). https://doi.org/10.1037/a0015362
- Aspiration is the strongest involvement component — Fan & Chen (2001). https://doi.org/10.1023/A:1009048817385
- Rearing environment moves childhood outcomes where environments differ a lot (adoption) — Capron & Duyme (1989). https://doi.org/10.1038/340552a0
- Environment matters most under deprivation — Turkheimer et al. (2003). https://doi.org/10.1046/j.0956-7976.2003.psci_1475.x

**Warm-demanding, not tiger**
- Supportive beats tiger on grades *and* wellbeing — Kim et al. (2013). https://doi.org/10.1037/a0030612
- Authoritative/warmth/autonomy positive; harsh/psychological control negative (effects small) — Pinquart (2016). https://doi.org/10.1007/s10648-015-9338-y
- Structure is not control — Grolnick & Pomerantz (2009). https://doi.org/10.1111/j.1750-8606.2009.00099.x
- The emotional costs of conditional regard — Assor, Roth & Deci (2004). https://doi.org/10.1111/j.0022-3506.2004.00256.x
- Achievement pressure is a top adolescent-health risk — Luthar, Kumar & Zillmer (2020). https://doi.org/10.1037/amp0000556
- Conscientiousness (not "grit" as a separate thing) predicts achievement — Poropat (2009). https://doi.org/10.1037/a0014996

**Motivation (let it become theirs; be careful with rewards)**
- Self-Determination Theory — Ryan & Deci (2000). https://doi.org/10.1037/0003-066X.55.1.68
- Harmonious vs obsessive passion — Vallerand et al. (2003). https://doi.org/10.1037/0022-3514.85.4.756
- Passion antecedents (autonomy support vs over-valuation/pressured specialization) — Mageau et al. (2009). https://doi.org/10.1111/j.1467-6494.2009.00559.x
- Rewards undermine intrinsic motivation, worse in children — Deci, Koestner & Ryan (1999). https://doi.org/10.1037/0033-2909.125.6.627
- The classic child demonstration — Lepper, Greene & Nisbett (1973). https://doi.org/10.1037/h0035519
- Even toddlers; praise did not undermine — Warneken & Tomasello (2008). https://doi.org/10.1037/a0013860
- The dissent (rewards can help start a low-interest task) — Cameron, Banko & Pierce (2001). https://doi.org/10.1007/BF03392017

**Pressure (push the challenge, not the child)**
- Control leads to burnout, separately from difficulty — Bartholomew et al. (2011). https://doi.org/10.1177/0146167211413125
- ~85% success is the optimal-difficulty sweet spot — Wilson et al. (2019). https://doi.org/10.1038/s41467-019-12552-4
- Scaffolding / zone of proximal development — Wood, Bruner & Ross (1976). https://doi.org/10.1111/j.1469-7610.1976.tb00381.x

**Burnout (catch quiet devaluation)**
- The three-part burnout measure incl. devaluation — Raedeke & Smith (2001). https://doi.org/10.1123/jsep.23.4.281
- Burnout predicts dropout years later — Isoard-Gautheur et al. (2016). https://doi.org/10.1123/tsp.2014-0140
- Burnout as constrained identity and control — Coakley (1992). https://doi.org/10.1123/ssj.9.3.271
- A participation gap is multi-causal — Crane & Temple (2015). https://doi.org/10.1177/1356336X14555294

**Practice and rest**
- Deliberate practice explains a limited share of performance — Macnamara, Hambrick & Oswald (2014). https://doi.org/10.1177/0956797614535810
- Deliberate practice is effortful and, for a child, externally scaffolded — Ericsson, Krampe & Tesch-Römer (1993). https://doi.org/10.1037/0033-295X.100.3.363
- Rest cadence for young people — Brenner & AAP Council on Sports Medicine and Fitness (2016). https://doi.org/10.1542/peds.2016-2148

**Deep vs well-rounded**
- "Multipotentiality" is largely a testing artifact — Achter, Lubinski & Benbow (1996) https://doi.org/10.1037/0022-0167.43.1.65 ; (1997) https://doi.org/10.1177/001698629704100102
- Breadth helps on an inverted-U — Fredricks (2012) https://doi.org/10.1007/s10964-011-9704-0 ; Busseri et al. (2006) https://doi.org/10.1037/0012-1649.42.6.1313
- Skills do not transfer across unrelated domains — Sala & Gobet (2017). https://doi.org/10.1177/0963721417712760
- Sample early, specialize later — Côté (1999). https://doi.org/10.1123/tsp.13.4.395
- More ability keeps paying even among the gifted — Robertson, Smeets, Lubinski & Benbow (2010). https://doi.org/10.1177/0963721410391442

**Quitting and switching**
- Foreclosure is the hazard — Marcia (1966) https://doi.org/10.1037/h0023281 ; Kroger, Martinussen & Marcia (2010) https://doi.org/10.1016/j.adolescence.2009.11.002
- Sunk-cost bias is learned with age; young kids lack it — Sehl, Friedman & Denison (2021) https://doi.org/10.1111/cogs.13063 ; Arkes & Ayton (1999) https://doi.org/10.1037/0033-2909.125.5.591
- Effort, not consistency-of-interest, carries "grit" — Credé, Tynan & Harms (2017) https://doi.org/10.1037/pspp0000102 ; Duckworth et al. (2007) https://doi.org/10.1037/0022-3514.92.6.1087

**Timing / sensitive periods**
- A music/motor sensitive period before ~7 — Watanabe, Savion-Lemieux & Penhune (2007) https://doi.org/10.1007/s00221-006-0619-z ; Steele et al. (2013) https://doi.org/10.1523/JNEUROSCI.3578-12.2013

**The whole household**
- Coparenting agreement predicts child adjustment — Teubert & Pinquart (2010). https://doi.org/10.1080/15295192.2010.492040
- Interparental conflict predicts youth problems — Buehler et al. (1997). https://doi.org/10.1023/A:1025006909538
- The two-parent advantage runs through process, not structure — Amato (2005). https://doi.org/10.1353/foc.2005.0012

**How talent actually develops (grandmasters, environment, mentors)**
- Talent is developed; "drive, not talent"; the three-teacher relay — Bloom (1985), *Developing Talent in Young People*. https://www.penguinrandomhouse.com/books/15009/developing-talent-in-young-people-by-benjamin-bloom/
- The "rage to master" needs an enriched environment — Winner (1996); Winner & Drake (2018). https://www.journalofexpertise.org/articles/JoE_2018_1_1_Winner_Drake_Apr10.pdf
- Talent-development megamodel; psychosocial skills as the stage-transition determinant — Subotnik, Olszewski-Kubilius & Worrell (2011). https://doi.org/10.1177/1529100611418056
- The "complex" (high-support + high-challenge) home and flow — Csikszentmihalyi, Rathunde & Whalen (1993). https://archive.org/details/talentedteenager0000csik_v3s4
- Progress by widening the audience (authentic-project model) — Renzulli (1977). https://gifted.uconn.edu/schoolwide-enrichment-model/the-enrichment-triad-model/
- Psychosocial skills are a teachable curriculum (PCDEs) — MacNamara, Button & Collins (2010). https://doi.org/10.1123/tsp.24.1.52
- A designed home that produced three chess prodigies (existence proof) — Polgar, *Raise a Genius!* (documented in `docs/research/familyBrainlift.md`).
