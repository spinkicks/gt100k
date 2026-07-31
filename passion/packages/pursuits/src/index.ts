// What a child can actually do, and who will tell them they are getting better.
//
// This package is the child-facing MENU. It is not the taxonomy, and the distinction is the whole
// point of it: `@gt100k/two-axis-tagging` holds eight cabins because a belief has to live in a cell
// coarse enough to accumulate evidence, and rendering that coordinate system to a child produced
// leaves like "board games" and "instruments" — categories with no shared action, which a child
// cannot picture doing and cannot specialise in.
//
// So there are two structures. The taxonomy stays as the model's coordinate system. This is the
// menu, flat, with the cabin demoted to a filter facet the child never has to navigate through.
//
// DATA AND PREDICATES ONLY. No engine logic, no scoring, nothing that decides anything about a
// child. Consumers filter; they do not ask this package what to show.
import { PURSUITS } from "./catalogue.js";
import type { Pursuit } from "./model.js";

export type { Cadence, Ceiling, Pursuit, Reach, Region, Skew, Venue } from "./model.js";
export { PURSUITS } from "./catalogue.js";

/**
 * The pursuits a child of this age can actually enter.
 *
 * Age is a hard filter rather than a sort, because the alternative is showing a seven-year-old a
 * door that is locked. Most venues open at 10 to 13 — eBird's terms bar under-13s outright, picoCTF
 * and the game jams are 13 by COPPA, and 4-H Cloverbuds are frequently barred from the competitive
 * judging that is the reason to enter. Seventeen of the thirty-seven admit a six-year-old.
 *
 * That thinness is a fact about the world and this function surfaces it rather than hiding it: a
 * caller that gets back a short list for a young child is seeing the truth, and should say so on
 * screen instead of padding it.
 *
 * THIS FILTERS ON `minAge`, WHICH IS THE PURSUIT'S OWN DOOR, NOT `ceiling.opensAt`. The two are
 * different questions and the gap between them is large: twenty-one of the thirty-seven have a
 * ceiling that opens later than the pursuit itself, and several not until fifteen or seventeen. A
 * caller showing a child what they can start today wants this function; a caller telling an adult
 * where a pursuit eventually leads wants `ceiling` and should not pretend the two coincide.
 */
export function reachableAt(age: number, from: readonly Pursuit[] = PURSUITS): readonly Pursuit[] {
  return from.filter((p) => age >= p.minAge);
}

/**
 * The pursuits a child with no club and one uninformed adult can reach.
 *
 * `adult-action` is included because every one of those needs exactly one explainable thing from a
 * grown-up — hold the account, be the second team member, sign the form — and the product can tell
 * them what it is. `needs-organisation` is excluded because no amount of explaining conjures a
 * local robotics team.
 */
export function reachableAlone(from: readonly Pursuit[] = PURSUITS): readonly Pursuit[] {
  return from.filter((p) => p.reach !== "needs-organisation");
}

/** The pursuits that cost a family no more than `usd` a year, excluding any instrument. */
export function withinBudget(usd: number, from: readonly Pursuit[] = PURSUITS): readonly Pursuit[] {
  return from.filter((p) => p.costUsd <= usd);
}

/**
 * The pursuits whose venue accepts entries from here.
 *
 * International venues are always included, because a US child can enter ABRSM and a UK child can
 * enter iNaturalist. Only the regional ones are filtered out, and there are more of those than is
 * comfortable: two of the three best animation venues are UK-only.
 */
export function inRegion(
  region: "us" | "uk",
  from: readonly Pursuit[] = PURSUITS,
): readonly Pursuit[] {
  return from.filter((p) => p.region === "international" || p.region === region);
}

export function byId(id: string): Pursuit | undefined {
  return PURSUITS.find((p) => p.id === id);
}
