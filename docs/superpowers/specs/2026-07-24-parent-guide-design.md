# Design: The Warm-Demanding Parent Playbook (parent-guide)

**Date:** 2026-07-24
**Status:** Draft (approved in brainstorming; pending written-spec review)
**Owners:** us (the parent/guide side of GT 100k). Teammate owns the kid platform.

## 1. Why this exists

Manager's framing:
- **MVP #2:** a guide for homeschool parents to make sure their kids are set up for success.
- **Long term:** an "outline of the successful parent" we can reuse for applications, guides, and onboarding.

This is the first artifact on the parent/guide side. It consolidates three things we already have into one plain-language, parent-facing page:

1. **The family-coaching engine** (`@gt100k/family`, spec 019): a pure decision engine that turns per-child signals into a **warm-demanding coaching read** (posture + door-opening offers + shared activities + a family-driven-pressure watch), guide-facing, "system proposes, human disposes."
2. **The brainlift** (`docs/research/familyBrainlift.md`, "Select the Family, Not the Child"): the thesis that the **family is the lever** that converts a child's ceiling into real achievement, and the successful parent is warm-demanding, autonomy-supportive, non-contingent, whole-household-committed. Harm runs specifically through **contingent self-worth and control**.
3. **The research memos** (`docs/research/passion-pipeline/*`): decouple worth from outcome, back off pressure before difficulty, keep pursuits plural and reversible.

In GT 100k the homeschool parents *are* the educators, so the guide-facing wisdom in our engine is exactly what a parent needs pointed at them directly. This page is that wisdom, made readable and usable by a parent, and it stands alone as the "successful parent outline."

## 2. Audience, voice, purpose

- **Reader:** a committed homeschool parent in (or applying to) GT 100k.
- **Job:** they read it and (a) understand the one stance that matters, (b) get concrete moves they can start this week, (c) can catch the traps in themselves, and (d) know what to do in the hard moments. It doubles as a credibility/application artifact.
- **Voice:** warm, direct, second person ("you"), plain language. We **translate the jargon** ("warm-demanding" → "demanding and warm at the same time"; "non-contingent warmth" → "your warmth never depends on how it goes"; "autonomy support" → "they keep choosing"). Honest about the risk, never preachy. **No em-dashes** in the copy.
- **Guardrails carried from the engine:** no score, no label, no reward/gamification anywhere; the page proposes, the parent decides; warmth is never presented as conditional.

## 3. Approach (chosen)

**A + widget:** a single self-contained static HTML page (the playbook), plus a small interactive **Family Check-In** widget that mirrors the engine. Rejected alternatives: playbook-only (loses the "explain our engine" value the manager wants), and a dense one-pager (too terse to change behavior). The interactive engine-in-the-console version is out of scope; the widget is a self-contained JS mirror, not a live import.

## 4. Content spine (the page, top to bottom)

The page is a set of short, plain-language **chapters**. **Every strong claim carries an inline, checkable citation** (author, year), and the **Sources** section (§11) lists each with a working link, so a parent can confirm nothing here is invented. A sticky in-page table of contents lets them jump around. Chapters stay tight (a few sentences each) so the whole thing stays scannable.

**Part 1 — Why (the case).**
1. **The one idea (hero).** "You are your child's biggest advantage. Handled wrong, you are also the biggest risk. The whole difference is *how*." [Pinquart & Ebeling 2020; Kim 2013]
2. **Why the home matters, not just genes.** The engaged, autonomy-supportive home converts a child's ceiling into real achievement; adoption and income studies move measured outcomes by double digits where environments differ, and parents' expectations predict *gains*, not just current levels. [Capron & Duyme 1989; Turkheimer 2003; Pinquart & Ebeling 2020; Hill & Tyson 2009]
3. **The stance: demanding and warm.** Warm-demanding beats "tiger" on the child's own grades *and* wellbeing; the harm comes from control and warmth-that-depends-on-results, not from high standards. [Kim 2013; Assor 2004; Pinquart 2016; Grolnick & Pomerantz 2009]
4. **Let it become theirs (motivation).** The goal must become the child's own (harmonious, not obsessive, passion) through autonomy support. And **do not bribe the passion**: rewards, streaks, and prizes reliably undermine real interest, and the effect is *worse* in young children. Sincere, specific praise for the process is fine; contingent prizes are not. [Vallerand 2003; Ryan & Deci 2000; Deci/Koestner/Ryan 1999; Lepper 1973; Warneken & Tomasello 2008]
5. **Push the challenge, not the child (pressure).** Two separate dials. Keep difficulty in the "hard but doable" zone (roughly 85% success), and when they strain, turn *pressure* down before you lower the *challenge*. When stakes rise, add *more* freedom and less evaluation, the opposite of the adult reflex. Sustained achievement pressure is now a top adolescent-health risk. [Wilson 2019; Wood 1976; Bartholomew 2011; Mageau 2009; Grolnick & Pomerantz 2009; Luthar 2020]

