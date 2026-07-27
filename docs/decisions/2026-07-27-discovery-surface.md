# The child-facing discovery surface: game, catalog, or neither

**Status:** **DECIDED by the surface owner, 2026-07-27 (see §-1): keep the existing game. Do not build
a separate launcher app. Whether the child leaves the product to learn is deliberately left open.**
The recommendation in §0 — build the launcher, retire the game — is **not adopted**; its evidence is
retained and re-scoped as the bar the game has to meet.
**Date:** 2026-07-27 (rev 3 the same day: rev 1 evaluated the wrong artefact, see §0; rev 3 is the
owner's ruling)
**Question:** Should the 3D exploration game be replaced by a browse app where a child can start
learning anything?

---

## -1. The surface owner's ruling

**Keep the game we have. It already has the menu.**

The launcher's central mechanic is a fixed, non-personalised choice moment over a taxonomy the child
reads and picks from. `mvp-jul24` already implements that shape: a **click-to-select 2D map of topic
cabins** → a cabin interior → click a prop → an activity opens as an overlay, with **no locomotion
anywhere** (`passion/apps/mvp-jul24/PROJECT.md`, Mission; PRD §5.2 revised 2026-07-25). So the
requirements in §0 are applied **to the existing surface by adjustment**, not by standing up a second
child-facing app.

**The scope of the ruling is "the surface we have now," not "the surface forever."** It settles what
gets built against today and stops a parallel app being stood up; it is not a commitment to `mvp-jul24`
as the permanent child-facing surface. The two rules below that it does not satisfy are the terms on
which that could be revisited, and revisiting it needs a new ruling rather than a quiet drift.

This also disposes of one of §0's own arguments in the game's favour rather than against it: rev 2's
prescription for fixing the game *by subtraction* was "drop the 3D navigation shell." That already
happened on 2026-07-25 — there is no avatar, no walking, and the interior camera is permanently
fixed. The navigation-load and cost-of-entry objections were aimed at a shell the app no longer has.

### What stays open, on purpose

**Whether the child leaves the product to learn.** Not deferred for want of an opinion — held open
because both channels already exist in the app and the choice between them is about which one is
load-bearing, not which one to build:

- **Leaving** already exists. Every cabin's always-open shelf carries **3–6 offline explainer cards,
  each with a real citation and one outbound link**, plus exactly one domain-invitation card
  (`PROJECT.md`, *The shelf is the D5 maintenance path*). That is the launcher's "follow a vetted
  link and go" in miniature, already stocked and already justified on different grounds.
  **But it is a different store:** the shelf's links are hand-authored in
  `mvp-jul24/src/shelf/cards.data.ts` and nothing in the app calls `curatedForCell`, so the
  151-resource curated library and the shelf a child actually opens are today unconnected. Answering
  the open question in favour of leaving means wiring one to the other; answering it in favour of
  staying means deciding whether two curated collections should continue to exist side by side.
- **Staying** already exists, and is the thing a launcher cannot have: an active generative task per
  topic. §0 concedes this is the game's one property worth preserving, and the swap test
  (`PROJECT.md`, *Why the split exists*) is what keeps it evidence rather than wrapper engagement.

So the open question is narrow and answerable later without rework: **is the shelf a maintenance
surface behind in-app activities, or is it the primary destination and the activities the trigger?**
Nothing below forecloses either answer.

### What this changes about §0's conclusions

| §0 said | After the ruling |
|---|---|
| Retire the game | **Not adopted.** The surface is fixed; the design rules must be met inside it. |
| Build a launcher app | **Not adopted.** No second child-facing surface. |
| Evidence against a game shell (Brom 2022; the art confound; navigation load) | **Retained, not withdrawn.** It stops being a reason to replace the surface and becomes the list the surface is audited against — see the two rules below that the game does *not* currently satisfy. |
| The in-app depth channel mostly goes away | **Reversed.** Keeping the activities keeps `chosen_challenge`, `unrequired_revision` and `self_authored_scope` expressible. E10's out-of-product report stays valuable but is no longer the *only* depth instrument. |
| The curated library **is** the surface | **Conditional on the open question.** Either way the library keeps its value — the launcher's shelf if the child leaves, the cabin's shelf stock if they do not — and `2026-07-27-curated-library-standard.md` is unchanged. |

### The two design rules the game does not currently satisfy

Recorded here rather than in a follow-up, because keeping the game means keeping these open:

1. **Rule 1 — the choice moment is a topic label, not a thumbnail.** The map offers pictorial cabins
   and the in-cabin choice is painted props, which is the Javora confound in its most direct form.
   `PROJECT.md` already logs the residual honestly ("Slight inter-room visual variation keeps a small
   C8 aesthetics-confound exposure… wrapper appeal independently predicts voluntary return, β = 0.267,
   p = .003") and the shared shell — same geometry, same lighting rig, same camera, both rooms lit at
   dusk — removes most of it. **Keeping the game means that residual stays and is not closed by a
   text-label surface.** Rule 2 (uniform presentation) is therefore largely already met; rule 1 is
   not, and cannot be fully met by a surface whose choice affordance is a painting.
2. **Rule 5 — log the offered set, including position.** `SurfacedRecord.position` (#203) was added
   for a list, and a map has ordering too: signpost order, prop placement, what falls under the
   cursor first. It applies here and is not currently emitted — and per `PROJECT.md`'s last logged
   risk, **the backdrop backend's prop polygons and bookshelf emit nothing at all today**, so
   emission is silently partial before position is even considered.

Rule 4 (no streak, badge, point, notification or unlock) is already satisfied, and on a stronger
argument than this doc's: nothing is gated, there is no completion-triggered offer, and the reason is
that a completion gate would launder an ability measure into a depth measure (`PROJECT.md`, *Depth and
unlocking*).

### Two consequences worth stating

**#203's engine pieces stand, but one of its premises does not.** Its rationale was that "a launcher
has no furniture: the child picks a subtopic, which IS a DomainPath." Keeping the game means the
gadget→taxonomy crosswalk is **back in scope**. It is also cheaper than #203 assumed: the taxonomy
already models the app's room split as `math-puzzles/logic-puzzles` and
`math-puzzles/competition-math`, both in `SEED_SUBTOPICS`, so no minting is required. That work is
already designed on `dev/mvp-jul24/backend-wiring-plan`, which this ruling promotes from conflicting
with the decision to being the path through it.

**The age bands do not line up, and that is a reason this ruling leaves the leave/stay question
open.** This doc's evidence is 6–8 (Brom's own band is the authors' assumption, ~8–10); `mvp-jul24`
targets **9–12** and says so explicitly. The specific finding §0 used to argue that losing the in-app
depth channel was survivable — in-session telemetry discriminated nothing at 7–8, only the delayed
out-of-product probe did — is **not known to hold** at 9–12. It cannot be leaned on to force the
child out of the product, and its converse cannot be leaned on to keep them in.

---

## 0. Correction to rev 1, and the recommendation as it stood

> **Superseded in part by §-1.** Everything below is the analysis as it stood before the owner ruled,
> kept whole because its evidence is still in force. Only its two *conclusions* — build a launcher,
> retire the game — were rejected. Do not read this section on its own.

**Rev 1 evaluated a recommender. The thing actually proposed is a directory, and the difference is
the whole argument.**

What was described: a child picks an umbrella topic (a cabin), picks a subtopic from that cabin's
fixed list, and gets a small curated set of vetted external links — YouTube, sites, courses — then
**leaves to learn**. The lists are curated, age-filtered and reputation-ranked. Nothing is
personalised. Nothing is predicted.

Rev 1's central objection was that recommendation makes E4 non-identifiable, because a decline and a
non-surfacing produce the same log. **That objection does not apply to a fixed taxonomy.** When the
choice set is the cabin's subtopic list — the same list for every child, every time — we know
exactly what was on offer, so a decline is exactly as interpretable as it is today. The objection
was to the ranker, not to the browsing.

So the recommendation changes: **build the launcher, retire the game.** Rev 1's evidence against the
game stands unchanged and is if anything more relevant, because the launcher is cheap and the game
is not.

### Why "we do not want retention" is the strongest thing about this proposal

It reads like a concession. It is the opposite: it is the canonical instrument.

Deci, Koestner & Ryan (1999), a meta-analysis of 128 studies, states the measure plainly: *"The
primary measure of intrinsic motivation, introduced by Deci (1971), is the degree to which
participants **return to and persist at the target activity during a free-choice period subsequent
to the experimental phase**."* <https://doi.org/10.1037/0033-2909.125.6.627>

That is our product's core measurement, described in 1971, and it is why our own Insight 1 says the
reliable signal is *voluntary return after external pressure is removed*. It also tells us exactly
what retention mechanics would do to it: engagement-contingent, completion-contingent and
performance-contingent rewards undermined free-choice intrinsic motivation at **d = −0.40, −0.36 and
−0.28**, and the paper notes tangible rewards *"tended to be more detrimental for children than
college students."*

A streak, a badge or a return-nudge is not a neutral growth tactic bolted onto the side of the
measurement. It **is** the reward contingency whose removal defines the measurement. Adding one does
not bias the instrument; it destroys the thing being measured, and does so harder in children. This
is the same finding that already gives us GC1 and GC6; it simply binds much more tightly once
"comes back on their own" is the primary outcome rather than a nice property.

One caveat worth carrying, since it is the obvious next suggestion: the same meta-analysis found
positive *verbal* feedback enhanced free-choice behaviour (d = 0.33), so praise is not in the same
category as a badge. But it also found verbal rewards *"tended to be less enhancing for children
than college students"*, so it is not a lever to reach for either.

### Most of it is already built

The launcher's backend is not new work. `curatedForCell(library, domainPath, ageTier)` already
returns age-filtered, reputation-ranked resources for a domain path, and `@gt100k/concierge` is a
child-safe RAG pipeline with a curated library behind it. The subtopic-to-links step — the part that
sounds like the hard part — exists. What does not exist is a child-facing list.

The taxonomy is also already the right shape. Patall's optimum is 3–5 options per choice moment, and
`SEED_SUBTOPICS` gives 3 or 4 subtopics in every one of the eight cabins. Nobody designed it for
this and it landed there anyway.

### What it costs, stated plainly

**The in-app depth channel mostly goes away.** "Chose harder work", "unrequired revision" and
"self-authored scope" have no expression in a page of links. This is a real loss and it is the
strongest argument the game had.

It is survivable for one specific reason: our own evidence says that at ages 7 to 8, in-session
telemetry *discriminated nothing* and only the delayed out-of-product probe did
(partial eta-squared .24). A surface that sends a child away and then asks an adult, weeks later,
whether the interest reached the topic itself is **aligned** with that finding rather than working
against it. That makes E10's report channel — built 2026-07-27 — load-bearing rather than a nice
addition, and it means the `focused` versus `broad` coding is now the main depth instrument we have,
not a supplement to a richer in-app one.

### The honest tension nobody should paper over

**We must not induce return, but we must still be able to observe it.** A child who never opens the
app again is indistinguishable, in our logs, from a child with no durable interest — and one of
those is a measurement failure.

The resolution is a distinction, not a mechanic: the app may be worth returning to for a reason
**intrinsic to the pursuit** (it is where the good chess links are) and never for a reason
**extrinsic to it** (points, streaks, notifications, unlocks). The first is the activity; the second
is the contingency Deci measured the removal of. Where the child pursues the topic entirely outside
our product, we do not see it at all and are relying on E10's adult report to catch it. That is a
known blind spot, and it is the right one to have rather than the one where we chase them.

### Design rules that follow

1. **The choice moment is a topic label, not a thumbnail.** Javora et al. found children chose the
   prettier version of the *same* game 62% of the time and learned no more (d > 0.86 preference).
   In a grid of video cards, the thumbnail is most of what differentiates options, so we would be
   measuring thumbnail quality. Text and a uniform icon per subtopic; the links themselves may show
   richer previews *after* the choice is recorded, because by then the choice is already measured.
2. **Uniform presentation across topics.** Same layout, same density, same icon treatment. Any topic
   that looks better than another is a confound with the topic's own signal.
3. **Fixed sets, no personalisation, no ranking by predicted interest.** This is what keeps E4
   interpretable. If resources within a subtopic are ever ordered by anything child-specific, E5
   (`W_SURFACED`, currently unbuilt) stops being deferred and becomes mandatory.
4. **No streak, badge, point, notification or unlock.** See above; this is not a style preference.
5. **Log the offered set, not just the pick.** `SurfacedRecord` already does this at the artifact
   level. A list surface should also record position, which it does not today, so ordering bias can
   be separated from preference.
6. **Reading age.** A two-level text taxonomy assumes a six-year-old can read `agentic-engineering`.
   It cannot. Icons and audio labels are a requirement at the bottom of the band, not a polish item.
   *No evidence gathered on this; flagged as an open design question rather than answered.*
7. **The destination is not ours.** YouTube autoplay and its own recommender will pull a child off
   the chosen topic within a video or two. Our child-safe RAG vets *what we link to*; it says nothing
   about where the child ends up three clicks later. Prefer destinations without autoplay where a
   choice exists, and treat "what happened after they left" as unmeasured rather than assumed good.

---

## Recommendation (as it stood — see §-1 for the ruling)

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
