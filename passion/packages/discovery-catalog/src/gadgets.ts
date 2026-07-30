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
//
//   tune-repair → DEBUG, not investigate. The child hears that something is wrong and corrects it,
//   which is what `debug` is; `fix` is already in ACTION_MODE_RULES and the gadget is called Repair.
//   The other two music activities are judgements rather than corrections, so they stay `investigate`.
//   This is also the only thing stopping the music room reading as a single cell — see below.
//
// A LIMITATION OF THE MUSIC ROW SET, recorded rather than discovered later. All three music
// activities map to `music-sound/music-theory`, because the product taxonomy's music subtopics are
// audio-systems / production / instruments / music-theory and none of the three involves playing an
// instrument or making a track. So the room can tell us a child likes musical structure and CANNOT
// tell us whether it was melody, harmony or rhythm that held them — the distinction exists in the
// activities and has nowhere to land in the taxonomy. Splitting the modes (debug vs investigate)
// recovers a little of it; a `music-theory` subtopic split would recover the rest, and that is a
// change to the product taxonomy rather than to this file.
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
export type SolveVerb = "inspect" | "tinker" | "play" | "assemble" | "fix";

/**
 * One row per gadget in `gadgets/registry.ts`. Coverage in both directions is a test: a gadget with
 * no row emits into nothing, and a row with no gadget files engagement under a domain nothing in
 * the app can reach.
 *
 * THE FOURTH COLUMN IS THE MENU, NOT THE MODEL, and the two are deliberately allowed to disagree.
 * `domainPath` is where a belief is held and must not move — a child who plays Balance Scale is
 * telling us about `math-puzzles/foundations` whatever tile they found it under. `pursuits` is which
 * of the 44 tiles on the wall offers the game, and the wall is a different partition of the same
 * space: there is no Foundations tile, because "fractions, ratios and functions" share no action
 * program and so are not a thing a child does.
 *
 * The comment below used to warn that filing the four maths activities under competition maths would
 * "serve AMC papers to a child who liked a balance scale, because `curatedForCell` matches on path".
 * That was correct when one key did both jobs. It no longer applies to the tile: the belief still
 * lands on `foundations`, and the shelf a child reaches from the Competition Maths tile is the one
 * curated for that tile — Beast Academy's playground and Math Kangaroo's grade 1-2 papers, which is
 * exactly the right next thing for a child who liked a balance scale. The old objection is the
 * reason to keep the columns separate rather than a reason to leave the games unreachable.
 */
