// The browse prototype's data, drawn from the real taxonomy and the real curated library.
//
// Nothing here is mock content. The cabins are `CABINS`, the subtopics are `SEED_SUBTOPICS`, and the
// links are the 157 verified resources in `@gt100k/concierge`. A prototype fed on invented data
// answers a question nobody asked: it tells you the layout looks good with eight tidy words in it,
// and says nothing about the eight real ones or about the shelf that turns out to hold two links.
import { CABINS, SEED_SUBTOPICS, type CabinId } from "@gt100k/two-axis-tagging";
import {
  curatedForCell,
  SEED_LIBRARY,
  type AgeTier,
  type CuratedResource,
} from "@gt100k/concierge";
import { artifactFor } from "@gt100k/discovery-catalog";

/** `PROJECT.md` puts the target band at 9-12, so the shelf serves the two tiers that span it. */
export const AGE_TIERS: readonly AgeTier[] = ["9-11", "12-14"];

export interface Tile {
  readonly id: string;
  readonly label: string;
  /** One line, in words a nine-year-old reads without help. Never a pitch. */
  readonly blurb: string;
  readonly cabin: CabinId;
  /** Absent where no image has been made yet, and the tile falls back to its glyph. */
  readonly image?: string;
}

/**
 * Which tiles have art, and the rule the art follows.
 *
 * All twelve were generated from one prompt scaffold: the same flat-vector house style, the same
 * four-colour palette, the same charcoal ground, the same light from the upper left. That
 * uniformity is the measurement, not a style preference. Javora (2019) varied only the aesthetic
 * treatment of identical content and children aged 9-11 chose the prettier version 62% of the time
 * with no learning benefit; holding execution constant is what leaves subject preference as the
 * thing that differs.
 *
 * Each one depicts THE ACTIVITY BEING DONE — hands on the thing — rather than a wonder-shot of the
 * subject. A galaxy photograph would sell astronomy as passive awe when the work is patient
 * measurement in the cold, and a child pulled in by the photograph bounces off the reality. Hands
 * on a balance scale promises what the cabin actually contains.
 *
 * The residual risk is real and it is bounded: a picture can buy a first click that the topic has
 * not earned. It cannot buy a cross-day return, and the return is what the belief is built on.
 */
const IMAGES: Record<string, string> = {
  "math-puzzles": "/topics/topic-math-puzzles.webp",
  "code-computers": "/topics/topic-code-computers.webp",
  "games-strategy": "/topics/topic-games-strategy.webp",
  "making-engineering": "/topics/topic-making-engineering.webp",
  "art-motion": "/topics/topic-art-motion.webp",
  "music-sound": "/topics/topic-music-sound.webp",
  "science-nature": "/topics/topic-science-nature.webp",
  "influence-media": "/topics/topic-influence-media.webp",
  // Music & Sound is the one cabin whose subtopics are illustrated, as a prototype of what the
  // second level costs: four more images per cabin, thirty-one in total.
  "music-sound/audio-systems": "/topics/sub-audio-systems.webp",
  "music-sound/production": "/topics/sub-production.webp",
  "music-sound/instruments": "/topics/sub-instruments.webp",
  "music-sound/music-theory": "/topics/sub-music-theory.webp",
};

/**
 * Cabin names as a child would say them, and one line each on what you would actually be doing.
 *
 * The blurb is the load-bearing part. A tile that says only "Influence & Media" asks a child to
 * already know what that is, and the ones most likely to hide a real interest behind a word are
 * exactly the ones with the most abstract names.
 */
const CABIN_COPY: Record<CabinId, { label: string; blurb: string }> = {
  "math-puzzles": { label: "Puzzles & Numbers", blurb: "Work out the rule that makes it click." },
  "code-computers": { label: "Code & Computers", blurb: "Tell a machine exactly what to do." },
  "games-strategy": { label: "Games & Strategy", blurb: "Out-think the person across the board." },
  "making-engineering": {
    label: "Making & Building",
    blurb: "Build something that moves or lights up.",
  },
  "art-motion": { label: "Art & Animation", blurb: "Draw it, then make it move." },
  "music-sound": { label: "Music & Sound", blurb: "Find out why some sounds fit together." },
  "science-nature": { label: "Science & Nature", blurb: "Ask why, then go and check." },
  "influence-media": {
    label: "Words & Persuasion",
    blurb: "Change what someone thinks with a story.",
  },
};

