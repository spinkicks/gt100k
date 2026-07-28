// The crosswalk: this app's furniture, named in the product taxonomy's terms.
//
// Emission is on, so records are being written, and without this every one of them is discarded:
// `buildActionEvents` looks the artifact id up in a catalog, and nothing in the repo mapped
// `nonogram` to a domain. This is that catalog.
//
// WHY A CROSSWALK IS NEEDED AT ALL. The two taxonomies differ on purpose. This app splits
// `logic-games` from `math` because its original puzzles survive replacing every numeral with an
// arbitrary symbol, so they measure deduction and not mathematics (see `game/types.ts`). The product
// models the same split one level down, inside `math-puzzles`. Neither is wrong; they are cut for
// different jobs, and this file is where they meet.
//
// WRITTEN AS LITERALS, deliberately. `signals/types.ts` records the decision that this app holds the
// engine packages as `import type` only — erased at build, no runtime dependency, no bundle cost —
// and `makeArtifact` is a runtime import. So the rows are hand-written and `catalog.test.ts`
// validates them against the real `CABINS` and `SEED_SUBTOPICS` instead, which it can do because a
// test is not bundled. `makeArtifact` would also stamp `PROVISIONAL`, and these are hand-authored.
//
// THE JUDGEMENT CALLS, all three pinned by test so they change deliberately rather than by drift:
//
//   chess → games-strategy/chess, NOT math-puzzles/logic-puzzles. The app files it under
//   `logic-games` for a sound reason, but the product has an exact match and the domain read exists
//   to name what a child could go deep on. A child returning to the chess puzzle is telling us about
//   chess; routing that into `logic-puzzles` discards it.
//
//   gear-train → making-engineering, NOT math-puzzles. It sits in the app's `math` room, but what a
//   child does in it is assemble a working train of gears.
//
//   the four maths activities → math-puzzles/foundations, NOT competition-math. Balance, ratio,
//   fractions and functions are foundational. Filing them under competition maths would serve AMC
//   papers to a child who liked a balance scale, because `curatedForCell` matches on path.
import type { Artifact } from "@gt100k/two-axis-tagging";

/**
 * The action verb a solve on this gadget represents.
 *
 * Part of the mapping and not an afterthought: `resolveEngagedModes` takes the PRIMARY mode from
 * ACTION_MODE_RULES order intersected with `affordedModes`, so the verb decides the mode and the
 * order of `affordedModes` means nothing. `tinker` engages build and investigate together, which is
 * why the two gadgets that genuinely do both use it rather than `inspect`, which would engage one
 * and leave the other generating skip-noise against a cell the child was in fact working in.
 */
export type SolveVerb = "inspect" | "tinker" | "play" | "assemble";

/**
 * One row per gadget in `gadgets/registry.ts`. Coverage in both directions is a test: a gadget with
 * no row emits into nothing, and a row with no gadget files engagement under a domain nothing in
 * the app can reach.
 */
const ROWS = [
  // logic-games — deduction. Solving these is investigating a system, not building one.
  ["nonogram", ["math-puzzles", "logic-puzzles"], ["investigate"], "inspect"],
  ["mirror", ["math-puzzles", "logic-puzzles"], ["investigate"], "inspect"],
  // Routing a pipe network is construction first, deduction second. Both are engaged, so both
  // are afforded, and the verb the emitter uses decides which is primary.
  ["pipes", ["math-puzzles", "logic-puzzles"], ["build", "investigate"], "tinker"],
  ["chess", ["games-strategy", "chess"], ["perform"], "play"],

  // math — foundational, not competition.
  ["balance-scale", ["math-puzzles", "foundations"], ["investigate"], "inspect"],
  ["fraction-laser", ["math-puzzles", "foundations"], ["investigate"], "inspect"],
  ["function-machine", ["math-puzzles", "foundations"], ["investigate"], "inspect"],
  ["ratio-mixing", ["math-puzzles", "foundations"], ["investigate"], "inspect"],
  ["gear-train", ["making-engineering"], ["build", "investigate"], "tinker"],
] as const satisfies readonly (readonly [
  string,
  readonly [string] | readonly [string, string],
  readonly string[],
  SolveVerb,
])[];

export const CATALOG: ReadonlyMap<string, Artifact> = new Map(
  ROWS.map(([id, domainPath, affordedModes]) => [
    id,
    {
      id,
      domainPath,
      affordedModes,
      kind: "gadget",
      source: "gold",
      origin: "seed",
      tagConfidence: 1,
      tagStatus: "TRUSTED",
    } as Artifact,
  ]),
);

/**
 * The cabin each of the game's topics belongs to.
 *
 * A topic is a room; a gadget is a thing in it. The rows above answer "what is this object", and
 * this answers "what is this room about", which is the question an invitation card asks: it is
 * addressed to the whole field rather than to any one puzzle, so it cannot borrow a gadget's path
 * without narrowing itself to that gadget's subtopic.
 *
 * Cabin-level on purpose, with no subtopic. A room contains several, and picking one would quietly
 * decide that a child who liked the maths room liked fractions specifically.
 *
 * The three rooms with no interior yet (`music`, `art`, `science`, `words`) are absent rather than
 * guessed. An absent row yields no resources, which is visibly nothing; a wrong row yields the
 * wrong resources, which looks like it worked.
 */
const TOPIC_CABINS = {
  "logic-games": ["math-puzzles"],
  math: ["math-puzzles"],
  code: ["code-computers"],
} as const satisfies Readonly<Record<string, readonly [string]>>;

/** The cabin path for one of the game's topics, or undefined when that room has no mapping yet. */
export function pathForTopic(topicId: string): Artifact["domainPath"] | undefined {
  return (TOPIC_CABINS as Readonly<Record<string, Artifact["domainPath"]>>)[topicId];
}

/** Solve verb per gadget, derived from the same rows so the two cannot disagree. */
const VERBS: ReadonlyMap<string, SolveVerb> = new Map(ROWS.map(([id, , , verb]) => [id, verb]));

/** The artifact for a gadget id, or undefined when the id is not one of ours. */
export function artifactFor(gadgetId: string): Artifact | undefined {
  return CATALOG.get(gadgetId);
}

/** The verb a solve on this gadget represents. See {@link SolveVerb}. */
export function solveVerbFor(gadgetId: string): SolveVerb | undefined {
  return VERBS.get(gadgetId);
}
