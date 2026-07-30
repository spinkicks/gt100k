// Pure Maps view-model for the guide console (024 mastery maps, spec §6). It turns a `MasteryMap`
// plus the record `validateMap` earns for it into something a guide can read: plain-language stages
// and modes, the ordering justification kept whole, and every validator problem placed either at the
// milestone it names or at the top of the map when it names none.
//
// IT IS A REVIEW SURFACE AND NOT A GATE. The validator is the gate, and nothing else is: no human
// signs a map off, `vettedBy` is optional, and a map with an empty `validation.errors` is usable
// whether or not anyone has looked at it. What a guide can decide is whether the map is in USE, which
// is why `withStatus` below leaves the validation record byte-identical when a map is withdrawn.
//
// NO COMPLETION MEASURE, and this is the one invariant that has to live here. Spec §5 is explicit
// that the data model cannot enforce it: `milestones` is an array, so `done / total` is one division
// away from any consumer and no engine rule can prevent it. So nothing below counts milestones,
// tallies finished ones, or divides one by the other. `test/maps.test.ts` holds that line on the
// view model and `test/maps-panel.test.tsx` holds it on the rendered markup, which is the surface
// the ban is actually about.
import type { HumanActor, HypothesisStore } from "@gt100k/hypothesis-store";
import {
  applyEdit,
  canPublish,
  guideOverride,
  readMap,
  validateMap,
  type Blocker,
  type EvidenceStrength,
  type GuideOverride,
  type Justification,
  type MapEdit,
  type MapStatus,
  type MasteryMap,
  type Milestone,
  type MilestoneEvidence,
  type OpportunityHint,
  type OrderingBasis,
  type PracticeForm,
  type ValidationProblem,
} from "@gt100k/mastery-map";
import { STAGES, type Stage } from "@gt100k/specialization-planner";
import { evidenceFor, linkKey, stageForDomain, type ChildWork } from "./map-evidence.js";
import { REVIEW_MAPS } from "./maps-seed.js";
import { modeLabel, specPath } from "./vocab.js";

/**
 * The fixed instant the panel validates against, so the screen is deterministic and the freshness
 * warning is reproducible. Same reason `ROSTER_NOW` exists: a console that read the wall clock would
 * render differently on every load and could not be pinned by a test.
 */
export const REVIEW_NOW = "2026-07-26T00:00:00.000Z";

/** Who the console signs an edit as. The demo has one guide, and an edit with no named actor is
    not a record of anything: `provenance.edits` exists to say who changed what. */
export const REVIEW_ACTOR: HumanActor = { id: "guide-104", role: "GUIDE" };

const STAGE_TEXT: Record<string, string> = {
  S1_IGNITION: "Ignition",
  S2_FOUNDATIONS: "Foundations",
  S3_AUTHORSHIP: "Authorship",
  S4_SIGNATURE: "Signature",
};

/** What each basis is called, in words, so the four are told apart with the colour taken away. */
export const SUPPORT_TEXT: Record<OrderingBasis, string> = {
  syllabus: "Published syllabus",
  research: "Research finding",
  community: "Community consensus",
  model: "Our own reasoning",
};

/** And what each one is worth, said plainly, strongest first. */
export const SUPPORT_NOTE: Record<OrderingBasis, string> = {
  syllabus:
    "A recognised published curriculum, so someone other than us can check this ordering against it.",
  research: "Citable research about how this skill develops.",
  community: "Named community consensus. Real, but nobody certifies it.",
  model:
    "No external support. The model put this here on its own reasoning and says so, which is the weakest thing an ordering can rest on.",
};

const STATUS_TEXT: Record<MapStatus, string> = {
  draft: "Draft",
  published: "In use",
  withdrawn: "Withdrawn",
};

/** The status line a guide reads. Each one says what the status does NOT mean, because the three are
    easy to read as a ladder of approval and none of them is one. */
