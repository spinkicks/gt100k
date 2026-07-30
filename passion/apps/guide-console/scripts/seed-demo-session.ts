#!/usr/bin/env -S npx tsx
/**
 * Posts a scripted multi-day session for `local-demo` through the real ingest route.
 *
 * WHY THIS EXISTS. Playing the wall live produces exactly one `open`, and an open resolves to no
 * work-mode: it proves the child was there, not that they worked. So Demo Child lands in the console
 * reading "0 tracked" beside four synthetic children with two and three, which looks like the
 * ingest failed when in fact it is the engine being careful. A belief needs a child to DO something
 * — solve, assemble, fix — and a confident one needs voluntary returns across distinct days, which
 * no live demo can produce.
 *
 * WHAT IT IS AND IS NOT. This is a scripted stand-in for a week of play, not a seeded read. It goes
 * through `POST /api/ingest` exactly as the browser does, is subject to the same consent check, and
 * every record is shaped by the same rules the game obeys: real gadget ids from
 * `@gt100k/discovery-catalog`, the crosswalk's own solve verbs, `prompted: false` because nothing
 * nudged this child, and surfacings recorded for everything that was on screen rather than only for
 * what was chosen. The console then derives whatever it derives. Nothing here writes a hypothesis,
 * a belief, or a score — if the engine concludes nothing, the console shows nothing.
 *
 * Usage, after `pnpm --filter @gt100k/guide-console consent`:
 *
 *   pnpm --filter @gt100k/guide-console seed-demo [http://localhost:3020]
 */
import { solveVerbFor } from "@gt100k/discovery-catalog";

const ORIGIN = process.argv[2] ?? "http://localhost:3020";
const KID = "local-demo";

/**
 * The story, in the shape the engine reads it.
 *
 * A child who keeps coming back to rhythm and keeps trying chess, with one visit to something they
 * did not return to. Three distinct days because that is what `MIN_DISTINCT_DAYS` wants before it
 * will call anything confident, and the point of the demo is to show the gate passing honestly
 * rather than to hand the console a conclusion.
 *
 * `daysAgo` rather than fixed dates so the session is always recent whenever this is run — a
 * console showing a child last seen in March is a console nobody believes.
 */
const STORY: readonly { daysAgo: number; gadget: string; solves: number; harder?: boolean }[] = [
  // Day one: tries three things, finishes two.
  { daysAgo: 6, gadget: "downbeat", solves: 2 },
  { daysAgo: 6, gadget: "chess", solves: 1 },
  { daysAgo: 6, gadget: "nonogram", solves: 0 },
  // Day two: comes back to rhythm unprompted, and asks for a harder board.
  { daysAgo: 3, gadget: "downbeat", solves: 3, harder: true },
  { daysAgo: 3, gadget: "chord-fit", solves: 1 },
  // Day three: rhythm again, plus the chess it kept picking up.
  { daysAgo: 1, gadget: "downbeat", solves: 2 },
  { daysAgo: 1, gadget: "chess", solves: 2, harder: true },
];

/** Everything that was on screen on a given day, so a non-choice reads as a decline and not a gap. */
const OFFERED_EACH_DAY = [
  "downbeat",
  "chess",
  "nonogram",
  "chord-fit",
  "tune-repair",
  "mirror",
  "pipes",
  "balance-scale",
];

const at = (daysAgo: number, hour: number, minute = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const interactions: unknown[] = [];
const surfaced: unknown[] = [];

const days = [...new Set(STORY.map((s) => s.daysAgo))].sort((a, b) => b - a);
for (const daysAgo of days) {
  const sessionId = `demo-${daysAgo}`;
  OFFERED_EACH_DAY.forEach((artifactId, position) => {
    surfaced.push({ kidId: KID, artifactId, sessionId, timestamp: at(daysAgo, 16), position });
  });
}

let minute = 0;
/** Walks the clock forward so records within a day are ordered rather than simultaneous. */
const nextMinute = (step: number): number => {
  minute += step;
  return minute;
};

for (const beat of STORY) {
  const sessionId = `demo-${beat.daysAgo}`;
  const verb = solveVerbFor(beat.gadget);
  if (verb === undefined) throw new Error(`no crosswalk verb for ${beat.gadget}`);

  // The open, always. Without it a gadget the child tried and left reads to `deriveSkips` as a
  // decline, which would invert the sign of the very thing this session is meant to show.
  interactions.push({
    kidId: KID,
    artifactId: beat.gadget,
    actionType: "open",
    timestamp: at(beat.daysAgo, 16, nextMinute(3)),
    prompted: false,
    sessionId,
    dwellBucket: beat.solves === 0 ? "short" : "long",
  });

  for (let i = 0; i < beat.solves; i++) {
    interactions.push({
      kidId: KID,
      artifactId: beat.gadget,
      actionType: verb,
      timestamp: at(beat.daysAgo, 16, nextMinute(4)),
      prompted: false,
      sessionId,
      // `chosen_challenge` only on the boards where the child asked for a harder one. It is the
      // voluntary-difficulty depth signal and it is the one thing here that is not just presence.
      ...(beat.harder && i === beat.solves - 1 ? { depthSignals: ["chosen_challenge"] } : {}),
    });
  }
}

// Wrapped rather than top-level: this package is CommonJS, so `tsx` has no top-level await.
async function main(): Promise<void> {
  const res = await fetch(`${ORIGIN}/api/ingest`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify({ kidId: KID, interactions, surfaced }),
  });

  const text = await res.text();
  console.log(`${res.status} ${text}`);
  if (!res.ok) {
    console.error(
      '\nIf this is 403 with "no-record", run `pnpm --filter @gt100k/guide-console consent` first.',
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    `\nPosted ${interactions.length} interactions and ${surfaced.length} surfacings across ` +
      `${days.length} distinct days. Reload the console; Demo Child should now carry a read.`,
  );
}

void main();
