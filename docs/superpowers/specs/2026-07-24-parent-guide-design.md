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

1. **The one idea (hero).** "You are your child's biggest advantage. Handled wrong, you are also the biggest risk. The whole difference is *how*." One-line promise; soft scroll cue.
2. **The stance: demanding and warm.** High expectations plus warmth that never depends on results. What it is, what it is not (the "tiger" trap: cold control underperforms warm-demanding on the child's own grades). The child owns the goal, so it becomes theirs instead of something done to them.
3. **The five moves** (from the engine's asks + shared activities):
   - Open doors, do not assign them. Offer access, a time and place, a community; the child can decline.
   - Be a co-learner, not a judge. Shared build/make evenings, "demo nights" where the child teaches you, visits to see the field.
   - Protect their ownership. They keep choosing the problem, the method, and the pace.
   - Keep it plural and reversible. Offer a second, unrelated door; stepping back is a legitimate outcome, not a failure.
   - Handle logistics, not the outcome. Do the access and the driving; do not attach your pride to the result.
4. **The four traps** (the engine's pressure antecedents, as a self-check). Each is "what it looks like → do this instead":
   - Over-valuing it (you are more invested than they are).
   - Approval that rides on performance (your warmth shifts with results).
   - Control and hovering (correcting, taking over, surveillance).
   - Tying their whole identity to one thing (over-identification).
5. **When it gets hard** (mirrors the engine's branches) — short "if this → do this":
   - A big event is coming (stakes rising): dial *down* pressure and evaluation, not warmth; the counter-cyclical move.
   - They have gone quiet (devaluation): a warm, non-evaluative check-in; a guilt-free, reversible break is a real option; consider looping in your guide.
   - They are stuck (over-challenged): normalize the struggle, rebuild small wins.
   - Little shared time (low engagement): build the shared, high-support high-challenge environment.
   - **The Family Check-In widget lives here** (see §5).
6. **Why this works (credibility strip).** Compact, understated, cited: warm-demanding beats "tiger" on the child's own grades (Kim 2013); harm runs through contingent self-worth (Luthar 2020); parental expectations predict *gains*, not just levels (Pinquart & Ebeling 2020; Hill & Tyson 2009); harmonious vs obsessive passion decides whether the goal becomes the child's own (Vallerand 2003; Ryan & Deci 2000). This is the layer that makes the page credible for applications.
7. **The one-page summary.** A printable "fridge version": the stance, the five moves, the four traps, the hard-moment rules. This IS the "successful parent outline."

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

## 8. Out of scope (YAGNI)

- No live import of `@gt100k/family` (the widget mirrors the branch logic to stay a single portable file).
- No backend, no persistence, no per-child or real data, no theme switcher, no multi-page site.
- No connection to the kid platform or the guide console.
- No new engine logic: the widget only re-expresses the existing 5 branches.

## 9. Success criteria

- A parent with no background reads it and can state the stance, name two moves, and catch one trap in themselves.
- The Family Check-In returns the correct branch for each of the five situations (verifiable against `assess.ts` logic).
- It opens correctly by double-click with no network, prints cleanly, and passes AA contrast.
- It reads as credible for an application (the evidence strip is accurate and cited).
- No em-dashes, no score/label/reward anywhere, warmth never framed as conditional.

## 10. Grounding references

- Engine: `passion/packages/family/src/{model,assess,derive}.ts`; console surface: `passion/apps/guide-console/app/{family.ts,family-panel.tsx}`.
- Research: `docs/research/familyBrainlift.md`; `docs/research/passion-pipeline/{02-push-vs-backoff-burnout,03-talent-development-spine,04-reversibility-plurality-switching}.md`.
- Spec of the engine: `specs/019-family-coengagement/spec.md`.