/** Subtopic slugs are engineering names. These are the words on the tile. */
const SUBTOPIC_COPY: Record<string, { label: string; blurb: string }> = {
  "competition-math": { label: "Competition Maths", blurb: "Hard problems with elegant answers." },
  "logic-puzzles": { label: "Logic Puzzles", blurb: "Deduce it with no numbers at all." },
  foundations: { label: "How Maths Works", blurb: "Fractions, ratios and balance, properly." },
  statistics: { label: "Data & Chance", blurb: "What the numbers are really saying." },
  "game-dev": { label: "Making Games", blurb: "Build a game other people can play." },
  python: { label: "Python", blurb: "The language most people start with." },
  hardware: { label: "Hardware", blurb: "Computers you can open up and change." },
  "agentic-engineering": { label: "AI Agents", blurb: "Get an AI to do a job on its own." },
  chess: { label: "Chess", blurb: "The oldest deep game there is." },
  "odds-and-chance": { label: "Odds & Chance", blurb: "Decide well when you cannot be sure." },
  "board-games": { label: "Board Games", blurb: "Strategy you can hold in your hands." },
  robotics: { label: "Robotics", blurb: "Machines that sense and move." },
  electronics: { label: "Electronics", blurb: "Circuits, and what makes them work." },
  "3d-printing": { label: "3D Printing", blurb: "Design it, then hold it." },
  visual: { label: "Drawing & Design", blurb: "Make something people want to look at." },
  animation: { label: "Animation", blurb: "Twelve drawings a second, and it lives." },
  "video-editing": { label: "Video Editing", blurb: "Cut it so it feels the way you meant." },
  "3d-modeling": { label: "3D Modelling", blurb: "Sculpt things that do not exist." },
  "audio-systems": { label: "Sound Systems", blurb: "How sound gets from there to your ear." },
  production: { label: "Making Tracks", blurb: "Record it, layer it, mix it." },
  instruments: { label: "Instruments", blurb: "Play something with your hands." },
  "music-theory": { label: "How Music Works", blurb: "Why some notes belong together." },
  botany: { label: "Plants", blurb: "Living things that solve problems slowly." },
  physics: { label: "Physics", blurb: "The rules everything else obeys." },
  astronomy: { label: "Astronomy", blurb: "Look up, and work out what you are seeing." },
  marketing: { label: "Persuasion", blurb: "Why some messages land and others do not." },
  storytelling: { label: "Storytelling", blurb: "Hold someone's attention to the end." },
  psychology: { label: "Psychology", blurb: "Why people do what they do." },
  publishing: { label: "Publishing", blurb: "Get your words in front of readers." },
};

export const CABIN_TILES: readonly Tile[] = CABINS.map((c) => ({
  id: c,
  label: CABIN_COPY[c].label,
  blurb: CABIN_COPY[c].blurb,
  cabin: c,
  ...(IMAGES[c] ? { image: IMAGES[c] } : {}),
}));

export function subtopicTiles(cabin: CabinId): readonly Tile[] {
  return SEED_SUBTOPICS[cabin].map((s) => {
    const id = `${cabin}/${s}`;
    return {
      id,
      label: SUBTOPIC_COPY[s]?.label ?? s,
      blurb: SUBTOPIC_COPY[s]?.blurb ?? "",
      cabin,
      ...(IMAGES[id] ? { image: IMAGES[id] } : {}),
    };
  });
}

export function resourcesFor(cabin: CabinId, subtopic: string): readonly CuratedResource[] {
  return curatedForCell(SEED_LIBRARY, [cabin, subtopic], AGE_TIERS, 5);
}

