/**
 * Slice 2: reading a published map against what one child has actually made.
 *
 * Two claims are under test here and they are not the same claim, which is the whole reason this
 * file is long. "This child has this capability" is a verdict the package must never reach, and
 * `EvidenceStrength` exists so that it cannot be expressed. "Should we offer this next" has to come
 * out yes or no, because the guide either puts the thing in front of the child or does not, and
 * that is what `reachable` answers. Several tests below exist only to pin the gap between them.
 */
import { describe, expect, it } from "vitest";
import type { Stage } from "@gt100k/specialization-planner";

import { GAME_DEV_MAP, PIANO_MAP } from "../src/__fixtures__/maps.js";
import type { MasteryMap, Milestone } from "../src/model.js";
import {
  EVIDENCE_STRENGTHS,
  MAP_OVERRIDE_NO_REASON,
  guideOverride,
  readMap,
  type GuideOverride,
  type MilestoneEvidence,
  type MilestoneRead,
} from "../src/select.js";

const GUIDE = { id: "guide-104", role: "GUIDE" } as const;

/** A milestone with only the fields reachability and ordering read. The rest is filler that the
    validator would care about and this module never looks at. */
function milestone(id: string, stageFloor: Stage, requires: readonly string[] = []): Milestone {
  return {
    id,
    title: id,
    capability: `Make the ${id} thing and keep it`,
    requires,
    modes: [],
    stageFloor,
    ordering: { reason: "filler", basis: "model", sources: [] },
    resources: [],
    practice: [],
    demonstration: `The ${id} thing`,
    opportunities: [],
    authorship: "human-authored",
  };
}

function mapOf(milestones: readonly Milestone[]): MasteryMap {
  return {
    id: "map-under-test",
    version: 1,
    domainPath: ["code-computers"],
    modes: [],
    ageBands: ["9-11"],
    milestones,
    provenance: { model: "hand", promptVersion: "none", generatedAt: "", edits: [] },
    validation: { validatedAt: "", validatorVersion: "unvalidated", errors: [], warnings: [] },
    status: "published",
    vettedBy: null,
    vettedAt: null,
    revalidatedAt: "2026-07-01T00:00:00.000Z",
  };
}

const made = (
  milestoneId: string,
  artifactCount: number,
  projectId = `proj-${milestoneId}`,
): MilestoneEvidence => ({ milestoneId, projectId, artifactCount });

const overrideOn = (milestoneId: string, note = "Did this at their old school"): GuideOverride =>
  guideOverride(milestoneId, GUIDE, "2026-07-02T00:00:00.000Z", note);

/** A -> B, both trunk, both at the floor, so nothing but the prerequisite is ever in the way. */
const CHAIN = mapOf([milestone("a", "S1_IGNITION"), milestone("b", "S1_IGNITION", ["a"])]);

/** E1_CYCLE, which no published map may contain and which this module still has to order the same
    way whichever end of the array it starts from. a needs c, c needs b, b needs a, and d hangs off
    the cycle from outside it so there is one edge here that is not part of a cycle. */
const CYCLIC = mapOf([
  milestone("a", "S1_IGNITION", ["c"]),
  milestone("b", "S1_IGNITION", ["a"]),
  milestone("c", "S1_IGNITION", ["b"]),
  milestone("d", "S1_IGNITION", ["a"]),
]);

/** One id declared twice. The validator has no rule against this today, so it is not a state that
    cannot arise, and the id can no longer be the last word on where an entry sorts. */
const DUPLICATE_ID = mapOf([
  { ...milestone("twice", "S1_IGNITION"), title: "The thing this id was meant to be" },
  { ...milestone("twice", "S1_IGNITION"), title: "A second thing under the same id" },
]);

const readOf = (reads: readonly MilestoneRead[], id: string): MilestoneRead =>
  reads.find((r) => r.milestone.id === id)!;

/** Id and title together, because a map declaring one id twice cannot be pinned by ids alone. */
const named = (reads: readonly MilestoneRead[]): readonly (readonly [string, string])[] =>
  reads.map((r) => [r.milestone.id, r.milestone.title] as const);

// ── What it reports at all ───────────────────────────────────────────────────────────────────────

