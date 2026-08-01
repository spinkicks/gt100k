/**
 * The link between a project a child actually did and the milestone it was meant to demonstrate
 * (spec `2026-07-26-milestone-project-wiring.md`).
 *
 * `readMap` derives a standing from `MilestoneEvidence` and creates none, so something above both
 * has to make the links. That something cannot be the planner or the workspace: mastery-map depends
 * on the planner and the workspace depends on it too, so either of them importing mastery-map is a
 * cycle. The composition therefore lives in the console, and this file is the test of it.
 *
 * WHAT COUNTS IS A WORK-EVENT OF KIND `artifact` AND NOTHING ELSE. A session is effort, an attempt
 * is effort, a reflection is words about effort. The design says a milestone is demonstrated by a
 * thing that exists, so only the events that record a thing are counted.
 */
import { readMap, type MilestoneEvidence } from "@gt100k/mastery-map";
import {
  logEvent,
  startProject,
  type Project,
  type ProjectBrief,
  type WorkEventKind,
} from "@gt100k/project-workspace";
import {
  curatedForCell,
  derivePlanInputs,
  planSpecialization,
  stubBriefGenerator,
} from "@gt100k/specialization-planner";
import { getForKid } from "@gt100k/hypothesis-store";
import { describe, expect, it } from "vitest";

import { PILOT_CATALOG, ROSTER_NOW, profileFor } from "../app/console-data.js";
import { evidenceFor, evidenceFromProjects, workForKid } from "../app/map-evidence.js";
import { CONSOLE_GAME_DEV_MAP } from "../app/maps-seed.js";
import { PLAN_AGE_TIER, PLAN_LIBRARY } from "../app/plan-library.js";
import { wellbeingForKid } from "../app/wellbeing.js";

const NOW = "2026-07-20T09:00:00.000Z";

const BRIEF: ProjectBrief = {
  title: "Rescue the Toaster",
  drivingQuestion: "What makes a one-screen game worth finishing?",
  authenticMethod: "Build it, hand it to somebody, watch where they stop.",
  audience: "MENTOR_PEERS",
  childOwnsChoice: true,
  craftScaffold: "One bounded practice on collision shapes.",
  successLooksLike: "Somebody who is not you reached the end of it.",
  source: "stub",
};

/** A project from a brief, optionally stamped with the milestone the caller selected. */
function projectOn(milestoneId?: string): Project {
  return startProject(
    {
      brief: milestoneId === undefined ? BRIEF : { ...BRIEF, milestoneId },
      kidId: "kid-1",
      ageBand: "9-11",
    },
    NOW,
  );
}

/** Append one work-event of each kind given, in order, the way a child's journey grows. */
function worked(project: Project, kinds: readonly WorkEventKind[]): Project {
  return kinds.reduce(
    (held, kind, i) =>
      logEvent(
        held,
        {
          kind,
          at: `2026-07-2${i}T10:00:00.000Z`,
          text: `entry ${i}`,
          ...(kind === "artifact" ? { artifact: { title: `Thing ${i}`, kind: "build" } } : {}),
        },
        NOW,
      ),
    project,
  );
}

