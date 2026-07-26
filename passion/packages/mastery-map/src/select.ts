/**
 * Slice 2: reading a published map against what one child has actually made.
 *
 * `readMap` is the whole of it. Given a map and the artefacts a child has produced, it reports
 * EVERY milestone, ordered, with the standing behind each one and whether it is something a guide
 * could offer next. It is read-only analysis: it does not touch the planner, it does not pick an
 * answer out of the list, and it does not create the links between artefacts and milestones. Those
 * arrive as `MilestoneEvidence` from the caller.
 *
 * Pure and deterministic, like the rest of this package: no clock, no randomness, no I/O. Total on
 * every map, including the ones the validator rejects, with one deliberate exception: an override
 * carrying no reason is refused rather than read, for the reason on `GuideOverride`.
 *
 * The child's stage is a parameter because the specialization planner owns stage and this module
 * must never become a second ladder that fights it.
 */
import type { HumanActor } from "@gt100k/hypothesis-store";
import { STAGES, type Stage } from "@gt100k/specialization-planner";

import type { MasteryMap, Milestone } from "./model.js";

/**
 * A link between something the child made and a milestone it may evidence. Supplied by the caller:
 * slice 2 derives standing, it does not create links.
 *
 * `artifactCount` counts artefacts inside one project. It is not a count of milestones and nothing
 * downstream may turn it into one. It is judged one link at a time and clamped to a whole number of
 * artefacts, so a link claiming a negative or fractional count contributes nothing rather than
 * cancelling out a link that really does stand for work; see `contributionOf`.
 */
export interface MilestoneEvidence {
  readonly milestoneId: string;
  readonly projectId: string;
  readonly artifactCount: number;
}

/**
 * How much work stands behind a milestone. THIS IS NOT A VERDICT, and refusing to make it one is
 * the reason the type exists instead of a boolean.
 *
 * Shavelson, Baxter & Gao (1993) measured the generalisability of elementary performance
 * assessment and found task-sampling variability dominates the error: performance on one task
 * predicts performance on another poorly, and roughly 15 to 23 tasks are needed to reach a
 * generalisability coefficient of 0.80. One artefact is therefore badly underpowered as proof of a
 * capability, and so are three. Human judgment is no refuge either: Koretz, Stecher, Klein &
 * McCaffrey (1994) measured rater reliability on the Vermont portfolio program at 0.33 to 0.43, so
 * asking a person to declare the capability present does not rescue the claim, it relocates it.
 *
 * So the vocabulary tops out at a description of quantity. `multiple` says more than one thing was
 * made. It does not say the child has the capability, and no consumer may render it as though it
 * did. Butler (1988) is why that matters in the surface as well as here: with 132 children aged
 * roughly 10 to 12, a bare verdict with no task anchoring behaved like a grade and depressed both
 * interest and subsequent performance, so a standing is never to be shown without the work it
 * rests on, which is what `MilestoneRead.evidence` is for.
 */
export type EvidenceStrength = "none" | "single" | "multiple";

/** The three, in ascending order, for iteration and for pinning that no fourth one is a verdict. */
export const EVIDENCE_STRENGTHS = [
  "none",
  "single",
  "multiple",
] as const satisfies readonly EvidenceStrength[];

/**
 * A guide's call that a prerequisite should not hold the next thing up, whatever the artefacts say.
 * A child who did this at their old school, or on paper nobody kept, is the ordinary case.
 *
 * It moves REACHABILITY and it never moves `strength`: standing comes from artefacts and from
 * nothing else, so an override cannot manufacture evidence. `note` is required because an override
 * with no reason is a checkbox, and a checkbox is what this whole design is built to avoid. That
 * requirement is enforced rather than documented: `guideOverride` refuses to build one without a
 * reason and `readMap` refuses to read one, so the type cannot be satisfied by a blank string.
 */
export interface GuideOverride {
  readonly milestoneId: string;
  readonly actor: HumanActor;
  /** ISO-8601, from the caller. This module reads no clock, and a signed human record must carry
      the moment it was actually signed rather than whatever constant a surface had to hand. */
  readonly at: string;
  readonly note: string;
}

/** Stable token at the head of the thrown message, so a caller keys on this and not on prose. */
export const MAP_OVERRIDE_NO_REASON = "OVERRIDE_NO_REASON";

