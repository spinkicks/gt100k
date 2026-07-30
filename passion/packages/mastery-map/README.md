# @gt100k/mastery-map

What getting good at a domain actually involves, as a validated DAG of milestones.

[`@gt100k/specialization-planner`](../specialization-planner) owns **pace** — stage, practice dose, rest,
back-off — and is deliberately domain-agnostic, which left a gap nothing filled: the system could tell a
child it was time for a harder project without knowing that getting good at chess and getting good at audio
production involve different things in a different order. A mastery map supplies that domain knowledge, and
it never touches pace.

Pure and deterministic: no network, no clock, no randomness. Every type is transcribed from
`specs/2026-07-26-mastery-map-slice1.md`, where the reasoning lives.

## The one non-obvious idea: every claim names what it rests on, and the strongest claim available is "more than one thing was made"

Two refusals run through the whole package.

**An ordering decision must declare its basis.** Every `Milestone.ordering` carries a `Justification` with an
`OrderingBasis` of `syllabus`, `research`, `community` or `model`, in descending order of how checkable the
claim is by someone other than us. `model` — the model's own reasoning with no external support — is
permitted and never hidden: `E4_SOURCES_ON_MODEL_BASIS` rejects a model basis carrying sources, and
`W1_MODEL_HEAVY` flags a map where more than `MODEL_BASIS_MAX_SHARE` (34%) of milestones rest on one. Dressing
a chosen default up as science is the fastest way to lose a guide's trust the first time they look closely.

**The package will not say a child has a capability.** `EvidenceStrength` is `none | single | multiple` and
stops there, on purpose. Shavelson, Baxter & Gao (1993) found task-sampling variability dominates the error in
elementary performance assessment — roughly 15 to 23 tasks are needed for a generalisability coefficient of
0.80 — so one artefact is badly underpowered as proof of a capability, and so are three. Asking a person
instead does not rescue the claim, it relocates it: Koretz et al. (1994) measured rater reliability on the
Vermont portfolio program at 0.33 to 0.43. So the vocabulary tops out at a description of quantity, and
Butler (1988) is why the surface must honour that too — a bare verdict with no task anchoring behaved like a
grade and depressed both interest and subsequent performance, which is what `MilestoneRead.evidence` exists
to prevent by carrying the work beside the standing.

`reachable` is the one binary the package does emit, and the gap between it and "has the capability" is
load-bearing. "Should a guide offer this next" has to resolve to yes or no, because the guide either puts the
thing in front of the child or does not. So a prerequisite counts as satisfied **for the purpose of
offering** when it has any evidence at all or a guide override. That bar is deliberately low, and low in the
direction that fails safe: offering something too early costs a child a hard task, which the map already
frames as expected; a high bar costs a child being held at a rung by a measurement nobody in this field can
actually make.

## Entry points

| Export | What it does |
| --- | --- |
| `validateMap(map, now?)` | The gate. Ten error rules and six warnings, all collected — nothing throws, nothing stops at the first. |
| `canPublish(map, now?)` | Whether a map may be put into use: errors empty **and**, when given a clock, resources re-checked within `STALE_AFTER_DAYS`. |
| `applyEdit(map, edit)` | One guide correction, recorded on both sides. |
| `readMap(map, evidence, overrides, stage)` | Every milestone, ordered, read against what one child has made. |
| `guideOverride(id, actor, at, note)` | A guide's call that a prerequisite should not hold the next thing up. |
| `servesPath` / `samePath` | Which map a domain resolves to. |
| `MapGenerator`, `MapStore` | The two ports, with `stubMapGenerator` and `createMemoryMapStore` for CI. |

### The validator is the whole of the machine-checkable claim

Nobody available to us can certify that an ordering of a domain is correct — a guide is not a chess master,
and a signature from someone with no basis for giving it is worse than no signature, because it looks like
review. `MasteryMap.vettedBy` is therefore optional and is **not** a precondition for use. What is checkable
is checked mechanically: the `requires` graph is a DAG with no dangling edges (`E1`), ids are unique
(`E10` — a duplicate hides a whole milestone, so a cycle through the hidden one is invisible to `E1`), a
prerequisite is never gated later than what it unlocks (`E6`), a branch claims only modes the domain affords
(`E7`), resources carry provenance and cover a band the map claims (`E5`), and no prose names a time by which
a child should arrive (`E9`) — a forecast becomes a quota, and a quota is the family pressure the wellbeing
engine exists to catch.