describe("Evidence from real projects: what a link is made of", () => {
  it("makes one link per project, counting the artefacts on it", () => {
    const links = evidenceFromProjects([
      worked(projectOn("gd-one-screen-game"), ["artifact", "artifact", "artifact"]),
    ]);
    expect(links).toHaveLength(1);
    expect(links[0]!.milestoneId).toBe("gd-one-screen-game");
    expect(links[0]!.artifactCount).toBe(3);
  });

  /**
   * STARTING A MILESTONE IS NOT EVIDENCE OF FINISHING IT. A child who was given the rung, opened
   * the project and made nothing has made nothing, and the honest report of that is `none`. A link
   * is still emitted, because "this project was aimed here and produced nothing yet" is a different
   * fact from "no project was ever aimed here", and only the first one is worth a guide's time.
   */
  it("starting a milestone is not evidence of finishing it: a project with no artefact reads as none", () => {
    const links = evidenceFromProjects([
      worked(projectOn("gd-one-screen-game"), ["session", "session"]),
    ]);
    expect(links).toHaveLength(1);
    expect(links[0]!.artifactCount).toBe(0);

    const read = readMap(CONSOLE_GAME_DEV_MAP, links, [], "S1_IGNITION").find(
      (r) => r.milestone.id === "gd-one-screen-game",
    )!;
    expect(read.strength).toBe("none");
    // And it cannot satisfy the rung that comes after it either, because satisfaction is keyed off
    // the same standing the guide can see, and the guide can see there is nothing here.
    const next = readMap(CONSOLE_GAME_DEV_MAP, links, [], "S1_IGNITION").find(
      (r) => r.milestone.id === "gd-reproduce-a-bug",
    )!;
    expect(next.blockedBy).toContainEqual({
      kind: "prerequisite",
      milestoneId: "gd-one-screen-game",
    });
  });

  it("counts no session, attempt or reflection toward the artefacts", () => {
    const links = evidenceFromProjects([
      worked(projectOn("gd-one-screen-game"), [
        "session",
        "attempt",
        "reflection",
        "artifact",
        "outcome",
        "revision",
        "decision",
        "ai_help",
        "milestone",
        "showcase",
      ]),
    ]);
    expect(links[0]!.artifactCount).toBe(1);
    expect(readMap(CONSOLE_GAME_DEV_MAP, links, [], "S1_IGNITION")[0]!.strength).toBe("single");
  });

  it("makes no link at all for a project the caller aimed at no milestone", () => {
    const links = evidenceFromProjects([worked(projectOn(), ["artifact", "artifact"])]);
    expect(links).toEqual([]);
    for (const read of readMap(CONSOLE_GAME_DEV_MAP, links, [], "S1_IGNITION")) {
      expect(read.strength).toBe("none");
    }
  });

  /** Decision 4: the standing is never shown without the work it rests on, so the artefacts ride
      on the link rather than being derived a second time from somewhere the screen cannot see. */
  it("carries the artefacts it counted, so the count and the list cannot disagree", () => {
    const links = evidenceFromProjects([
      worked(projectOn("gd-one-screen-game"), ["artifact", "session", "artifact"]),
    ]);
    expect(links[0]!.made.map((m) => m.title)).toEqual(["Thing 0", "Thing 2"]);
    expect(links[0]!.made).toHaveLength(links[0]!.artifactCount);
    expect(links[0]!.project).toBe("Rescue the Toaster");
    // And what it returns is what the engine takes, which is the whole point of the adapter.
    const asEvidence: readonly MilestoneEvidence[] = links;
    expect(asEvidence).toHaveLength(1);
  });

  it("is pure: the same projects give the same links, and the projects are untouched", () => {
    const projects = [worked(projectOn("gd-one-screen-game"), ["artifact"])];
    const before = JSON.stringify(projects);
    expect(evidenceFromProjects(projects)).toEqual(evidenceFromProjects(projects));
    expect(JSON.stringify(projects)).toBe(before);
  });
});

/**
 * The console's seeds take the same shape a real project does, which is what makes swapping the
 * source a one-line change rather than a rewrite. A `ChildProject` therefore carries ONE milestone
 * id, the way a `Project` does, and not one per artefact: the caller selects a milestone, the
 * planner stamps it onto one brief, and one project comes out of it.
 */
