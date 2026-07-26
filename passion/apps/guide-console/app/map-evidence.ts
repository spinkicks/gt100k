// What each child has actually MADE, and which milestone each thing may evidence (024 mastery maps,
// slice 2). The console's own demo data, seeded here the way `maps-seed.ts` seeds the maps and
// `console-data.ts` seeds the roster.
//
// SLICE 2 DERIVES STANDING, IT DOES NOT CREATE LINKS. `readMap` is handed `MilestoneEvidence` and
// takes it as given, so somebody upstream has to decide which artefact evidences which milestone.
// Here that somebody is this file. In production it is the Evidence Graph, and the shape below is
// deliberately the shape a project-workspace `WorkEvent` of kind "artifact" already carries, so
// swapping the source later is a change of where the records come from and not a change of model.
// Nothing here reaches into that package, and nothing here is derived from a checkbox: every
// standing the panel shows is computed from the artefacts listed below and from nothing else.
//
// SYNTHETIC. Four synthetic children, no real child data, same as every other console seed.
import {
  samePath,
  servesPath,
  type GuideOverride,
  type MilestoneEvidence,
} from "@gt100k/mastery-map";
import type { DomainPath, Stage } from "@gt100k/specialization-planner";

import { CHILDREN } from "./console-data.js";
import { plansForKid } from "./plan.js";

/** One thing the child made. `kind` is the artefact kind a `WorkEvent` already carries, and
    `milestoneId` is the link: the claim that this thing might show that capability. */
export interface MadeThing {
  readonly title: string;
  readonly kind: string;
  readonly at: string;
  readonly milestoneId: string;
}

export interface ChildProject {
  readonly id: string;
  readonly title: string;
  readonly made: readonly MadeThing[];
}

export interface ChildWork {
  readonly kidId: string;
  readonly name: string;
  readonly projects: readonly ChildProject[];
  /** Overrides a guide had already recorded before this session. The console appends to these. */
  readonly overrides: readonly GuideOverride[];
}

/** The same guide the console signs an edit as, written out here for the same reason `maps-seed.ts`
    writes `vettedBy` out: this file is seed data and has no business importing the review screen. */
const GUIDE = { id: "guide-104", role: "GUIDE" } as const;

// ── Ari: a piano child whose earliest work was never kept ────────────────────────────────────────
// The case an override exists for. Ari has one recording behind the steady-pulse milestone and
// nothing at all behind the whole-piece milestone that comes before it, because that happened
// somewhere nobody was keeping the work. The override lets the next rung be offered; it does NOT
// put a standing on the milestone it names, and the panel shows both facts side by side.

const ARI_WORK: ChildWork = {
  kidId: "kid-synthetic-001",
  name: "Ari Mercado",
  projects: [
    {
      id: "proj-scales-notebook",
      title: "Scales notebook",
      made: [
        {
          title: "G major, hands together, one steady pulse",
          kind: "recording",
          at: "2026-07-14T16:20:00.000Z",
          milestoneId: "pf-steady-pulse",
        },
      ],
    },
  ],
  overrides: [
    {
      milestoneId: "pf-one-whole-piece",
      actor: GUIDE,
      at: "2026-07-15T09:00:00.000Z",
      note:
        "Ari played whole pieces for two years before joining and none of it was kept. I am not " +
        "asking them to redo it to unlock the next thing.",
    },
  ],
};

// ── Bex: one paper sat, and the next rung open with nothing behind it yet ────────────────────────

const BEX_WORK: ChildWork = {
  kidId: "kid-synthetic-002",
  name: "Bex Ito",
  projects: [
    {
      id: "proj-amc8-practice",
      title: "AMC 8 practice papers",
      made: [
        {
          title: "First whole paper, sat in one sitting and marked",
          kind: "marked script",
          at: "2026-07-09T15:05:00.000Z",
          milestoneId: "cm-first-whole-paper",
        },
      ],
    },
  ],
  overrides: [],
};

// ── Cyrus: nothing linked anywhere, which is a state the panel has to render honestly ────────────

const CYRUS_WORK: ChildWork = {
  kidId: "kid-synthetic-003",
  name: "Cyrus Okafor",
  projects: [],
  overrides: [],
};

// ── Dulce: the one child with a certified spike in a domain that has a map ───────────────────────
// Her game-dev spike is ACTIVE, so the stage below is the planner's real read on her and not a
// default. Two projects, four artefacts, spread over two milestones on purpose: one milestone
// evidenced twice inside a single project, and one evidenced once from each of two projects.

