# Wiring projects to milestones

**Status:** spec, implementing immediately.
**Follows:** mastery-map slice 2. Read
[`2026-07-26-mastery-map-slice1.md`](2026-07-26-mastery-map-slice1.md) §3 and the design's §9 first.
**Date:** 2026-07-26

## 1. The gap

`readMap` derives a child's standing from `MilestoneEvidence` links, and **nothing creates them.**
Every child currently reads as "nothing made here yet", so the artefact-derived position that slice 2
was built around cannot fire.

The console's `app/map-evidence.ts` already composes the pieces correctly, but from four hand-written
seed constants. What is missing is the connection between a project a child actually did and the
milestone it was meant to demonstrate.

## 2. The constraint that decides the design

`mastery-map` depends on `specialization-planner` (for `Stage`), and `project-workspace` depends on
it too. **So neither the planner nor the workspace can import mastery-map.** A planner that picks its
own milestone off a map is a dependency cycle.

The composition therefore happens **above** both, in the caller that already assembles a plan. That
is where the map lives, and it is where `curatedForCell` is already called today.

## 3. The chain

```
guide console (composition layer)
  resolves the map for the spike's domain
  reads the child's standing            readMap(...)
  picks a reachable milestone
        |
        v  passes the milestone id AND its resources into the plan
specialization-planner
  stamps milestoneId onto the brief it returns
        |
        v
project-workspace
  a Project created from that brief carries the milestoneId
        |
        v  artifact work-events accumulate as the child works
guide console
  derives MilestoneEvidence from real projects, not seeds
        |
        v
readMap  reports a standing backed by things the child actually made
```

## 4. Changes

**`specialization-planner`**
- `ProjectBrief` gains `readonly milestoneId?: string`. Optional, because a self-directed project
  legitimately belongs to no milestone.
- `PlanDeps` gains `readonly milestoneId?: string`.
- **The planner stamps it onto the brief after the generator returns.** It is never read from the
  generator's output. This matters: a model must not be able to invent a milestone id and thereby
  attach a child's work to a rung nobody selected. The stamp is the caller's, not the model's.

**`project-workspace`**
- `Project` gains `readonly milestoneId?: string`, carried from the brief it was created from.
  Nothing else changes: a project without one behaves exactly as today.

**`mastery-map`**
- Nothing. `MilestoneEvidence` already exists and `readMap` already consumes it. This is the point of
  having taken evidence as an input rather than inventing a linkage.

**`guide-console`**
- `evidenceFor` derives links from real projects: for each project carrying a `milestoneId`, one
  link, with `artifactCount` equal to the number of `artifact` work-events on it.
- The seeds stay as the demo data the console renders, but they take the same shape a real project
  does, so swapping the source is a one-line change rather than a rewrite.

## 5. What counts as evidence

**Only a work-event of kind `artifact`.** Not a session, not an attempt, not a reflection. The design
says a milestone is demonstrated by a thing that exists, and sessions are effort rather than
artefacts.

A project carrying a `milestoneId` with zero artifact events yields `artifactCount: 0`, which reads
as strength `none`. That is correct and worth stating: **starting a milestone is not evidence of
finishing it**, and the honest report for a child who began and made nothing is that they have made
nothing.

## 6. What this deliberately does not do

It does not make a milestone "passed". Strength stays `none` / `single` / `multiple`, because one
artefact is badly underpowered as proof of a capability (Shavelson, Baxter & Gao 1993: roughly 15 to
23 tasks for a generalisability coefficient of 0.80). Wiring the evidence up changes where the number
comes from, not what it is allowed to claim.

It does not let the planner choose a milestone. The caller chooses; the planner records.

It does not touch reachability. Branch milestones stay unreachable until `chosen_challenge` is
emitted.

## 7. Tests

- The planner stamps `milestoneId` from deps, and **ignores** a `milestoneId` present in a generator's
  response. Assert the model cannot inject one.
- A brief with no `milestoneId` in deps has none on the output, and everything else is unchanged.
- A project carrying a milestone id and three artifact events yields one link with `artifactCount: 3`.
- A project carrying a milestone id and no artifact events yields a link with `artifactCount: 0`,
  which `readMap` reports as strength `none`.
- Sessions, attempts and reflections do not count.
- A project with no `milestoneId` yields no link.
- End to end: a plan carrying a milestone id, turned into a project, worked on, produces a standing
  on that milestone and on no other.
