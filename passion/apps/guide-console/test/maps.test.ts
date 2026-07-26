/**
 * Headless tests for the guide-console Maps view-model (024 mastery maps, spec §6). No jsdom, same
 * as every other console suite: what is pinned here is the pure wiring between the engine's
 * `ValidationRecord` and what the panel is handed.
 *
 * The percentage ban has two halves and this file holds one of them: nothing derivable from the
 * view model is a completion measure. The other half is the rendered markup, which is where a
 * progress bar would actually appear, and that lives in `maps-panel.test.tsx`. A test over the view
 * model alone cannot see JSX written straight into the component.
 */
import { describe, expect, it } from "vitest";
import { validateMap, type MasteryMap } from "@gt100k/mastery-map";
import {
  CONSOLE_COMPETITION_MATH_MAP,
  CONSOLE_GAME_DEV_MAP,
  CONSOLE_PIANO_MAP,
} from "../app/maps-seed.js";
import { workForKid } from "../app/map-evidence.js";
import {
  OVERRIDE_ALREADY_RECORDED,
  OVERRIDE_UNKNOWN_MILESTONE,
  REVIEW_NOW,
  childReadView,
  editCapability,
  mapView,
  mapsForReview,
  overrideFor,
  problemKey,
  recordOverride,
  withStatus,
} from "../app/maps.js";

/**
 * The piano map with one `requires` pointed at a milestone that does not exist. That is error rule
 * 1, reported against `pf-steady-pulse`, and it is the only rule the edit trips: rule 6 skips a
 * prerequisite it cannot resolve, and losing one edge leaves the graph acyclic.
 */
const BROKEN_PIANO: MasteryMap = {
  ...CONSOLE_PIANO_MAP,
  milestones: CONSOLE_PIANO_MAP.milestones.map((m) =>
    m.id === "pf-steady-pulse" ? { ...m, requires: ["pf-nothing-here"] } : m,
  ),
};

