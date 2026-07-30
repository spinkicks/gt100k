# Mastery Maps, slice 1: the map itself

**Status:** built. `@gt100k/mastery-map` ships the model, the validator, the generator port with its
deterministic stub, the golden fixtures and persistence, and the guide console carries the review
screen. Two things listed here as out of scope have since been built: slice 2 reads a map against a
child, and a live generator adapter exists.
**Design:** [`2026-07-25-mastery-map-design.md`](2026-07-25-mastery-map-design.md). Read it first;
this document does not restate the reasoning, only what to build.
**Date:** 2026-07-26

## 1. Scope

**In:** the `MasteryMap` domain model, the generator behind a typed port with a deterministic stub for
CI, the validator, persistence, and the guide's review screen.

**Out:** any child-facing surface, per-child selection from a map, real-world opportunity brokering
beyond hints, the admissions portfolio, and child login (G3, a pre-live gate).

**New package:** `@gt100k/mastery-map` in `passion/packages/mastery-map`. Pure, deterministic,
no network, no clock, no randomness, following every other engine.

> **Cleared (2026-07-27).** `chosen_challenge` is emitted now: the game's harder-variant control
> records it, emission is on, and a session reaches the orchestrator through the console's ingest
> route. Branch milestones are reachable in principle, through exactly one gadget — the only one that
> offers a harder variant — so the caveat on warning rule 3 should now say that rather than saying
> nothing emits the signal. The trunk-only fixture requirement stands on its own merits.

**Named dependency, and it does not block this slice.** No child can currently be placed above
`S2_FOUNDATIONS`. `deriveStage` in `specialization-planner/src/stage.ts` requires `stretchSeeking`
for both `S3_AUTHORSHIP` and `S4_SIGNATURE`, `stretchSeeking` derives solely from
`chosen_challenge`, and nothing in production emits that event. This is escalated in PR #163 and is
not ours to fix here. Slice 1 still builds, because a map is authored independently of who can
currently reach it. What it means is that **branch milestones are unreachable until
`chosen_challenge` becomes observable**, so warning rule 3 carries the caveat rather than stating a
bare floor (§5), and the golden fixtures must contain a reachable trunk-only path (§8). Without
that, the goldens would encode a map no child can enter and the tests would be asserting on dead
structure.

## 2. The ordering rule, which is the heart of this slice

**Every ordering decision carries a justification, and every justification names what it rests on.**
A recognised syllabus is the strongest kind of support, not a separate mechanism. Where no syllabus
exists the model justifies the ordering from research or from named community consensus, and where it
has neither it must say so rather than sound equally confident.

This is the same principle as `Basis` in `@gt100k/research`, whose own comment is the rule here too:
dressing a chosen default up as science is the fastest way to lose a guide's trust the first time
they look closely. The vocabulary is separate because the question is different, but `Source` is
reused directly rather than redefined.

```ts
import type { Source } from "@gt100k/research";

/** What an ordering decision actually rests on, strongest first. */
export type OrderingBasis =
  /** A recognised published curriculum: a federation rating syllabus, ABRSM/Trinity grades,
      an olympiad ladder. Proven and external, so the claim is checkable by someone other than us. */
  | "syllabus"
  /** Peer-reviewed or otherwise citable research about how this skill develops. */
  | "research"
  /** Named community consensus: an established forum's progression guide, a widely used
      practice curriculum with no formal standing. Real, but not authoritative. */
  | "community"
  /** The model's own reasoning with no external support. Permitted, never hidden, and the
      validator caps how much of a map may rest on it (§5). */
  | "model";

export interface Justification {
  /** One plain sentence: why this milestone sits here, and after those. */
  readonly reason: string;
  readonly basis: OrderingBasis;
  /** Required for syllabus, research and community. MUST be empty for `model`. */
  readonly sources: readonly Source[];
  /** Honest caveat: contested, thin, or drawn from a different population or age band. */
  readonly limit?: string;
}
```

## 3. Domain model