describe("Evidence from the console's seeds: the same rule, on the demo data", () => {
  it("makes one link per project that names a milestone, with every artefact on it", () => {
    const dulce = workForKid("kid-synthetic-004");
    const byProject = new Map(dulce.projects.map((p) => [p.id, p]));
    // `evidenceFor` folds two sources now: projects made in the Studio, and attested work done
    // somewhere we do not run. This test owns the first rule, so it takes the project-derived links
    // and asserts the count against the projects rather than against the whole fold.
    const links = evidenceFor(dulce).filter((l) => byProject.has(l.projectId));
    expect(links).toHaveLength(dulce.projects.filter((p) => p.milestoneId !== undefined).length);
    for (const link of links) {
      const project = byProject.get(link.projectId)!;
      expect(link.milestoneId).toBe(project.milestoneId);
      expect(link.artifactCount).toBe(project.made.length);
      expect(link.made).toEqual(project.made);
    }
  });

  it("folds attested external work in alongside the projects, without disturbing them", () => {
    // The two sources have to coexist on one child: Dulce builds in the Studio AND ships on itch.io.
    // Only the attestation that survived its defense contributes, so her three claims yield one
    // link, not three.
    const dulce = workForKid("kid-synthetic-004");
    const projectIds = new Set(dulce.projects.map((p) => p.id));
    const attested = evidenceFor(dulce).filter((l) => !projectIds.has(l.projectId));
    expect(attested).toHaveLength(1);
    expect(attested[0]?.projectId).toBe("att-dulce-playtests");
    expect(attested[0]?.artifactCount).toBe(3);
    // And it carries the address, which is the half of an external claim a child cannot fabricate.
    for (const m of attested[0]?.made ?? []) expect(m.url).toMatch(/^https:\/\//);
  });

  it("makes no link for a seed project that names no milestone", () => {
    const work = {
      kidId: "kid-1",
      name: "Nobody",
      projects: [{ id: "p1", title: "Off on their own", made: [] }],
      overrides: [],
    };
    expect(evidenceFor(work)).toEqual([]);
  });
});

/**
 * The whole chain, in one test. A caller picks a milestone off a map, the planner stamps it onto
 * the brief, a project is started from that brief, the child works on it, and the standing that
 * comes out sits on the rung that was chosen and on no other. Every step is the real function; the
 * only thing synthesised is the child's typing.
 */
describe("End to end: a chosen milestone reaches a standing and goes nowhere else", () => {
  it("puts the standing on the rung the caller chose, and on none of the others", async () => {
    const CHOSEN = "gd-one-screen-game";
    const kidId = "kid-synthetic-004";

    // The console's own plan path, which is where a milestone would actually be selected.
    const profile = profileFor(kidId)!;
    const reads = new Map(wellbeingForKid(kidId).map((c) => [c.cellKey, c.read]));
    const spike = getForKid(profile.store, kidId).find((h) => h.state === "ACTIVE")!;
    const inputs = derivePlanInputs(
      profile,
      profile.store,
      spike.cellKey,
      reads.get(spike.cellKey)!,
      ROSTER_NOW,
      PILOT_CATALOG,
    )!;

    const plan = await planSpecialization(
      inputs,
      {
        generator: stubBriefGenerator,
        resources: curatedForCell(PLAN_LIBRARY, inputs.domainPath, PLAN_AGE_TIER),
        milestoneId: CHOSEN,
      },
      ROSTER_NOW,
    );
    expect(plan.nextProject.milestoneId).toBe(CHOSEN);

    const started = startProject({ brief: plan.nextProject, kidId, ageBand: "9-11" }, NOW);
    expect(started.milestoneId).toBe(CHOSEN);

    const done = logEvent(
      started,
      {
        kind: "artifact",
        at: "2026-07-21T18:00:00.000Z",
        text: "I put the build up and my cousin finished it.",
        artifact: { title: "One-screen build, finished end to end", kind: "build" },
      },
      NOW,
    );

    const standing = readMap(CONSOLE_GAME_DEV_MAP, evidenceFromProjects([done]), [], plan.stage);
    const chosen = standing.find((r) => r.milestone.id === CHOSEN)!;
    expect(chosen.strength).toBe("single");
    expect(chosen.evidence.map((e) => e.projectId)).toEqual([done.id]);
    for (const read of standing) {
      if (read.milestone.id === CHOSEN) continue;
      expect(read.strength, `${read.milestone.id} picked up a standing it was never aimed at`).toBe(
        "none",
      );
      expect(read.evidence).toEqual([]);
    }
  });
});