describe("Maps view-model: errors, warnings and where they land", () => {
  it("keeps a milestone-scoped warning on its own milestone and off every other", () => {
    const vm = mapView(CONSOLE_PIANO_MAP);
    // The piano map's one warning is W6 on the analytic milestone, whose capability opens "Review".
    const flagged = vm.milestones.find((m) => m.id === "pf-listen-back")!;
    expect(flagged.warnings.map((w) => w.code)).toEqual(["W6_CONSUMPTION_VERB"]);
    for (const m of vm.milestones) {
      if (m.id !== "pf-listen-back") expect(m.warnings).toEqual([]);
    }
    // It names a milestone, so it does not also appear at the top of the map.
    expect(vm.warnings).toEqual([]);
  });

  it("keeps a map-level warning at the top and off every milestone", () => {
    const vm = mapView(CONSOLE_GAME_DEV_MAP);
    expect(vm.warnings.map((w) => w.code)).toEqual(["W2_NO_SYLLABUS"]);
    for (const m of vm.milestones) expect(m.warnings).toEqual([]);
  });

  it("separates errors from warnings rather than pooling them", () => {
    const vm = mapView(BROKEN_PIANO);
    const broken = vm.milestones.find((m) => m.id === "pf-steady-pulse")!;
    expect(broken.errors.map((e) => e.code)).toEqual(["E1_DANGLING"]);
    expect(broken.warnings).toEqual([]);
    // The unrelated warning stays where it was, and errors never leak into a warnings list.
    const flagged = vm.milestones.find((m) => m.id === "pf-listen-back")!;
    expect(flagged.warnings.map((w) => w.code)).toEqual(["W6_CONSUMPTION_VERB"]);
    expect(flagged.errors).toEqual([]);
    for (const m of vm.milestones) {
      for (const p of m.errors) expect(p.severity).toBe("error");
      for (const p of m.warnings) expect(p.severity).toBe("warning");
    }
    // And validity is the errors and nothing else: the same map is valid without that one edit.
    expect(vm.valid).toBe(false);
    expect(mapView(CONSOLE_PIANO_MAP).valid).toBe(true);
  });

  /**
   * Both halves of one defect. A banned field name is the case where a single rule fires on every
   * milestone at once, with identical code and identical wording each time: the engine has to name
   * which milestone each hit is on, or they all pile up at the top of the card, and the list key
   * has to carry that name, or React collides the flags and keeps one of them.
   */
  it("places an identical problem at each milestone it is on, under a key of its own", () => {
    const everyMilestoneDirty = {
      ...CONSOLE_PIANO_MAP,
      milestones: CONSOLE_PIANO_MAP.milestones.map((m) => ({ ...m, rating: 1800 })),
    } as unknown as MasteryMap;

    const vm = mapView(everyMilestoneDirty);
    const banned = vm.milestones.flatMap((m) => m.errors.filter((e) => e.code === "E8_BANNED_KEY"));
    expect(banned).toHaveLength(CONSOLE_PIANO_MAP.milestones.length);
    expect(vm.errors).toEqual([]);

    const keys = banned.map(problemKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("loses no problem and duplicates none while placing them", () => {
    for (const source of [CONSOLE_PIANO_MAP, CONSOLE_GAME_DEV_MAP, BROKEN_PIANO]) {
      const record = validateMap(source, REVIEW_NOW);
      const vm = mapView(source);
      const placed = [
        ...vm.errors,
        ...vm.warnings,
        ...vm.milestones.flatMap((m) => [...m.errors, ...m.warnings]),
      ];
      expect(placed).toHaveLength(record.errors.length + record.warnings.length);
      for (const p of [...record.errors, ...record.warnings]) expect(placed).toContainEqual(p);
    }
  });
});

describe("Maps view-model: the four ordering grounds", () => {
  it("tells a model-basis milestone from a syllabus-backed one in the data, not only in CSS", () => {
    const vm = mapView(CONSOLE_PIANO_MAP);
    const ownReasoning = vm.milestones.find((m) => m.id === "pf-write-your-own")!;
    const syllabus = vm.milestones.find((m) => m.id === "pf-one-whole-piece")!;

    expect(ownReasoning.basis).toBe("model");
    expect(syllabus.basis).toBe("syllabus");
    expect(ownReasoning.externallyAnchored).toBe(false);
    expect(syllabus.externallyAnchored).toBe(true);
    // The words differ too, so the distinction survives a stylesheet that never loads.
    expect(ownReasoning.support).not.toBe(syllabus.support);
    expect(ownReasoning.supportNote).toMatch(/no external support/i);
    // And the engine's own rule is visible in what the panel gets: a model basis carries no source.
    expect(ownReasoning.ordering.sources).toHaveLength(0);
    expect(syllabus.ordering.sources.length).toBeGreaterThan(0);
  });

  it("gives all four grounds their own words", () => {
    const all = mapsForReview().flatMap((m) => m.milestones);
    const bases = new Set(all.map((m) => m.basis));
    expect([...bases].sort()).toEqual(["community", "model", "research", "syllabus"]);
    const words = new Set(all.map((m) => m.support));
    expect(words.size).toBe(4);
  });
});

/**
 * The percentage ban, held here because the engine cannot hold it (spec §5). These assertions are
 * over what the PANEL is handed: if no count of milestones, no ratio and no per-milestone doneness
 * ever reaches the view model, no surface built on it can render a progress bar without someone
 * adding one of them back and failing this file.
 */
describe("Maps view-model: no completion measure is derivable from it", () => {
  /** Every key name anywhere in the view model, so the scan cannot be dodged by nesting. */
  function keysOf(value: unknown, into: Set<string> = new Set()): Set<string> {
    if (value === null || typeof value !== "object") return into;
    if (Array.isArray(value)) {
      for (const item of value) keysOf(item, into);
      return into;
    }
    for (const [k, child] of Object.entries(value)) {
      into.add(k);
      keysOf(child, into);
    }
    return into;
  }

  function numbersOf(value: unknown, into: number[] = []): number[] {
    if (typeof value === "number") into.push(value);
    if (value === null || typeof value !== "object") return into;
    for (const child of Object.values(value)) numbersOf(child, into);
    return into;
  }

  function booleanKeysOf(value: unknown, into: Set<string> = new Set()): Set<string> {
    if (value === null || typeof value !== "object") return into;
    if (Array.isArray(value)) {
      for (const item of value) booleanKeysOf(item, into);
      return into;
    }
    for (const [k, child] of Object.entries(value)) {
      if (typeof child === "boolean") into.add(k);
      booleanKeysOf(child, into);
    }
    return into;
  }

  /** Whole words, not substrings: "demonstration" contains "ratio" and is not a measure of one. */
  const COMPLETION_WORDS = new Set([
    "count",
    "counts",
    "total",
    "totals",
    "percent",
    "percentage",
    "pct",
    "ratio",
    "share",
    "fraction",
    "progress",
    "done",
    "complete",
    "completed",
    "completion",
    "finished",
    "remaining",
    "numerator",
    "denominator",
    "tally",
  ]);

  const wordsIn = (key: string): readonly string[] =>
    key
      .split(/(?=[A-Z])|[_-]/)
      .map((w) => w.toLowerCase())
      .filter((w) => w.length > 0);

  it("names no field after a count, a ratio or a state of doneness", () => {
    for (const vm of mapsForReview()) {
      for (const key of keysOf(vm)) {
        for (const word of wordsIn(key)) {
          expect(COMPLETION_WORDS.has(word), `"${key}" is a completion measure by name`).toBe(
            false,
          );
        }
      }
    }
  });

  it("exposes no number that could be read as a ratio", () => {
    for (const vm of mapsForReview()) {
      for (const n of numbersOf(vm)) {
        // A completion measure is a fraction of one. Publication years are the only numbers here.
        expect(n > 0 && n < 1, `${n} is a fraction`).toBe(false);
      }
    }
  });

  /**
   * The honest form of the ban, and the one that does not refute itself. Counting the milestones on
   * a map is not the problem: `milestones.length` is exactly that count and it is unavoidable,
   * which is why asserting that no field equals it was asserting nothing.
   *
   * What makes a percentage possible is a NUMERATOR, and there is none, because a mastery map is
   * knowledge about a DOMAIN and holds nothing at all about any particular child. Pinning the
   * milestone view model's shape exactly is what keeps it that way: a `done`, `reached` or
   * `completedAt` added later has to change this list first, and changing it is a decision somebody
   * has to defend in review.
   */
  it("has no numerator, because the domain records no per-child doneness anywhere", () => {
    const MILESTONE_SHAPE = [
      "after",
      "basis",
      "branchModes",
      "capability",
      "demonstration",
      "errors",
      "externallyAnchored",
      "id",
      "isTrunk",
      "opportunities",
      "ordering",
      "practice",
      "resources",
      "stage",
      "support",
      "supportNote",
      "title",
      "warnings",
    ];
    for (const vm of mapsForReview()) {
      for (const ms of vm.milestones) {
        expect(Object.keys(ms).sort()).toEqual(MILESTONE_SHAPE);
      }
    }
  });

  it("carries no per-milestone flag anyone could tally", () => {
    // Exact, not a subset: a `completed` or `reached` boolean added later has to fail here first.
    const ALLOWED = [
      "externallyAnchored",
      "inUse",
      "isTrunk",
      "publishable",
      "solitary",
      "stale",
      "valid",
      "withdrawn",
    ];
    for (const vm of mapsForReview()) {
      expect([...booleanKeysOf(vm)].sort()).toEqual(ALLOWED);
    }
  });
});

describe("Maps view-model: use is a separate question from validity", () => {
  it("makes a withdrawn map plainly different from one in use", () => {
    const inUse = mapView(withStatus(CONSOLE_PIANO_MAP, "published"));
    const withdrawn = mapView(withStatus(CONSOLE_PIANO_MAP, "withdrawn"));

    expect(inUse.status).toBe("published");
    expect(withdrawn.status).toBe("withdrawn");
    expect(withdrawn.withdrawn).toBe(true);
    expect(inUse.withdrawn).toBe(false);
    expect(withdrawn.inUse).toBe(false);
    expect(inUse.inUse).toBe(true);
    // Told apart by words as well as by a class, so the difference is not carried by colour alone.
    expect(withdrawn.statusText).not.toBe(inUse.statusText);
    expect(withdrawn.statusNote).not.toBe(inUse.statusNote);
    expect(withdrawn.statusNote).toMatch(/nothing about it became invalid/i);
  });

  it("leaves the validation record untouched when a map is withdrawn", () => {
    // Spec §6: withdrawing is a decision about USE, never a finding that the map went wrong.
    const inUse = mapView(withStatus(CONSOLE_PIANO_MAP, "published"));
    const withdrawn = mapView(withStatus(CONSOLE_PIANO_MAP, "withdrawn"));
    expect(withdrawn.valid).toBe(inUse.valid);
    expect(withdrawn.errors).toEqual(inUse.errors);
    expect(withdrawn.warnings).toEqual(inUse.warnings);
    expect(withdrawn.milestones).toEqual(inUse.milestones);
  });

  it("does not make a map wait for a human to look at it", () => {
    // Nobody available to us can certify that an ordering of a domain is right, so human review is
    // optional and its absence blocks nothing. The game-dev map has nobody on it.
    const unreviewed = mapsForReview().find((m) => m.id === CONSOLE_GAME_DEV_MAP.id)!;
    expect(unreviewed.reviewedBy).toBeNull();
    expect(unreviewed.publishable).toBe(true);
  });
});

/**
 * Spec §6 needs both conditions at the move into use, and spec §7 wants the freshness half of it
 * visible in the review screen. "The error list is empty" was the whole of the panel's gate, which
 * let a map whose resources had not been looked at since January be offered for use.
 */
describe("Maps view-model: what stops a map going into use", () => {
  it("marks a map overdue a re-check, and refuses to let it go into use", () => {
    const vm = mapView(CONSOLE_COMPETITION_MATH_MAP);
    // Nothing is WRONG with this map. That is the point: validity alone was never the gate.
    expect(vm.valid).toBe(true);
    expect(vm.stale).toBe(true);
    expect(vm.publishable).toBe(false);
    expect(vm.publishRefusal).toMatch(/re-check/i);
  });

  it("leaves a recently checked map fresh and publishable", () => {
    const vm = mapView(CONSOLE_PIANO_MAP);
    expect(vm.stale).toBe(false);
    expect(vm.publishable).toBe(true);
    expect(vm.publishRefusal).toBeNull();
  });

  it("refuses a map the validator found a problem with, and says how many", () => {
    const vm = mapView(BROKEN_PIANO);
    expect(vm.publishable).toBe(false);
    expect(vm.publishRefusal).toMatch(/validator found/i);
  });
});

/**
 * The edit affordance, end to end through the engine. Spec §6: a guide can correct what the
 * software wrote, the correction is recorded with both its sides, and the map goes back to draft
 * for re-validation rather than carrying a record earned by the sentence just replaced.
 */
describe("Maps view-model: a guide correcting what the software wrote", () => {
  const edited = editCapability(
    CONSOLE_PIANO_MAP,
    "pf-listen-back",
    "Publish a written note on a recording of your own playing",
  );

  it("shows the new wording on the milestone it was aimed at", () => {
    const ms = mapView(edited).milestones.find((m) => m.id === "pf-listen-back")!;
    expect(ms.capability).toBe("Publish a written note on a recording of your own playing");
  });

  it("surfaces the correction with both sides of it, named to a milestone and a person", () => {
    const vm = mapView(edited);
    expect(vm.edits).toEqual([
      {
        milestone: "Hear what you actually played",
        field: "capability",
        before: "Review a recording of your own playing and publish a written note of what to fix",
        after: "Publish a written note on a recording of your own playing",
        at: REVIEW_NOW,
        by: "guide-104",
      },
    ]);
  });

  it("shows nothing for a map nobody has corrected", () => {
    expect(mapView(CONSOLE_PIANO_MAP).edits).toEqual([]);
  });

  /** The invariant that makes an edit safe: the map cannot go back into use on a record earned by
      text that is gone. Re-validating is the way back, and the panel re-validates on every render. */
  it("takes the map back to draft and blocks use until it has been checked again", () => {
    expect(edited.status).toBe("draft");
    expect(edited.validation.errors).not.toEqual([]);
    // `mapView` re-runs the validator, so what the guide sees is the fresh judgment on new text.
    const vm = mapView(edited);
    expect(vm.valid).toBe(true);
    expect(vm.publishable).toBe(true);
  });

  it("leaves the map it was handed exactly as it was", () => {
    expect(CONSOLE_PIANO_MAP.provenance.edits).toEqual([]);
    expect(
      mapView(CONSOLE_PIANO_MAP).milestones.find((m) => m.id === "pf-listen-back")?.capability,
    ).toBe("Review a recording of your own playing and publish a written note of what to fix");
  });
});

// ── Slice 2: one map read against one child ──────────────────────────────────────────────────────

const ARI = workForKid("kid-synthetic-001"); // one recording, and an override on the rung before it
const BEX = workForKid("kid-synthetic-002"); // one paper sat, nothing behind the rung after it
const CYRUS = workForKid("kid-synthetic-003"); // nothing linked anywhere
const DULCE = workForKid("kid-synthetic-004"); // the one child with a certified spike in a mapped domain

/**
 * The maths map put into use and re-checked. Nobody is read against a map that is not in use or not
 * fit to be, and this seed is deliberately a stale draft, so a test that wants a reading off it has
 * to do to it exactly what a guide would have to do to it first.
 */
const MATH_IN_USE: MasteryMap = {
  ...CONSOLE_COMPETITION_MATH_MAP,
  status: "published",
  revalidatedAt: REVIEW_NOW,
};

/** Every map a child can currently be read against, for the invariants that must hold on all. */
const IN_USE: readonly MasteryMap[] = [CONSOLE_PIANO_MAP, CONSOLE_GAME_DEV_MAP, MATH_IN_USE];

const readOf = (vm: { reads: readonly { id: string }[] }, id: string) =>
  vm.reads.find((r) => r.id === id)!;

const AT = "2026-07-26T11:15:00.000Z";

describe("Child read: the standing comes from artefacts and from nothing else", () => {
  it("counts two artefacts in one project as several things made, and lists them", () => {
    const ms = readOf(
      childReadView(CONSOLE_GAME_DEV_MAP, DULCE, DULCE.overrides),
      "gd-one-screen-game",
    );
    expect(ms.strength).toBe("multiple");
    expect(ms.evidence).toHaveLength(1);
    expect(ms.evidence[0]!.project).toBe("Rescue the Toaster");
    expect(ms.evidence[0]!.made.map((m) => m.title)).toEqual([
      "One-screen build, finished end to end",
      "Playable link her cousin got to the end of",
    ]);
  });

  it("adds up artefacts across projects rather than counting projects", () => {
    const ms = readOf(
      childReadView(CONSOLE_GAME_DEV_MAP, DULCE, DULCE.overrides),
      "gd-reproduce-a-bug",
    );
    expect(ms.strength).toBe("multiple");
    expect(ms.evidence.map((e) => e.project)).toEqual(["Finding the lift bug", "The lift fix"]);
    for (const e of ms.evidence) expect(e.made).toHaveLength(1);
  });

  it("reads one artefact as one thing made, which is the underpowered case", () => {
    const ms = readOf(childReadView(CONSOLE_PIANO_MAP, ARI, ARI.overrides), "pf-steady-pulse");
    expect(ms.strength).toBe("single");
    expect(ms.strengthNote).toMatch(/nowhere near enough/i);
  });

  /** Decision 1: a guide's override moves what can be OFFERED and never puts a standing anywhere.
      Ari's earliest playing was real and nobody kept it, so this is the ordinary case. */
  it("leaves an overridden milestone with nothing made, because nobody ticks anything", () => {
    const ms = readOf(childReadView(CONSOLE_PIANO_MAP, ARI, ARI.overrides), "pf-one-whole-piece");
    expect(ms.strength).toBe("none");
    expect(ms.evidence).toEqual([]);
    expect(ms.override?.note).toMatch(/none of it was kept/i);
    expect(ms.override?.by).toBe("guide-104");
  });

  /**
   * Decision 4, asserted rather than assumed. `Array.isArray(evidence)` was true by construction
   * and said nothing; what has to hold is that a standing above "nothing made here yet" always has
   * the artefacts it was derived from underneath it, on every map and for every child.
   */
  it("puts real work under every standing that says something was made", () => {
    let checked = 0;
    for (const work of [ARI, BEX, CYRUS, DULCE]) {
      for (const map of IN_USE) {
        for (const ms of childReadView(map, work, work.overrides).reads) {
          expect(ms.strengthNote.length).toBeGreaterThan(0);
          const artefacts = ms.evidence.flatMap((e) => e.made);
          expect(artefacts.length > 0, `${ms.id} says "${ms.strengthText}"`).toBe(
            ms.strength !== "none",
          );
          if (ms.strength !== "none") checked += 1;
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  /**
   * And the artefacts under a standing are the ones ON the link it was derived from, not a second
   * derivation from the child's work that could drift from the first. The count and the list come
   * off one object, so "several things made" over one artefact is not expressible.
   */
  it("shows the artefacts the link stands for rather than deriving them a second time", () => {
    const vm = childReadView(CONSOLE_GAME_DEV_MAP, DULCE, DULCE.overrides);
    for (const ms of vm.reads) {
      for (const e of ms.evidence) {
        const project = DULCE.projects.find((p) => p.id === e.projectId)!;
        expect(e.project).toBe(project.title);
        // The link is on the milestone the PROJECT was aimed at, which is where a real one carries
        // it, and it holds that project's whole body of work rather than a slice of it.
        expect(project.milestoneId).toBe(ms.id);
        expect(e.made.map((m) => m.title)).toEqual(project.made.map((m) => m.title));
      }
    }
  });

  /** Every field on a link reaches the screen. `at` did not: it was computed, carried and never
      rendered, which is a fact about a child sitting in a view model that nothing shows. */
  it("carries nothing on a link that the screen does not show", () => {
    const ms = readOf(
      childReadView(CONSOLE_GAME_DEV_MAP, DULCE, DULCE.overrides),
      "gd-reproduce-a-bug",
    );
    for (const e of ms.evidence)
      expect(Object.keys(e).sort()).toEqual(["made", "project", "projectId"]);
  });
});

/**
 * The distinction the whole slice turns on. "This child has this capability" is a verdict nothing
 * here reaches, and "should we offer this next" is a decision that has to come out yes or no. The
 * tests below are the ones that would fail if the two ever collapsed into each other.
 */
describe("Child read: reachable is an offering decision, not a mastery claim", () => {
  it("offers the next rung off one artefact while the rung behind it still says one thing made", () => {
    const vm = childReadView(CONSOLE_PIANO_MAP, ARI, ARI.overrides);
    expect(readOf(vm, "pf-steady-pulse").reachable).toBe(true);
    expect(readOf(vm, "pf-steady-pulse").strength).toBe("single");
    // And what unlocked it is the override on the rung before it, which claims nothing at all.
    expect(readOf(vm, "pf-one-whole-piece").strength).toBe("none");
    expect(readOf(vm, "pf-one-whole-piece").reachable).toBe(true);
  });

  it("calls a milestone with nothing made reachable, so reachable cannot be read as a standing", () => {
    const ms = readOf(childReadView(MATH_IN_USE, BEX, BEX.overrides), "cm-write-one-solution");
    expect(ms.reachable).toBe(true);
    expect(ms.strength).toBe("none");
    expect(ms.evidence).toEqual([]);
  });

  it("still offers the first rung to a child who has made nothing anywhere", () => {
    const vm = childReadView(MATH_IN_USE, CYRUS, CYRUS.overrides);
    expect(readOf(vm, "cm-first-whole-paper").reachable).toBe(true);
    for (const ms of vm.reads) expect(ms.strength).toBe("none");
  });

  it("never says a milestone is offered and blocked at the same time", () => {
    for (const work of [ARI, BEX, CYRUS, DULCE]) {
      for (const map of IN_USE) {
        for (const ms of childReadView(map, work, work.overrides).reads) {
          expect(ms.reachable).toBe(ms.blockedBy.length === 0);
        }
      }
    }
  });

  it("says what is in the way in words a guide can act on", () => {
    const vm = childReadView(CONSOLE_GAME_DEV_MAP, DULCE, DULCE.overrides);
    // Gated above her, and nothing else: the rung before it has two artefacts behind it.
    expect(readOf(vm, "gd-playtest").blockedBy).toEqual([
      "Gated at Foundations, and the planner has Dulce Park at Ignition.",
    ]);
    // And one with both problems names both, the prerequisite by its title rather than its id.
    expect(readOf(vm, "gd-version-control").blockedBy).toEqual([
      'Nothing behind "Watch someone else play it" yet, and that one comes first.',
      "Gated at Foundations, and the planner has Dulce Park at Ignition.",
    ]);
  });
});

describe("Child read: the planner owns stage, and the map only asks", () => {
  it("says so when the planner has actually read this child in this domain", () => {
    const vm = childReadView(CONSOLE_GAME_DEV_MAP, DULCE, DULCE.overrides);
    expect(vm.stage).toBe("Ignition");
    expect(vm.stageNote).toMatch(/planner has Dulce Park at Ignition/);
    expect(vm.stageNote).toMatch(/never moves it/);
  });

  it("says the other thing when nobody has placed the child in this domain at all", () => {
    const vm = childReadView(CONSOLE_PIANO_MAP, ARI, ARI.overrides);
    expect(vm.stageNote).toMatch(/no certified spike in this domain/);
    expect(vm.stage).toBe("Ignition");
  });

  /**
   * Which map a spike resolves to is the engine's rule and there is one of it. Dulce's spike is on
   * `["code-computers", "game-dev"]`, and a map filed at the cabin above it serves her: comparing
   * paths for equality instead told a guide she had no certified spike in a domain the planner has
   * a live read on, and then blamed every gated rung on that.
   */
  it("reads the planner's stage through a map filed at the cabin above the child's spike", () => {
    const cabin: MasteryMap = { ...CONSOLE_GAME_DEV_MAP, domainPath: ["code-computers"] };
    const vm = childReadView(cabin, DULCE, DULCE.overrides);
    expect(vm.stageNote).toMatch(/planner has Dulce Park at Ignition/);
    expect(vm.stageNote).not.toMatch(/no certified spike/);
  });

  it("does not read a cabin map's stage off a spike in a different cabin", () => {
    const elsewhere: MasteryMap = { ...CONSOLE_GAME_DEV_MAP, domainPath: ["science-nature"] };
    expect(childReadView(elsewhere, DULCE, DULCE.overrides).stageNote).toMatch(
      /no certified spike/,
    );
  });

  it("orders the reads the way the engine does, and not the way the map was authored", () => {
    expect(
      childReadView(CONSOLE_GAME_DEV_MAP, DULCE, DULCE.overrides).reads.map((r) => r.id),
    ).toEqual([
      "gd-one-screen-game",
      "gd-reproduce-a-bug",
      "gd-playtest",
      "gd-version-control",
      "gd-profile-a-scene",
    ]);
  });
});

/**
 * The two reasons a rung can be out of reach, which are not the same reason and must not share a
 * sentence. The caveat used to fire on ANY stage floor and then say "nothing above Foundations can
 * be reached by any child", which for a child at Ignition looking at a rung gated at Foundations is
 * simply false: Foundations IS reachable, and the block IS about where this child has been placed.
 * On the maths map, which has no rung above Foundations at all, every clause of it was false.
 */
describe("Child read: the ceiling and the placement are different facts", () => {
  it("carries the ceiling caveat where something is gated above what anyone can reach", () => {
    // The piano map's own composition rung sits at Authorship, which nobody can be placed at.
    const vm = childReadView(CONSOLE_PIANO_MAP, ARI, ARI.overrides);
    expect(vm.ceilingNote).toMatch(/not for anything this child did/i);
    expect(vm.ceilingNote).toMatch(/nothing above Foundations/i);
  });

  it("says nothing about the ceiling when the only gate is one the planner could pass", () => {
    // Two rungs at Foundations, nothing above it, and Bex at Ignition. Every clause of the ceiling
    // caveat would be false here, and it is the case that put a false sentence on the screen.
    const vm = childReadView(MATH_IN_USE, BEX, BEX.overrides);
    expect(vm.reads.some((r) => r.blockedBy.length > 0)).toBe(true);
    expect(vm.ceilingNote).toBeNull();
  });

  it("says instead that this is where the planner has the child, and whose call moving them is", () => {
    const vm = childReadView(MATH_IN_USE, BEX, BEX.overrides);
    expect(vm.stageGateNote).toMatch(/where the planner has Bex Ito today/i);
    expect(vm.stageGateNote).toMatch(/planner's call/i);
    // And it does not claim the rung is unreachable by anybody, which is the false half.
    expect(vm.stageGateNote).not.toMatch(/any child|out of reach/i);
  });

  it("carries both where both are true, in two sentences rather than one", () => {
    // Dulce is at Ignition: playtest and version control are gated at Foundations, which the
    // planner could move her to, and profiling sits at Authorship, which nobody can reach.
    const vm = childReadView(CONSOLE_GAME_DEV_MAP, DULCE, DULCE.overrides);
    expect(vm.ceilingNote).not.toBeNull();
    expect(vm.stageGateNote).not.toBeNull();
    expect(vm.ceilingNote).not.toBe(vm.stageGateNote);
  });

  it("carries neither when nothing on the map is gated above the child at all", () => {
    const groundFloor: MasteryMap = {
      ...MATH_IN_USE,
      milestones: MATH_IN_USE.milestones.map((m) => ({ ...m, stageFloor: "S1_IGNITION" as const })),
    };
    const vm = childReadView(groundFloor, BEX, BEX.overrides);
    expect(vm.ceilingNote).toBeNull();
    expect(vm.stageGateNote).toBeNull();
  });
});

/**
 * Slice 1 §8: a map with a problem on it never reaches what a plan consumes, and `MapStore.get`
 * enforces that. The review path was justified on the grounds that no child is downstream of it,
 * and slice 2 made that false by putting a child's standing on the review screen. So the reading is
 * gated on the same check, plus the one the store leaves to its caller: the map has to be in use.
 */
describe("Child read: nobody is read against a map that is not in use, or not fit to be", () => {
  it("shows no standing for a draft, and says the decision is the guide's", () => {
    const vm = childReadView(withStatus(CONSOLE_PIANO_MAP, "draft"), ARI, ARI.overrides);
    expect(vm.reads).toEqual([]);
    expect(vm.standingRefusal).toMatch(/not in use yet/i);
    expect(vm.standingRefusal).toMatch(/your call/i);
  });

  it("shows no standing for a withdrawn map, without pretending it went wrong", () => {
    const vm = childReadView(withStatus(CONSOLE_PIANO_MAP, "withdrawn"), ARI, ARI.overrides);
    expect(vm.reads).toEqual([]);
    expect(vm.standingRefusal).toMatch(/taken out of use/i);
    expect(vm.standingRefusal).toMatch(/nothing about it became invalid/i);
  });

  it("shows no standing for a map the validator found a problem with", () => {
    const vm = childReadView(withStatus(BROKEN_PIANO, "published"), ARI, ARI.overrides);
    expect(vm.reads).toEqual([]);
    expect(vm.standingRefusal).toMatch(/not fit for use/i);
    expect(vm.standingRefusal).toMatch(/validator found/i);
  });

  /** Freshness is half of `canPublish`, so a map nobody has re-checked is refused here too. The
      maths seed is exactly that map, and the child under it was being read against it anyway. */
  it("shows no standing for a map whose resources are overdue a re-check", () => {
    const vm = childReadView(
      withStatus(CONSOLE_COMPETITION_MATH_MAP, "published"),
      BEX,
      BEX.overrides,
    );
    expect(vm.reads).toEqual([]);
    expect(vm.standingRefusal).toMatch(/re-check/i);
  });

  it("reads the child against a map that is in use and fit to be", () => {
    const vm = childReadView(CONSOLE_PIANO_MAP, ARI, ARI.overrides);
    expect(vm.standingRefusal).toBeNull();
    expect(vm.reads.length).toBe(CONSOLE_PIANO_MAP.milestones.length);
  });

  /** The map itself is still reviewable in every one of those states. Refusing the reading is not
      refusing the map: the review screen is where a map that cannot be used gets fixed. */
  it("leaves the map's own review surface exactly as it was", () => {
    for (const status of ["draft", "withdrawn", "published"] as const) {
      const map = withStatus(CONSOLE_PIANO_MAP, status);
      expect(mapView(map).milestones).toEqual(mapView(CONSOLE_PIANO_MAP).milestones);
    }
  });
});

describe("Child read: the override affordance", () => {
  it("is offered where nothing was made and withheld where something was", () => {
    const vm = childReadView(CONSOLE_GAME_DEV_MAP, DULCE, DULCE.overrides);
    // An override on a milestone that already has an artefact would change nothing: satisfaction
    // for the purpose of offering is any evidence at all OR an override.
    expect(readOf(vm, "gd-one-screen-game").canOverride).toBe(false);
    expect(readOf(vm, "gd-playtest").canOverride).toBe(true);
  });

  /** And withheld once one has been recorded, for the same reason: a second one changes nothing a
      guide can see, and the engine reads the list as a log and would keep only the last of them. */
  it("is withheld on a milestone a guide has already spoken about", () => {
    const vm = childReadView(CONSOLE_PIANO_MAP, ARI, ARI.overrides);
    expect(readOf(vm, "pf-one-whole-piece").override).not.toBeNull();
    expect(readOf(vm, "pf-one-whole-piece").strength).toBe("none");
    expect(readOf(vm, "pf-one-whole-piece").canOverride).toBe(false);
  });

  /**
   * The instant is an argument and there is no default. It used to be stamped with `REVIEW_NOW`,
   * the fixed clock the panel validates against, which dated every override a guide would ever
   * record to the same moment. A validation clock can be pinned because validation is a function of
   * the map. The moment a person signed something is part of what the record says.
   */
  it("records the note against the guide and the instant it was actually given", () => {
    expect(overrideFor("gd-playtest", "She ran two playtests at code club.", AT)).toEqual({
      milestoneId: "gd-playtest",
      actor: { id: "guide-104", role: "GUIDE" },
      at: AT,
      note: "She ran two playtests at code club.",
    });
    const later = overrideFor("gd-playtest", "She ran two playtests at code club.", REVIEW_NOW);
    expect(later.at).not.toBe(AT);
  });

  /** Item 9 at the console's own door: an override with no reason is a checkbox. */
  it("refuses to build one with no reason on it", () => {
    expect(() => overrideFor("gd-playtest", "   ", AT)).toThrow(/OVERRIDE_NO_REASON/);
  });

  it("unlocks what came after it without making anything appear on the milestone itself", () => {
    const vm = childReadView(CONSOLE_GAME_DEV_MAP, DULCE, [
      ...DULCE.overrides,
      overrideFor("gd-playtest", "She ran two playtests at code club.", AT),
    ]);
    expect(readOf(vm, "gd-playtest").strength).toBe("none");
    expect(readOf(vm, "gd-playtest").evidence).toEqual([]);
    // gd-version-control loses its prerequisite blocker. The stage floor is not a guide's to move.
    expect(readOf(vm, "gd-version-control").blockedBy).toEqual([
      "Gated at Foundations, and the planner has Dulce Park at Ignition.",
    ]);
  });
});

/**
 * An override is a signed human decision, and it used to live in component state and nowhere else:
 * a re-render lost it, nothing recorded that it had happened, and the affordance stayed open so a
 * guide could add a second one that the engine would silently drop. `recordOverride` is to the
 * child's record what `applyEdit` is to the map's provenance: the one way in, and it refuses what
 * would lose a record.
 */
describe("Child read: recording an override", () => {
  const OVERRIDE = overrideFor("gd-playtest", "She ran two playtests at code club.", AT);

  it("appends it to the child's record beside the ones they arrived with", () => {
    const after = recordOverride(CONSOLE_GAME_DEV_MAP, DULCE, OVERRIDE);
    expect(after.overrides).toEqual([...DULCE.overrides, OVERRIDE]);
    // And the record it was handed is left exactly as it was.
    expect(DULCE.overrides).toEqual([]);
  });

  it("is read back by the view model, so the decision survives the render that follows it", () => {
    const after = recordOverride(CONSOLE_GAME_DEV_MAP, DULCE, OVERRIDE);
    const ms = readOf(childReadView(CONSOLE_GAME_DEV_MAP, after, after.overrides), "gd-playtest");
    expect(ms.override).toEqual({ by: "guide-104", at: AT, note: OVERRIDE.note });
    expect(ms.canOverride).toBe(false);
  });

  it("refuses a second override on the same milestone rather than dropping the first", () => {
    const after = recordOverride(CONSOLE_GAME_DEV_MAP, DULCE, OVERRIDE);
    const second = overrideFor("gd-playtest", "Actually it was three playtests.", REVIEW_NOW);
    expect(() => recordOverride(CONSOLE_GAME_DEV_MAP, after, second)).toThrow(
      OVERRIDE_ALREADY_RECORDED,
    );
    // Ari arrived with one, so the refusal holds for a record made before this session too.
    const again = overrideFor("pf-one-whole-piece", "Same call, made twice.", AT);
    expect(() => recordOverride(CONSOLE_PIANO_MAP, ARI, again)).toThrow(OVERRIDE_ALREADY_RECORDED);
  });

  it("refuses a milestone this map does not have, the way an edit does", () => {
    expect(() => recordOverride(CONSOLE_PIANO_MAP, ARI, OVERRIDE)).toThrow(
      OVERRIDE_UNKNOWN_MILESTONE,
    );
  });
});

/**
 * The percentage ban, now that there IS a numerator. Slice 1 could say a map holds nothing about
 * any child and be done; slice 2 is per-child by definition, so the ban has to be held on purpose
 * rather than by absence. Here that means: nothing in the read view model is a count, a ratio or a
 * tally of standings, and no field is named as though it were one. The other half is the rendered
 * markup, in `maps-panel.test.tsx`, which is where a bar would actually appear.
 */
describe("Child read: no completion measure is derivable from it either", () => {
  const ALL = [ARI, BEX, CYRUS, DULCE].flatMap((work) =>
    IN_USE.map((map) => childReadView(map, work, work.overrides)),
  );

  function keysOf(value: unknown, into: Set<string> = new Set()): Set<string> {
    if (value === null || typeof value !== "object") return into;
    if (Array.isArray(value)) {
      for (const item of value) keysOf(item, into);
      return into;
    }
    for (const [k, child] of Object.entries(value)) {
      into.add(k);
      keysOf(child, into);
    }
    return into;
  }

  function booleanKeysOf(value: unknown, into: Set<string> = new Set()): Set<string> {
    if (value === null || typeof value !== "object") return into;
    if (Array.isArray(value)) {
      for (const item of value) booleanKeysOf(item, into);
      return into;
    }
    for (const [k, child] of Object.entries(value)) {
      if (typeof child === "boolean") into.add(k);
      booleanKeysOf(child, into);
    }
    return into;
  }

  function numbersOf(value: unknown, into: number[] = []): number[] {
    if (typeof value === "number") into.push(value);
    if (value === null || typeof value !== "object") return into;
    for (const child of Object.values(value)) numbersOf(child, into);
    return into;
  }

  const COMPLETION_WORDS = new Set([
    "count",
    "counts",
    "total",
    "totals",
    "percent",
    "percentage",
    "pct",
    "ratio",
    "share",
    "fraction",
    "progress",
    "done",
    "complete",
    "completed",
    "completion",
    "finished",
    "remaining",
    "numerator",
    "denominator",
    "tally",
    "passed",
    "score",
  ]);

  const wordsIn = (key: string): readonly string[] =>
    key
      .split(/(?=[A-Z])|[_-]/)
      .map((w) => w.toLowerCase())
      .filter((w) => w.length > 0);

  it("names no field after a count, a ratio, a verdict or a state of doneness", () => {
    for (const vm of ALL) {
      for (const key of keysOf(vm)) {
        for (const word of wordsIn(key)) {
          expect(COMPLETION_WORDS.has(word), `"${key}" is a completion measure by name`).toBe(
            false,
          );
        }
      }
    }
  });

  it("exposes no number at all, so there is nothing to divide", () => {
    // `artifactCount` is deliberately not carried through: the panel is handed the artefacts
    // themselves, which is what a guide has to see anyway, and a bare number is what a tally is
    // made of.
    for (const vm of ALL) expect(numbersOf(vm)).toEqual([]);
  });

  /** Exact, not a subset. A `passed`, `met` or `complete` boolean added later has to fail here
      first, and `reachable` is on the list because it is an offering decision and nothing else. */
  it("carries no per-milestone flag anyone could read as doneness", () => {
    for (const vm of ALL) {
      expect([...booleanKeysOf(vm)].sort()).toEqual(["canOverride", "isTrunk", "reachable"]);
    }
  });

  /** The read's shape, pinned. Adding a field is a decision somebody has to defend in review. */
  it("shapes a read out of exactly the fields slice 2 decided on", () => {
    const SHAPE = [
      "blockedBy",
      "branchModes",
      "canOverride",
      "capability",
      "evidence",
      "id",
      "isTrunk",
      "override",
      "reachable",
      "stage",
      "strength",
      "strengthNote",
      "strengthText",
      "title",
    ];
    for (const vm of ALL) for (const ms of vm.reads) expect(Object.keys(ms).sort()).toEqual(SHAPE);
  });

  /** And the vocabulary itself never reaches a verdict, whatever a caller does with it. */
  it("says how much was made and never whether it was enough", () => {
    for (const vm of ALL) {
      for (const ms of vm.reads) {
        expect(["none", "single", "multiple"]).toContain(ms.strength);
        expect(ms.strengthText).not.toMatch(/\b(pass|passed|complete|done|mastered|met)\b/i);
      }
    }
  });
});
