# 07 — The Child-Facing Surface at Ages 6–8: Reading, Finding, Clicking

> Research memo for GT100K PassionLab **Discover**. Answers the question the surface docs keep deferring:
> **what does a 6-to-8-year-old actually perceive, read, find and hit on the screen we put in front of them?**
> It is the design-question companion to `06-activity-design-ages-6-8.md`, which settled *what we measure*
> and left *how the child operates the thing* explicitly open.

**Owners:** Felipe Caicedo · Passion Pipeline research track
**Status:** Research input to `docs/prd/DISCOVERY-APP-PRD.md` §5.2–5.4 / §7, `docs/decisions/2026-07-27-discovery-surface.md`
design rule 6, `docs/decisions/2026-07-25-design-language.md` (child mode), and `passion/apps/mvp-jul24`.
**Grounding:** `06-activity-design-ages-6-8.md` (§2.1, §2.4, §8.5) · `2026-07-27-discovery-surface.md` (design rules 1, 2, 6)
· `passion/packages/design-tokens/src/contract.css`

> **Why this memo exists.** `2026-07-27-discovery-surface.md` design rule 6 says, in full: *"A two-level text
> taxonomy assumes a six-year-old can read `agentic-engineering`. It cannot. Icons and audio labels are a
> requirement at the bottom of the band, not a polish item. **No evidence gathered on this; flagged as an open
> design question rather than answered.**"* Separately `DISCOVERY-APP-PRD.md:132` already *promises*
> "voice + images/taps for pre-literate kids" with nothing behind it. This memo closes that gap.

**Scope honesty, read first — and it is worse here than in memo 06.** The band 6–8 sits in a hole in the
literature from the opposite side this time. Memo 06's problem was that the good studies were at 9–12; here the
good studies are at **3–6**, i.e. *below* us. The strongest motor-precision paper in this memo tested 4- and
5-year-olds, and its authors open by noting they had *not* seen the same problem in children aged **seven and
older** — a caveat that cuts directly against over-applying it. Where a finding is out of band I say so inline
and in the confidence column, because the honest summary is that **a 6-year-old and an 8-year-old differ more
from each other on every dimension in this memo than two adults twenty years apart do**, and no single design
serves both without an explicit capability switch.

**This is a single desk-research pass, not memo 06's harness.** No fan-out, no 3-vote adversarial verification,
no refuted-claims list. Confidence below is my own read, driven mostly by *how far the sample sits from 6–8*.
Four sources were paywalled (HTTP 403) and are cited from abstracts and indexer summaries rather than full text;
each is marked **[abstract only]**. Treat those as leads to verify, not as settled. Nothing here should be
quoted with memo 06's authority.

---

## 1. Thesis (one line)

At 6–8 the child cannot yet read our labels, cannot find our hotspots by any cue more complex than a single
popped-out feature, and cannot reliably hit our 44-pixel targets with a mouse — so **audio must carry the
label, one exclusive visual feature must carry the affordance, and the entire motion budget must be spent
marking what is clickable rather than making the room feel alive**; every pixel of decorative motion we spend
is bought directly out of the child's ability to find the thing we are measuring.

---

## 2. The six findings that change the design, and an audit of what we built

### 2.1 The reading gap is roughly sevenfold, and it is the binding constraint on any text label *(high confidence; in band)*

In Maryanne Wolf's stage model, ages ~6–7 are the **novice reader** stage, and late in it a typical child
"can understand up to 4,000 or more words when heard but can read about **600**." One stage later (the
*decoding reader*, ~7–9) it is about **3,000 read against 9,000 heard**. Listening outruns reading until
roughly ages 9–15, when the two converge.
Wolf, M. (2008). *Proust and the Squid: The Story and Science of the Reading Brain.* Icon Books.
Summarised at <https://www.theliteracybug.com/stages>.

Two consequences, and the second is the one people miss.

1. **Audio is not an accessibility affordance here. It is the primary label channel at the bottom of the band.**
   A spoken label reaches a ~4,000-word vocabulary; the same label in text reaches ~600.
2. **The gap closes fast and unevenly across our own band.** 600 → 3,000 readable words happens *inside* 6–8.
   So a single fixed modality is wrong at one end whichever end you design for. This is direct evidence for
   what `DISCOVERY-APP-PRD.md:132` already specifies — modality "triggered by literacy/motor capability, not
   birthday." That line was an assertion; it is now an evidenced one, and it is load-bearing rather than a
   nicety.

*Limits:* Wolf's counts are a synthesis for a general readership, not a measurement with a confidence interval,
and "600 words" is a central tendency across enormous variance. Use it for the *ratio* and the *direction*,
never as a threshold.

### 2.2 Pop-out search is mature by 6. Conjunction search is not. This is the whole hotspot problem *(high confidence; in band)*

