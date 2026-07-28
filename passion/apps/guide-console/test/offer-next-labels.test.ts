/**
 * Two subtopics of one cabin are two different things to offer.
 *
 * The panel was reported showing "Math & Puzzles" twice, with the same sentence under both, and no
 * way to tell which was which. It was not a rendering accident. `selectHoldOut` counts a
 * maintenance debt PER DOMAIN PATH (`occasionsByDomain` keys on the joined path), and only its
 * breadth step projects down to cabins — that split is deliberate and pinned by
 * `surfacing/test/cabin-level-breadth.test.ts`. So `math-puzzles/logic-puzzles` and
 * `math-puzzles/foundations` are two independent obligations, and the console was labelling both
 * with `path[0]` alone.
 *
 * Which means the two candidate fixes are not equivalent. DEDUPLICATING to one "Math & Puzzles"
 * row would drop an obligation the policy deliberately tracked separately: a guide who offers one
 * logic puzzle has paid the logic-puzzles debt and not the foundations one, and the row that would
 * have told them so is gone. It also cannot be undone downstream, because the surviving row does
 * not say which subtopic it stood for. DISAMBIGUATING keeps both and tells the guide what to
 * actually put in front of the child, which is the only thing this panel is for. `specs/009` calls
 * the fine level the actionable one, and every other panel in this console already renders paths
 * with `specPath`.
 *
 * The existing suite has a `does not repeat a domain across reasons` case that looks like it should
 * have caught this. It cannot: it iterates the synthetic children, whose `surfaced` logs are all
 * empty, so `owed` is always `[]` and the duplicate path never arises. These tests build the
 * history the bug needs.
 */
import { describe, expect, it } from "vitest";
import type { StudentProfile } from "@gt100k/student-profile";

import { groupOffers, offersForKid } from "../app/offer-next.js";
import { profileFor, ROSTER_NOW } from "../app/console-data.js";

/** A day offset back from the synthetic clock, which is what an unregistered profile is read at. */
const day = (back: number): string =>
  new Date(Date.parse(ROSTER_NOW) - back * 86_400_000).toISOString();

/**
 * A child owed a follow-up in two subtopics of ONE cabin.
 *
 * `nonogram` is `math-puzzles/logic-puzzles` and `balance-scale` is `math-puzzles/foundations`, both
 * from the gadget crosswalk the console already merges into its catalog. Distinct days, and fewer
 * than the four spaced occasions the debt asks for, so both come back owed.
 */
function twoSubtopicsOwed(): StudentProfile {
  const base = profileFor("kid-synthetic-003");
  if (!base) throw new Error("the sparse synthetic child is missing from the roster");
  const surfaced = [
    { artifactId: "nonogram", days: [30, 25] },
    { artifactId: "balance-scale", days: [28, 20, 12] },
  ].flatMap(({ artifactId, days }) =>
    days.map((d, i) => ({
      kidId: base.kidId,
      artifactId,
      sessionId: `${artifactId}-${i}`,
      timestamp: day(d),
    })),
  );
  return { ...base, surfaced };
}

describe("an offer names the domain at the grain the policy decided it", () => {
  it("tells two owed subtopics of one cabin apart", () => {
    const offers = offersForKid(twoSubtopicsOwed());
    const debts = offers.filter((o) => o.reason === "maintenance-debt");

    // The bug: both of these were "Math & Puzzles".
    expect(debts.length).toBe(2);
    expect(new Set(debts.map((o) => o.label)).size).toBe(2);
    expect(debts.map((o) => o.label).sort()).toEqual([
      "Math & Puzzles › Foundations",
      "Math & Puzzles › Logic Puzzles",
    ]);
  });

  it("keeps the cabin in the label, so a guide still sees the area", () => {
    // Only the debts: the probe and the breadth pick are in other cabins by construction.
    const debts = offersForKid(twoSubtopicsOwed()).filter((o) => o.reason === "maintenance-debt");
    expect(debts.length).toBeGreaterThan(0);
    for (const o of debts) expect(o.label.startsWith("Math & Puzzles ›")).toBe(true);
  });

  it("labels a cabin-only offer with just the cabin", () => {
    // `never-offered` is chosen from `candidates`, which is a list of cabins, so those paths have no
    // subtopic and must not grow a fake one.
    const offers = offersForKid(profileFor("kid-synthetic-001"));
    for (const o of offers.filter((p) => p.reason === "never-offered")) {
      expect(o.domainPath.length).toBe(1);
      expect(o.label).not.toContain("›");
    }
  });

  it("gives every row an identity that does not collide", () => {
    // The list was keyed `${reason}:${label}`, so two same-cabin debts were also one React key.
    const offers = offersForKid(twoSubtopicsOwed());
    const keys = offers.map((o) => o.domainPath.join("/"));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("groupOffers", () => {
  it("states a reason once however many domains carry it", () => {
    const offers = offersForKid(twoSubtopicsOwed());
    const groups = groupOffers(offers);

    // Two debts, one sentence. Repeating it per row is what made the panel read as broken.
    const debt = groups.find((g) => g.reason === "maintenance-debt");
    expect(debt?.offers.length).toBe(2);
    expect(groups.filter((g) => g.reason === "maintenance-debt").length).toBe(1);
    expect(new Set(groups.map((g) => g.because)).size).toBe(groups.length);
  });

  it("loses no offer and invents none", () => {
    const offers = offersForKid(twoSubtopicsOwed());
    const grouped = groupOffers(offers).flatMap((g) => g.offers);
    expect(grouped).toEqual(offers);
  });

  it("keeps the policy's order, so debts still come before breadth", () => {
    const groups = groupOffers(offersForKid(twoSubtopicsOwed()));
    const reasons = groups.map((g) => g.reason);
    const debt = reasons.indexOf("maintenance-debt");
    const fresh = reasons.indexOf("never-offered");
    if (debt !== -1 && fresh !== -1) expect(debt).toBeLessThan(fresh);
  });

  it("gives every group a heading that is not its own sentence", () => {
    for (const g of groupOffers(offersForKid(twoSubtopicsOwed()))) {
      expect(g.heading.length).toBeGreaterThan(0);
      expect(g.heading).not.toBe(g.because);
      expect(g.offers.length).toBeGreaterThan(0);
    }
  });

  it("says nothing about a child with nothing to offer", () => {
    expect(groupOffers([])).toEqual([]);
  });
});