```ts
import type { DomainPath, WorkMode } from "@gt100k/two-axis-tagging";
import type { Stage } from "@gt100k/specialization-planner";
import type { AgeTier, CuratedResource } from "@gt100k/concierge";
import type { HumanActor } from "@gt100k/hypothesis-store";

export interface MasteryMap {
  /** Stable identity, independent of `domainPath`, because the taxonomy will move (§10). A
      re-generation of the same domain replaces the map at this id rather than creating a rival. */
  readonly id: string;
  /** Bumped on every stored change. The optimistic-concurrency token for `MapStore.put` (§4). */
  readonly version: number;
  /** A map belongs to a DOMAIN, not a cell. Modes are branches (design §3). */
  readonly domainPath: DomainPath;
  /** The modes this domain affords. Every `Milestone.modes` must be a subset of this (§5, error 7),
      so a branch cannot claim a mode the domain does not have. */
  readonly modes: readonly WorkMode[];
  /** Plural on purpose. A map runs S1 to S4, which is roughly ages 6 to 14, so one tier cannot
      express what it covers. Validator rule 5 checks each resource covers at least one of these. */
  readonly ageBands: readonly AgeTier[];
  readonly milestones: readonly Milestone[];
  readonly provenance: MapProvenance;
  /** Whether the map is VALID (§6). Errors must be empty to publish. */
  readonly validation: ValidationRecord;
  /** Whether the map is IN USE (§6). A different question from validity, kept separate so that
      withdrawing a map does not have to pretend the map became invalid. */
  readonly status: MapStatus;
  /** OPTIONAL human review. Not a precondition for use: no human here can certify domain
      correctness, and the child-affecting gates are downstream and already human-owned (§6). */
  readonly vettedBy: HumanActor | null;
  readonly vettedAt: string | null;
  /** ISO-8601. Resources rot; see §7. */
  readonly revalidatedAt: string;
}

export type MapStatus = "draft" | "published" | "withdrawn";

export interface Milestone {
  readonly id: string;
  /** Plain language. A child could read it. */
  readonly title: string;
  /** What the child can DO afterwards. Never what they consumed. */
  readonly capability: string;
  /** Milestone ids. The DAG edges. */
  readonly requires: readonly string[];
  /** Empty = trunk, serves every mode in the domain. Non-empty = a branch, and every entry must
      appear in `MasteryMap.modes`. */
  readonly modes: readonly WorkMode[];
  /** Earliest stage this is appropriate at. The map never advances anyone (design §6). Note the
      dependency in §1: nothing above `S2_FOUNDATIONS` is reachable by any child today. */
  readonly stageFloor: Stage;
  /** Why here, and after those. */
  readonly ordering: Justification;
  readonly resources: readonly CuratedResource[];
  readonly practice: readonly PracticeForm[];
  /** The artefact that shows the capability. This is what makes leaving costless (design §9). */
  readonly demonstration: string;
  readonly opportunities: readonly OpportunityHint[];
  readonly authorship: Authorship;
}

/** What repeated effort looks like here. Deliberately not a duration or a count: the planner owns
    dose via dpDose, and an hours target would be the weakest kind of claim (design §13.5). */
export interface PracticeForm {
  readonly title: string;
  readonly description: string;
  /** Solitary analysis is often the highest-yield mode and the least visible to adults
      (Charness et al. 2005), so the map records which it is and the UI must not bury it. */
  readonly solitary: boolean;
}

/** A hint only. The access broker (023) owns real-world contact and guardian consent is a hard
    blocker there. A map may say tournaments exist; it may never reach into the world. */
export interface OpportunityHint {
  readonly kind: "competition" | "showcase" | "community" | "mentorship";
  readonly description: string;
  readonly readinessNote: string;
  /** Overlaps the planner's `AUDIENCE_BY_STAGE`, which already maps stage to audience level
      (SELF, MENTOR_PEERS, REAL_COMMUNITY, FIELD) in `specialization-planner/src/plan.ts`. This is
      a domain author's note about one specific opportunity, not a second audience ladder. Where
      the two disagree the planner is authoritative and this is advisory. */
  readonly stageFloor: Stage;
}

export type Authorship = "model" | "human-edited" | "human-authored";

export interface MapProvenance {
  readonly model: string;
  readonly promptVersion: string;
  readonly generatedAt: string;
  /** Every edit a human made, so the record shows how the map was actually built (design §10). */
  readonly edits: readonly MapEdit[];
}

export interface MapEdit {
  readonly milestoneId: string;
  readonly actor: HumanActor;
  readonly at: string;
  readonly field: string;
  /** The values either side of the edit, serialised. Recording only the field name makes "did
      human-edited maps produce better outcomes" (design §10) unanswerable, because the edit
      overwrites the only copy of what the model proposed and leaves nothing to compare. */
  readonly before: string;
  readonly after: string;
  readonly note?: string;
}
```