**Part 2 — What to do (the five moves).** From the engine's offers + shared activities: open doors do not assign them; be a co-learner not a judge; protect their ownership (they choose problem, method, pace); keep it plural and reversible; handle logistics, not the outcome. [Grolnick & Pomerantz 2009; Mageau 2009]

**Part 3 — What to avoid (the four traps).** The engine's pressure antecedents as a self-check ("what it looks like → do this instead"): over-valuing it; approval that rides on performance; control and hovering; tying their whole identity to one thing. [Mageau 2009; Assor 2004]

**Part 4 — How talent actually develops (the ideas behind our coaching).** This is the "why it works" layer, and it is exactly the thinking baked into the engine's recommendations.
6. **What actually makes a "grandmaster."** Drive and an enriched, supportive environment matter more than raw gifts. In Bloom's study of 120 world-class performers, early on "motivation and effort count far more than the particular gifts," and the talent was *developed*, not simply found. The kids who go far show a "rage to master" (an intrinsic, near-obsessive pull), but that only pays off *inside* a supportive environment; neither the drive nor the talent alone is enough. One family famously *designed* their home around chess and produced three prodigies, an existence proof that environment can convert potential into elite performance. Ability still matters and keeps mattering, yet hours of drilling explain only a minority of the difference (most in games like chess, least in academics). [Bloom 1985; Winner 1996; Polgar; Macnamara 2014; Robertson/Lubinski/Benbow 2010]
7. **The environment does the quiet work (the "complex" home).** The homes that grow talent are *both* highly supportive *and* highly challenging at the same time, and they make using the skill feel good (flow). That combination, not pressure, is what turns ability into sustained development. [Csikszentmihalyi/Rathunde/Whalen 1993; Capron & Duyme 1989; Turkheimer 2003]
8. **The mentor is a relay, and outside people matter (you cannot be all of them).** No single coach carries a child the whole way. It is a sequence: a warm first teacher who makes them fall in love, a technical teacher who builds precision, then a master who shapes their voice, and the most valuable thing each hands over is *the next one* (an introduction, an audition, a door). A big part of your job, and of what our system helps with, is bringing in mentors, near-peers, and community you cannot personally be. [Bloom 1985; Subotnik/Olszewski-Kubilius/Worrell 2011]
9. **The climb is staged.** Fall in love → get precise → make it real for a community → find your own voice. Sample widely and playfully when young, specialize around the mid-teens, and save the heavy investment for later adolescence. Progress by *widening the audience* (from you, to peers, to a real community, to the field), not by piling on hours; each real project is the unit of growth. [Côté 1999; Subotnik 2011; Renzulli 1977; Bloom 1985]
10. **The real bottleneck is psychosocial skill, and it is teachable.** What separates strong developers is not only talent but skills like setting goals, practicing with quality, coping with feedback and pressure, and self-advocacy. These are a curriculum, not a fixed personality, and they can be built from early on. [MacNamara/Button/Collins 2010; Subotnik 2011]

**Part 5 — The big questions parents actually ask (each answered with research).**
11. **How much practice, and how much rest?** Practice matters but explains a limited share of performance, so *bounded* practice serving a real project beats endless drilling; and real rest (days off each week, weeks off each year) is part of the plan, not a lapse. [Macnamara 2014; Ericsson 1993; AAP/Brenner 2016]
12. **Deep or well-rounded?** A genuine deep spike is what pays, and most children have a real strongest area ("good at everything" is largely a testing illusion). But breadth helps only up to a point (an inverted-U), and skills do not transfer across unrelated fields, so hold about **two or three** pursuits early and **narrow by around age 13**. Sample widely early, specialize later. [Achter/Lubinski/Benbow 1996, 1997; Fredricks 2012; Busseri 2006; Sala & Gobet 2017; Côté 1999; Robertson/Lubinski/Benbow 2010]
13. **Should I let them quit?** The real danger is *foreclosure* (all-in with no exploration), not switching. The "you've put too much in to stop now" instinct is the adult's bias; young children do not have it. Ask for *effort within the attempt*, never *loyalty to a domain*. A healthy switch is a calm move *toward* something they already return to, made *after* clearing at least one real difficulty. Default to "park," never "quit." [Marcia 1966; Kroger 2010; Sehl 2021/2024/2026; Arkes & Ayton 1999; Credé 2017; Duckworth 2007; O'Keefe/Dweck/Walton 2018]
14. **Am I too late, or pushing too early?** Start early with wide, low-stakes sampling; the heavy investment years are adolescence, not childhood. A true "start-before-7" window exists only for music and other rhythm/motor skills. [Côté 1999; Watanabe 2007; Steele 2013]