/**
 * A deterministic shuffle, seeded once per session.
 *
 * RANDOM ORDER, NOT A RANDOM ROSTER, and the distinction is the whole design.
 *
 * Random *ordering* is strictly better than a fixed one for measurement. A fixed list bakes in
 * position bias forever: whatever sits first accumulates engagement and nothing can ever separate
 * "first" from "preferred". Randomising decorrelates the two, which is what makes the `position` we
 * log a usable variable rather than a constant.
 *
 * Random *membership* is a different thing and it is dangerous. Rotating fresh topics in every
 * session is the trigger-and-abandon pattern, and in a multi-session study (n = 212) children whose
 * interest was triggered and then not maintained finished BELOW children never triggered at all.
 * So the set is fixed; only the order moves. Which topics are on offer is a decision for
 * `@gt100k/surfacing`, which pays maintenance debts before it buys breadth.
 *
 * Seeded rather than `Math.random` so a session is stable across re-renders: a grid that reshuffles
 * under a child's hand as they reach for a tile is a different and much worse product.
 */
export function shuffled<T>(items: readonly T[], seed: number): readonly T[] {
  const out = [...items];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296; // numerical recipes LCG; adequate for a shuffle
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * A game reachable from a cell, named for a child.
 *
 * This is a COMPONENTS-FREE index on purpose. The playable component and its `supportsTier` flag
 * live in `runtime/gadgets/registry.ts`, which imports all fifteen puzzles (plus the audio engine,
 * motion and chess.js). If the wall imported that to decide *which cell has a game*, the entire game
 * bundle would join the wall's first load — the wall is the child's front door and must stay light.
 * So the door only needs an id and a label; `runtime/host` resolves the id to a component and mounts
 * it lazily when a child actually opens one (see `GameLauncher`).
 *
 * The registry is the source of truth for the roster. If a gadget is added there, add its id +
 * child-facing label here too — the build will not catch the omission, only a missing game will.
 */
export interface GameRef {
  readonly id: string;
  readonly label: string;
}

/**
 * The fifteen active gadgets, in registry order, labelled the way a child would read them. The
 * cell each one belongs to is NOT written here — it is read from the crosswalk (`artifactFor`), so
 * the taxonomy stays owned by `@gt100k/discovery-catalog` and this list only ever holds copy.
 */
const GAMES: readonly GameRef[] = [
  { id: "nonogram", label: "Nonogram" },
  { id: "mirror", label: "Mirror Maze" },
  { id: "pipes", label: "Pipes" },
  { id: "chess", label: "Chess" },
  { id: "balance-scale", label: "Balance Scale" },
  { id: "fraction-laser", label: "Fraction Laser" },
  { id: "function-machine", label: "Function Machine" },
  { id: "ratio-mixing", label: "Ratio Mixing" },
  { id: "gear-train", label: "Gear Train" },
  { id: "tune-repair", label: "Tune Repair" },
  { id: "chord-fit", label: "Chord Fit" },
  { id: "downbeat", label: "Downbeat" },
  { id: "sprite-loop", label: "Sprite Loop" },
  { id: "trace-repair", label: "Trace & Repair" },
  { id: "teach-helper", label: "Teach the Helper" },
];

/** Index built once from the crosswalk: `cabin` or `cabin/subtopic` → the games that live there. */
const GAMES_BY_CELL: ReadonlyMap<string, readonly GameRef[]> = (() => {
  const m = new Map<string, GameRef[]>();
  for (const g of GAMES) {
    const path = artifactFor(g.id)?.domainPath;
    if (!path) continue; // a gadget with no crosswalk row is simply unreachable, not an error here
    const key = path.join("/");
    const bucket = m.get(key);
    if (bucket) bucket.push(g);
    else m.set(key, [g]);
  }
  return m;
})();

/**
 * The game(s) a child can play at a cell — the generative act that sits beside the curated links.
 *
 * Called with a subtopic for the leaf view, and with the cabin alone for the cabin view (which is
 * where the one cabin-level gadget, `gear-train` under Making & Building, becomes reachable — the
 * only game that would otherwise have no door). Membership is fixed and returned in registry order;
 * this is inside an already-chosen subtopic, not a cross-topic choice moment, so it is not part of
 * the offered-set the wall randomises and logs.
 */
export function gamesForCell(cabin: CabinId, subtopic?: string): readonly GameRef[] {
  return GAMES_BY_CELL.get(subtopic ? `${cabin}/${subtopic}` : cabin) ?? [];
}