describe("readMap reports every milestone, not a selection", () => {
  it("returns one read per milestone and drops none", () => {
    const reads = readMap(PIANO_MAP, [], [], "S1_IGNITION");
    expect(reads).toHaveLength(PIANO_MAP.milestones.length);
    expect(reads.map((r) => r.milestone.id).sort()).toEqual(
      PIANO_MAP.milestones.map((m) => m.id).sort(),
    );
  });

  it("carries the whole milestone through, so nothing has to be looked up again", () => {
    const reads = readMap(PIANO_MAP, [], [], "S1_IGNITION");
    for (const r of reads) {
      expect(r.milestone).toBe(PIANO_MAP.milestones.find((m) => m.id === r.milestone.id));
    }
  });

  /** Exact, not a subset. A `passed`, `done` or `completedAt` added later has to change this line
      first, and changing it is a decision somebody has to defend in review. */
  it("shapes a read out of exactly the fields slice 2 decided on", () => {
    const reads = readMap(CHAIN, [made("a", 1)], [overrideOn("b")], "S1_IGNITION");
    for (const r of reads) {
      expect(Object.keys(r).sort()).toEqual([
        "blockedBy",
        "evidence",
        "milestone",
        "override",
        "reachable",
        "strength",
      ]);
    }
  });
});

// ── Never a binary "passed" ──────────────────────────────────────────────────────────────────────

/**
 * Shavelson, Baxter & Gao (1993) is the reason the vocabulary stops where it does: task-sampling
 * variability dominates measurement error in elementary performance assessment, and roughly 15 to
 * 23 tasks are needed for a generalisability coefficient of 0.80. One artefact is nowhere near
 * that, and neither is five. So the three values below describe how much was made and none of them
 * is a verdict about the child.
 */
describe("strength of evidence, never a verdict", () => {
  it("offers three values, all of them descriptions of quantity", () => {
    expect(EVIDENCE_STRENGTHS).toEqual(["none", "single", "multiple"]);
  });

  it("has no value meaning passed, done, mastered or met", () => {
    const verdicts = ["pass", "passed", "fail", "done", "complete", "mastered", "met", "achieved"];
    for (const s of EVIDENCE_STRENGTHS) expect(verdicts).not.toContain(s);
  });

  it("reads nothing as none", () => {
    expect(readOf(readMap(CHAIN, [], [], "S1_IGNITION"), "a").strength).toBe("none");
  });

  it("reads one artefact as single, which is the underpowered case", () => {
    expect(readOf(readMap(CHAIN, [made("a", 1)], [], "S1_IGNITION"), "a").strength).toBe("single");
  });

  it("reads two artefacts in one project as multiple", () => {
    expect(readOf(readMap(CHAIN, [made("a", 2)], [], "S1_IGNITION"), "a").strength).toBe(
      "multiple",
    );
  });

  it("reads one artefact each from two projects as multiple", () => {
    const evidence = [made("a", 1, "proj-1"), made("a", 1, "proj-2")];
    expect(readOf(readMap(CHAIN, evidence, [], "S1_IGNITION"), "a").strength).toBe("multiple");
  });

  /**
   * Every link is judged on its own before anything is added up, and the four ways of writing "this
   * link stands for nothing" all have to come out the same. Adding raw counts read every one of
   * them as something: a negative count SUBTRACTED from work that really exists, and a fraction or
   * a `NaN` came out as `multiple`, the strongest reading there is, off a link holding nothing.
   */
  describe("a link is judged on its own, and a link to nothing contributes nothing", () => {
    it("reads a negative count as nothing made", () => {
      expect(readOf(readMap(CHAIN, [made("a", -3)], [], "S1_IGNITION"), "a").strength).toBe("none");
    });

    /** The defect in its sharpest form: three artefacts on the screen under a standing that said
        nothing had been made here, because one bad link cancelled all three. */
    it("does not let a negative link cancel artefacts that really exist", () => {
      const evidence = [made("a", 3, "proj-real"), made("a", -3, "proj-bad")];
      const read = readOf(readMap(CHAIN, evidence, [], "S1_IGNITION"), "a");
      expect(read.strength).toBe("multiple");
      expect(read.evidence).toEqual(evidence);
    });

    it("reads a count of zero as nothing made", () => {
      expect(readOf(readMap(CHAIN, [made("a", 0)], [], "S1_IGNITION"), "a").strength).toBe("none");
    });

    it("reads a fraction of an artefact as nothing made, because half a thing was not made", () => {
      expect(readOf(readMap(CHAIN, [made("a", 0.5)], [], "S1_IGNITION"), "a").strength).toBe(
        "none",
      );
      // And a fraction on top of a whole one is still just the whole one.
      expect(readOf(readMap(CHAIN, [made("a", 1.9)], [], "S1_IGNITION"), "a").strength).toBe(
        "single",
      );
    });

    it("reads a count that is not a number at all as nothing made", () => {
      expect(readOf(readMap(CHAIN, [made("a", Number.NaN)], [], "S1_IGNITION"), "a").strength).toBe(
        "none",
      );
    });

    /** The invariant underneath all of the above, and the one a surface depends on: `none` means
        no link contributed an artefact, so "nothing made here yet" is never printed over work. */
    it("says none only when no link contributed an artefact", () => {
      const messy = [made("a", -3), made("a", 0, "p0"), made("a", 0.5, "p1"), made("a", 2, "p2")];
      for (const evidence of [messy, messy.slice(0, 3), []]) {
        const read = readOf(readMap(CHAIN, evidence, [], "S1_IGNITION"), "a");
        const contributed = evidence.reduce(
          (n, e) => n + Math.max(0, Math.trunc(e.artifactCount) || 0),
          0,
        );
        expect(read.strength === "none").toBe(contributed === 0);
      }
    });

    /** Satisfaction for the purpose of offering is keyed off the same standing, so a link holding
        nothing cannot unlock the next rung either. */
    it("does not let a link to nothing satisfy a prerequisite", () => {
      const reads = readMap(CHAIN, [made("a", -3), made("a", 0.5, "p1")], [], "S1_IGNITION");
      expect(readOf(reads, "b").reachable).toBe(false);
      expect(readOf(reads, "b").blockedBy).toEqual([{ kind: "prerequisite", milestoneId: "a" }]);
    });
  });

  /** Decision 1: position comes from artefacts, never from a checkbox. An override is a guide's
      call about what to OFFER and it is not a claim that anything was made. */
  it("does not let an override put evidence where there is none", () => {
    const read = readOf(readMap(CHAIN, [], [overrideOn("a")], "S1_IGNITION"), "a");
    expect(read.strength).toBe("none");
    expect(read.evidence).toEqual([]);
    expect(read.override).toEqual(overrideOn("a"));
  });

  /** Decision 4: a standing is never shown without the work it rests on, so the work has to come
      back with it. Butler (1988) is why: a bare verdict with no task anchoring behaves like a
      grade and depressed both interest and subsequent performance in 132 children aged 10 to 12. */
  it("hands back the artefact links the standing was derived from, in the order given", () => {
    const evidence = [made("a", 1, "proj-2"), made("a", 3, "proj-1")];
    expect(readOf(readMap(CHAIN, evidence, [], "S1_IGNITION"), "a").evidence).toEqual(evidence);
  });
});