## 4. Ports

The engine stays pure. Everything that touches a network sits behind a port with a deterministic stub
used by CI, exactly as `ProjectBriefGenerator` already does in 018.

```ts
export interface MapGenerator {
  generate(ctx: MapContext): Promise<MasteryMap>;
}

export interface MapContext {
  readonly domainPath: DomainPath;
  readonly modes: readonly WorkMode[];   // the modes this domain affords
  /** Plural for the same reason `MasteryMap.ageBands` is: a map spans S1 to S4, so it spans age
      tiers. Concierge's `AgeTier`, deliberately NOT a fourth local copy. See the note below. */
  readonly ageBands: readonly AgeTier[];
  /** Drawn from the concierge's curated library, whose entries a human approved. The generator
      attaches, never fetches. */
  readonly resources: readonly CuratedResource[];
}

export interface MapStore {
  /** Most specific match wins; see below. */
  get(domainPath: DomainPath): Promise<MasteryMap | null>;
  /** Optimistic concurrency: rejects unless the stored map's `version` is exactly
      `map.version - 1`. Two guides editing the same map is a real case, and last-write-wins would
      silently discard one of them. On rejection the caller re-reads and re-applies. */
  put(map: MasteryMap): Promise<void>;
  listDrafts(): Promise<readonly MasteryMap[]>;
}
```

**The generator never fetches its own resources.** They come from the concierge's curated library,
and that library is **human-vetted upstream**: the concierge's tenth stage is a vet queue where a
person approves an entry into the library or rejects it (`concierge/src/promote.ts`). That is
deliberate child-safety design and this slice does not weaken it. A generator that fetched directly
would bypass all of it. So be precise about the claim this slice makes: the **ordering** is
software-decided, the resource safety is not.

**Which map a child resolves to.** `DomainPath` is `readonly [CabinId] | readonly [CabinId, string]`,
so a cabin map and a sub-topic map can both exist. The most specific match wins: a spike on
`["games-strategy", "chess"]` resolves to the chess map when there is one and falls back to the
`["games-strategy"]` map when there is not. `get` performs that fallback itself so no caller
reimplements it. The two are never merged, because a merged DAG is one nobody authored and nobody
validated.

**Do not define a fourth age type.** `"6-8" | "9-11" | "12-14"` is currently declared three times:
`AgeBand` in access-broker, `AgeBand` in project-workspace, and `AgeTier` in concierge. This package
imports concierge's `AgeTier`, because that is the type the resources it checks are already tiered
by. Consolidating the other two is a worthwhile small cleanup and is explicitly not part of this
slice.

## 5. The validator

Pure, synchronous, total. Returns every problem rather than throwing on the first. A map with any
**error** cannot be published.

**Errors:**
1. `requires` forms a DAG. No cycles, and every id resolves to a milestone in the same map.
2. Every milestone has a non-empty `capability` and `demonstration`.
3. `capability` references the artefact named in `demonstration`. At least one content word of
   `demonstration`, ignoring stopwords, appears in `capability`. This replaces a banned-verb list
   and it targets the failure the verb list was aiming at: a milestone you can finish by consuming
   something is one whose capability does not mention anything you made. It is decidable, which the
   verb list was not.
4. Every milestone's `ordering.sources` is non-empty **unless** `basis` is `model`, and is empty
   **when** `basis` is `model`.
5. Every `CuratedResource` carries a `provenance` and an `ageTiers` entry covering at least one band
   in the map's `ageBands`. At least one, not all: a map spanning 6 to 14 will legitimately hold
   resources pitched at one end of that range.
6. A milestone's `stageFloor` is at or above the floor of everything it requires. A prerequisite
   cannot be gated later than the thing it unlocks.
7. Every entry in `Milestone.modes` appears in `MasteryMap.modes`. A branch serving a mode the
   domain does not afford is unreachable by construction.