const STATUS_NOTE: Record<MapStatus, string> = {
  draft: "Valid and not in use yet. Putting it into use is your call, not a sign-off.",
  // "Cleared" rather than "passed": a standing on this screen may never read as a pass, and a word
  // that is fine about a map is a word a guide then meets again beside a child's name.
  published: "In use. It cleared the validator, which is the only gate a map has.",
  withdrawn:
    "Taken out of use. Nothing about it became invalid, and the validation below is unchanged.",
};

export interface ResourceVM {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  /** The concierge's age tiers, shown as given. A resource pitched at one end of a map's range is
      legitimate, so this is information and never a filter the guide has to satisfy. */
  readonly ageTiers: Milestone["resources"][number]["ageTiers"];
  readonly provenance: string;
}

export interface OpportunityVM {
  readonly kind: OpportunityHint["kind"];
  readonly description: string;
  readonly readinessNote: string;
  readonly stage: string;
}

export interface MilestoneVM {
  readonly id: string;
  readonly title: string;
  readonly capability: string;
  readonly demonstration: string;
  /** Kept whole so the panel can render the reason, the limit and the sources from one prop. */
  readonly ordering: Justification;
  readonly basis: OrderingBasis;
  readonly support: string;
  readonly supportNote: string;
  /** False only for `model`. The difference lives in the view model and not just in the stylesheet,
      so a guide reading the words alone still knows which orderings nobody outside us has checked. */
  readonly externallyAnchored: boolean;
  readonly isTrunk: boolean;
  readonly branchModes: readonly string[];
  readonly stage: string;
  /** Titles, not ids, of the milestones this one comes after. */
  readonly after: readonly string[];
  readonly resources: readonly ResourceVM[];
  readonly practice: readonly PracticeForm[];
  readonly opportunities: readonly OpportunityVM[];
  readonly errors: readonly ValidationProblem[];
  readonly warnings: readonly ValidationProblem[];
}

export interface EditVM {
  /** The milestone by its title, since that is what the guide is looking at. */
  readonly milestone: string;
  readonly field: string;
  readonly before: string;
  readonly after: string;
  readonly at: string;
  readonly by: string;
}

export interface MapVM {
  readonly id: string;
  readonly domain: string;
  readonly modes: readonly string[];
  readonly ageBands: readonly string[];
  readonly status: MapStatus;
  readonly statusText: string;
  readonly statusNote: string;
  readonly withdrawn: boolean;
  readonly inUse: boolean;
  /** Whether the validator found nothing wrong: `validation.errors` is empty. Not a function of who
      reviewed it, and NOT on its own enough to put a map into use; see `publishable`. */
  readonly valid: boolean;
  /** Both of spec §6's conditions for the move into use: nothing in the error list AND a re-check
      inside `STALE_AFTER_DAYS`. A map validated before its resources rotted passes `valid` and
      fails this, which is why the panel gates on this one. */
  readonly publishable: boolean;
  /** Why it cannot go into use, in words a guide can act on, or null when it can. */
  readonly publishRefusal: string | null;
  /** More than `STALE_AFTER_DAYS` since the resources were last re-checked. Out of date rather than
      wrong, which is why it is surfaced here and never blocks anything but publication. */
  readonly stale: boolean;
  /** Who has LOOKED at it, if anyone. Optional by design, so null here blocks nothing. */
  readonly reviewedBy: string | null;
  readonly revalidatedAt: string;
  readonly authoredBy: string;
  /** Every correction a guide has made, both sides of each one. Empty until someone edits. */
  readonly edits: readonly EditVM[];
  /** Problems about the map as a whole. The milestone-scoped ones live on their milestone. */
  readonly errors: readonly ValidationProblem[];
  readonly warnings: readonly ValidationProblem[];
  readonly milestones: readonly MilestoneVM[];
}

/**
 * A list key for one validator problem, unique across a whole map.
 *
 * The milestone id is in here because the same rule firing on several milestones is the ordinary
 * case and not an exotic one: a banned field name, or a missing source, hits every milestone that
 * has it, with identical code and identical wording each time. A key of code and message alone
 * collided those, and React keeps one of a set of colliding siblings and drops the rest, so the
 * guide would have seen one copy of a problem that was really on five milestones.
 */
