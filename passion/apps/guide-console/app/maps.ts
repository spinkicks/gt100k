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
import type { HumanActor } from "@gt100k/hypothesis-store";
import {
  applyEdit,
  canPublish,
  validateMap,
  type Justification,
  type MapEdit,
  type MapStatus,
  type MasteryMap,
  type Milestone,
  type OpportunityHint,
  type OrderingBasis,
  type PracticeForm,
  type ValidationProblem,
} from "@gt100k/mastery-map";
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
  published: "In use. It passed the validator, which is the only gate a map has.",
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