const hasReason = (note: string): boolean => note.trim() !== "";

/**
 * Build a guide's override, refusing one with no reason. This is the enforcement the doc comment on
 * `GuideOverride` has always claimed: an override with a blank note is a checkbox, and a checkbox
 * asserts that a milestone is behind a child on nobody's authority and with nothing to check.
 *
 * `at` is an argument because an override is a signed human record. A surface that stamped a fixed
 * review clock on it would date every override a guide ever recorded to the same instant.
 */
export function guideOverride(
  milestoneId: string,
  actor: HumanActor,
  at: string,
  note: string,
): GuideOverride {
  if (!hasReason(note)) {
    throw new Error(
      `${MAP_OVERRIDE_NO_REASON}: the override on milestone "${milestoneId}" has no reason on it. An override with no reason is a checkbox, and this package records why a guide made a call or does not record the call.`,
    );
  }
  return { milestoneId, actor, at, note };
}

/** Why a milestone is not on offer. Two different problems with two different answers: find the
    child some work for the earlier rung, or wait for the planner to move them. */
export type Blocker =
  /** `milestoneId` is the PREREQUISITE that has neither evidence nor an override. */
  | { readonly kind: "prerequisite"; readonly milestoneId: string }
  /** The milestone is gated above where the planner has this child. */
  | { readonly kind: "stage-floor"; readonly stageFloor: Stage };

export interface MilestoneRead {
  readonly milestone: Milestone;
  /** How much was made here. Never a verdict; see `EvidenceStrength`. */
  readonly strength: EvidenceStrength;
  /** The links the standing was derived from, in the order the caller supplied them, so a surface
      can show the work beside the judgment. Decision 4 makes that mandatory in the UI. */
  readonly evidence: readonly MilestoneEvidence[];
  /**
   * Whether a guide could OFFER this next. NOT a claim that the child has any capability, and the
   * gap between those two is load-bearing.
   *
   * "This child has this capability" is a binary this package never asserts, because one artefact
   * cannot support it and neither can a rater (see `EvidenceStrength`). "Should we offer this
   * next" is different in kind: it has to resolve to yes or no, because the guide either puts the
   * thing in front of the child or does not. Reachability is the second question.
   *
   * So a prerequisite counts as satisfied FOR THE PURPOSE OF OFFERING the next thing when it has
   * any evidence at all or a guide override. That bar is deliberately low, and it is low in the
   * direction that fails safe. Offering something too early costs a child a hard task, which the
   * map already frames as expected rather than as evidence of poor fit. A high bar costs a child
   * being held at a rung by a measurement nobody in this field can actually make.
   */
  readonly reachable: boolean;
  /** Empty exactly when `reachable`. Prerequisites first, in the order the map declares them, then
      the stage floor. */
  readonly blockedBy: readonly Blocker[];
  /** The override standing on THIS milestone, so a surface can show it beside the artefacts, or
      null. Never affects `strength`. */
  readonly override: GuideOverride | null;
}

const stageIndex = (s: Stage): number => STAGES.indexOf(s);

/**
 * What ONE link actually contributes: a whole number of artefacts, never negative and never a
 * fraction. Each link is judged on its own before anything is added up, which is the difference
 * that matters. A link carrying `-3` used to cancel three real artefacts and leave a milestone
 * reading "nothing made here yet" above work a guide could see on the same screen, and a link
 * carrying `0.5` or `NaN` used to come out as the strongest reading of all.
 *
 * `Math.trunc` throws away the fraction, `|| 0` turns `NaN` and the two zeroes into nothing, and
 * `Math.max` drops anything negative, so a link to nothing contributes nothing and can subtract
 * nothing.
 */
function contributionOf(artifacts: number): number {
  return Math.max(0, Math.trunc(artifacts) || 0);
}

/** Nothing made is `none`, one thing made is `single`, more than one is `multiple`. Counted over
    what the links actually contribute, so only a link holding at least one artefact moves it. */
function strengthOf(artifacts: number): EvidenceStrength {
  if (artifacts <= 0) return "none";
  return artifacts === 1 ? "single" : "multiple";
}