export function problemKey(p: ValidationProblem): string {
  return `${p.code}:${p.milestoneId ?? "map"}:${p.message}`;
}

function resourceView(r: Milestone["resources"][number]): ResourceVM {
  return { id: r.id, title: r.title, url: r.url, ageTiers: r.ageTiers, provenance: r.provenance };
}

function milestoneView(
  m: Milestone,
  titles: ReadonlyMap<string, string>,
  problems: readonly ValidationProblem[],
): MilestoneVM {
  const basis = m.ordering.basis;
  return {
    id: m.id,
    title: m.title,
    capability: m.capability,
    demonstration: m.demonstration,
    ordering: m.ordering,
    basis,
    support: SUPPORT_TEXT[basis],
    supportNote: SUPPORT_NOTE[basis],
    externallyAnchored: basis !== "model",
    isTrunk: m.modes.length === 0,
    branchModes: m.modes.map(modeLabel),
    stage: STAGE_TEXT[m.stageFloor] ?? m.stageFloor,
    after: m.requires.map((id) => titles.get(id) ?? id),
    resources: m.resources.map(resourceView),
    practice: m.practice,
    opportunities: m.opportunities.map((o) => ({
      kind: o.kind,
      description: o.description,
      readinessNote: o.readinessNote,
      stage: STAGE_TEXT[o.stageFloor] ?? o.stageFloor,
    })),
    errors: problems.filter((p) => p.severity === "error"),
    warnings: problems.filter((p) => p.severity === "warning"),
  };
}

function editView(e: MapEdit, titles: ReadonlyMap<string, string>): EditVM {
  return {
    milestone: titles.get(e.milestoneId) ?? e.milestoneId,
    field: e.field,
    before: e.before,
    after: e.after,
    at: e.at,
    by: e.actor.id,
  };
}

/** One map, validated and turned into something a guide can read. Pure: the clock is a parameter. */
export function mapView(map: MasteryMap, now: string = REVIEW_NOW): MapVM {
  const record = validateMap(map, now);
  const titles = new Map(map.milestones.map((m) => [m.id, m.title]));

  // Against the record just earned, not the one the map arrived carrying. A stored record was
  // earned by whatever the map said when it was written, and an edit since then has replaced it.
  const publish = canPublish({ ...map, validation: record }, now);

  // A problem is placed at the milestone it names. One naming a milestone that is not in the map
  // would otherwise vanish off the screen entirely, so it falls back to the top of the map: a
  // problem a guide cannot see is worse than one in the wrong place.
  const byMilestone = new Map<string, ValidationProblem[]>();
  const atMapLevel: ValidationProblem[] = [];
  for (const p of [...record.errors, ...record.warnings]) {
    const owner = p.milestoneId !== undefined && titles.has(p.milestoneId) ? p.milestoneId : null;
    if (owner === null) atMapLevel.push(p);
    else byMilestone.set(owner, [...(byMilestone.get(owner) ?? []), p]);
  }

  return {
    id: map.id,
    domain: specPath(map.domainPath),
    modes: map.modes.map(modeLabel),
    ageBands: [...map.ageBands],
    status: map.status,
    statusText: STATUS_TEXT[map.status],
    statusNote: STATUS_NOTE[map.status],
    withdrawn: map.status === "withdrawn",
    inUse: map.status === "published",
    valid: record.errors.length === 0,
    publishable: publish.ok,
    publishRefusal: publish.ok ? null : publish.reason,
    // Read off the engine's own finding rather than by comparing the date a second time here. Two
    // staleness thresholds, one in the engine and one in the console, would drift apart.
    stale: record.warnings.some((w) => w.code === "W5_STALE"),
    reviewedBy: map.vettedBy?.id ?? null,
    revalidatedAt: map.revalidatedAt,
    authoredBy: map.provenance.model,
    edits: map.provenance.edits.map((e) => editView(e, titles)),
    errors: atMapLevel.filter((p) => p.severity === "error"),
    warnings: atMapLevel.filter((p) => p.severity === "warning"),
    milestones: map.milestones.map((m) => milestoneView(m, titles, byMilestone.get(m.id) ?? [])),
  };
}