// ── Reachability is an offering decision, not a mastery claim ────────────────────────────────────

describe("reachable answers 'should we offer this next', not 'has this child got it'", () => {
  /** The central distinction. One artefact is far too little to say a capability is there, and it
      is enough to stop holding the next thing back, because those are different questions. */
  it("unlocks the next milestone on one artefact while the standing behind it stays single", () => {
    const reads = readMap(CHAIN, [made("a", 1)], [], "S1_IGNITION");
    expect(readOf(reads, "b").reachable).toBe(true);
    expect(readOf(reads, "a").strength).toBe("single");
    // And nothing anywhere upgraded that "single" into a verdict on the way through.
    expect(readOf(reads, "b").blockedBy).toEqual([]);
  });

  it("unlocks the next milestone on a guide override while the standing behind it stays none", () => {
    const reads = readMap(CHAIN, [], [overrideOn("a")], "S1_IGNITION");
    expect(readOf(reads, "b").reachable).toBe(true);
    expect(readOf(reads, "a").strength).toBe("none");
  });

  it("calls a milestone with nothing behind it reachable, because reachable is not a standing", () => {
    const read = readOf(readMap(CHAIN, [], [], "S1_IGNITION"), "a");
    expect(read.reachable).toBe(true);
    expect(read.strength).toBe("none");
  });

  it("says reachable exactly when nothing blocks it", () => {
    for (const stage of ["S1_IGNITION", "S2_FOUNDATIONS"] satisfies Stage[]) {
      for (const map of [PIANO_MAP, GAME_DEV_MAP]) {
        for (const r of readMap(map, [made("pf-one-whole-piece", 1)], [], stage)) {
          expect(r.reachable).toBe(r.blockedBy.length === 0);
        }
      }
    }
  });
});

