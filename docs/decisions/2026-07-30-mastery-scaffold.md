# Deriving a general mastery scaffold from one real map

**Status:** Design agreed, not yet built.
**Date:** 2026-07-30
**Why now:** we are asked what the product does to take a child to the top of a domain, and today
`MasteryMap` is a static description of a domain with no child's position on it. It cannot scaffold
anyone, because nothing knows where anyone is.

---

## 0. The honest version of the question

The question that prompted this was "what is the process to get a kid to grandmaster by 8th grade".

The truthful answer is that **grandmaster by 8th grade describes roughly a dozen human beings who
have ever lived.** The youngest GM on record, Abhimanyu Mishra, made the title at 12 years 4 months
after full-time training with private coaches and paid-for norm tournaments abroad. A product that
implies it can produce that outcome is selling something it cannot deliver, and every claim in
`passionBrainlift.md` is written specifically to avoid that failure.

What we can honestly claim is narrower and still worth a great deal:

> We can give a child the *real* ladder for their domain, keep them on it voluntarily, and produce a
> record that proves how far up it they actually climbed and that the climbing was theirs.

That is the thing elite admission actually reads (`passionBrainlift.md` line 11: what makes this
student singular, and how can we prove it to an external viewer). It is not a grandmaster factory.
Everything below is built to that claim and no further.

---

## 1. What transfers between domains, and what does not

Chess is the most favourable domain that exists for this work. It has a federation, a numeric
rating, engines, four centuries of codified theory, and a published curriculum. Sewing has none of
those. So before deriving anything from chess we have to be precise about what we think travels.

**Decided: the structure and the method transfer. The ladder does not.**

| Layer | Transfers? | Why |
|---|---|---|
| **Structure** — milestone DAG, capability statements, an external judge per rung, a demonstration artefact | Yes | This is a container. It carries no chess-specific content and `MasteryMap` already assumes it. |
| **Method** — how repeated effort is organised | Yes, but only as domain-general learning principles | See §2. |
| **Ladder** — rungs, ratings, titles | **No** | Forcing an Elo-shaped ladder onto domains that have none means inventing fake ones, which is precisely the failure `OrderingBasis` was written to prevent. A map whose ordering basis is `model` is permitted but flagged; a map that *pretends* its invented ladder is a syllabus is a lie the validator cannot catch. |

### Why the ladder must not transfer

`OrderingBasis` already ranks the evidence behind a milestone ordering: `syllabus` (a federation
rating syllabus, ABRSM grades, an olympiad ladder) > `research` > `community` > `model`. Chess sits
at the top of that scale. Woodworking sits at the bottom. Exporting chess's ladder to woodworking
would let a `model`-basis ordering wear a `syllabus`-basis costume, and the whole point of the type
is that a guide can see which one they are looking at.

---

## 2. The method layer: principles, not chess archetypes

**Decided: `PracticeForm` gets tagged with the domain-general learning principle it instantiates.
Nothing else transfers.**

The temptation is to generalise chess's practice archetypes — calibrated tactics sets, engine
post-mortems, graded opposition — into forms every domain must map onto. We are not doing that,
for a specific empirical reason.

Macnamara, Hambrick & Oswald (2014) measured how much of the variance in performance deliberate
practice explains, by field:

| Field | Variance explained |
|---|---|
| **Games** (chess, Scrabble, bridge) | **26%** |
| Music | 21% |
| Sports | 18% |
| Education | 4% |
| Professions | < 1% |

"Games" in that meta-analysis is essentially the chess figure, and it is the **best case in the
entire dataset.** Deriving a training method from chess and porting it outward means exporting from
the most practice-responsive domain to far less responsive ones. The archetypes are artifacts of
chess happening to have engines and puzzle databases; they are not findings.

What *is* domain-general, with evidence that holds across fields, is the underlying principles.
So each `PracticeForm` gains a tag naming which it instantiates — spacing, retrieval practice,
interleaving, feedback latency, desirable difficulty — and chess supplies worked examples of those
principles, never the principles themselves.

The existing `PracticeForm` already refuses to carry an hours target, on the grounds that deliberate
practice explains 26% of variance in games and its central study failed to replicate. The principle
tag is the same discipline applied one level up.

### One thing chess did legitimately contribute

`PracticeForm.solitary` exists because Charness et al. (2005) found solitary study predicts
tournament rating better than tournament play does. That is a chess finding already baked into the
general model, and it is fine there: it is a claim about a *form* of practice being undervalued by
adults watching, which is a bias about observers, not about chess.

---

## 3. The chess map, and a hard case beside it

**Decided: author chess first, and validate the derived structure against a domain with no ladder,
no engine and no rating, in parallel.**

If the structure only works for chess we will have learned that cheaply. If it survives both, it
generalises. Authoring chess alone and declaring the result general would be the single easiest way
to fool ourselves here.

The hard case is an **academic-adjacent pursuit that survives the catalogue cut**
(`2026-07-30-catalogue-scope.md` §4a) — Robotics, Rocketry or an astronomy pursuit, chosen once the
audit lands. Speedcubing was the first choice and was dropped: it is on the cut list, and validating
the scaffold against a pursuit we are removing would prove nothing.

This weakens the test, and the weakening should be stated rather than glossed. Robotics and Rocketry
both have real competitive ladders (FIRST, NAR/TARC), so they are considerably closer to chess than
Woodworking would have been. A structure that survives chess and Robotics has been shown to work
for two ladder-bearing domains, which is a narrower claim than "it generalises". If the surviving
catalogue turns out to contain no ladder-free pursuit at all, then the generality question becomes
moot for this product, and §1's claim that the structure transfers should be marked untested rather
than proven.