/**
 * Move a map in or out of use. A guide's call, needing nobody's approval, and it says nothing about
 * whether the map is valid: spec §6 keeps validity and use apart precisely so that withdrawing does
 * not have to pretend the map went wrong. Nothing but `status` changes, the validation record very
 * much included.
 */
export function withStatus(map: MasteryMap, status: MapStatus): MasteryMap {
  return { ...map, status };
}

/**
 * The console's one edit affordance, routed through the engine so it cannot skip any of what an
 * edit entails: both sides recorded in `provenance.edits`, the milestone marked human-edited, the
 * version bumped, and the map returned to draft with its validation record cleared, because that
 * record was earned by the sentence being replaced.
 *
 * Capability is the field on offer because it is the one a guide can actually judge. They cannot
 * say whether a milestone belongs before or after another one, and this console never asks them to.
 */
export function editCapability(
  map: MasteryMap,
  milestoneId: string,
  value: string,
  at: string = REVIEW_NOW,
): MasteryMap {
  return applyEdit(map, { milestoneId, field: "capability", value, actor: REVIEW_ACTOR, at });
}

/** The maps waiting for a guide's eyes, validated against the pinned clock. */
export function mapsForReview(now: string = REVIEW_NOW): readonly MapVM[] {
  return REVIEW_MAPS.map((m) => mapView(m, now));
}

// ── Slice 2: one map read against one child ──────────────────────────────────────────────────────
//
// Everything above this line is domain knowledge and holds nothing about anybody. Everything below
// is a read on ONE child, which is the first time this console has had a numerator at all, so the
// percentage ban has to be held differently here. It is held in two places: nothing below counts
// milestones, tallies standings or divides one by the other, and `test/maps-panel.test.tsx` reads
// the rendered markup of this section for a bar, a fraction, a percent sign or a doneness word.
// The markup is where the ban can actually be checked; this is where it has to be obeyed.

/** How much was made, said in words. NEVER a verdict: see `EvidenceStrength` in the engine, and
    Shavelson, Baxter & Gao (1993) for why one artefact cannot carry a claim about a capability. */
export const STRENGTH_TEXT: Record<EvidenceStrength, string> = {
  none: "Nothing made here yet",
  single: "One thing made",
  multiple: "Several things made",
};

/**
 * And what that is worth, said beside it every time. Butler (1988) found that with 132 children
 * aged roughly 10 to 12 a bare verdict with no task anchoring behaved like a grade and depressed
 * both interest and subsequent performance, so a standing never appears on this screen on its own:
 * the note says what it is not, and the work it rests on is listed underneath it.
 */
export const STRENGTH_NOTE: Record<EvidenceStrength, string> = {
  none: "No artefact has been linked here. That is a fact about the record, not about the child.",
  single:
    "One artefact, which is nowhere near enough to say the capability is there: what a child makes varies enormously from one task to the next. Read the work, not this line.",
  multiple:
    "More than one artefact, and still well short of what it would take to claim the capability. Read the work, not this line.",
};

/**
 * The highest stage the planner can currently place any child at. Both stages above it need
 * `stretchSeeking`, which derives solely from `chosen_challenge`.
 *
 * That event used to be emitted by nothing, which made this ceiling absolute. Since #216 it IS
 * emitted: the "Try a harder one" button in `GadgetOverlay` records it. But the button only renders
 * where the puzzle honours `tier`, and `supportsTier` is set on Nonogram alone, so the whole product
 * offers exactly one route to the signal and it runs through a single cell.
 *
 * KEPT AT FOUNDATIONS DELIBERATELY, and this is the part to revisit rather than trust. The ceiling
 * is no longer a statement about what the product can emit; it is a statement about what it emits
 * often enough to place a child on. A child who did ask for a harder Nonogram would earn
 * `stretchSeeking` honestly and would then be told, wrongly, that the stage above is out of reach
 * for everyone. That is a smaller and rarer error than the one this replaced — which told every
 * guide a flatly false thing about every child — but it is still an error, and closing it means
 * deciding whether one cell is enough to lift the ceiling. That is a product call, not a doc fix.
 *
 * A gate above this is a fact about the product; a gate at or below it is a fact about where this
 * child has been placed today, and the two need different sentences because only one of them is
 * about the child at all.
 */
