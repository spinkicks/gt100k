# The child-facing discovery surface: game, catalog, or neither

**Status:** Recommendation, for the surface owner to accept or reject. Not a decision I can make alone.
**Date:** 2026-07-27
**Question:** Should the 3D exploration game be replaced by a browse/catalog app ("Netflix for
learning") where a child can start learning anything?

---

## Recommendation

**Do not build the recommendation-driven catalog. Do not defend the current game either.**

The three defining properties of the Netflix framing (algorithmic surfacing, video-first cards, a
very large item count) each independently damage this system's measurement, and the first one
damages it in a way more data cannot repair. But the critique of the game is largely right: the best
available evidence says a game surface is specifically good at producing the signal we are required
to **discount**, and no better at the one we count.

What the evidence converges on is neither proposal: **small, fixed, un-personalized, rotating sets
of comparably-produced ACTIVE options, with cross-day return as the outcome.** A stripped choice
board, not a 3D world and not a catalog.

One asymmetry decides it. The game's problems are fixable by subtraction: drop the 3D navigation
shell, equalize art across gadgets, keep the generative tasks. The catalog's central problem is only
fixable by removing recommendation, at which point it is not the product being proposed.

Confidence: **high** against the recommender-plus-video-plus-large-catalog combination for a
measurement product. **Moderate** that the 3D shell is actively harmful. **Low** on any head-to-head
ranking, because no study compares these two surfaces as measurement instruments.

---

## The argument that actually decides it, which is ours and not the literature's

**Recommendation makes our most distinctive measurement non-identifiable.**

E4 scores what a child *declined when alternatives were available*. That is only evidence if we know
the alternatives were genuinely on offer. Once the offered set is a function of the child's prior
behaviour, "this child rejected chemistry" and "the ranker stopped showing chemistry" produce the
same log, and no amount of data separates them: more data tightens the feedback loop rather than
breaking it. The counterfactual offered set is not recoverable after the fact.

The same applies to the outcome. A cross-day return to something the system put in the first row is
joint evidence about the child and about our own ranker, so the metric would be partly measuring
us. This is a logical argument about identifiability, not an empirical finding, and it is stated
that way deliberately. The empirical case against children's filter bubbles is thin (see gaps) and
nobody should be sold the stronger version.

---

## The evidence

**A game surface catches interest and does not hold it, tested in close to our conditions.**
Brom, Kolek, Lukavský, Děchtěrenko & Volná (2022), *To Quiz or to Shoot When Practicing Grammar?*
Frontiers in Psychology 13:856623. <https://doi.org/10.3389/fpsyg.2022.856623>
N = 11,949, randomised game versus plain quiz, same content, in genuine free-choice conditions on a
public children's site competing against 200+ other games. The game won at getting past the first
level (61.8% vs 53.6%) and **lost** on completing the intervention (4.3% vs 6.0%), with fewer correct
answers (36.3 vs 47.4) and more errors (16.1 vs 13.1). The authors' own framing: it "triggered
situational interest but did not maintain it."
*Quality:* the strongest design found on this question. **Limits, checked in the paper itself:** the
age band is the authors' assumption, not a measurement ("we can assume the study participants were
younger school-age children (age ∼8–10)"); the topic is one the paper calls "difficult and boring";
and the mechanic is a shooter, not an exploratory world. It shows a game shell does not hold
interest in a boring topic. It does not directly test discovery across topics.

**Children's free choice tracks presentation quality, with no learning benefit.**
Javora, Hannemann, Stárková, Volná & Brom (2019), BJET 50(4) 1942–1960.
<https://doi.org/10.1111/bjet.12701> Ages 9–11, N = 53, same game at two aesthetic treatments.
Strong preference for the prettier version (d > 0.86), chosen 62% of the time in free choice, and
they learned no more. *Small sample, but a clean within-content manipulation.* This is our art
confound demonstrated directly.

**Choice helps in small sets and repeated moments, and any external reward cancels it.**
Patall, Cooper & Robinson (2008), Psychological Bulletin 134(2) 270–300.
<https://doi.org/10.1037/0033-2909.134.2.270> 41 studies: 2–4 successive choices d = 0.61 against
d = 0.21 for one; 3–5 options beat both fewer and more (>5: d = 0.21); and with a reward external to
the choice the benefit goes to **d = −0.01** against d = 0.35 without. *Caveat that the abstract
hides: the option-count moderator is marginal (p < .06 fixed effects, p = .20 random), and the
"stronger in children" result holds under fixed effects only.*

**Extraneous interesting material degrades what you can measure through it.**
Rey (2012), Educational Research Review 7, 216–237. <https://doi.org/10.1016/j.edurev.2012.05.003>
39 studies; seductive detail harmed retention (d = 0.30) and transfer (d = 0.48). Consistent with
Brom's players wasting a median 9 actions that hit nothing.

**Bigger choice sets reduce engagement with whatever is chosen.**
Maimaran (2017), Judgment and Decision Making 12(5). Children preferred picking from the larger set
and then spent *less* time with what they picked. **Ages 4–5, below our band** — directional only.

---

## What this means for each direction

### Against the catalog

- **E4 is destroyed, not degraded.** See the identifiability argument above.
- **The depth channel collapses onto dwell.** "Chose harder work", "unrequired revision" and
  "self-authored scope" have no natural expression in a video card. What is left is play, pause and
  complete, which is dwell, which we have already established is flat against learning (p = .80) and
  non-monotonic. We would be back on the one signal we ruled out.
- **Card art becomes the dominant choice cue**, in a grid where thumbnail and title are nearly all
  that distinguishes options. Javora, industrialised.
- **Shallow sampling costs calendar time.** More items spreads a fixed number of sessions thinner,
  so each topic accumulates fewer cross-day returns before a decision can be made.
- **Parents enter the measurement.** In catalog products adults do much of the searching, which
  injects parent preference into what is meant to be the child's revealed preference.

### Against the game

- **We are engineering the noise we then subtract.** Our rule is to discount triggered situational
  interest and count cross-day returns. Brom says a game shell is good at the first and no better at
  the second.
- **Whichever gadget got the best art wins**, and with one gadget per topic, art quality varies by
  topic by construction, so the topic ranking inherits the production schedule.
- **Navigation load contaminates depth**, and a 3D cabin imposes more of it than Brom's 2D shooter.
- **Spatial and game skill is a person-level confound**: a child who navigates 3D poorly looks like a
  child with low interest, consistently, across every topic. *No direct study found; testable.*
- **The metaphor caps the topic range.** A puzzle world can host cryptography. It cannot host poetry
  without warping it into a puzzle, at which point the child is choosing between puzzles.
- **One point in its favour, which must be preserved:** a puzzle gadget is an active task that
  produces something. That is strictly better than video-passive for depth, and it is the property
  to keep when stripping the game.

---

## Design requirements for either surface, and what we already have

| Requirement | Status in our code |
|---|---|
| Fixed, non-personalised sets of 3–5 options, 2–4 choice moments per session | Surface's job. Nothing in the engine assumes otherwise. |
| Log the offered set, not just the selection | **Partly.** `SurfacedRecord` records `(kid, artifact, session, timestamp)`, which is what E4 needs. It does **not** record slate position or per-child prior exposure count, which a grid would need to separate position bias from preference. |
| Normalise a decline by the size of the choice set | **Done.** E4 divides by `choiceSetSize`. |
| No reward external to the choice | **Enforced.** Guardrails GC1/GC6 ban score, rank and gamification keys outright. Patall makes this stronger than a style preference: an external reward does not add noise to the choice signal, it zeroes it. |
| Discount a fixed novelty window, identical across topics | **Done.** `noveltyWindowDays`, applied per cell, and novel events score nothing. |
| At least one generative act per topic | Surface's job. This is the property the game has and a video catalog does not. |
| Down-weight system-surfaced engagement | **E5, unbuilt.** Currently deferred for want of anything that surfaces. **A recommender makes it mandatory, not optional.** |
| Interleave a hold-out: surface something the model predicts will be declined | **Missing entirely.** Without it any adaptive surface is unfalsifiable. Worth filing regardless of which way this goes. |
| Equalise cost of entry across options | Surface's job. Three clicks versus thirty seconds of navigation measures friction, not interest. |

---

## Where the evidence runs out

Stated rather than papered over, because several of these are load-bearing.

- **No study compares a game surface with a browse surface as interest-measurement instruments.**
  Everything found compares them on learning or usability. The question as asked is unstudied, and
  this recommendation is assembled from adjacent findings.
- **No validated instrument exists for inferring durable interest in 6–8 year olds from behavioural
  logs.** Stealth assessment validates well for *competencies* (r ≈ .40 against Raven's) but there is
  no equivalent construct validation for interest. We would be building the first one.
- **Filter-bubble harm to children is asserted more than demonstrated.** The one empirical YouTube
  Kids audit found no strong indication of bubble formation. Our case against recommendation rests
  on identifiability, which is a logical argument.
- **Choice overload is not established for 6–14.** The best study is ages 4–5.
- **Nothing on 3D or spatially-navigated surfaces for interest measurement.** The load argument is an
  extrapolation.
- **No comparable product publishes evidence that it identifies genuine interest.** Khan Academy Kids
  has an RCT on literacy gains, not interest. Duolingo has published research on "goal drift", where
  engagement migrates from mastery to metric maintenance, which is precisely our failure mode. Every
  one of these publishes retention or learning evidence; none publishes interest-identification
  evidence. That is an open space rather than a state of the art we have missed.