This is the most actionable finding in the memo and it maps one-to-one onto a requirement the PRD already
carries.

- **Feature search** — the target differs from everything else by *one* dimension (it is the only moving thing,
  or the only saturated thing) — "pops out." Peak performance is reached **as early as age 6**, and most studies
  find no further change from childhood to adolescence.
- **Conjunction search** — the target is defined by a *combination* (the round brown thing on the shelf) —
  requires organised serial scanning, and that is **still developing**. Donnelly et al. (2007) found **6–7 year
  olds performed more poorly than adults** on conjunction search, and 6–8-year-olds are susceptible to
  distractors **during conjunction search but not during feature search**.
- **Crowding compounds it.** Foveal crowding is elevated in children relative to adults — more disruption from
  flankers, over a larger spatial extent — with maturity estimates ranging from ~5–7 to ~7–9 years.

Overview: *Differential development of visual attention skills in school-age children*
<https://pmc.ncbi.nlm.nih.gov/articles/PMC2824025/> · *The development of organized visual search*
<https://www.sciencedirect.com/science/article/abs/pii/S0001691813000693> · a 2024 *Child Development* study
adds that younger children were slower to detect **colour** than luminance, and especially slow with colour in
the presence of irrelevant motion <https://pmc.ncbi.nlm.nih.gov/articles/PMC10884345/>.

**Why this is decisive for us.** `DISCOVERY-APP-PRD.md` §5.4 states the requirement plainly: *"every
interactable prop must read as interactable from the one framing."* A painterly, hyper-real cabin interior is
precisely a **conjunction-search display** — the clickable kettle is distinguished from the decorative kettle
by a conjunction of shape, placement and context. The PRD asks for a search task that 6–7-year-olds are
measurably bad at, in a display designed to be visually rich, and then reads failure-to-find as
failure-to-be-interested.

The fix is cheap and it is a constraint, not a redesign: **interactables must differ from the entire rest of
the frame by exactly one perceptual feature, and nothing decorative may ever carry that feature.** That turns
the hardest search mode into the one that is already mature at 6. Note the colour caveat above: colour is a
*weaker* pop-out channel at this age than luminance or motion, and is actively degraded by irrelevant motion —
so a warm glow is a worse choice than it sounds, and see §2.3 for the better one.

### 2.3 Motion is the strongest attention magnet at this age — which makes decorative motion the most expensive thing on the screen *(medium-high confidence; slightly below band)*

Three lines converge, and together they invert the PRD's aesthetic instinct.

- **Motion is what pulls children's gaze.** Eye-tracking with 4–6-year-olds found that *motion specifically* is
  what attracts attention in an illustration, and animation well-matched to the text guided children to the
  parts that mattered. <https://pmc.ncbi.nlm.nih.gov/articles/PMC5062825/>
- **Low-relevance animation actively costs comprehension.** Preschoolers (4–5) saw digital picture books with
  high-relevant animation, low-relevant animation, or static illustration. Comprehension was **lower with
  low-relevant animation** and comparable to static with high-relevant animation; children in the low-relevant
  condition **looked less at the high-relevant elements and more at the low-relevant ones**.
  <https://doi.org/10.16910/jemr.17.4.1>
- **The general seductive-details result holds.** Rey's (2012) meta-analysis of 39 studies: interesting-but-
  irrelevant material harmed retention (d = 0.30) and transfer (d = 0.48) — already cited in
  `2026-07-27-discovery-surface.md`. A related caution in the children's-media literature is that *"interactive
  elements including hot spots and games can distract children's attention and have a negative impact."*
  And contextual animation added to boost interest in 9–11-year-olds produced yet another null — the paper's own
  subtitle is *"the saga of null results continues."*
  <https://www.sciencedirect.com/science/article/abs/pii/S0959475223000725>

**The synthesis, which is the memo's headline design move.** Motion is simultaneously (a) a *feature* dimension,
so it pops out and is therefore usable by a 6-year-old per §2.2, and (b) the single strongest involuntary
attention cue at this age. Those two facts mean motion is the best possible hotspot marker we have — and every
frame of *ambient* motion spends that same limited resource on nothing, while measurably pulling gaze off the
elements that matter.

So: **spend the entire motion budget on marking interactables, and none of it on ambience.** Concretely this
puts two things in `DISCOVERY-APP-PRD.md` §5.2 in direct conflict with the evidence — the *"cursor-driven
parallax/dolly so the frame breathes slightly"* and the decorative dust-mote canvas. Both are low-relevance
motion competing with the hotspots for exactly the attentional channel the hotspots need. They are not merely
unnecessary; they are subtractive. Note this is a *reversal of sign*, not a matter of taste: the same device
that reads as "aliveness" to an adult reviewer reads as noise-in-the-signal-channel to a 6-year-old's
attentional system.