const REACHABLE_CEILING: Stage = "S2_FOUNDATIONS";

const aboveCeiling = (stage: Stage): boolean =>
  STAGES.indexOf(stage) > STAGES.indexOf(REACHABLE_CEILING);

/**
 * The caveat for a gate NOBODY can pass. It used to ride with every stage floor a child was under,
 * which made it a false statement in front of a guide about a real child: for a child at Ignition,
 * a rung gated at Foundations IS reachable, and the block IS about where the planner has them. On a
 * map with no rung above Foundations at all, every clause of it was false.
 */
const CEILING_NOTE =
  "Almost nothing above Foundations is reachable yet: both higher stages need a child to have asked for harder work, and only one puzzle in the whole product currently offers that. Anything gated above Foundations is out of reach for that reason and not for anything this child did or did not do.";

/** And the caveat for a gate the planner could pass tomorrow, which is a different fact. */
const stageGateNote = (name: string, stage: string): string =>
  `Some rungs here are gated above ${stage}, which is where the planner has ${name} today. That is about where the planner currently has them, not about what they can do and not about this map. Moving them up is the planner's call and it reads their own pace.`;

export interface MadeVM {
  readonly title: string;
  readonly kind: string;
  readonly at: string;
}

/** One link between a project and a milestone, with the things it holds. The artefacts travel with
    it because decision 4 says a standing is never shown without the work it rests on, and they are
    the artefacts ON the link rather than a second derivation that could drift from it. */
export interface EvidenceVM {
  readonly projectId: string;
  readonly project: string;
  readonly made: readonly MadeVM[];
}

export interface OverrideVM {
  readonly by: string;
  readonly at: string;
  readonly note: string;
}

export interface MilestoneReadVM {
  readonly id: string;
  readonly title: string;
  readonly capability: string;
  readonly stage: string;
  readonly isTrunk: boolean;
  readonly branchModes: readonly string[];
  readonly strength: EvidenceStrength;
  readonly strengthText: string;
  readonly strengthNote: string;
  readonly evidence: readonly EvidenceVM[];
  /** Whether a guide could OFFER this next. Not a claim that the child has the capability, and the
      panel says as much in words: the two questions are different and only the second one has to
      come out yes or no. */
  readonly reachable: boolean;
  /** What is in the way, in sentences a guide can act on. Empty exactly when `reachable`. */
  readonly blockedBy: readonly string[];
  readonly override: OverrideVM | null;
  /** An override only does something where there is nothing made and nobody has already said this:
      satisfaction for the purpose of offering is "any evidence at all, or an override", so on a
      milestone that has either the affordance would be a button that changes nothing. A second
      override would also be silently dropped by the engine, which reads the list as a log. */
  readonly canOverride: boolean;
}

export interface ChildReadVM {
  readonly mapId: string;
  readonly kidId: string;
  readonly childName: string;
  readonly stage: string;
  /** Where that stage came from. The planner owns stage and the map never moves anyone, so the
      difference between "the planner read this" and "nobody has placed them here" is worth saying. */
  readonly stageNote: string;
  /** Why no standing is shown, or null when one is. A map that is not in use, or not fit to be, is
      not a map to read a child against; see `standingRefusalFor`. */
  readonly standingRefusal: string | null;
  /** Set only when something on this map is gated above the ceiling nobody can currently pass. */
  readonly ceilingNote: string | null;
  /** Set only when something is gated above where the planner has this child, at a stage the
      planner could actually move them to. A different fact from `ceilingNote` and never the same
      sentence, because one of them is about the product and the other is about a placement. */
  readonly stageGateNote: string | null;
  /** Empty when `standingRefusal` is set. */
  readonly reads: readonly MilestoneReadVM[];
}