### Ordering basis for the chess map

Chess is one of the few domains where we can claim `syllabus` honestly:

- **The Steps Method** (Stappenmethode), Steps 1–6 — a genuine published curriculum in wide
  institutional use, and the strongest single basis available.
- **US Chess / FIDE rating classes** — an external, numeric, public ladder.
- **Charness et al. (2005)** and the chunking literature (de Groot; Gobet & Simon) for `research`
  basis where the syllabus is silent on *why* an ordering holds.

Anything we cannot ground in those gets `basis: "model"` and carries the validator warning. It does
not get dressed up.

---

## 4. We do not build the learning app

**Decided: the map points outward.** If the optimal chess map calls for rated games every week,
chess.com already exists and we are not rebuilding it. The map's job is to say what the climb
consists of and who judges each rung; the climbing happens wherever that domain actually happens.

This is settled, and it creates the problem in §5.

---

## 5. The real blocker: nothing knows where a child is

Two facts, both verified in the code today:

1. **There is no per-child map progress anywhere in the system.** No attestation, no completion, no
   position. `MasteryMap` is a domain description a guide reads.
2. **If the learning happens off our surfaces, no signal reaches us at all.** The inference engine
   reads interactions with our own surfaces. A child playing ten hours of rated games a week on
   chess.com emits exactly zero.

Together these mean the map cannot currently scaffold anyone, and §4 guarantees the gap rather than
closing it.

### The mechanism: the demonstration artefact, examined

Every milestone already carries a **`demonstration`** field — *"the artefact that shows the
capability"*, with a comment noting this is what makes leaving costless, since a child who parks a
domain keeps everything they made. That field was designed for exactly this and has been unused.

The mechanism is:

1. The child does the work in the world — plays the games, builds the thing.
2. They bring back **external links** as the artefact: chess.com game URLs, a WCA result page, a
   published episode.
3. The **Socratic tutor examines them.** A milestone attestation is a `socratic-defense` session
   scoped to a milestone, and the engine already probes the six facets it needs — `what`, `why`,
   `how`, `challenge`, `next`, `audience` — with per-facet coverage scoring.
4. The tutor logs the links into the evidence graph, and the session's judgment is the attestation.

**Why links plus defense is strong.** A chess.com game URL is a public record on a third party's
server; the child cannot fabricate the game. What a link cannot prove is that *they* played it — and
that is exactly what the defense catches, because a child who did not play a game cannot explain
their own decisions inside it. This is the brainlift's central argument (SPOV 5) applied to a new
artefact type: the process plus a short human-examined defense, because neither alone is enough.

**The gap to design around.** Linking games does not prove account ownership. The cheap fix is to
bind the account **once** rather than re-prove it per game, and treat subsequent games from that
account as covered. This is a one-time verification, not a per-milestone tax.

**Why this matters beyond map position.** The admissions research in
`2026-07-30-catalogue-scope.md` §2 found that elite institutions built verification channels for
some domains and not others: faculty portfolio review for music, art and making, a second rating
axis for academic competition, coach advocacy for athletics, and for games and puzzle sports
nothing at all — the Common App has no category for them, so a world ranking arrives as free text
under "Other." Attestation is therefore not only how the map knows where a child stands. It is the
missing channel: an external party who looked at the work and stands behind it, which is
structurally what an audition tape that impressed the music department is. That makes it worth more
in the domains that have no channel of their own, which is the opposite of where we would have
guessed.

**What this deliberately does not do.** No venue API integrations. Chess.com has an API and the WCA
publishes rankings, but that is N integrations for N domains and most of the 44 pursuits have no API
at all. If a domain later earns the integration on its own merits, fine; it is not the mechanism.

---

## 6. The stage ceiling, noted and left alone

`deriveStage` requires `stretchSeeking` to advance past `S2_FOUNDATIONS`, and `stretchSeeking`
derives solely from `chosen_challenge`, which only 5 of 15 gadgets can emit and no external pursuit
emits at all. Every branch milestone sits at `S3_AUTHORSHIP` or above.

This is a real constraint on the *discovery* side and it is out of scope here, because §4 moves the
climb off our surfaces entirely. It is recorded so that nobody later mistakes an unreachable upper
ladder for a map-authoring failure. The comment in `select.ts` claiming only Nonogram sets
`supportsTier` is stale and should be corrected to five.

---

## 7. Deliverables

1. **A real chess map**, grounded in the Steps Method and FIDE rating classes, with every ordering
   justified and every `model`-basis ordering flagged as such.
2. **The derivation**, which is the authoring method: what we did to write the chess map, stated so
   that a second author can write a map for a domain we have never touched. §1 and §2 are its first
   two rules.
3. **The progress mechanism** of §5 — milestone attestation as a scoped defense session over
   external links.

A map with no position on it cannot scaffold anyone, so (3) is not optional and not deferrable.

---

## 8. What would falsify this

- If the chess map's structure cannot be filled for the hard case in §3 without every ordering
  collapsing to `basis: "model"`, then the structure is chess-shaped and we have not generalised.
- If milestone attestation via defense turns out to gate on adult availability at a rate that makes
  climbing slower than the child's own motivation, the mechanism is honest but unusable, and the
  wellbeing engine will show it as pressure.
- If children bring back links they cannot defend at any meaningful rate, the artefact type is wrong
  and the problem is not the examination.
