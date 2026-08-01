// What each child has actually MADE, and which milestone each project was meant to demonstrate
// (024 mastery maps, slice 2). The console's own demo data, seeded here the way `maps-seed.ts`
// seeds the maps and `console-data.ts` seeds the roster.
//
// SLICE 2 DERIVES STANDING, IT DOES NOT CREATE LINKS. `readMap` is handed `MilestoneEvidence` and
// takes it as given, so somebody upstream has to decide what evidences which milestone. THIS FILE
// IS THAT SOMEBODY, and it has to be: mastery-map depends on the specialization planner, and
// project-workspace depends on the planner too, so neither of those packages may import mastery-map
// without making a cycle of it. The composition belongs above both, in the console that already
// assembles a plan, which is the whole reason it lives here rather than in an engine.
//
// THE LINK RIDES ON THE PROJECT, NOT ON THE ARTEFACT, because that is the only shape the pipeline
// can produce: the caller selects one milestone, the planner stamps it onto one brief, and one
// `Project` comes out carrying it. A per-artefact tag let one project span several rungs, which no
// real project ever does. `evidenceFromProjects` below is the adapter from the real thing, and it
// is the same function `evidenceFor` is, so moving off these seeds is a change of source and not a
// change of model. Nothing here is derived from a checkbox: every standing the panel shows is
// computed from the artefacts listed below and from nothing else.
//
// SYNTHETIC. Four synthetic children, no real child data, same as every other console seed.
import {
  evidenceFromAttestations,
  samePath,
  servesPath,
  type Attestation,
  type GuideOverride,
  type MilestoneEvidence,
} from "@gt100k/mastery-map";
// Type-only, so nothing of that package reaches the bundle. The adapter reads a `Project`'s shape
// and calls nothing, which is all a pure fold over its events needs.
import type { Project } from "@gt100k/project-workspace";
import type { DomainPath, Stage } from "@gt100k/specialization-planner";

import { children } from "./console-data.js";
import type { HypothesisStore } from "@gt100k/hypothesis-store";
import { plansForKid } from "./plan.js";

/** One thing the child made. `kind` is the artefact kind a `WorkEvent` already carries. It holds no
    milestone of its own: which rung the work was aimed at is a fact about the project. */
export interface MadeThing {
  readonly title: string;
  readonly kind: string;
  readonly at: string;
  /**
   * Where it lives, when it does not live here.
   *
   * Present only on attested external work. A studio artefact has no url because it is in the
   * evidence graph; a chess.com game does, and the url IS the checkable part — it is a public record
   * on a third party's server, which is the half of the claim a link can actually carry.
   */
  readonly url?: string;
}

/** The console's stand-in for a `Project`, field for field on the two things a standing needs.
    `milestoneId` is optional here for the same reason it is optional there: a self-directed
    project belongs to no milestone, and one aimed at none evidences none. */
export interface ChildProject {
  readonly id: string;
  readonly title: string;
  readonly milestoneId?: string;
  readonly made: readonly MadeThing[];
}

