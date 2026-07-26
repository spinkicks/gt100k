# Mastery Maps, slice 1: the map itself

**Status:** spec, ready for an implementation plan.
**Design:** [`2026-07-25-mastery-map-design.md`](2026-07-25-mastery-map-design.md). Read it first;
this document does not restate the reasoning, only what to build.
**Date:** 2026-07-26

## 1. Scope

**In:** the `MasteryMap` domain model, the generator behind a typed port with a deterministic stub for
CI, the validator, persistence, and the guide's vetting screen.

**Out:** any child-facing surface, per-child selection from a map, real-world opportunity brokering
beyond hints, the admissions portfolio, and child login (G3, a pre-live gate).

**New package:** `@gt100k/mastery-map` in `passion/packages/mastery-map`. Pure, deterministic,
no network, no clock, no randomness, following every other engine.

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
  /** A map belongs to a DOMAIN, not a cell. Modes are branches (design §3). */
  readonly domainPath: DomainPath;
  readonly milestones: readonly Milestone[];
  readonly provenance: MapProvenance;
  /** null = draft. A draft is never shown to a child and never drives a plan. */
  readonly vettedBy: HumanActor | null;
  readonly vettedAt: string | null;
  /** ISO-8601. Resources rot; see §7. */
  readonly revalidatedAt: string;
}

export interface Milestone {
  readonly id: string;
  /** Plain language. A child could read it. */
  readonly title: string;
  /** What the child can DO afterwards. Never what they consumed. */
  readonly capability: string;
  /** Milestone ids. The DAG edges. */
  readonly requires: readonly string[];
  /** Empty = trunk, serves every mode in the domain. Non-empty = a branch. */
  readonly modes: readonly WorkMode[];
  /** Earliest stage this is appropriate at. The map never advances anyone (design §6). */
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
  /** Concierge's `AgeTier`, deliberately NOT a fourth local copy. See the note below. */
  readonly ageBand: AgeTier;
  /** Already vetted by the concierge's ten stages. The generator attaches, never fetches. */
  readonly resources: readonly CuratedResource[];
}

export interface MapStore {
  get(domainPath: DomainPath): Promise<MasteryMap | null>;
  put(map: MasteryMap): Promise<void>;
  listDrafts(): Promise<readonly MasteryMap[]>;
}
```

**The generator never fetches its own resources.** Retrieval goes through the concierge, which already
enforces child-safety, reputation and age tiers across ten stages. A generator that fetched directly
would bypass all of it.

**Do not define a fourth age type.** `"6-8" | "9-11" | "12-14"` is currently declared three times:
`AgeBand` in access-broker, `AgeBand` in project-workspace, and `AgeTier` in concierge. This package
imports concierge's `AgeTier`, because that is the type the resources it checks are already tiered
by. Consolidating the other three is a worthwhile small cleanup and is explicitly not part of this
slice.

## 5. The validator

Pure, synchronous, total. Returns every problem rather than throwing on the first. A map that fails
any **error** cannot be stored as vetted.

**Errors:**
1. `requires` forms a DAG. No cycles, and every id resolves to a milestone in the same map.
2. Every milestone has a non-empty `capability` and `demonstration`.
3. `capability` is not satisfiable by consumption. Reject the consumption verbs
   (`watch`, `read`, `listen to`, `review`) as the leading verb.
4. Every milestone's `ordering.sources` is non-empty **unless** `basis` is `model`, and is empty
   **when** `basis` is `model`.
5. Every `CuratedResource` carries an `ageTiers` entry covering the map's band, and a `provenance`.
6. A milestone's `stageFloor` is at or above the floor of everything it requires. A prerequisite
   cannot be gated later than the thing it unlocks.
7. No scalar score, rank, streak, point, badge or leaderboard field anywhere on any type. The
   existing GC-class guardrail, asserted here too because this is new surface.
8. No completion percentage, and no field from which one could be trivially derived, such as a
   milestone count presented as a total (design §9).
9. No forecast: no field naming a date, age or timeframe by which a child should reach a milestone
   (design §8).

**Warnings** (a guide sees them, they do not block):
1. More than `MODEL_BASIS_MAX_SHARE` of milestones rest on `basis: "model"`. Default 0.34. A map
   mostly justified by the model's own confidence is the case the ordering rule exists to expose.
2. The map has no `syllabus`-based milestone at all, so nothing is externally anchored.
3. A branch milestone sits below `S3_AUTHORSHIP`. Divergence is expected at expert entry, so an
   early branch is suspicious (design §3).
4. The trunk is less than 20% of the map. Possible, and the design says so, but worth a look.

## 6. The vetting screen

A tab in the guide console, using the GT identity and the shared token contract like every other
surface.

**A guide judges appropriateness and fit for a child, never domain sequencing.** They are not chess
masters, and asking them to certify an ordering they cannot evaluate produces a rubber stamp.

So the screen shows, per milestone: the title and capability in plain language, the ordering
justification **with its basis rendered exactly like a research claim**, reusing the existing
`WhyThis` affordance and `Basis` presentation so a `model`-basis milestone visibly differs from a
`syllabus`-backed one. Then resources with their age tiers, and the demonstration artefact.

A guide can **approve**, **edit** (recorded in `provenance.edits`), or **reject** the map. Approving
sets `vettedBy` and `vettedAt`. Nothing else may set them.

Validator warnings appear inline, at the milestone they concern.

## 7. Freshness

`revalidatedAt` is set on generation and on each re-check. Slice 1 stores the field and surfaces
staleness in the vetting screen; the re-check job itself is out of scope.

## 8. Tests

Standard for this repo: pure engine, deterministic fixtures, golden values derived by hand and then
confirmed, never pasted from output.

- **Validator:** one test per error rule and per warning rule, each asserting the specific problem is
  reported and that a valid map reports none. Cycles, dangling `requires`, consumption verbs,
  missing sources, sources present on a `model` basis, age-tier gaps, an inverted `stageFloor`.
- **Guardrails:** a scalar score field anywhere fails. A completion percentage fails. A forecast
  field fails. These mirror the existing GC checks and should be written to fail loudly.
- **Golden map:** one hand-built fixture for a domain with a real external syllabus and one for a
  domain with none, so both anchor classes are exercised end to end.
- **Stub generator:** deterministic, used by CI, producing a map that passes the validator.
- **A map with `vettedBy: null` is never returned by whatever a plan would consume.** Assert it.

## 9. Guardrails restated

The map proposes; the guide disposes; the planner still owns stage and pace. The map never advances a
child, never forecasts where they will land, never shows a percentage, and never scores anything.
Every milestone yields a real artefact, so parking a spike forfeits nothing.

## 10. Open, and deliberately deferred

Domain taxonomy is still a rough draft and will expand, so `domainPath` keys will move. Maps must
survive a taxonomy edit; slice 1 should not assume the current eight cabins are final. How that
migration works is a slice 2 problem, but the model should not make it harder than it needs to be.