**Part 6 — When it gets hard.** Short "if this → do this" for the four moments the engine watches (stakes rising, gone quiet, stuck, little shared time), plus the **Family Check-In widget** (§5). [memo 02 signal→action; Raedeke & Smith 2001; Mageau 2009]

**Part 7 — Sources.** "Check it yourself" (§11): every claim above, grouped, with links.

**Part 8 — The one-page summary.** A printable "fridge version" (the stance, the five moves, the four traps, and the big-question answers in a line each). This IS the "successful parent outline."

## 5. The Family Check-In widget (a parent-facing mirror of `assessFamily`)

A small, self-contained interactive block. The parent answers a few plain yes/no questions about *right now*; it returns the same warm-demanding read a guide would get. It **reimplements the engine's tiny 5-branch priority ladder in vanilla JS** (a faithful mirror of `packages/family/src/assess.ts`), so the page stays one static file with no imports or network.

**Framing (guardrails):** it is guidance, never a diagnosis, score, or grade. It says "here is what tends to help right now" and "these are moments to consider a break or talk to your guide." Nothing is stored or sent.

**Questions → engine signals** (each a simple toggle the parent can self-observe):

| Question (plain) | Engine signal |
|---|---|
| Is a big test, competition, showcase, or deadline coming up soon? | `anyStakesEvent` |
| Have they gone quiet lately (doing it flatly, canceling, not sharing it)? | `anyDevaluation` |
| Do they seem worn out or in need of a break? | `anyBackOffOrRest` |
| Honestly, are you more invested in this than they are? | `parentalOverValuation` |
| Does your warmth or approval shift with how they perform? | `conditionalRegardObserved` |
| Do you catch yourself hovering, correcting, or taking over? | `familyControlObserved` |
| Is their whole sense of self riding on this one thing? | `overIdentification` |
| Is there little you do together around their interests? | `lowFamilyEngagement` |

**Branch ladder (mirror of `decide()`), first match wins:**
1. **Elevated pressure** if any of: over-valuation, conditional regard, control, (worn-out/quiet **and** a big event), (whole-identity **and** a big event). → *Result:* "Ease the pressure, keep the warmth." Autonomy up, warmth non-contingent, decouple worth from outcome; offers = keep warmth identical before/after, cut evaluative talk, (offer a second door if identity is over-invested), handle logistics only. Plus: "this is a good moment to talk to your guide."
2. **Rising stakes** if a big event is coming. → "Counter-cyclically ease off." Reduce evaluation, do logistics only, offer access. Warmth non-contingent.
3. **Strain** if worn-out/needs a break or gone quiet. → "A warm check-in and a real option to pause." Offer a guilt-free reversible break, keep access/structure available; "consider looping in your guide."
4. **Low engagement** if little shared time. → "Build the shared environment." Offer a regular low-stakes time/place, shared co-learning activities.
5. **Healthy** otherwise. → "Keep doing what you are doing." Non-contingent warmth, open doors, offer a community.