8. No banned field name anywhere on any type. **Import the real lists rather than restating a
   different one:** `SCALAR_KEYS` (`score`, `rating`, `passionScore`, `label`) and
   `GAMIFICATION_KEYS` (`streak`, `points`, `reward`, `xp`, `badge`, `leaderboard`), both already
   exported from `@gt100k/guardrails`. The scanner they are used with, `scanBannedKeys` in
   `guardrails/src/checks.ts`, is module-private today, so add `export` to it and let the barrel
   carry it. Writing a second scanner here would give us two lists that drift. **The `rating` entry
   is a real tension and the resolution is deliberate:** a chess milestone whose prose mentions a
   rating band is legitimate domain language, and this rule never touches prose. What is banned is
   a *field* called `rating`. The scan is over keys, never over values.
9. No forecast in the named prose fields: `Milestone.ordering.reason`, `OpportunityHint.readinessNote`
   and `PracticeForm.description`. The check is for a date, an age or a timeframe by which a child
   should reach something (design §8). Scoped to those three on purpose. `generatedAt`,
   `validatedAt`, `vettedAt` and `revalidatedAt` are timestamps about the map, not forecasts about
   a child, and an unscoped "no dates" rule would reject all four.

**The completion-percentage ban is not an error here, because the data model cannot enforce it.**
`milestones` is an array. `done / total` is one division away for any consumer, and no validator
over this shape can prevent that. A rule claiming otherwise would be a guardrail that only looks
like one, which is the failure mode this whole spec is about. The ban stands, as a **UI-layer
invariant with its own test**: no guide-facing or child-facing surface renders a completed-milestone
count, a fraction, a percentage or a progress bar over a map (design §9). It is tested where it can
actually be tested, in the surface, not in the engine.

**Warnings** (a guide sees them, they do not block):
1. More than `MODEL_BASIS_MAX_SHARE` of milestones rest on `basis: "model"`. A map mostly justified
   by the model's own confidence is the case the ordering rule exists to expose.
2. The map has no `syllabus`-based milestone at all, so nothing is externally anchored.
3. A branch milestone sits below expert entry, `S3_AUTHORSHIP`. Divergence is expected at expert
   entry, so an early branch is suspicious (design §3). **The §1 caveat rides along with it, in the
   warning text a guide actually reads:** no child can be placed above `S2_FOUNDATIONS` today, so
   every branch is unreachable at every height. That is why this is a note about expert entry
   rather than a bare `S3_AUTHORSHIP` floor, and why it never becomes an error. Telling an author
   to raise a branch, while no branch is reachable at any height, is advice we cannot yet stand
   behind.
4. The trunk is less than `TRUNK_MIN_SHARE` of the map. Possible, and the design says so, but worth
   a look.
5. `revalidatedAt` is more than `STALE_AFTER_DAYS` old. Surfaced in the review screen; see §7. The
   re-check job itself is out of scope.
6. `capability` opens with a consumption verb (`watch`, `read`, `listen to`, `review`, `study`,
   `learn about`, `understand`). A warning and not an error, for two reasons. It is incomplete: it
   misses gerunds and any capability phrased as a noun with no leading verb. And it is wrong often
   enough to matter, because it penalises the analytic mode, which design §3 identifies as the
   highest-yield one. "Review a peer's game and publish the annotation" is a legitimate analytic
   capability and an error-level rule would reject it. Error 3 is the check that actually catches
   consumption.

### The validator's own constants are chosen defaults, not measurements

The central rule of this spec is that every ordering decision names what it rests on, so the
validator's own numbers have to meet that standard. All four are `chosen` in the sense
`@gt100k/research` uses the word: our own defaults, defensible, picked by us, not derived from a
study. Each is exported as a named constant carrying this reasoning in its doc comment, so a reader
who disagrees can see it is a default rather than a result.