*Limits:* both eye-tracking studies are 4–6, below band, and both measure story comprehension rather than
hotspot discovery. The extrapolation from "animation pulls gaze off relevant picture elements" to "parallax
pulls gaze off hotspots" is mine, not the authors'. It is also **directly testable** in our own build and
should be, before the art budget is committed.

### 2.4 The child target sizes are already written and reachable by nobody, and the platform we chose is the harder input modality *(high confidence on the numbers; the band is the caveat)*

**First, a correction to what I assumed before reading the code.** `contract.css:98` sets
`--control-min: 44px /* WCAG 2.5.5 */` — an adult minimum — but the contract does **not** stop there.
`[data-mood="child"]` already overrides it to **56 px**, and `.u-primary-target` already sets **76 px** under a
comment reading *"Primary child actions get the ~2cm target the child-UX literature recommends."* Someone had
already found and applied roughly the evidence below. So the problem is not the value. **The problem is that
`data-mood="child"` and `.u-primary-target` are each set by exactly nobody** — both appear in the repo only at
their own declaration sites — and `passion/apps/mvp-jul24`, the one child-facing app, does not import
`@gt100k/design-tokens` at all. The child sizing was reasoned out, written down, and wired to nothing; every
child-facing pixel currently renders in adult mode. See §2.7 for what the built screens actually measure.

The child evidence the 56/76 px values were reaching for:

| Target size | 4-year-olds | 5-year-olds | Adults |
|---|---|---|---|
| 16 px | **43 %** | 74 % | 90 % |
| 32 px | 77 % | **91 %** | 96 % |
| 64 px | **90 %** | 97 % | 99 % |

Accuracy in point-and-click, thirteen 4-year-olds / thirteen 5-year-olds / thirteen adults; effects of age
*F*(2,36) = 20.744, *p* < .001 and of target size *F*(2,35) = 34.924, *p* < .001; distance to target had no
effect. The authors' own summary: *"to achieve the same level of accuracy as adults at 16 pixels, 5 year olds
require 32 pixels, and 4 year olds 64 pixels,"* and **64 px offers significant advantages over 32 px for both
child groups while offering adults none.** Children also showed far more *target reentry* — overshooting and
re-crossing the target — even at the larger sizes.
Hourcade, J. P., Bederson, B. B., Druin, A., & Guimbretière, F. *Accuracy, Target Reentry and Fitts' Law
Performance of Preschool Children Using Mice.* University of Maryland HCIL.
<https://api.drum.lib.umd.edu/server/api/core/bitstreams/6f012eb1-196c-4014-8a34-a031c977deaf/content>

Corroborating, and closer to our band:

- Nielsen Norman Group, testing ages **3–12** in the US and China (and notably running the **6–8 group in
  dyads**), recommends **at least 2 cm × 2 cm** for young children — "4 times bigger" by area than the adult
  1 cm × 1 cm. At 96 CSS px/inch, 2 cm ≈ **76 px**. They rate 6–8-year-olds' fine motor and motor coordination
  both as **"Limited."** Their in-band failure case: an ad close-button **5 mm** across that **two 7-year-olds
  could not hit**, mis-taps launching the App Store, ending in the child abandoning the app.
  <https://www.nngroup.com/articles/children-ux-physical-development/>
- Anthony et al. (2012) is the one squarely in-and-above band: children **aged 7–16** on 4-inch phones, targets
  varied 12.7 mm → 3.175 mm, confirming higher miss rates for children than adults at small sizes.
  <https://lisa-anthony.com/wp-content/uploads/2012/09/anthony-et-al-tabletop20121.pdf>
- Vatavu et al. (ages 3–6, n = 89, mean 4.6) measured touch *offset* from target centre: 4.5 mm at 3 years,
  3.8 mm at 4 — the padding any target must absorb.
  <https://www.sciencedirect.com/science/article/abs/pii/S1071581914001426>

**And the platform choice makes this worse, not better.** `DISCOVERY-APP-PRD.md:258` targets **school Windows
machines** — chosen for GPU headroom over Chromebooks. That decision was made on rendering grounds and silently
also chose **mouse/trackpad over touch**, which is the harder modality at this age. NN/g's desktop guidance for
under-9s is explicit: *"rely on simple keyboard input or clicks only; avoid dragging, scrolling, and small click
targets,"* and younger children often do *better* with a trackpad than a mouse, while 7-year-olds on a
touchscreen PC abandoned both pointing devices for direct touch. Hourcade's numbers above are **mouse**
numbers, so they are the relevant ones for us.