`E3` is the one worth understanding before writing a map: a milestone's `capability` must share a content
word with its `demonstration`, which is a crude but effective test that the milestone cannot be finished by
consuming something. It has known false positives (`compose` does not match `composition`, because no
stemmer runs) and they are kept deliberately — a stemmer would also make `play` match `player`, widening an
error-level gate into passing the milestones it exists to catch. A rejected author rewords one sentence; a
milestone waved through is one nobody looks at again.

`E8` scans **field names** against `@gt100k/guardrails`'s real `SCALAR_KEYS` and `GAMIFICATION_KEYS` lists,
never a local copy, and scans keys rather than prose because a milestone that mentions a rating is
legitimate domain language.

### An edit invalidates the map, by design

`applyEdit` may only touch `title`, `capability` and `demonstration` — prose a guide can read and judge,
which is the whole basis on which they are allowed to change anything here. `stageFloor`, `requires` and
`ordering.basis` are the claims the validator gates, and a hand edit to one of those is a change nobody has
checked.

Every edit records `before` and `after`, bumps `version`, marks the milestone `human-edited`, sets `status`
back to `draft`, and **replaces the `ValidationRecord` with one carrying an `UNVALIDATED_SINCE_EDIT` error**
so `canPublish` refuses until the validator has run again. A map claiming a passing validation of a sentence
that has been replaced is worse than one claiming nothing, because it looks checked. Keeping both sides of
the change is what makes "did human-edited maps produce better outcomes" answerable at all: the edit
overwrites the only copy of what the model proposed.

### Resolution widens, and only on absence

`MapStore.get` performs the fallback itself so no caller reimplements it: a spike on
`["games-strategy", "chess"]` resolves to the chess map when one exists and to the `["games-strategy"]` map
when it does not. Three properties matter. The two maps are **never merged** — a merged DAG is one nobody
authored and nobody validated. The widening never goes **down**, because a map about chess is not a map about
strategy games. And `get` widens on **absence, never on invalidity**: a map carrying an error is not returned
at all, because answering a question about chess with a map about games in general, because the chess map has
a problem, is a silent swap the caller cannot see. `getForReview` is the unfiltered accessor for the review
screen — a draft nobody can see is a draft nobody can fix — and must never be called on a path that leads to
a child. `put` uses optimistic concurrency on `version`, since two guides editing one map is a real case and
last-write-wins would silently discard one of them.

### `readMap`'s order is a function of the map alone

Stage floor ascending, then prerequisite depth, then id, then a content fingerprint of the milestone itself.
The last two keys decide nothing on a well-formed map and exist so the answer cannot depend on array order —
including on the maps the validator rejects, which this function still has to be total over. Depth is
computed with back edges dropped, where a back edge is identified from the graph rather than from the walk,
so a map with a cycle in it yields the same numbers whichever end it is handed.

## Deliberately absent

- **No pace, no advancement.** `Milestone.stageFloor` says the earliest stage something is appropriate at.
  The map never moves anyone; `stage` is a parameter to `readMap` because the planner owns the one ladder in
  this system and this module must not become a second one that fights it.
- **No grade, and no hours target.** `PracticeForm` describes what repeated effort looks like and refuses to
  quantify it: deliberate practice explains 26% of variance in games and its central study failed to
  replicate, so an hours figure would be the weakest claim available.
- **No reaching into the world.** `OpportunityHint` is advisory. Real-world contact and guardian consent
  belong to `@gt100k/access-broker`, and where a hint's `stageFloor` disagrees with the planner's audience
  ladder, the planner wins.
- **No fetching.** `MapGenerator` receives its resources on `MapContext`, drawn from the concierge's curated
  library where a human already approved them. A generator that fetched its own would walk straight past the
  one place in this pipeline where a person checks what a child will see. Be precise about the claim: the
  ordering is software-decided, the resource safety is not.

## A caveat worth knowing before you read output

Almost nothing above `S2_FOUNDATIONS` is reachable by any child today. `deriveStage` requires
`stretchSeeking` for both higher stages, `stretchSeeking` derives solely from `chosen_challenge`, and only
one gadget of nine currently asks for it — so that signal arrives through a single cell. Every branch
milestone sits at or above `S3_AUTHORSHIP`. A trunk-only reachable set is therefore the **ordinary** output
of `readMap` rather than a fault in it, and `W3_EARLY_BRANCH` carries the same caveat in its message because
a guide reads the message and not the spec.

```sh
pnpm --filter @gt100k/mastery-map test
```