| Constant | Default | What it rests on |
|---|---|---|
| `MODEL_BASIS_MAX_SHARE` | 0.34 | Chosen. About a third, so a map can lean on the model where a domain genuinely has no external anchor without the map becoming mostly unsupported. No study sets this. |
| `TRUNK_MIN_SHARE` | 0.20 | Chosen. Design §3 puts confidence in the trunk model at roughly 70% and says an almost-empty trunk is a legitimate outcome, so this flags rather than blocks. |
| The branch floor, `S3_AUTHORSHIP` | `S3_AUTHORSHIP` | The closest to evidence-backed of the four, and still partly chosen. The separation is a finding (Charness et al.'s tenth year, Bilalić et al.'s titled players only); mapping it onto our four-stage vocabulary is ours. |
| `STALE_AFTER_DAYS` | 90 | Chosen. A quarter is short enough to catch link rot and long enough not to churn. Nothing measures resource decay rates for us. |

## 6. Software gates the ordering; the human gate is downstream and already exists

**The validator is the gate on the ordering.** A map that passes §5 is publishable without a human
signing it off. No human certifies domain correctness, because nobody available to us can: a guide
is not a chess master, and asking them to approve an ordering they cannot evaluate manufactures a
rubber stamp and calls it oversight.

The resource half of a map is a different matter and is not software-gated. Those resources are
human-vetted upstream in the concierge (§4), by design, and this section makes no claim about them.

This does not weaken "the system proposes, a human disposes", and it is worth being precise about
why. **A map is domain knowledge, not a decision about a child.** Nothing in a map reaches a child
until a human promotes a hypothesis and approves a plan, and both of those are already human-owned
gates that this slice does not touch. Adding a third gate at the map would not add oversight; it
would add a signature from someone with no basis for giving it, which is worse than no signature
because it looks like review.

So `vettedBy` records **optional** human review, and is not a precondition for use. What a map must
have is a passing `ValidationRecord`.

```ts
export interface ValidationRecord {
  readonly validatedAt: string;
  readonly validatorVersion: string;
  readonly errors: readonly ValidationProblem[];   // MUST be empty to publish
  readonly warnings: readonly ValidationProblem[]; // surfaced, never blocking
}

export interface ValidationProblem {
  /** Stable across wording changes, so tests and the review screen key on this and not on prose:
      `cycle`, `dangling-require`, `empty-capability`, `capability-artefact-mismatch`,
      `sources-on-model-basis`, `missing-sources`, `age-band-gap`, `missing-provenance`,
      `inverted-stage-floor`, `mode-not-afforded`, `banned-key`, `forecast`, and one per warning. */
  readonly code: string;
  readonly severity: "error" | "warning";
  /** The milestone it concerns, when it concerns one. Map-level problems omit it. The review
      screen uses it to place a problem inline at its milestone rather than in a list at the top. */
  readonly milestoneId?: string;
  /** Plain language, written for a guide. Not a stack trace, and never the only thing a caller
      can branch on: that is what `code` is for. */
  readonly message: string;
}
```

`MasteryMap.vettedBy: HumanActor | null` stays, meaning "a human has looked at this", and
`MasteryMap.validation: ValidationRecord` is added and is what actually gates publication.

### Validity and use are separate, and `status` is why

**Publication takes two things.** `validation.errors` must be empty, which says the map is valid,
and `status` must be `"published"`, which says someone decided to use it. They answer different
questions, and collapsing them into "errors are empty" leaves no way to express a map that is
perfectly valid and deliberately not in use.

| Transition | Requires | Effect on `validation` |
|---|---|---|
| `draft` to `published` | `validation.errors` empty and `validatedAt` not stale | none |
| any to `withdrawn` | nothing; a guide's call | **none.** Withdrawing is a decision about use, not a finding of invalidity |
| `withdrawn` to `published` | re-validation, then the same check as above | replaced by the fresh record |
| any to `draft` | an edit lands | replaced by the fresh record after re-validation |

An edit stales `validatedAt` the moment it lands, so an edited map returns to `draft` and is
re-validated before it can be published again.

### The review screen

Still built, because a guide should be able to see and correct what the software produced. It is a
review surface, not a gate. A tab in the guide console, GT identity, shared token contract.

Per milestone it shows the title and capability in plain language, then the ordering justification
**with its basis rendered exactly like a research claim**, so a `model`-basis milestone visibly
differs from a `syllabus`-backed one. Then resources with their age tiers, and the demonstration
artefact. Validator problems appear inline at the milestone in their `milestoneId`.