/**
 * Everything each milestone can reach by following `requires`, one step or many. Used to tell an
 * edge that is part of a cycle from one that is not, which is the only way depth below can be a
 * function of the map rather than of the order a walk happened to enter it.
 *
 * Each milestone gets its own walk with its own visited set. That is more work than one memoised
 * pass and it is the point: a memo filled in mid-cycle holds a partial answer, and which answer it
 * holds depends on where the walk started.
 */
function reachSets(byId: ReadonlyMap<string, Milestone>): ReadonlyMap<string, ReadonlySet<string>> {
  const out = new Map<string, ReadonlySet<string>>();
  for (const id of byId.keys()) {
    const seen = new Set<string>();
    const stack = [...(byId.get(id)?.requires ?? [])];
    for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
      if (seen.has(next)) continue;
      seen.add(next);
      for (const dep of byId.get(next)?.requires ?? []) stack.push(dep);
    }
    out.set(id, seen);
  }
  return out;
}

/**
 * How many prerequisite steps a milestone sits behind the start of the map: zero for a milestone
 * that requires nothing, otherwise one more than the deepest thing it requires.
 *
 * A `requires` entry that resolves to nothing is skipped, because there is no depth to read off it.
 *
 * A CYCLE is E1_CYCLE and cannot be published, and this still has to be total and still has to give
 * the same answer whichever end of the map it is handed. So a BACK EDGE CONTRIBUTES NO DEPTH, and a
 * back edge is defined by the graph rather than by the walk: an edge from a milestone to something
 * that can reach it back is inside a cycle, and depth through it would be depth measured from
 * itself. Dropping exactly those edges leaves an acyclic graph, so what is left is a longest path,
 * every memo is final when it is written, and two callers holding the same cyclic map get the same
 * numbers. Milestones inside a cycle come out at the depth of whatever reaches them from outside
 * it, which is zero when nothing does, and the remaining keys in `readMap` order them from there.
 */
function depthsOf(map: MasteryMap): ReadonlyMap<string, number> {
  const byId = new Map(map.milestones.map((m) => [m.id, m]));
  const reach = reachSets(byId);
  const done = new Map<string, number>();

  const visit = (id: string): number => {
    const memo = done.get(id);
    if (memo !== undefined) return memo;
    let depth = 0;
    for (const dep of byId.get(id)?.requires ?? []) {
      if (!byId.has(dep)) continue;
      if (reach.get(dep)?.has(id) === true) continue; // a back edge: depth from itself is no depth
      depth = Math.max(depth, visit(dep) + 1);
    }
    done.set(id, depth);
    return depth;
  };

  for (const m of map.milestones) visit(m.id);
  return done;
}

/**
 * A stable string standing for the whole of one milestone, used only to break a tie the real
 * ordering keys left. Keys are sorted, so it is a function of the milestone's content and not of
 * the order the fields happened to be written in, and a `Milestone` is JSON data by its type, so
 * there is nothing here to recurse for ever on.
 *
 * Two milestones that still tie under this are identical in every field, which is the one case a
 * total order over a map is impossible: nothing distinguishes them, so the reads built from them
 * are deep-equal and which one comes first is not an observable difference.
 */
