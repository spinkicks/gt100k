/**
 * Opening a thing is not the same as passing it over, and until now the pipeline could not tell the
 * difference.
 *
 * An interaction whose `actionType` resolves to no work-mode emits no event, which is correct: mode
 * is a nuisance covariate the engine models only to keep the topic read clean, and inferring one
 * from mere presence injects noise into the term that exists to absorb it. But `deriveSkips` built
 * its engaged-this-session set purely from RESOLVED events, and treats a surfaced cell absent from
 * that set as passed over. So a child who opened something and did nothing else earned a full
 * `B_SKIP` decrement against the cell they had just chosen to look at.
 *
 * That is the same sign inversion `dwellBucket` was introduced to prevent (see the note on
 * `Interaction.dwellBucket`), arriving by a different door: there, a sub-floor open was dropped and
 * left "surfaced, never engaged"; here, an unresolvable one is.
 *
 * This matters more, not less, as the child-facing surface changes. A browse-style surface puts far
 * more on offer per session than a room with a handful of gadgets, so the not-chosen set is large
 * and the cost of misclassifying the one thing the child actually touched is proportionally higher.
 */
import type { Artifact } from "@gt100k/two-axis-tagging";
import { describe, expect, it } from "vitest";

import type { Interaction, SurfacedRecord } from "../src/model.js";
import { deriveSignals } from "../src/pipeline.js";

const NONOGRAM: Artifact = {
  id: "nonogram",
  domainPath: ["math-puzzles", "logic-puzzles"],
  affordedModes: ["investigate"],
  kind: "gadget",
  source: "gold",
  origin: "seed",
  tagConfidence: 1,
  tagStatus: "TRUSTED",
};

const PIPES: Artifact = {
  ...NONOGRAM,
  id: "pipes",
  affordedModes: ["build", "investigate"],
};

/** A different cabin entirely, so engaging it cannot cover nonogram's cell by sharing its path. */
const SPRITE: Artifact = {
  ...NONOGRAM,
  id: "sprite",
  domainPath: ["art-motion", "animation"],
};

const CATALOG = new Map<string, Artifact>([
  [NONOGRAM.id, NONOGRAM],
  [PIPES.id, PIPES],
  [SPRITE.id, SPRITE],
]);

const KID = "kid-1";
const day = (n: number): string => `2026-07-${String(n).padStart(2, "0")}T00:00:00.000Z`;

const surfaced = (artifactId: string, session: string, at: string): SurfacedRecord => ({
  kidId: KID,
  artifactId,
  sessionId: session,
  timestamp: at,
});

const acted = (artifactId: string, session: string, at: string): Interaction => ({
  kidId: KID,
  artifactId,
  actionType: "inspect",
  timestamp: at,
  prompted: false,
  sessionId: session,
});

const opened = (artifactId: string, session: string, at: string): Interaction => ({
  kidId: KID,
  artifactId,
  actionType: "open",
  timestamp: at,
  prompted: false,
  sessionId: session,
  dwellBucket: "short",
});

const run = (interactions: readonly Interaction[], surfacedRecords: readonly SurfacedRecord[]) =>
  deriveSignals({ interactions, surfaced: surfacedRecords, catalog: CATALOG });

/** Past the 3-day novelty window, so nothing below is excluded for being new. */
const WARMUP: readonly SurfacedRecord[] = [
  surfaced("nonogram", "s0", day(1)),
  surfaced("pipes", "s0", day(1)),
];