const stageText = (s: string): string => STAGE_TEXT[s] ?? s;

function blockerText(
  blocker: Blocker,
  titles: ReadonlyMap<string, string>,
  childName: string,
  childStage: string,
): string {
  if (blocker.kind === "prerequisite") {
    const title = titles.get(blocker.milestoneId) ?? blocker.milestoneId;
    return `Nothing behind "${title}" yet, and that one comes first.`;
  }
  return `Gated at ${stageText(blocker.stageFloor)}, and the planner has ${childName} at ${childStage}.`;
}

/**
 * Why this map is not one to read a child against, or null when it is.
 *
 * SLICE 1 §8 SAYS A MAP WITH AN ERROR NEVER REACHES WHAT A PLAN CONSUMES, and `MapStore.get`
 * enforces exactly that, while the review path is justified on the grounds that no child is
 * downstream of it. Slice 2 made that false: it put a child downstream of the review screen. So the
 * same two conditions the store applies are applied here, plus the one the store leaves to the
 * caller: a map has to be IN USE before anybody is read against it. Withdrawing a map used to leave
 * the child's standing sitting on the screen underneath it.
 */
function standingRefusalFor(
  map: MasteryMap,
  publish: ReturnType<typeof canPublish>,
): string | null {
  if (!publish.ok) {
    return `Nothing here is read against a child while this map is not fit for use. ${publish.reason}`;
  }
  if (map.status === "withdrawn") {
    return "This map has been taken out of use, so nobody is read against it. Nothing about it became invalid, and putting it back into use brings the reading back.";
  }
  if (map.status !== "published") {
    return "This map is not in use yet, so nobody is read against it. Putting it into use is your call, and the reading appears when you make it.";
  }
  return null;
}

/**
 * One map, read against one child. Read-only: it changes no plan, picks nothing out of the list,
 * and creates no evidence link. The engine returns every milestone in its own order (stage floor,
 * then prerequisite depth, then id, then the milestone itself) and this puts words around it.
 *
 * The child's stage comes from the specialization planner, which is the only thing in this system
 * that owns stage. The map asks; it never advances anyone.
 *
 * A map that is not in use, or not fit to be, is refused here rather than read: see
 * `standingRefusalFor`. The map itself still goes on the screen, because the review surface is
 * where a map gets fixed.
 */