function fingerprint(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "undefined";
  if (Array.isArray(value)) return `[${value.map(fingerprint).join(",")}]`;
  const held = value as Record<string, unknown>;
  return `{${Object.keys(held)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${fingerprint(held[k])}`)
    .join(",")}}`;
}

/**
 * Every milestone on the map, ordered, read against what this child has made.
 *
 * THE ORDER IS: stage floor ascending, then prerequisite depth ascending, then id, then the
 * milestone's own content. It is a function of the map's own content and of nothing else, so two
 * callers holding the same map always see the same list however their arrays happen to be
 * arranged, and the caller's evidence cannot reshuffle it. That holds on a map with a cycle in it
 * and on a map that declares one id twice, both of which the validator rejects and neither of which
 * may make this function's answer depend on where a walk started. Each key earns its place:
 *
 * - **Stage floor first**, because the planner's stage is the one ladder in this system and a
 *   guide reading the list is reading it in the order a child could meet things.
 * - **Then depth**, so a prerequisite never sorts after the thing it unlocks. See `depthsOf` for
 *   what depth means where the map doubles back on itself.
 * - **Then id**, which decides nothing on its own and exists so that two milestones alike on both
 *   real keys still come out in one fixed order rather than in whatever order they were stored.
 *   Compared as plain strings, not by locale, because a locale-sensitive comparison would make the
 *   output depend on the machine.
 * - **Then the milestone itself**, which only ever runs on a map declaring one id twice. Ids were
 *   the last key and equal ids returned zero, which handed the decision to whatever order the
 *   array happened to be in. Two entries tie here only when every field on them matches, and then
 *   the reads are deep-equal and the list is the same list either way round.
 *
 * `stage` is the child's current stage, from the planner. Note that nothing above `S2_FOUNDATIONS`
 * is reachable by any child today: `deriveStage` requires `stretchSeeking` for both higher stages,
 * `stretchSeeking` derives solely from `chosen_challenge`, and nothing in production emits that
 * event (escalated in PR #163). Every branch milestone sits at or above `S3_AUTHORSHIP`, so a
 * trunk-only reachable set is the correct output of this function and not a fault in it.
 */
export function readMap(
  map: MasteryMap,
  evidence: readonly MilestoneEvidence[],
  overrides: readonly GuideOverride[],
  stage: Stage,
): readonly MilestoneRead[] {
  const byMilestone = new Map<string, MilestoneEvidence[]>();
  for (const e of evidence) {
    const held = byMilestone.get(e.milestoneId);
    if (held === undefined) byMilestone.set(e.milestoneId, [e]);
    else held.push(e);
  }

  // Last wins. The list is read as a log, and the last entry is where the guide left it.
  const overrideById = new Map<string, GuideOverride>();
  for (const o of overrides) {
    if (!hasReason(o.note)) {
      throw new Error(
        `${MAP_OVERRIDE_NO_REASON}: the override on milestone "${o.milestoneId}" has no reason on it. Reading it would let a milestone be counted as behind a child on nobody's authority.`,
      );
    }
    overrideById.set(o.milestoneId, o);
  }

  const strengthById = new Map<string, EvidenceStrength>();
  for (const [id, links] of byMilestone) {
    strengthById.set(
      id,
      strengthOf(links.reduce((n, e) => n + contributionOf(e.artifactCount), 0)),
    );
  }

  /** Satisfied FOR THE PURPOSE OF OFFERING the next thing, which is not a claim that this
      milestone is finished. Keyed off the same standing the surface shows, so a link to a project
      holding no artefacts cannot satisfy a prerequisite that a guide can see is empty. */
  const satisfied = (id: string): boolean =>
    (strengthById.get(id) ?? "none") !== "none" || overrideById.has(id);

  const depths = depthsOf(map);
  const childStage = stageIndex(stage);

  const reads = map.milestones.map((m): MilestoneRead => {
    const blockedBy: Blocker[] = [];
    for (const dep of m.requires) {
      if (!satisfied(dep)) blockedBy.push({ kind: "prerequisite", milestoneId: dep });
    }
    if (stageIndex(m.stageFloor) > childStage) {
      blockedBy.push({ kind: "stage-floor", stageFloor: m.stageFloor });
    }

    return {
      milestone: m,
      strength: strengthById.get(m.id) ?? "none",
      evidence: byMilestone.get(m.id) ?? [],
      reachable: blockedBy.length === 0,
      blockedBy,
      override: overrideById.get(m.id) ?? null,
    };
  });

  // Computed once per milestone rather than inside the comparator, which sees each entry many
  // times, and only for the map's own milestones so nothing a caller supplied can reach it.
  const prints = new Map(map.milestones.map((m) => [m, fingerprint(m)]));

  return reads.sort((a, b) => {
    const floor = stageIndex(a.milestone.stageFloor) - stageIndex(b.milestone.stageFloor);
    if (floor !== 0) return floor;
    const depth = (depths.get(a.milestone.id) ?? 0) - (depths.get(b.milestone.id) ?? 0);
    if (depth !== 0) return depth;
    if (a.milestone.id !== b.milestone.id) return a.milestone.id < b.milestone.id ? -1 : 1;
    const print = prints.get(a.milestone) ?? "";
    const other = prints.get(b.milestone) ?? "";
    if (print === other) return 0;
    return print < other ? -1 : 1;
  });
}
