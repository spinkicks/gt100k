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

/** `PROJECT.md` puts the target band at 9-12, so the shelf serves the two tiers that span it. */
export const AGE_TIERS: readonly AgeTier[] = ["9-11", "12-14"];

export interface Tile {
  readonly id: string;
  readonly label: string;
  /** One line, in words a nine-year-old reads without help. Never a pitch. */
  readonly blurb: string;
  readonly cabin: CabinId;
}

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
}));

export function subtopicTiles(cabin: CabinId): readonly Tile[] {
  return SEED_SUBTOPICS[cabin].map((s) => ({
    id: `${cabin}/${s}`,
    label: SUBTOPIC_COPY[s]?.label ?? s,
    blurb: SUBTOPIC_COPY[s]?.blurb ?? "",
    cabin,
  }));
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