describe("an open is presence, not rejection", () => {
  it("does not turn the thing the child opened into a skip", () => {
    const out = run(
      [acted("nonogram", "s1", day(2)), opened("nonogram", "s9", day(20))],
      [...WARMUP, surfaced("nonogram", "s9", day(20))],
    );

    const against = out.cellEvents.filter((e) => e.kind === "skip" || e.kind === "decline");
    expect(against).toEqual([]);
  });

  it("does not turn a never-engaged thing the child opened into a decline", () => {
    const out = run(
      [opened("pipes", "s9", day(20))],
      [...WARMUP, surfaced("pipes", "s9", day(20))],
    );

    expect(out.cellEvents.filter((e) => e.kind === "decline")).toEqual([]);
  });

  it("covers every cell the opened artifact affords, not just the first", () => {
    // Pipes affords build AND investigate. Marking only one would leave the other reading as
    // passed over, which is the same bug one mode along.
    const out = run(
      [opened("pipes", "s9", day(20))],
      [...WARMUP, surfaced("pipes", "s9", day(20))],
    );

    expect(out.cellEvents.filter((e) => e.kind === "skip" || e.kind === "decline")).toEqual([]);
  });
});

describe("but it has not blunted the disconfirming signal wholesale", () => {
  it("something surfaced and genuinely untouched is still declined", () => {
    const out = run(
      [opened("nonogram", "s9", day(20))],
      [...WARMUP, surfaced("nonogram", "s9", day(20)), surfaced("pipes", "s9", day(20))],
    );

    const declined = out.cellEvents.filter((e) => e.kind === "decline");
    expect(declined.length).toBeGreaterThan(0);
    // Pipes was passed over; nonogram was opened, so only pipes' cells appear.
    for (const e of declined) expect(e.domainPath).toEqual(["math-puzzles", "logic-puzzles"]);
    expect(declined.every((e) => e.mode === "build" || e.mode === "investigate")).toBe(true);
  });

  // A test asserting the opposite of this used to live here: "a session where the child opened
  // nothing still declines everything offered". It was guarding against over-suppression, and it
  // was wrong. A session with no engagement is not a session that rejected the offer, and its
  // decrement lands on whatever the system chose to surface, which penalises exposure rather than
  // measuring interest. See `no-choice-no-decline.test.ts` for the argument and the replacement.

  it("an open in one session does not excuse a pass-over in another", () => {
    // Presence is session-scoped, exactly as engagement is. s10 needs a choice of its own for the
    // pass-over to be readable at all, so the child engages sprite there; the question is whether
    // the s9 open leaks across and protects nonogram in s10. Sprite is in another cabin on purpose,
    // or engaging it would cover nonogram's cell by sharing a domain path and the test would pass
    // without testing anything.
    const out = run(
      [opened("nonogram", "s9", day(20)), acted("sprite", "s10", day(21))],
      [
        ...WARMUP,
        surfaced("nonogram", "s9", day(20)),
        surfaced("nonogram", "s10", day(21)),
        surfaced("sprite", "s10", day(21)),
      ],
    );

    const against = out.cellEvents.filter((e) => e.kind === "skip" || e.kind === "decline");
    expect(against.map((e) => e.domainPath)).toEqual([["math-puzzles", "logic-puzzles"]]);
    expect(against[0]?.timestamp).toBe(day(21));
  });
});

describe("the drop record says which of the two things happened", () => {
  it("an open is dropped as no-work-mode, not as unresolved-action", () => {
    // The distinction a reader of `dropped` needs: "this is presence, by design" versus "we could
    // not resolve this, which may be a bug". Collapsing them hides real emitter faults in a pile of
    // expected noise.
    const out = run([opened("nonogram", "s9", day(20))], [...WARMUP]);

    expect(out.dropped.map((d) => d.reason)).toEqual(["no-work-mode"]);
  });

  it("a genuinely unresolvable action is still unresolved-action", () => {
    const nonsense: Interaction = { ...opened("nonogram", "s9", day(20)), actionType: "wibble" };
    const out = run([nonsense], [...WARMUP]);

    expect(out.dropped.map((d) => d.reason)).toEqual(["unresolved-action"]);
  });

  it("an open on an artifact we do not know is still unknown-artifact", () => {
    // Presence in something unmapped tells us nothing and must not be silently forgiven.
    const out = run([opened("ghost", "s9", day(20))], [...WARMUP]);

    expect(out.dropped.map((d) => d.reason)).toEqual(["unknown-artifact"]);
  });
});
