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
import { COMPETITION_MATH_MAP, GAME_DEV_MAP, PIANO_MAP } from "../app/maps-seed.js";
import {
  REVIEW_NOW,
  editCapability,
  mapView,
  mapsForReview,
  problemKey,
  withStatus,
} from "../app/maps.js";

/**
 * The piano map with one `requires` pointed at a milestone that does not exist. That is error rule
 * 1, reported against `pf-steady-pulse`, and it is the only rule the edit trips: rule 6 skips a
 * prerequisite it cannot resolve, and losing one edge leaves the graph acyclic.
 */
const BROKEN_PIANO: MasteryMap = {
  ...PIANO_MAP,
  milestones: PIANO_MAP.milestones.map((m) =>
    m.id === "pf-steady-pulse" ? { ...m, requires: ["pf-nothing-here"] } : m,
  ),
};

describe("Maps view-model: errors, warnings and where they land", () => {
  it("keeps a milestone-scoped warning on its own milestone and off every other", () => {
    const vm = mapView(PIANO_MAP);
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
    const vm = mapView(GAME_DEV_MAP);
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
    expect(mapView(PIANO_MAP).valid).toBe(true);
  });

  /**
   * Both halves of one defect. A banned field name is the case where a single rule fires on every
   * milestone at once, with identical code and identical wording each time: the engine has to name
   * which milestone each hit is on, or they all pile up at the top of the card, and the list key
   * has to carry that name, or React collides the flags and keeps one of them.
   */
  it("places an identical problem at each milestone it is on, under a key of its own", () => {
    const everyMilestoneDirty = {
      ...PIANO_MAP,
      milestones: PIANO_MAP.milestones.map((m) => ({ ...m, rating: 1800 })),
    } as unknown as MasteryMap;

    const vm = mapView(everyMilestoneDirty);
    const banned = vm.milestones.flatMap((m) => m.errors.filter((e) => e.code === "E8_BANNED_KEY"));
    expect(banned).toHaveLength(PIANO_MAP.milestones.length);
    expect(vm.errors).toEqual([]);

    const keys = banned.map(problemKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("loses no problem and duplicates none while placing them", () => {
    for (const source of [PIANO_MAP, GAME_DEV_MAP, BROKEN_PIANO]) {
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
    const vm = mapView(PIANO_MAP);
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
    const inUse = mapView(withStatus(PIANO_MAP, "published"));
    const withdrawn = mapView(withStatus(PIANO_MAP, "withdrawn"));

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
    const inUse = mapView(withStatus(PIANO_MAP, "published"));
    const withdrawn = mapView(withStatus(PIANO_MAP, "withdrawn"));
    expect(withdrawn.valid).toBe(inUse.valid);
    expect(withdrawn.errors).toEqual(inUse.errors);
    expect(withdrawn.warnings).toEqual(inUse.warnings);
    expect(withdrawn.milestones).toEqual(inUse.milestones);
  });

  it("does not make a map wait for a human to look at it", () => {
    // Nobody available to us can certify that an ordering of a domain is right, so human review is
    // optional and its absence blocks nothing. The game-dev map has nobody on it.
    const unreviewed = mapsForReview().find((m) => m.id === GAME_DEV_MAP.id)!;
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
    const vm = mapView(COMPETITION_MATH_MAP);
    // Nothing is WRONG with this map. That is the point: validity alone was never the gate.
    expect(vm.valid).toBe(true);
    expect(vm.stale).toBe(true);
    expect(vm.publishable).toBe(false);
    expect(vm.publishRefusal).toMatch(/re-check/i);
  });

  it("leaves a recently checked map fresh and publishable", () => {
    const vm = mapView(PIANO_MAP);
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
    PIANO_MAP,
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
    expect(mapView(PIANO_MAP).edits).toEqual([]);
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
    expect(PIANO_MAP.provenance.edits).toEqual([]);
    expect(mapView(PIANO_MAP).milestones.find((m) => m.id === "pf-listen-back")?.capability).toBe(
      "Review a recording of your own playing and publish a written note of what to fix",
    );
  });
});
