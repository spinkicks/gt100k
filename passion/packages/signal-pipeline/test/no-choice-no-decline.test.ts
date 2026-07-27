/**
 * A decline is a statement about a choice. If the child made no choice, there is nothing to say.
 *
 * `deriveSkips` treated every surfaced cell a session did not engage as passed over, including in
 * sessions where the child engaged *nothing*. So a child who loaded the map, could not find a way
 * in, and left earned one disconfirming event against every cabin on screen. The interest model
 * then reads a sweep of negative evidence across the whole taxonomy and concludes the child is
 * interested in none of it, on the strength of a session that observed nothing at all.
 *
 * The bias is systematic rather than random, which is what makes it worth a rule of its own. The
 * sessions that produce these sweeps are exactly the sessions where the surface failed to be
 * findable, and findability varies by cabin art, not by interest. So the error correlates with how
 * hard a cabin is to see. Memo 07 §4 D9 reaches the same conclusion from the child-UX side: a
 * six-year-old who cannot locate a hotspot is recorded as having rejected the topic, which makes
 * every visual-search finding in that memo a sign-inversion risk in this package.
 *
 * What licensed the choice set in the first place was narrower than what was built on it. Memo 06
 * §8.4 P2 argues that "a return to the only available cabin is not a preference" and that choice is
 * only interpretable against the alternatives, which justifies `choiceSetSize` as the normaliser of
 * a *positive* signal. Emitting a negative event per unchosen cell is a further step, and it is the
 * step that needs a choice to have occurred.
 *
 * This does not fix the residual case: a child who engages A while never perceiving B still
 * declines B. That one cannot be settled from inside the engine, because rendering and perceiving
 * are indistinguishable here. It needs the attention data memo 07 D9 proposes to emit.
 */
import type { Artifact } from "@gt100k/two-axis-tagging";
import { describe, expect, it } from "vitest";

import type { Interaction, SurfacedRecord } from "../src/model.js";
import { deriveSignals } from "../src/pipeline.js";

const base: Omit<Artifact, "id" | "domainPath"> = {
  affordedModes: ["investigate"],
  kind: "gadget",
  source: "gold",
  origin: "seed",
  tagConfidence: 1,
  tagStatus: "TRUSTED",
};

const CABINS = ["math-puzzles", "code-computers", "art-motion", "making-engineering"] as const;
const CATALOG = new Map<string, Artifact>(
  CABINS.map((c) => [c, { ...base, id: c, domainPath: [c, "intro"] } as Artifact]),
);

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

/** Everything on offer, on one day, in one session. */
const allOf = (session: string, at: string): SurfacedRecord[] =>
  CABINS.map((c) => surfaced(c, session, at));

/** Past the 3-day novelty window, so nothing below is excluded merely for being new. */
const WARMUP: readonly SurfacedRecord[] = allOf("s0", day(1));

const run = (interactions: readonly Interaction[], surfacedRecords: readonly SurfacedRecord[]) =>
  deriveSignals({ interactions, surfaced: surfacedRecords, catalog: CATALOG });

const against = (out: ReturnType<typeof run>) =>
  out.cellEvents.filter((e) => e.kind === "skip" || e.kind === "decline");

describe("a session in which the child chose nothing", () => {
  it("produces no disconfirming evidence, though everything was on screen", () => {
    const out = run([], [...WARMUP, ...allOf("s9", day(20))]);

    expect(against(out)).toEqual([]);
  });

  it("does not scale its damage with how much was on offer", () => {
    // The pathology was proportional to the size of the catalogue: the more the surface showed, the
    // more the child was recorded as rejecting. A browse-style surface makes that far worse than a
    // room with four doors, so the fix has to hold as the offer set grows.
    const many = Array.from({ length: 40 }, (_, i) => `extra-${i}`);
    const bigCatalog = new Map(CATALOG);
    for (const id of many) bigCatalog.set(id, { ...base, id, domainPath: [id, "intro"] } as Artifact);
    const show = (session: string, at: string): SurfacedRecord[] =>
      [...CABINS, ...many].map((c) => surfaced(c, session, at));

    const out = deriveSignals({
      interactions: [],
      surfaced: [...show("s0", day(1)), ...show("s9", day(20))],
      catalog: bigCatalog,
    });

    expect(against(out)).toEqual([]);
  });
});

describe("but a session in which the child did choose still speaks", () => {
  it("declines the alternatives that lost to something the child took", () => {
    const out = run(
      [acted("math-puzzles", "s9", day(20))],
      [...WARMUP, ...allOf("s9", day(20))],
    );

    const declined = against(out).map((e) => e.domainPath[0]).sort();
    expect(declined).toEqual(["art-motion", "code-computers", "making-engineering"]);
  });

  it("still normalises those declines by the size of the choice they lost", () => {
    const out = run(
      [acted("math-puzzles", "s9", day(20))],
      [...WARMUP, ...allOf("s9", day(20))],
    );

    for (const e of against(out)) expect(e.choiceSetSize).toBe(3);
  });

  it("counts an open as choosing, so presence alone re-enables the signal", () => {
    // An open resolves to no work-mode and so builds no event, but it is still proof the child was
    // there and acting. The rule keys on whether a choice happened, not on whether it was scoreable.
    const out = run(
      [
        {
          kidId: KID,
          artifactId: "math-puzzles",
          actionType: "open",
          timestamp: day(20),
          prompted: false,
          sessionId: "s9",
          dwellBucket: "short",
        },
      ],
      [...WARMUP, ...allOf("s9", day(20))],
    );

    expect(against(out).map((e) => e.domainPath[0]).sort()).toEqual([
      "art-motion",
      "code-computers",
      "making-engineering",
    ]);
  });
});