**This needs a new component, not a reuse of `WhyThis`.** `guide-console/app/why.tsx` takes an
`id: string` and looks the claim up in the static research registry, and an ordering justification
is per-milestone data with no registry entry. Its `BasisTag` renders research's three-valued `Basis`
(`evidence`, `chosen`, `policy`), not the four-valued `OrderingBasis`. So build a component that
follows the same visual language and takes its data as a prop: the same popover shape, the same
quiet secondary affordance, the same "honest limit" line, and the same "no published source: this is
a default we picked" fallback for a `model` basis.

A guide can **edit** (recorded in `provenance.edits` with its before and after, and returning the
map to `draft` for re-validation) or **withdraw** the map, which sets `status: "withdrawn"` and
leaves `validation` untouched. Both are corrections to software output, which is a judgment they can
make: they can see that a resource is wrong for a nine-year-old even when they could not have
ordered the milestones themselves.

## 7. Freshness

`revalidatedAt` is set on generation and on each re-check. A map is stale once it is more than
`STALE_AFTER_DAYS` old, defaulting to 90 and chosen rather than measured (§5). Slice 1 stores the
field, warns on staleness, and surfaces it in the review screen; the re-check job itself is out of
scope. Staleness is a warning and not an error, because a stale map is out of date rather than
wrong, and blocking on it would take working maps out of use on a timer.

## 8. Tests

Standard for this repo: pure engine, deterministic fixtures, golden values derived by hand and then
confirmed, never pasted from output.

- **Validator:** one test per error rule and per warning rule, each asserting the specific
  `ValidationProblem.code` is reported and that a valid map reports none. Cycles, dangling
  `requires`, a `capability` that names no artefact from its `demonstration`, missing sources,
  sources present on a `model` basis, age-band gaps, an inverted `stageFloor`, a mode the domain
  does not afford, a consumption verb (warning, not error).
- **Guardrails:** a banned key anywhere fails, driven by the real `SCALAR_KEYS` and
  `GAMIFICATION_KEYS` rather than a local copy. A milestone whose prose mentions a rating band
  passes, while a field named `rating` fails, since that distinction is the whole point of rule 8.
  A forecast in `ordering.reason`, `readinessNote` or `PracticeForm.description` fails, while a
  `generatedAt` timestamp does not. **The completion-percentage ban is tested in the UI layer, not
  here** (§5): the engine cannot express it, so a test here would assert nothing.
- **Golden map:** one hand-built fixture for a domain with a real external syllabus and one for a
  domain with none, so both anchor classes are exercised end to end. **Each must contain a complete
  trunk-only path whose every `stageFloor` is at or below `S2_FOUNDATIONS`**, because that is the
  highest stage any child can currently reach (§1). Without it the goldens assert on structure no
  child can enter.
- **Lifecycle:** publishing needs both an empty `validation.errors` and `status: "published"`.
  Withdrawing leaves `validation` byte-identical. An edit returns the map to `draft`, records
  `before` and `after`, and the map cannot be published again until it is re-validated.
- **Store:** `put` rejects a stale `version` rather than overwriting. `get` on a sub-topic path
  falls back to the cabin map when no sub-topic map exists, and never merges the two.
- **Stub generator:** deterministic, used by CI, producing a map that passes the validator.
- **A map whose `validation.errors` is non-empty is never returned by whatever a plan would
  consume.** Assert it. `vettedBy: null` is fine and must NOT block, since human review is optional.

## 9. Guardrails restated

The map proposes; the guide disposes; the planner still owns stage and pace. The map never advances a
child, never forecasts where they will land, never shows a percentage, and never scores anything.
Every milestone yields a real artefact, so parking a spike forfeits nothing. One of those, the
percentage, is held in the surface rather than the model, because the model cannot hold it (§5).

## 10. Open, and deliberately deferred

Domain taxonomy is still a rough draft and will expand, so `domainPath` keys will move. Maps must
survive a taxonomy edit; slice 1 should not assume the current eight cabins are final. `MasteryMap.id`
is stable and independent of `domainPath` for exactly this reason, so a taxonomy edit is a change to
a field on an existing map rather than the birth of a new one. How the rest of that migration works
is a slice 2 problem, but the model should not make it harder than it needs to be.