describe("what blocks a milestone, said precisely enough to act on", () => {
  it("names the prerequisite that has nothing behind it", () => {
    const reads = readMap(CHAIN, [], [], "S1_IGNITION");
    expect(readOf(reads, "b").reachable).toBe(false);
    expect(readOf(reads, "b").blockedBy).toEqual([{ kind: "prerequisite", milestoneId: "a" }]);
  });

  it("names the stage floor when the planner has the child below it", () => {
    const map = mapOf([milestone("a", "S3_AUTHORSHIP")]);
    const read = readOf(readMap(map, [], [], "S2_FOUNDATIONS"), "a");
    expect(read.reachable).toBe(false);
    expect(read.blockedBy).toEqual([{ kind: "stage-floor", stageFloor: "S3_AUTHORSHIP" }]);
  });

  it("names both when both are in the way, prerequisites first", () => {
    const map = mapOf([
      milestone("a", "S1_IGNITION"),
      milestone("z", "S1_IGNITION"),
      milestone("b", "S3_AUTHORSHIP", ["a", "z"]),
    ]);
    expect(readOf(readMap(map, [], [], "S1_IGNITION"), "b").blockedBy).toEqual([
      { kind: "prerequisite", milestoneId: "a" },
      { kind: "prerequisite", milestoneId: "z" },
      { kind: "stage-floor", stageFloor: "S3_AUTHORSHIP" },
    ]);
  });

  it("lists prerequisites in the order the map declares them, not sorted behind the map's back", () => {
    const map = mapOf([
      milestone("z", "S1_IGNITION"),
      milestone("a", "S1_IGNITION"),
      milestone("b", "S1_IGNITION", ["z", "a"]),
    ]);
    expect(readOf(readMap(map, [], [], "S1_IGNITION"), "b").blockedBy).toEqual([
      { kind: "prerequisite", milestoneId: "z" },
      { kind: "prerequisite", milestoneId: "a" },
    ]);
  });

  it("stops naming a prerequisite once there is any evidence for it", () => {
    const reads = readMap(CHAIN, [made("a", 1)], [], "S1_IGNITION");
    expect(readOf(reads, "b").blockedBy).toEqual([]);
  });
});

// ── The ceiling nobody can currently pass ────────────────────────────────────────────────────────

/**
 * `deriveStage` needs `stretchSeeking` for both S3 and S4, `stretchSeeking` derives solely from
 * `chosen_challenge`, and nothing in production emits that event (escalated in PR #163). So no
 * child is above `S2_FOUNDATIONS`, every branch in both golden maps sits at `S3_AUTHORSHIP`, and a
 * trunk-only reachable set is the correct output rather than a fixture that needs fixing.
 */
describe("nothing above S2_FOUNDATIONS is reachable by any child today", () => {
  for (const map of [PIANO_MAP, GAME_DEV_MAP]) {
    it(`reports only trunk milestones as reachable on ${map.id}, even with everything evidenced`, () => {
      const everything = map.milestones.map((m) => made(m.id, 4));
      const reads = readMap(map, everything, [], "S2_FOUNDATIONS");

      const reachable = reads.filter((r) => r.reachable);
      expect(reachable.length).toBeGreaterThan(0);
      for (const r of reachable) expect(r.milestone.modes).toEqual([]);

      // And every branch is out of reach for the stage floor and for no other reason, so the day
      // `chosen_challenge` arrives the branches switch on with nothing else to change.
      for (const r of reads.filter((x) => x.milestone.modes.length > 0)) {
        expect(r.reachable).toBe(false);
        expect(r.blockedBy).toEqual([{ kind: "stage-floor", stageFloor: r.milestone.stageFloor }]);
      }
    });
  }

  it("holds the trunk back too when the planner has the child at the first rung", () => {
    const everything = PIANO_MAP.milestones.map((m) => made(m.id, 4));
    const reads = readMap(PIANO_MAP, everything, [], "S1_IGNITION");
    for (const r of reads) {
      const gated = r.milestone.stageFloor !== "S1_IGNITION";
      expect(r.reachable).toBe(!gated);
    }
  });
});

// ── Ordering ─────────────────────────────────────────────────────────────────────────────────────