export interface ChildWork {
  readonly kidId: string;
  readonly name: string;
  readonly projects: readonly ChildProject[];
  /** Overrides a guide had already recorded before this session. The console appends to these. */
  readonly overrides: readonly GuideOverride[];
  /**
   * Claims on a milestone for work done somewhere we do not run, each with the examination of it.
   *
   * The ordinary case for most of the catalogue: the map says play rated games weekly and chess.com
   * already exists, so nothing about that climb reaches this system as a project. Only an attestation
   * that survived its defense contributes, and `@gt100k/mastery-map`'s `refusalFor` is what decides.
   */
  readonly attestations?: readonly Attestation[];
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
      milestoneId: "pf-steady-pulse",
      made: [
        {
          title: "G major, hands together, one steady pulse",
          kind: "recording",
          at: "2026-07-14T16:20:00.000Z",
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

// ── Bex: one paper sat on the maths map, and a chess climb that crosses branches ─────────────────
// Bex is also the chess candidate the hypothesis store already carries (console-data.ts), so she is
// the honest choice for showing a child climbing the deepened chess map: real work, not a new
// synthetic kid invented for the occasion. The chess climb below is deliberately spread across
// TWO OF THE MAP'S MODE BRANCHES plus a trunk rung, because a map that only lit up on one branch
// would not show the graph shape Task 4 built.
//
// The scoresheet and the beginner lesson are things she made and kept, so they arrive as projects,
// the same way her AMC 8 papers do. The tournament game and the game review happened on chess.com
// and Lichess, which is the ordinary case attestation exists for (see map-evidence's file comment
// and DULCE_WORK below): nothing about play on a third party's server reaches this system as a
// project. Both links use each site's real profile-URL SHAPE with a generic "example" account
// rather than a specific game id, because I have no way to verify a particular game id is live and
// the honesty rule here is the same one the map itself is held to: no claim dressed up as more
// certain than it is.
const BEX_WORK: ChildWork = {
  kidId: "kid-synthetic-002",
  name: "Bex Ito",
  projects: [
    {
      id: "proj-amc8-practice",
      title: "AMC 8 practice papers",
      milestoneId: "cm-first-whole-paper",
      made: [
        {
          title: "First whole paper, sat in one sitting and marked",
          kind: "marked script",
          at: "2026-07-09T15:05:00.000Z",
        },
      ],
    },
    {
      // Trunk rung ch-write-it-down: kept, not linked, same as the AMC 8 scripts above.
      id: "proj-chess-scoresheets",
      title: "Scoresheets from the club ladder",
      milestoneId: "ch-write-it-down",
      made: [
        {
          title: "A legible scoresheet, both sides recorded, from the Tuesday club ladder",
          kind: "scoresheet",
          at: "2026-07-08T18:15:00.000Z",
        },
      ],
    },
    {
      // Branch: explain. Bex taught the newest club member one pin pattern; the note is what she
      // wrote down about it afterwards, not anything chess.com or Lichess ever saw.
      id: "proj-chess-teach-a-beginner",
      title: "Teaching the newest kid at the club",
      milestoneId: "ch-teach-a-beginner",
      made: [
        {
          title:
            "A ten-minute pin lesson for the newest club member, and what he found the next week",
          kind: "note",
          at: "2026-07-22T17:40:00.000Z",
        },
      ],
    },
  ],
  overrides: [],
  attestations: [
    {
      // Branch: perform. Stands. A slow game played and scored under a clock, in a Lichess arena —
      // an online format but still the tournament conditions ch-real-tournament-game asks for (the
      // map's own ch-see-the-tactic milestone already points to "a free online arena on Lichess or
      // Chess.com" as the same kind of opportunity).
      id: "att-bex-tournament-game",
      milestoneId: "ch-real-tournament-game",
      links: [
        {
          url: "https://lichess.org/@/example",
          what:
            "My Lichess profile, with the slow arena game I also kept a paper scoresheet for — " +
            "the one where I finally sat through a whole long game without losing on time",
          at: "2026-07-15T19:00:00.000Z",
        },
      ],
      examined: {
        at: "2026-07-16T14:00:00.000Z",
        coverageByFacet: {
          what: 0.78,
          why: 0.61,
          how: 0.82,
          challenge: 0.71,
          next: 0.55,
          audience: 0.5,
        },
        gaps: ["next", "audience"],
      },
    },
    {
      // Branch: investigate. Stands. Reviewing her own lost game, in her own words, before running
      // an engine, which is exactly what ch-study-your-games asks for.
      id: "att-bex-study-your-games",
      milestoneId: "ch-study-your-games",
      links: [
        {
          url: "https://www.chess.com/member/example",
          what:
            "My Chess.com profile, with the analysis I wrote on the rook-endgame game I lost — " +
            "where I thought it turned, written before I ran the computer on it",
          at: "2026-07-23T20:10:00.000Z",
        },
      ],
      examined: {
        at: "2026-07-24T13:30:00.000Z",
        coverageByFacet: {
          what: 0.7,
          why: 0.58,
          how: 0.75,
          challenge: 0.69,
          next: 0.4,
          audience: 0.45,
        },
        gaps: ["next", "audience"],
      },
    },
  ],
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
// default. Three projects, four artefacts, over two milestones: one milestone evidenced twice
// inside a single project, and one evidenced once from each of two projects.
//
// THE BUG WRITE-UP IS ITS OWN PROJECT, and it used to be a third artefact filed under "Rescue the
// Toaster" with a milestone id of its own. That could not survive the model: a project carries one
// milestone, so the choice was to drop the work or to give it the project it always was. Dulce did
// two separable pieces of work on one game, and the second was aimed at a different rung.

const DULCE_WORK: ChildWork = {
  kidId: "kid-synthetic-004",
  name: "Dulce Park",
  projects: [
    {
      id: "proj-rescue-the-toaster",
      title: "Rescue the Toaster",
      milestoneId: "gd-one-screen-game",
      made: [
        {
          title: "One-screen build, finished end to end",
          kind: "build",
          at: "2026-06-28T18:40:00.000Z",
        },
        {
          title: "Playable link her cousin got to the end of",
          kind: "link",
          at: "2026-07-02T17:10:00.000Z",
        },
      ],
    },
    {
      id: "proj-toaster-lift-bug",
      title: "Finding the lift bug",
      milestoneId: "gd-reproduce-a-bug",
      made: [
        {
          title: "The three steps that make the lift break, written down",
          kind: "note",
          at: "2026-07-11T19:25:00.000Z",
        },
      ],
    },
    {
      id: "proj-toaster-lift-fix",
      title: "The lift fix",
      milestoneId: "gd-reproduce-a-bug",
      made: [
        {
          title: "Fix for the lift bug with the cause named",
          kind: "patch",
          at: "2026-07-18T20:05:00.000Z",
        },
      ],
    },
  ],
  overrides: [],
  // WORK DONE SOMEWHERE WE DO NOT RUN, which is the ordinary case and the reason attestation exists.
  // Dulce builds in the Studio and also ships on itch.io, and nothing about the second reaches this
  // system as a project. All three states are seeded because a guide who cannot tell them apart is
  // worse off than one shown nothing: only the first is a standing.
  //
  // The game-dev map rather than competition maths, because that map is a `draft` and the panel
  // rightly refuses to read any child against a map nobody has put into use.
  attestations: [
    {
      // Stands. Examined, and she accounted for the work on every facet that speaks to authorship,
      // so these three links become three artefacts behind the rung.
      id: "att-dulce-playtests",
      milestoneId: "gd-playtest",
      links: [
        {
          url: "https://itch.io/jam/gmtk-jam/rate/1938201",
          what: "Jam entry with the ratings and comments strangers left on it",
          at: "2026-07-11T18:30:00.000Z",
        },
        {
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          what: "Recording of two friends playing it while I said nothing",
          at: "2026-07-18T15:10:00.000Z",
        },
        {
          url: "https://itch.io/jam/gmtk-jam/rate/194155",
          what: "The second build, after I changed the bit everyone got stuck on",
          at: "2026-07-25T12:00:00.000Z",
        },
      ],
      examined: {
        at: "2026-07-28T14:00:00.000Z",
        coverageByFacet: {
          what: 0.84,
          why: 0.73,
          how: 0.9,
          challenge: 0.81,
          next: 0.52,
          audience: 0.66,
        },
        // `next` is thin and it does not matter: where she goes next is the planner's question, not
        // evidence about what already happened.
        gaps: ["next"],
      },
    },
    {
      // Queued. Submitted, nobody has sat down with her yet. That is a fact about our capacity
      // rather than about Dulce, and the panel has to keep the two distinguishable.
      id: "att-dulce-repo",
      milestoneId: "gd-version-control",
      links: [
        {
          url: "https://github.com/example/toaster-rescue/commits/main",
          what: "My commit history, including the day I broke it and rolled back",
          at: "2026-07-27T17:15:00.000Z",
        },
      ],
    },
    {
      // Refused, and the most important row a guide can be shown. The link is real and the work
      // behind it is real; she could not say how she got there or what went wrong. That is the shape
      // copied work leaves behind — and equally the shape of work genuinely done and forgotten. The
      // panel names the gap and does not diagnose which, because it cannot.
      id: "att-dulce-profiler",
      milestoneId: "gd-profile-a-scene",
      links: [
        {
          url: "https://gist.github.com/example/9f2b1c4e",
          what: "Profiler output from the scene that was dropping frames",
          at: "2026-07-20T13:00:00.000Z",
        },
      ],
      examined: {
        at: "2026-07-29T15:30:00.000Z",
        coverageByFacet: {
          what: 0.66,
          why: 0.48,
          how: 0.19,
          challenge: 0.17,
          next: 0.4,
          audience: 0.3,
        },
        gaps: ["how", "challenge", "next"],
      },
    },
  ],
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
    name: children().find((c) => c.id === kidId)?.name ?? kidId,
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
 * The evidence links `readMap` consumes, built from the projects above so the two can never
 * disagree. ONE LINK PER PROJECT THAT NAMES A MILESTONE, holding every artefact on that project; a
 * project aimed at no milestone yields nothing, because it evidences nothing. Order follows the
 * projects, so it is stable across renders.
 *
 * A project aimed at a milestone with nothing made yet still yields a link, carrying zero. That is
 * not the same fact as no project at all, and the difference is one a guide can act on. It reads as
 * `none` either way, which is the point: starting a milestone is not evidence of finishing it.
 */
export function evidenceFor(work: ChildWork): readonly WorkLink[] {
  return [...linksFrom(work.projects), ...linksFromAttestations(work.attestations ?? [])];
}

/**
 * Attested external work, in the same shape studio work arrives in.
 *
 * DELIBERATELY THE SAME SHAPE, so the panel's rule survives without knowing about attestation at
 * all: a standing is never shown without the work under it, and the work under an attested standing
 * is the list of links the child was examined on. If external work had its own render path, that
 * guarantee would have to be re-implemented and could drift.
 *
 * `evidenceFromAttestations` decides what counts, so an unexamined or failed claim never reaches
 * here. That is the same division of labour `linksFrom` has with the projects: this function shapes,
 * it does not judge.
 */
function linksFromAttestations(attestations: readonly Attestation[]): readonly WorkLink[] {
  const standing = new Map(evidenceFromAttestations(attestations).map((e) => [e.projectId, e]));
  return attestations.flatMap((a) => {
    const ev = standing.get(a.id);
    if (ev === undefined) return [];
    return [
      {
        ...ev,
        // Named as work done elsewhere rather than given the milestone's title, because a guide
        // reading the row needs to know which of the two kinds of evidence they are looking at:
        // one was made under our eye and one was vouched for after the fact.
        project: "Made elsewhere",
        made: a.links.map((l) => ({ title: l.what, kind: "external", at: l.at, url: l.url })),
      },
    ];
  });
}

/**
 * The same fold over the real thing: the links a child's actual `Project`s support.
 *
 * ONLY A WORK-EVENT OF KIND `artifact` COUNTS. Not a session, not an attempt, not a reflection. The
 * design says a milestone is demonstrated by a thing that exists, and sessions are effort rather
 * than artefacts, so counting them would let a child who worked hard and made nothing read as
 * having made something.
 *
 * Pure, and it lives here rather than in `project-workspace` because the return type is
 * mastery-map's and that package may not import mastery-map: mastery-map already depends on the
 * planner, and so does the workspace. The console is the layer that holds both.
 */
export function evidenceFromProjects(projects: readonly Project[]): readonly WorkLink[] {
  return linksFrom(
    projects.map((p) => ({
      id: p.id,
      title: p.title,
      milestoneId: p.milestoneId,
      made: p.events.flatMap((e) =>
        e.kind === "artifact"
          ? [
              {
                // A child's own words are the fallback title, because an `artifact` event with no
                // payload on it is still a thing they say they made, and the kind decides what
                // counts. Dropping it would undercount real work over a missing optional field.
                title: e.artifact?.title ?? e.text,
                kind: e.artifact?.kind ?? "artifact",
                at: e.at,
              },
            ]
          : [],
      ),
    })),
  );
}

function linksFrom(projects: readonly ChildProject[]): readonly WorkLink[] {
  return projects.flatMap((project) =>
    project.milestoneId === undefined
      ? []
      : [
          {
            milestoneId: project.milestoneId,
            projectId: project.id,
            artifactCount: project.made.length,
            project: project.title,
            made: project.made,
          },
        ],
  );
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
export function stageForDomain(
  kidId: string,
  domainPath: DomainPath,
  store?: HypothesisStore,
): ChildStage {
  const plans = plansForKid(kidId, store);
  const plan =
    plans.find((p) => samePath(p.domainPath, domainPath)) ??
    plans.find((p) => servesPath(domainPath, p.domainPath));
  return plan
    ? { stage: plan.plan.stage, fromPlan: true }
    : { stage: "S1_IGNITION", fromPlan: false };
}