Every result is expressed in the same plain, offer-framed language as the playbook body (reusing the engine's ask/activity copy, de-jargoned).

## 6. Visual direction

Calm, editorial, trustworthy (this is for parents and for applications, not the kid cartoon or the dark tech theme).
- A **committed warm palette** (a real off-white or a warm brand tone, not the default AI cream), deep ink text, one warm accent used sparingly.
- Type: a serif for headings paired with a clean sans for body (contrast pairing), or one strong family in multiple weights. Comfortable reading measure (65–75ch), generous whitespace, clear section rhythm.
- Restraint: rules and light cards only where they earn it (the traps self-check, the widget, the summary). No decorative gradient text, no glassmorphism.
- **Print-friendly** (the summary works as a handout).
- **Accessible:** WCAG AA contrast, semantic HTML (`header`/`section`/`h1..h3`), keyboard-operable widget, `prefers-reduced-motion` respected.

## 7. Tech and delivery

- **One file:** `parent-guide/index.html`, self-contained: inline `<style>`, semantic HTML, a small inline `<script>` for the widget only.
- **No external fetches** (system font stack, no CDN, no analytics), **no build step**, **no backend**. Opens by double-click; hostable or emailable as-is.
- The widget logic is a vanilla-JS mirror of the 5-branch ladder; the page is fully usable (all content readable) with JS disabled, and only the widget requires JS.
- A **sticky in-page table of contents** (anchor links) keeps the longer page navigable, and the same anchors let each body claim link straight to its Sources entry. Still no external fetch.

## 8. Out of scope (YAGNI)

- No live import of `@gt100k/family` (the widget mirrors the branch logic to stay a single portable file).
- No backend, no persistence, no per-child or real data, no theme switcher, no multi-page site.
- No connection to the kid platform or the guide console.
- No new engine logic: the widget only re-expresses the existing 5 branches.

## 9. Success criteria

- A parent with no background reads it and can state the stance, name two moves, and catch one trap in themselves.
- The Family Check-In returns the correct branch for each of the five situations (verifiable against `assess.ts` logic).
- It opens correctly by double-click with no network, prints cleanly, and passes AA contrast.
- **Every strong claim in the body has an inline citation** that resolves to an entry in §11 Sources, and every Sources link works. A skeptical parent can verify any claim in about two clicks. This is the bar that makes it credible for an application, and it holds us to the same rigor as the brainlift.
- It covers the full topic set the manager named: motivation, pressure, parenting, specialization, well-roundedness (breadth vs depth), quitting/switching, timing, and **how talent actually develops** (drive vs raw talent, the "complex" environment, the mentor relay and outside influence, the staged climb, and psychosocial skills), each backed by research.
- No em-dashes, no score/label/reward anywhere, warmth never framed as conditional.

## 10. Grounding references

- Engine: `passion/packages/family/src/{model,assess,derive}.ts`; console surface: `passion/apps/guide-console/app/{family.ts,family-panel.tsx}`.
- Research: `docs/research/familyBrainlift.md`; `docs/research/passion-pipeline/{02-push-vs-backoff-burnout,03-talent-development-spine,04-reversibility-plurality-switching}.md`.
- Spec of the engine: `specs/019-family-coengagement/spec.md`.

## 11. Sources the page must cite (claim → source → link)

Grouped to match the chapters. The page renders these as a "Check it yourself" section with clickable links, and each body claim links to its entry. All links are DOIs or stable records. An honest note appears on the page too: much of the passion/burnout evidence is adolescent-weighted and some parenting effects are small, so we state limits rather than overclaim (this mirrors the brainlift's own honesty).

**The home is the lever**
- Parents' expectations predict *gains*, not just levels — Pinquart & Ebeling (2020). https://doi.org/10.1007/s10648-019-09506-z
- Communicating expectations/strategy beats monitoring — Hill & Tyson (2009). https://doi.org/10.1037/a0015362
- Aspiration is the strongest involvement component — Fan & Chen (2001). https://doi.org/10.1023/A:1009048817385
- Rearing environment moves childhood outcomes where environments differ — Capron & Duyme (1989). https://doi.org/10.1038/340552a0
- Environment matters most where it has room to — Turkheimer et al. (2003). https://doi.org/10.1046/j.0956-7976.2003.psci_1475.x

**Warm-demanding, not tiger**
- Supportive beats tiger on grades *and* wellbeing (8-yr longitudinal) — Kim et al. (2013). https://doi.org/10.1037/a0030612
- Authoritative/warmth/autonomy positive; harsh/psychological control negative — Pinquart (2016). https://doi.org/10.1007/s10648-015-9338-y
- Structure is not control — Grolnick & Pomerantz (2009). https://doi.org/10.1111/j.1750-8606.2009.00099.x
- The emotional costs of conditional regard — Assor, Roth & Deci (2004). https://doi.org/10.1111/j.0022-3506.2004.00256.x
- Achievement pressure is a top adolescent-health risk — Luthar, Kumar & Zillmer (2020). https://doi.org/10.1037/amp0000556

**Motivation (let it become theirs; do not bribe it)**
- Self-Determination Theory — Ryan & Deci (2000). https://doi.org/10.1037/0003-066X.55.1.68
- Harmonious vs obsessive passion — Vallerand et al. (2003). https://doi.org/10.1037/0022-3514.85.4.756
- Passion antecedents (autonomy support vs over-valuation/pressured specialization) — Mageau et al. (2009). https://doi.org/10.1111/j.1467-6494.2009.00559.x
- Rewards undermine intrinsic motivation, worse in children — Deci, Koestner & Ryan (1999). https://doi.org/10.1037/0033-2909.125.6.627
- The classic child demonstration — Lepper, Greene & Nisbett (1973). https://doi.org/10.1037/h0035519
- Even toddlers, and praise did not undermine — Warneken & Tomasello (2008). https://doi.org/10.1037/a0013860

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
- Rest cadence for young people — Brenner & AAP Council on Sports Medicine and Fitness (2016). https://doi.org/10.1542/peds.2016-2148

**Deep vs well-rounded**
- "Multipotentiality" is largely a testing artifact; most gifted kids have a real tilt — Achter, Lubinski & Benbow (1996) https://doi.org/10.1037/0022-0167.43.1.65 ; (1997) https://doi.org/10.1177/001698629704100102
- Breadth helps on an inverted-U — Fredricks (2012) https://doi.org/10.1007/s10964-011-9704-0 ; Busseri et al. (2006) https://doi.org/10.1037/0012-1649.42.6.1313
- Skills do not transfer across unrelated domains — Sala & Gobet (2017). https://doi.org/10.1177/0963721417712760
- Sample early, specialize later — Côté (1999). https://doi.org/10.1123/tsp.13.4.395
- More ability keeps paying even among the gifted — Robertson, Smeets, Lubinski & Benbow (2010). https://doi.org/10.1177/0963721410391442

**Quitting and switching**
- Foreclosure (commitment without exploration) is the hazard — Marcia (1966) https://doi.org/10.1037/h0023281 ; Kroger, Martinussen & Marcia (2010) https://doi.org/10.1016/j.adolescence.2009.11.002
- Sunk-cost bias is learned with age; young kids lack it — Sehl, Friedman & Denison (2021) https://doi.org/10.1111/cogs.13063 ; Arkes & Ayton (1999) https://doi.org/10.1037/0033-2909.125.5.591
- Effort, not consistency-of-interest, carries "grit" — Credé, Tynan & Harms (2017) https://doi.org/10.1037/pspp0000102 ; Duckworth et al. (2007) https://doi.org/10.1037/0022-3514.92.6.1087
- "Develop your interest" beats "find your passion" — O'Keefe, Dweck & Walton (2018). https://doi.org/10.1177/0956797618780643

**Timing / sensitive periods**
- A music/motor sensitive period before ~7 — Watanabe, Savion-Lemieux & Penhune (2007) https://doi.org/10.1007/s00221-006-0619-z ; Steele et al. (2013) https://doi.org/10.1523/JNEUROSCI.3578-12.2013

**Whole household (context)**
- Coparenting agreement predicts child adjustment — Teubert & Pinquart (2010). https://doi.org/10.1080/15295192.2010.492040
- The two-parent advantage runs through process, not structure — Amato (2005). https://doi.org/10.1353/foc.2005.0012

**How talent actually develops (grandmasters, environment, mentors)**
- Talent is developed; "drive, not talent"; the three-teacher relay — Bloom (1985), *Developing Talent in Young People*. https://www.penguinrandomhouse.com/books/15009/developing-talent-in-young-people-by-benjamin-bloom/
- The "rage to master" needs an enriched environment (both, not either) — Winner (1996); Winner & Drake (2018). https://www.journalofexpertise.org/articles/JoE_2018_1_1_Winner_Drake_Apr10.pdf
- Talent-development megamodel; psychosocial skills as the stage-transition determinant — Subotnik, Olszewski-Kubilius & Worrell (2011). https://doi.org/10.1177/1529100611418056
- The "complex" (high-support + high-challenge) home and flow — Csikszentmihalyi, Rathunde & Whalen (1993). https://archive.org/details/talentedteenager0000csik_v3s4
- Deliberate practice is effortful and, for a child, externally scaffolded — Ericsson, Krampe & Tesch-Römer (1993). https://doi.org/10.1037/0033-295X.100.3.363
- Progress by widening the audience (the authentic-project model) — Renzulli (1977). https://gifted.uconn.edu/schoolwide-enrichment-model/the-enrichment-triad-model/
- Psychosocial skills are a teachable curriculum (PCDEs) — MacNamara, Button & Collins (2010). https://doi.org/10.1123/tsp.24.1.52
- A designed home that produced three chess prodigies (existence proof) — Polgar, *Raise a Genius!* (documented in `docs/research/familyBrainlift.md`).