const ROWS = [
  // logic-games — deduction. Solving these is investigating a system, not building one.
  //
  // All three go to the Sudoku tile, whose shelf is NRICH, Transum and Mathigon's puzzle calendars
  // — general grid deduction rather than sudoku specifically, which is what these are.
  ["nonogram", ["math-puzzles", "logic-puzzles"], ["investigate"], "inspect", ["sudoku"]],
  ["mirror", ["math-puzzles", "logic-puzzles"], ["investigate"], "inspect", ["sudoku"]],
  // Routing a pipe network is construction first, deduction second. Both are engaged, so both
  // are afforded, and the verb the emitter uses decides which is primary.
  ["pipes", ["math-puzzles", "logic-puzzles"], ["build", "investigate"], "tinker", ["sudoku"]],
  ["chess", ["games-strategy", "chess"], ["perform"], "play", ["chess"]],

  // math — foundational, not competition. On the belief axis. See the note above for why the tile
  // is Competition Maths anyway.
  [
    "balance-scale",
    ["math-puzzles", "foundations"],
    ["investigate"],
    "inspect",
    ["competition-maths"],
  ],
  [
    "fraction-laser",
    ["math-puzzles", "foundations"],
    ["investigate"],
    "inspect",
    ["competition-maths"],
  ],
  [
    "function-machine",
    ["math-puzzles", "foundations"],
    ["investigate"],
    "inspect",
    ["competition-maths"],
  ],
  [
    "ratio-mixing",
    ["math-puzzles", "foundations"],
    ["investigate"],
    "inspect",
    ["competition-maths"],
  ],
  // Assembling a working train of gears, offered from the tile about machines that move.
  ["gear-train", ["making-engineering"], ["build", "investigate"], "tinker", ["robotics"]],

  // music — all three are audible-only judgements about musical structure, so all three are theory.
  // tune-repair is the odd one on the mode axis: it is a correction, not a verdict.
  //
  // The tiles recover the distinction the taxonomy cannot hold, which the note below records as a
  // limitation: pitch goes to Singing, harmony to Songwriting, rhythm to Drums. The belief is still
  // one cell, so nothing about the model changes — but a child who was held by rhythm now finds the
  // game under the tile about rhythm.
  ["tune-repair", ["music-sound", "music-theory"], ["debug", "investigate"], "fix", ["singing"]],
  ["chord-fit", ["music-sound", "music-theory"], ["investigate"], "inspect", ["songwriting"]],
  ["downbeat", ["music-sound", "music-theory"], ["investigate"], "inspect", ["drums"]],

  // code — three different subtopics on purpose, which is the fix for the limitation recorded above:
  // the music room's three activities all land on `music-theory`, so it cannot say what held a child.
  //
  // sprite-loop -> game-dev, and the verb is `assemble` rather than `tinker`: the child produces a
  // working behaviour and nothing is being probed, so `build` is the whole of it.
  //
  // trace-repair -> DEBUG, for the same reason tune-repair is debug: the child is handed something
  // that is wrong and corrects it. It affords investigate too, because reading an execution to find
  // where it diverged genuinely is probing, and the verb picks debug as primary.
  //
  // teach-helper -> agentic-engineering, which is the one row here that is not a stretch of the
  // taxonomy but a use of it: writing a specification that holds for inputs you cannot see is what
  // that subtopic names. It affords `build` alone -- see §4.1 of the design spec for why `explain` was
  // NOT added to ACTION_MODE_RULES to make a second mode reachable.
  ["sprite-loop", ["code-computers", "game-dev"], ["build"], "assemble", ["game-jam"]],
  ["trace-repair", ["code-computers", "python"], ["debug", "investigate"], "fix", ["programming"]],
  [
    "teach-helper",
    ["code-computers", "agentic-engineering"],
    ["build"],
    "assemble",
    ["programming"],
  ],
] as const satisfies readonly (readonly [
  string,
  readonly [string] | readonly [string, string],
  readonly string[],
  SolveVerb,
  readonly string[],
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
 * The rooms with no interior yet (`art`, `science`, `words`) are absent rather than guessed. `code`
 * already had its row before the room existed, which is why nothing had to be added here for it.
 *
 * Music was on that list until #222 built it, and its row went in with that PR because the omission
 * is exactly the failure this comment was written to catch: the room's three activities all map to
 * `music-sound/music-theory`, so with no cabin-level row the invitation card would have narrowed
 * itself to theory and handed a child who liked the whole room only theory links. An absent row yields no resources, which is visibly nothing; a wrong row yields the
 * wrong resources, which looks like it worked.
 */
const TOPIC_CABINS = {
  "logic-games": ["math-puzzles"],
  math: ["math-puzzles"],
  code: ["code-computers"],
  music: ["music-sound"],
} as const satisfies Readonly<Record<string, readonly [string]>>;

/** The cabin path for one of the game's topics, or undefined when that room has no mapping yet. */
export function pathForTopic(topicId: string): Artifact["domainPath"] | undefined {
  return (TOPIC_CABINS as Readonly<Record<string, Artifact["domainPath"]>>)[topicId];
}

/** Solve verb per gadget, derived from the same rows so the two cannot disagree. */
const VERBS: ReadonlyMap<string, SolveVerb> = new Map(ROWS.map(([id, , , verb]) => [id, verb]));

/**
 * Which browse tiles offer each gadget, keyed by pursuit id.
 *
 * Opaque strings rather than a `PursuitId` import, for the same reason `CuratedResource.pursuits`
 * is: this package is held by the wall as data with no engine behind it, and pulling
 * `@gt100k/pursuits` in here would put the catalogue's prose into a bundle that does not need it.
 * `test/catalog.test.ts` checks the ids against the real catalogue, which a test can do freely.
 */
const PURSUITS: ReadonlyMap<string, readonly string[]> = new Map(
  ROWS.map(([id, , , , pursuits]) => [id, pursuits]),
);

/** The artifact for a gadget id, or undefined when the id is not one of ours. */
export function artifactFor(gadgetId: string): Artifact | undefined {
  return CATALOG.get(gadgetId);
}

/** The verb a solve on this gadget represents. See {@link SolveVerb}. */
export function solveVerbFor(gadgetId: string): SolveVerb | undefined {
  return VERBS.get(gadgetId);
}

/** The browse tiles that offer this gadget. Empty for an id that is not one of ours. */
export function pursuitsFor(gadgetId: string): readonly string[] {
  return PURSUITS.get(gadgetId) ?? [];
}