*Limits, stated loudly:* Hourcade is 4–5, below band, on 2004-era displays — and the same paper's opening
anecdote is that they had **not** observed the problem in children **7 and older**. So do not read "64 px" as
the 6–8 requirement. Read it as: *the floor is a function of capability, it is far above 44 px at the bottom of
our band, and 44 px is not defensible as a single value for a child surface.* Also convert in physical units,
not device pixels: 64 CSS px ≈ 17 mm, which is consistent with NN/g's ~20 mm and with Anthony's 12.7 mm being
the *easy* end of their range.

**The fix already exists architecturally.** `docs/decisions/2026-07-25-design-language.md` states that "Child
and adult are **modes** (same semantic token names, different values)." The mechanism for a larger child-mode
`--control-min` is built and simply has never been given a value. This is a token change, not a redesign.

### 2.5 Icons do not rescue the reading gap on their own, and adult conventions actively mislead *(medium confidence; mostly below band)* **[abstract only]**

The tempting inference from §2.1 is "use icons instead of text." The literature says icons help only under
fairly tight conditions.

- **Literal interpretation dominates.** Young children read icons and images very literally, including in what
  they expect to happen on tap. They handle back/forward arrows but do **not** extrapolate a "home" button or a
  floppy-disk save glyph — adult-world conventions requiring learned cultural knowledge.
  <https://www.uxmatters.com/mt/archives/2011/10/effective-use-of-color-and-graphics-in-applications-for-children-part-i-toddlers-and-preschoolers.php>
- **Semantic distance and count matter.** An eye-tracking study at CIKM 2024 found preschoolers searched more
  easily with icons of **close semantic distance** and with **single** icons rather than combined ones.
  <https://dl.acm.org/doi/10.1145/3627673.3680001>
- **Even "transparent" symbols are learned, not given.** *Hidden Symbols: How Informal Symbolism in Digital
  Interfaces Disrupts Usability for Preschoolers* makes the point that symbol use is a challenge for young
  children even when a symbol seems obvious to adults. Comprehension of graphic conventions rises steadily with
  age across 5, 6, 8 and 10.
- **Iconicity helps conditionally, not universally.** Perceptual similarity aids referential comprehension, but
  in one comparison younger children learned arbitrary and iconic gestures *equally* well while only older
  children with larger vocabularies showed the iconic advantage — i.e. resemblance paid off only once there was
  enough language to exploit it.

**Design consequence.** An icon is a viable label only if it **depicts the actual referent** (a violin, not a
"music" glyph), appears **alone**, and avoids conventions. For our taxonomy this is the difference between
workable and not: `games-strategy` has no depictable referent, while *chess* does. And note what this does
*not* solve — it gives the child a way to recognise a **cabin**, and no way at all to read a subtopic like
`odds-and-chance`. Audio per §2.1 remains mandatory; icons narrow the gap rather than closing it.

### 2.6 Demonstrate, don't instruct — and don't make the tutorial interactive *(medium confidence; adjacent band)*

- A CHI 2026 study of a tablet counting game (within-subjects, **n = 32** children) compared a baseline, an
  **animated** demonstration and an **interactive** demonstration. The **animated demonstration beat both** —
  including the interactive one. The framing is *"When Less Can Be More"*: added tutorial interactivity imposes
  load without buying comprehension. <https://dl.acm.org/doi/10.1145/3772318.3791550>
- Developmentally consistent: children under about **8–9 rely predominantly on visual feedback** to correct
  movement, with a shift around age 9 — supporting demonstration-first at 6–7. Observation beats verbal
  explanation when the learner has no prior experience with the action; words win only for a specific fiddly
  component. <https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7428179/>
- NN/g's positive cases agree: games worked for 7–9-year-olds when paired with *"clear instructions with
  images,"* and their most damning negative case is a discoverability one — a PBS Kids game had a click-only
  alternative to a hard drag, and **"none of the kids in our study discovered that function."**

That last point deserves its own line, because it is the general lesson: **at this age an undiscovered
affordance is identical to an absent one.** Our fallbacks must be *presented*, not *available*.

### 2.7 What the built screens actually measure — an audit, including one thing already right

Measured from `passion/apps/mvp-jul24/src/`, not from the specs. Reported at this length because the gap between
the two is the finding.

**Already correct, and it should be said first: the map marks the playable cabin with pulsing amber glow**
(`MapScreen.css`, `animation: node-breathe 3.4s`, plus an ember gradient and `--glow-ember`). That is **motion +
luminance as an exclusive marker on the interactable** — which is exactly D2, arrived at by instinct before this
memo existed. The dimmed "coming soon" nodes differ by brightness and saturation, another feature-channel
contrast. Whoever built that screen got the hardest part of §2.2 right, and D2 is largely a request to **keep
this and extend it into the cabin interiors**, not to invent it.

Against that, four measured problems:

| What | Measured | Against |
|---|---|---|
| Cabin identity on the map | **Text label only** (`.map-screen-node-label`), no icon, no audio | §2.1 — a 6-year-old reading ~600 words cannot tell Music from Math here. This is the single most consequential gap in the build. |
| Cabin node height | `padding: .5rem 1rem` + `font-size: .95rem` ≈ **38 px** | Below the adult 44 px floor, below child-mode 56 px, far below Hourcade's 64 px (§2.4) |
| Body/label type | `.95rem` ≈ 15.2 px labels; `.68rem` ≈ **10.9 px** uppercase badges; `.74rem` in `CabinStatic.css` | The token contract's own rule, `--text-base` "never below 16px for any user" |
| Token adoption | `mvp-jul24` has its own `theme.css` and never imports `@gt100k/design-tokens` | So child mode cannot apply even if something set `data-mood` |

The pattern is consistent and worth naming: **the child-facing app is the one surface that never received the
design-language rollout.** `2026-07-25-design-language.md` sequenced conversions as "guide console first, then
the parent guide, then the evidence explorer" — three adult surfaces, and the child app is absent from the list
entirely. That is how a well-reasoned 56 px child token ends up sitting next to a shipped 38 px child button.

---

## 3. The tension this memo cannot dissolve, stated honestly

`2026-07-27-discovery-surface.md` design rule 2 requires **uniform presentation across topics**, because
"any topic that looks better than another is a confound with the topic's own signal" — grounded in Javora et al.
(2019), where children chose the prettier version of the *same* game 62 % of the time (d > 0.86) and learned no
more. Memo 06's C8 says the same thing architecturally: hold the shell constant, vary only content binding.

Against that, the surface still has to be a place a 6-year-old wants to enter, and the only in-band evidence on
that pulls somewhere specific:

**Wang & Bowerman (2018)**, *Computers in Human Behavior* 87, doi:10.1016/j.chb.2018.05.032 — 180 primary
school children in three groups (**7–8**, 9–10, 11–12) rated e-learning web pages of high, medium and low
visual complexity under Berlyne's inverted-U. Preference for **medium** complexity **increased with age**, and
**younger children appreciated colourfulness more** than older ones. **[abstract only — 403, read via abstract
and indexer summaries; verify before citing as settled.]**

Also relevant and pointing the same way: children shift from a preference for **local** to adult-like **global**
visual information at around age 6 <https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3110822/>, and sensitivity to
the complexity and organisation of artworks sharpens notably between 4 and 7.

**What that implies, and where it collides with the current art direction.** At 7–8 the read is *lower complexity
and higher colourfulness* than at 9–12 — which is close to the opposite of a muted, painterly, detail-dense
"cozy realistic cabin." The current art direction may be aimed at the taste of an adult reviewer, or at a
9–12-year-old, rather than at the bottom of our band. I want to be careful here: this is one out-of-full-text
study on web pages, not on illustrated scenes, and I am not recommending a re-art on that basis.

**The resolution I do propose is structural rather than aesthetic, and it costs nothing to adopt.** Uniformity
and appeal only conflict if you treat "polish" as one scalar dial. Split it:

- **Hold constant across all cabins:** composition template, hotspot count, the pop-out feature (§2.2), motion
  budget (§2.3), palette *structure* (how many hues at what saturation), detail density, target sizes.
- **Vary only:** the depicted subject matter.

That satisfies rule 2's measurement requirement — no cabin can look "better," only *different* — while letting
the whole set be as colourful and legible as the band wants. It also converts memo 06's "equal polish" from a
production-schedule aspiration (which it currently is, and which §8.2 of memo 06 already admits is unmet with
only one cabin built) into a **checkable spec**: same template, same counts, same budget.

---

## 4. Design decisions

**D1 — Audio labels are mandatory at the bottom of the band, and are the primary label channel there, not a fallback.**
Every child-facing label — cabin, subtopic, gadget, button — carries a spoken form, triggered by hover/focus
and replayable on demand. Text remains for the readers. Per §2.1 the spoken channel reaches ~7× the vocabulary
of the written one at 6–7. This answers `2026-07-27-discovery-surface.md` rule 6 in the affirmative: audio is a
requirement, and it is a requirement *because of a measured vocabulary ratio*, not on principle.

**D2 — One exclusive pop-out feature marks every interactable, and nothing decorative may use it.**
Declare the feature once, globally, and enforce it as a lint-able rule rather than an art note. Per §2.2 this
converts hotspot-finding from conjunction search (immature at 6–7, distractor-prone) into feature search
(mature at 6). Prefer **motion or luminance** over hue, since colour detection is slower at this age and is
degraded by irrelevant motion.