const DULCE_WORK: ChildWork = {
  kidId: "kid-synthetic-004",
  name: "Dulce Park",
  projects: [
    {
      id: "proj-rescue-the-toaster",
      title: "Rescue the Toaster",
      made: [
        {
          title: "One-screen build, finished end to end",
          kind: "build",
          at: "2026-06-28T18:40:00.000Z",
          milestoneId: "gd-one-screen-game",
        },
        {
          title: "Playable link her cousin got to the end of",
          kind: "link",
          at: "2026-07-02T17:10:00.000Z",
          milestoneId: "gd-one-screen-game",
        },
        {
          title: "The three steps that make the lift break, written down",
          kind: "note",
          at: "2026-07-11T19:25:00.000Z",
          milestoneId: "gd-reproduce-a-bug",
        },
      ],
    },
    {
      id: "proj-toaster-lift-fix",
      title: "The lift fix",
      made: [
        {
          title: "Fix for the lift bug with the cause named",
          kind: "patch",
          at: "2026-07-18T20:05:00.000Z",
          milestoneId: "gd-reproduce-a-bug",
        },
      ],
    },
  ],
  overrides: [],
};

const WORK: readonly ChildWork[] = [ARI_WORK, BEX_WORK, CYRUS_WORK, DULCE_WORK];

/**
 * What this child has made. A child with nothing linked still gets a record, because "nothing has
 * been linked here yet" is a thing a guide needs to see and an empty screen is not that.
 */
export function workForKid(kidId: string): ChildWork {
  const held = WORK.find((w) => w.kidId === kidId);
  if (held) return held;
  return {
    kidId,
    name: CHILDREN.find((c) => c.id === kidId)?.name ?? kidId,
    projects: [],
    overrides: [],
  };
}

/**
 * One evidence link with the things it actually stands for travelling on it. The count and the list
 * cannot disagree, because the count IS the length of the list, and a surface showing the standing
 * beside the work reads both off this one object rather than deriving the artefacts a second time
 * from somewhere else. Decision 4 is why that matters: the work under a standing has to be the work
 * the standing was computed from, or the screen is showing a judgment of something else.
 */
export interface WorkLink extends MilestoneEvidence {
  /** The project's title, so a surface never has to look the project up again. */
  readonly project: string;
  /** The things this link stands for, in the order they were made. */
  readonly made: readonly MadeThing[];
}

/**
 * The evidence links `readMap` consumes, built from the artefacts above so the two can never
 * disagree. One link per project per milestone. Order follows the projects and then the artefacts,
 * so it is stable across renders.
 */
export function evidenceFor(work: ChildWork): readonly WorkLink[] {
  const out: WorkLink[] = [];
  for (const project of work.projects) {
    const byMilestone = new Map<string, MadeThing[]>();
    for (const thing of project.made) {
      const held = byMilestone.get(thing.milestoneId);
      if (held === undefined) byMilestone.set(thing.milestoneId, [thing]);
      else held.push(thing);
    }
    for (const [milestoneId, made] of byMilestone) {
      out.push({
        milestoneId,
        projectId: project.id,
        artifactCount: made.length,
        project: project.title,
        made,
      });
    }
  }
  return out;
}

/** One key per link, so a read handed back by the engine finds the artefacts it was derived from
    rather than a fresh derivation that could have drifted from them. */
export function linkKey(link: MilestoneEvidence): string {
  return `${link.projectId}\u0000${link.milestoneId}`;
}

export interface ChildStage {
  readonly stage: Stage;
  /** Whether the planner actually read this, or whether the child simply has no certified spike in
      this domain and therefore sits at the floor. A guide should be able to tell those apart. */
  readonly fromPlan: boolean;
}

/**
 * The child's stage for this domain, read off the specialization planner, which is the only thing
 * in this system that owns stage. The map never advances anybody and must not become a second
 * ladder, so it asks rather than deciding.
 *
 * WHICH PLAN COUNTS IS THE ENGINE'S RULE, not a second one written here. `servesPath` is the same
 * predicate `MapStore.get` resolves with: the exact domain, or the cabin above a sub-topic. A plain
 * equality check missed the widening, so a child whose spike sits on `["code-computers",
 * "game-dev"]`, reading a map filed at `["code-computers"]`, was told nobody had placed them in a
 * domain the planner has a live read on, and every gated rung was then blamed on the wrong thing.
 * Exact first, then the wider one, in the same order the store prefers them.
 *
 * A child with no certified spike this map serves has no plan and therefore no read, and sits at
 * the first rung. That is the honest answer: they have not been placed anywhere here.
 */
export function stageForDomain(kidId: string, domainPath: DomainPath): ChildStage {
  const plans = plansForKid(kidId);
  const plan =
    plans.find((p) => samePath(p.domainPath, domainPath)) ??
    plans.find((p) => servesPath(domainPath, p.domainPath));
  return plan
    ? { stage: plan.plan.stage, fromPlan: true }
    : { stage: "S1_IGNITION", fromPlan: false };
}