describe("ordering: stage floor, then prerequisite depth, then id", () => {
  it("orders the piano map the way the rule says, derived by hand", () => {
    expect(readMap(PIANO_MAP, [], [], "S2_FOUNDATIONS").map((r) => r.milestone.id)).toEqual([
      "pf-one-whole-piece",
      "pf-steady-pulse",
      "pf-sight-read",
      "pf-listen-back",
      "pf-own-practice",
      // Both branches sit at S3 and both come one step after pf-own-practice, so the id breaks it.
      "pf-perform-a-programme",
      "pf-write-your-own",
    ]);
  });

  it("breaks a three-way depth tie by id on the game-dev map", () => {
    expect(readMap(GAME_DEV_MAP, [], [], "S2_FOUNDATIONS").map((r) => r.milestone.id)).toEqual([
      "gd-one-screen-game",
      "gd-reproduce-a-bug",
      "gd-playtest",
      "gd-version-control",
      // All three branches are one step past version control, so all three sort by id, which is
      // NOT the order the map declares them in.
      "gd-jam-entry",
      "gd-profile-a-scene",
      "gd-tool-for-makers",
    ]);
  });

  it("puts the stage floor ahead of depth, so a late trunk rung outranks an early gated one", () => {
    const map = mapOf([
      milestone("gated-first", "S2_FOUNDATIONS"),
      milestone("deep-1", "S1_IGNITION"),
      milestone("deep-2", "S1_IGNITION", ["deep-1"]),
      milestone("deep-3", "S1_IGNITION", ["deep-2"]),
    ]);
    expect(readMap(map, [], [], "S2_FOUNDATIONS").map((r) => r.milestone.id)).toEqual([
      "deep-1",
      "deep-2",
      "deep-3",
      "gated-first",
    ]);
  });

  it("puts depth ahead of id, so a prerequisite never sorts after the thing it unlocks", () => {
    // Declared the wrong way round on purpose, so passing this takes more than echoing the array.
    const map = mapOf([
      milestone("a-second", "S1_IGNITION", ["z-first"]),
      milestone("z-first", "S1_IGNITION"),
    ]);
    expect(readMap(map, [], [], "S1_IGNITION").map((r) => r.milestone.id)).toEqual([
      "z-first",
      "a-second",
    ]);
  });

  /**
   * The ordering is a function of the map's content and of nothing else. If it leaked the array
   * order the caller happened to hand over, two callers holding the same map would disagree.
   *
   * The last two fixtures are the maps the validator rejects, and they are here because "the order
   * is deterministic" was written in the doc comment while a cycle made it false: depth was
   * memoised mid-walk, so it depended on which end of the array the walk entered from, and the
   * cyclic map below really did come back as b, c, a one way round and a, b, c the other. A
   * duplicate id was the second hole: ids were the last key and two equal ids compared equal, which
   * handed the decision to the array. Identity, not the milestone, is what these two pin.
   */
  it("gives the same order however the milestones were arranged on the way in", () => {
    for (const map of [PIANO_MAP, GAME_DEV_MAP, CYCLIC, DUPLICATE_ID]) {
      const expected = named(readMap(map, [], [], "S2_FOUNDATIONS"));
      const reversed = { ...map, milestones: [...map.milestones].reverse() };
      expect(named(readMap(reversed, [], [], "S2_FOUNDATIONS"))).toEqual(expected);
    }
  });

  /**
   * And the order a cycle comes out in, derived by hand. Every edge inside the cycle is a back edge
   * and contributes no depth, so a, b and c all sit at depth zero and the id breaks it. `d` hangs
   * off the cycle from outside, so the edge into it is not a back edge and `d` is one step deep.
   */
  it("gives a cyclic map a defined depth rather than one that depends on where a walk began", () => {
    expect(readMap(CYCLIC, [], [], "S1_IGNITION").map((r) => r.milestone.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  /** Two entries under one id are told apart by the milestone itself, which is the last resort and
      only ever runs here. Nothing but the title differs, so the titles decide it. */
  it("orders two milestones sharing an id by their content, not by the array", () => {
    expect(named(readMap(DUPLICATE_ID, [], [], "S1_IGNITION"))).toEqual([
      ["twice", "A second thing under the same id"],
      ["twice", "The thing this id was meant to be"],
    ]);
  });

  it("orders identically whatever the child has made, since ordering is about the map", () => {
    const bare = readMap(PIANO_MAP, [], [], "S2_FOUNDATIONS").map((r) => r.milestone.id);
    const busy = readMap(
      PIANO_MAP,
      PIANO_MAP.milestones.map((m) => made(m.id, 3)),
      PIANO_MAP.milestones.map((m) => overrideOn(m.id)),
      "S2_FOUNDATIONS",
    ).map((r) => r.milestone.id);
    expect(busy).toEqual(bare);
  });
});

// ── Pure, total, deterministic ───────────────────────────────────────────────────────────────────

describe("pure, total and deterministic", () => {
  it("returns a deep-equal result for the same input twice", () => {
    const evidence = [made("a", 2)];
    const overrides = [overrideOn("b")];
    expect(readMap(CHAIN, evidence, overrides, "S1_IGNITION")).toEqual(
      readMap(CHAIN, evidence, overrides, "S1_IGNITION"),
    );
  });

  it("leaves everything it was handed exactly as it was", () => {
    const map = mapOf([milestone("a", "S1_IGNITION"), milestone("b", "S1_IGNITION", ["a"])]);
    const before = JSON.stringify([map, [made("a", 1)], [overrideOn("b")]]);
    readMap(map, [made("a", 1)], [overrideOn("b")], "S1_IGNITION");
    expect(JSON.stringify([map, [made("a", 1)], [overrideOn("b")]])).toBe(before);
  });

  it("ignores evidence and overrides pointed at milestones this map does not have", () => {
    const reads = readMap(
      CHAIN,
      [made("not-here", 5)],
      [overrideOn("also-not-here")],
      "S1_IGNITION",
    );
    expect(reads).toHaveLength(2);
    for (const r of reads) {
      expect(r.evidence).toEqual([]);
      expect(r.override).toBeNull();
    }
  });

  /** E1_DANGLING is a validator error, so a published map has none. This still has to be total:
      an unresolvable prerequisite blocks, because nothing can ever be made for a milestone that is
      not on the map, and blocking is the answer that does not pretend otherwise. */
  it("blocks on a prerequisite that is not in the map rather than throwing", () => {
    const map = mapOf([milestone("b", "S1_IGNITION", ["ghost"])]);
    const read = readOf(readMap(map, [], [], "S1_IGNITION"), "b");
    expect(read.reachable).toBe(false);
    expect(read.blockedBy).toEqual([{ kind: "prerequisite", milestoneId: "ghost" }]);
  });

  /** E1_CYCLE is also a validator error. Depth is ill-defined on a cycle, so what matters is that
      the call comes back at all instead of recursing until the stack goes. */
  it("terminates on a cyclic map rather than recursing for ever", () => {
    const map = mapOf([
      milestone("a", "S1_IGNITION", ["c"]),
      milestone("b", "S1_IGNITION", ["a"]),
      milestone("c", "S1_IGNITION", ["b"]),
    ]);
    expect(readMap(map, [], [], "S1_IGNITION")).toHaveLength(3);
  });

  /**
   * `GuideOverride.note` has always been documented as required "because an override with no reason
   * is a checkbox, and a checkbox is what this whole design is built to avoid", and nothing made it
   * so: `readonly note: string` is satisfied by `""`. An override moves what a guide may offer a
   * child on nobody's authority but their own, so the reason is the whole of the record.
   */
  it("refuses to build an override with no reason on it", () => {
    expect(() => guideOverride("a", GUIDE, "2026-07-02T00:00:00.000Z", "")).toThrow(
      MAP_OVERRIDE_NO_REASON,
    );
    expect(() => guideOverride("a", GUIDE, "2026-07-02T00:00:00.000Z", "   \n ")).toThrow(
      MAP_OVERRIDE_NO_REASON,
    );
  });

  it("builds one with a reason on it, keeping the instant it was handed", () => {
    expect(
      guideOverride("a", GUIDE, "2026-07-02T00:00:00.000Z", "Did this before joining"),
    ).toEqual({
      milestoneId: "a",
      actor: GUIDE,
      at: "2026-07-02T00:00:00.000Z",
      note: "Did this before joining",
    });
  });

  it("refuses to read one either, so going around the constructor gains nothing", () => {
    const blank = { milestoneId: "a", actor: GUIDE, at: "2026-07-02T00:00:00.000Z", note: " " };
    expect(() => readMap(CHAIN, [], [blank], "S1_IGNITION")).toThrow(MAP_OVERRIDE_NO_REASON);
  });

  it("takes the last override for a milestone, reading the list as a log", () => {
    const first = overrideOn("a", "first note");
    const second = overrideOn("a", "second note");
    expect(readOf(readMap(CHAIN, [], [first, second], "S1_IGNITION"), "a").override).toEqual(
      second,
    );
  });

  it("reads an empty map as an empty list", () => {
    expect(readMap(mapOf([]), [made("a", 1)], [overrideOn("a")], "S1_IGNITION")).toEqual([]);
  });
});