**D2a — the marker must not move the target.** Animate glow, brightness or opacity; never `transform`,
`scale`, or position. This came out of building the mockup rather than out of the literature: the first
version pulsed the prop with a `scale(1.07)`, and headless Chromium refused to click it, reporting the element
as *"not stable"* after 60 retries. That is a fair proxy for a child who already overshoots stationary targets
(§2.4's target-reentry counts, which stayed elevated for children even at 64 px). A scaling marker
solves §2.2 by breaking §2.4. Mark the prop; do not move it.

**D3 — Spend the whole motion budget on hotspots. Cut ambient motion.**
Per §2.3, retire the cursor-driven parallax/dolly and the decorative dust motes from
`DISCOVERY-APP-PRD.md` §5.2, or demote them to an adult/marketing view. This is the one decision here that
removes work rather than adding it, and it is the one most likely to be resisted, because ambient motion is
what makes a room feel alive to the adult approving the screenshot. Note it is *already* required to be
disabled under `prefers-reduced-motion`, so the code path for a still frame exists.

**D4 — Wire the child mode that already exists, then raise its default.**
The values are written and unreachable (§2.4, §2.7). In order of cost:
(a) `mvp-jul24` imports `@gt100k/design-tokens` and sets `data-mood="child"` on its root — this alone moves
every control from 44 px to 56 px and body text to ≥16 px, and is a two-line change;
(b) raise the child `--control-min` from **56 px to 64 px**, since 56 sits in the gap Hourcade measured and
64 px is where the child advantage over 32 px was significant while adults gained nothing;
(c) make the ~2 cm `.u-primary-target` **automatic for scene hotspots and cabin nodes** rather than an opt-in
class, because an opt-in size floor is one forgotten `className` away from silently reverting;
(d) add a **spacing** rule alongside the size rule — crowding is elevated at this age (§2.2) and touch offset
runs ~4 mm (§2.4), so adjacency matters as much as size, and nothing in the contract addresses it;
(e) drive the mode from the literacy/motor capability signal, not birthday, per `DISCOVERY-APP-PRD.md:132`.
Note (a) is worth doing today even if (b)–(e) are argued about for a week.

**D5 — Icons depict referents, appear alone, and never carry a subtopic.**
Per §2.5: a violin, not a "music" glyph; no adult conventions; one icon per choice. Icons make **cabins**
recognisable to a non-reader. They do **not** make subtopics readable — that is D1's job, and no amount of icon
work substitutes for it.

**D6 — Onboard by animated demonstration; never by text, and not by an interactive tutorial.**
Per §2.6. Show the loop once, animated, ~10 s, replayable, skippable by anyone who starts acting. Resist the
instinct to make the tutorial hands-on: the in-band-adjacent result is that interactivity there *lost* to plain
animation.

**D7 — Present fallbacks; never merely offer them.**
Per §2.6's PBS Kids case, where no child found the click-only alternative. Any accessibility mirror or
easier-input path must be visible on the primary surface. This raises the bar on **A5**, the Layer-3
accessibility mirror in `DISCOVERY-APP-PRD.md` §5.2 — a parity-correct mirror that no child discovers satisfies
`plainViewEquals` and still fails every child who needed it.

**D8 — Split "polish" into a held-constant template and a varying subject.**
Per §3. Makes rule 2's uniformity checkable instead of aspirational, and decouples "equal across cabins" from
"appealing to a 6-year-old" so the two stop trading off.

**D9 — Instrument the failure modes this memo predicts, before the art budget commits.**
Every claim in §2.2–§2.4 is testable in our own build, cheaply, and each has a specific signature that is
otherwise **silently misread as low interest**:
- hover-without-click, and clicks landing on non-interactive scenery → hotspot not popping out (D2);
- target reentry / overshoot counts per click → target too small (D4);
- open-then-immediate-exit with no gadget click → child could not find anything to do.

This matters more than a normal instrumentation ask because of what memo 06 §8.4 P2 established: a surfaced
option with no engagement is scored by the engine as a **decline**. So a child who simply could not *find* the
hotspot generates evidence that the topic was rejected. **Every finding in this memo is therefore a
sign-inversion risk in the interest model, not merely a usability problem** — which is the strongest argument
for fixing them and the reason they belong in the measurement lane rather than in a design-polish backlog.

---

## 5. Conflicts with the current specs and app

| # | Where | Conflict | Proposed resolution |
|---|---|---|---|
| K1 | `design-tokens/src/contract.css:130–143` vs. `mvp-jul24` | Child mode **exists** (`--control-min: 56px`, `.u-primary-target: 76px`) and is set by **nobody**; `mvp-jul24` never imports the token package, so it ships 38 px nodes and 10.9 px badges (§2.7). | **D4(a)** first — import tokens, set `data-mood="child"`. Then 56 → 64 px, automatic hotspot targets, and a spacing rule. |
| K1b | `2026-07-25-design-language.md` rollout order | The conversion sequence names guide console → parent guide → evidence explorer. **The child app is not on the list.** | Add `mvp-jul24` to the rollout, ahead of the remaining adult surfaces. It is the only surface whose users cannot read. |
| K2 | `DISCOVERY-APP-PRD.md` §5.2 | Cursor-driven parallax/dolly + decorative dust motes are **low-relevance motion** competing for the exact attentional channel hotspots need (§2.3). | **D3.** Cut them from the child surface, or move them to an adult view. |
| K3 | `DISCOVERY-APP-PRD.md` §5.4 | *"Every interactable prop must read as interactable from the one framing"* — stated as a requirement with no mechanism, in a hyper-real scene that is a **conjunction-search** display. | **D2.** One exclusive global pop-out feature, enforced as a rule. |
| K4 | `DISCOVERY-APP-PRD.md:132` | "voice + images/taps for pre-literate kids" is promised; nothing implements it, and `2026-07-27-discovery-surface.md` rule 6 flags it unresolved. | **D1 + D5.** Audio-first labels; icons for cabins only. The PRD line is now evidenced (§2.1) rather than asserted. |
| K5 | `DISCOVERY-APP-PRD.md:258` | Platform chosen as school Windows machines on **GPU** grounds; that silently also chose **mouse/trackpad**, the harder modality at 6–8, and Hourcade's mouse numbers then apply. | Record the input-modality consequence explicitly. Prefer touch-capable hardware where a choice exists; if not, D4's larger targets are not optional. |
| K6 | `2026-07-27-discovery-surface.md` rule 2 vs. the cozy-realistic art direction | Uniformity is required for measurement; the only in-band appeal evidence favours **lower complexity, higher colourfulness** at 7–8 than the current direction. | **D8.** Split template from subject. Do **not** re-art on one abstract-only study. |
| K7 | `DISCOVERY-APP-PRD.md` §5.2 Layer 3 (**A5**) | The accessibility mirror is specified for parity (`plainViewEquals`) but not for **discoverability** — and A5 is still unbuilt. | **D7.** Parity is necessary, not sufficient; the mirror must be presented on the primary surface. |
| K8 | Genre premise | Torrente et al. note that in point-and-click adventures exploration "should not be immediate, trivial, or obvious" — the genre's core pleasure is *deliberate* search difficulty. For us, search difficulty is **measurement error** that the engine scores as a decline (memo 06 §8.4 P2). | Accept the genre conflict explicitly: we are building a **frame with findable affordances**, not an adventure game. D2 + D9. Retire "exploration" as a design value on the child surface. |

---

## 6. Who owns each decision

Nothing here is a new assignment. `docs/prd/passion-roadmap.md` already places the world, the cabins, the art
assets, the accessibility mirror and the game-side event emitter on the **world track**, and this memo's
decisions land where the roadmap already put the work:

- line 26 — *"**Game/visual world** (A1 world, A2 cabins, A3 assets, A5 mirror) · 🟡 partial / teammate — tinker
  cabin + realism loop"*
- line 46 — *"the game-side emitter is teammate"*
- line 49 — *"**A1/A5** discovery world + accessibility mirror (teammate track; only one **A2** cabin exists)"*
- line 56 — *"remaining cabins + **A5** accessibility mirror … (teammate/world track)"*

Since every decision in §4 is about what the child sees, hears, finds and clicks *inside the world*, most of
this memo is world-track work by the repo's existing division, not by anything this memo invents. Stated
plainly so the split is arguable on the facts rather than on tone:

| # | Decision | Lane | Owner per roadmap |
|---|---|---|---|
| D1 | Audio labels as the primary label channel | A2 cabins + A3 assets (voice assets) | **World track** |
| D2 | One exclusive pop-out feature on interactables | A2 cabins + A3 assets | **World track** (already half-done — §2.7) |
| D3 | Cut ambient motion; spend it on hotspots | A1 world + A2 (the "realism loop") | **World track** |
| D4 | Wire child mode; raise the default | (a) + (c) in `mvp-jul24`; (b) + (d) in `design-tokens` | **Split** — app wiring world track; token values shared |
| D5 | Icons depict referents, cabins only | A3 assets | **World track** |
| D6 | Animated-demonstration onboarding | A1 world + A3 assets | **World track** |
| D7 | Present fallbacks; the A5 mirror must be discoverable | **A5 accessibility mirror** | **World track** (explicit, line 49/56) |
| D8 | Split held-constant template from varying subject | A3 assets + art direction | **World track** |
| D9 | Instrument hover-without-click, reentry, open-then-exit | Game-side emitter → `CellEvent` | **Split** — emitter world track (line 46); engine read-side already built |

**What the engine//spec side owes, so this is not a one-way list.** D4(b) and D4(d) are token-contract changes
in shared code. D9's read-side needs the new event kinds accepted by `signal-pipeline` and `interest-inference`
and a decision on whether a discoverability-failure flag suppresses a belief update — that is the same class of
call as memo 06 §8.4's P1–P5 and it is not the world track's to make. K1b (adding `mvp-jul24` to the
design-language rollout) is a sequencing change to an accepted decision doc, which needs the author of that
decision. And §7.6 below — capability detection for literacy/motor — is unowned by anyone today and blocks the
"triggered by capability, not birthday" half of both D1 and D4.

**The smallest first PR, if the list reads as too much.** D4(a) — import the token package, set
`data-mood="child"` — is two lines, needs no art, no audio, no new evidence, and moves every control on the
child surface from 44 px to 56 px and all body text to ≥16 px at once. It is the highest ratio of
child-perceptible improvement to effort in this document, and it does not require agreeing with anything else
here.

**One thing this section is not.** The ownership above is copied from the roadmap, not derived from who has
capacity or who wrote this memo. If the world track disagrees with a *finding*, §2 is where to argue and §7
lists the eight places the evidence is thin enough to lose that argument. If it disagrees with an *assignment*,
the roadmap lines are quoted above and that is a conversation about the roadmap, not about this document.

---

## 7. What we still do not know

1. **No study measures children's hotspot-discovery rates in a scene** — not at any age. §2.2 is assembled from
   visual-search psychology; the application to painterly-scene hotspots is inference. D9 exists because of
   this, and our own build is the cheapest place in the world to test it.
2. **The 6–8 target-size floor is not measured.** Hourcade is 4–5 and explicitly notes 7+ did not show the
   problem; NN/g's 2 cm spans 3–12 without a per-age breakdown; Anthony is 7–16 without a size threshold. The
   64–76 px range in D4 is an interpolation across three studies, none of which measured our band with a mouse.
3. **Whether audio labels change navigation behaviour at 6–8 is unstudied.** The read-aloud literature is about
   *comprehension*, mostly in older children with reading difficulties, and mostly on prose rather than UI
   labels. One documented hazard: verbatim narration of interface elements produces audio that is hard to
   comprehend, so D1 needs authored spoken labels, not a screen-reader pass.
4. **Salient hotspots improved usability but not learning** in the one controlled hotspot-salience study
   (n = 128, mean age 4.73, 2 × 2 tap-vs-drag × salient-vs-not). Children learned ~5 Dutch words in one ~5-minute
   session and **the manipulated features did not explain that acquisition**
   <https://www.tandfonline.com/doi/full/10.1080/17482798.2022.2059536> **[abstract only]**. Directionally
   supportive of D2 and honestly weak: below band, and the outcome measured is not ours.
5. **Nothing here validates the game surface against the launcher.** Memo `2026-07-27-discovery-surface.md`
   already records that no study compares them as measurement instruments, and this memo found nothing new on
   that question. **What this memo does change is the cost estimate for the game**, in both directions: the
   scene-based surface carries a hotspot-discoverability risk (§2.2, K8) that a list surface does not have at
   all — and D2/D3 make it *cheaper to build*, since they subtract ambient motion and per-prop art subtlety.
   A reader looking for a reason to revisit the launcher will find K8 the strongest one in this document, and
   it is fair to say so.
6. **Reading-capability detection is unspecified.** D1 and D4 are both "capability-triggered" per the PRD, and
   nothing in the repo measures literacy or motor capability. Until something does, both decisions have to
   default to the **bottom** of the band, which is the safe direction but costs the 8-year-old a surface built
   for a 6-year-old.
7. **Four sources are abstract-only** (§2.5 partly, §3's Wang & Bowerman, the hotspots study, and the CIKM icon
   study), all 403-blocked. Each is flagged inline. Verify before any of them is load-bearing.
8. **Dyads.** NN/g ran their 6–8 group **in pairs**, and memo 06 §4 notes partner/small-group work produced the
   highest on-task rates (OR 1.51–1.62). We have never considered whether the child uses this surface alone. It
   would affect both the measurement (whose choice is it?) and the design. Genuinely open, and not something
   this memo researched.

---

## 8. Method

Single-pass desk research, 2026-07-27: targeted web search plus source fetching, with one PDF extracted
locally for the numbers in §2.4. **No fan-out, no adversarial verification, no refuted-claims list** — this is
deliberately not memo 06's harness, and the confidence markings are one reader's judgement driven chiefly by
sample-to-band distance. Four paywalled sources are marked **[abstract only]** and are cited from abstracts and
indexer summaries. Two claims I initially attributed to Chall's stage model turned out to be Wolf (2008) on
checking the primary page; the citation in §2.1 is the corrected one.

The single most useful thing a second pass could do is **not** more literature. It is D9: instrument
hover-without-click, target reentry and open-then-exit in `mvp-jul24` and read the answers off our own children,
because §2.2 and §2.4 are the two findings that most need our band and are the two the literature is least able
to give us.