export function childReadView(
  map: MasteryMap,
  work: ChildWork,
  overrides: readonly GuideOverride[],
  now: string = REVIEW_NOW,
  store?: HypothesisStore,
): ChildReadVM {
  const { stage, fromPlan } = stageForDomain(work.kidId, map.domainPath, store);
  const childStage = stageText(stage);
  // Against the record just earned, not the one the map arrived carrying, for the same reason
  // `mapView` re-validates: an edit since then replaced the text the stored record was earned by.
  const refusal = standingRefusalFor(
    map,
    canPublish({ ...map, validation: validateMap(map, now) }, now),
  );

  const head = {
    mapId: map.id,
    kidId: work.kidId,
    childName: work.name,
    stage: childStage,
    stageNote: fromPlan
      ? `The planner has ${work.name} at ${childStage} for this domain. The map reads that and never moves it.`
      : `${work.name} has no certified spike in this domain, so nobody has placed them on it and they sit at the first rung.`,
  };

  if (refusal !== null) {
    return { ...head, standingRefusal: refusal, ceilingNote: null, stageGateNote: null, reads: [] };
  }

  const titles = new Map(map.milestones.map((m) => [m.id, m.title]));
  const links = evidenceFor(work);
  const byLink = new Map(links.map((l) => [linkKey(l), l]));
  const reads = readMap(map, links, overrides, stage);

  /** The artefacts ON the link the standing was derived from, found by the key that identifies one
      project's work on one milestone. `readMap` hands back the very links it was given, so this
      resolves every time; the fallback keeps it total and shows the link rather than dropping work
      off a screen whose whole point is that the work is always under the judgment. */
  const evidenceView = (e: MilestoneEvidence): EvidenceVM => {
    const link = byLink.get(linkKey(e));
    return {
      projectId: e.projectId,
      project: link?.project ?? e.projectId,
      made: (link?.made ?? []).map((m) => ({ title: m.title, kind: m.kind, at: m.at })),
    };
  };

  const floors = reads.flatMap((r) =>
    r.blockedBy.flatMap((b) => (b.kind === "stage-floor" ? [b.stageFloor] : [])),
  );

  return {
    ...head,
    standingRefusal: null,
    ceilingNote: floors.some(aboveCeiling) ? CEILING_NOTE : null,
    stageGateNote: floors.some((f) => !aboveCeiling(f))
      ? stageGateNote(work.name, childStage)
      : null,
    reads: reads.map((r) => ({
      id: r.milestone.id,
      title: r.milestone.title,
      capability: r.milestone.capability,
      stage: stageText(r.milestone.stageFloor),
      isTrunk: r.milestone.modes.length === 0,
      branchModes: r.milestone.modes.map(modeLabel),
      strength: r.strength,
      strengthText: STRENGTH_TEXT[r.strength],
      strengthNote: STRENGTH_NOTE[r.strength],
      evidence: r.evidence.map(evidenceView),
      reachable: r.reachable,
      blockedBy: r.blockedBy.map((b) => blockerText(b, titles, work.name, childStage)),
      override:
        r.override === null
          ? null
          : { by: r.override.actor.id, at: r.override.at, note: r.override.note },
      canOverride: r.strength === "none" && r.override === null,
    })),
  };
}

/**
 * The override a guide records from the panel, signed and dated the way an edit already is.
 *
 * `at` is required and there is no default. It used to be stamped with `REVIEW_NOW`, the fixed
 * instant the panel validates against, which dated every override a guide would ever record to the
 * same moment. A validation clock can be pinned because validation is a pure function of the map;
 * a human record cannot, because the moment it was signed is part of what it records.
 */
export function overrideFor(milestoneId: string, note: string, at: string): GuideOverride {
  return guideOverride(milestoneId, REVIEW_ACTOR, at, note);
}

/** Stable tokens at the head of the thrown messages, so a caller keys on these and not on prose. */
export const OVERRIDE_UNKNOWN_MILESTONE = "OVERRIDE_UNKNOWN_MILESTONE";
export const OVERRIDE_ALREADY_RECORDED = "OVERRIDE_ALREADY_RECORDED";

/**
 * Record a guide's override against the child, the way `applyEdit` records a correction against the
 * map: through one function that cannot be skipped, leaving the decision in the child's record
 * rather than in a component's state where a re-render loses it.
 *
 * It refuses a SECOND override on the same milestone. The engine reads the list as a log and keeps
 * the last entry, so a duplicate would quietly discard whatever the earlier one said, and the
 * earlier one is the record of a decision somebody made and signed.
 *
 * It refuses a milestone this map does not have, exactly as `applyEdit` does, so an override
 * recorded against one map can never land on another that happens to reuse an id.
 */
export function recordOverride(
  map: MasteryMap,
  work: ChildWork,
  override: GuideOverride,
): ChildWork {
  if (!map.milestones.some((m) => m.id === override.milestoneId)) {
    throw new Error(
      `${OVERRIDE_UNKNOWN_MILESTONE}: map "${map.id}" has no milestone "${override.milestoneId}"`,
    );
  }
  const held = work.overrides.find((o) => o.milestoneId === override.milestoneId);
  if (held !== undefined) {
    throw new Error(
      `${OVERRIDE_ALREADY_RECORDED}: ${work.name} already has an override on "${override.milestoneId}", recorded by ${held.actor.id} on ${held.at.slice(0, 10)}. Recording a second one would drop that record.`,
    );
  }
  return { ...work, overrides: [...work.overrides, override] };
}
