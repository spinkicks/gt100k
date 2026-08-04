/**
 * Can a real child's behaviour ever open the promotion gate?
 *
 * For most of this product's life the answer was no, and nothing said so. The gate wants three
 * things: a return after a quiet gap, returns spanning two months, and a perseverance reference.
 * The first two came from the timeline. The third was only ever written by pilot fixtures, so every
 * child who arrived through the ingest route carried an empty `perseveranceArtifacts` map forever
 * and the Promote button stayed disabled no matter how committed they were.
 *
 * This test drives the real orchestrator with nothing but interactions of the kind the apps
 * actually emit, and asserts the gate opens. If it ever fails, promotion has become unreachable
 * again and the whole pipeline past discovery is dead.
 */
import { describe, expect, it } from "vitest";

import { emptyProfile, runCycle } from "../src/index.js";
import { deriveGates } from "../src/gates.js";
import type { Artifact } from "@gt100k/two-axis-tagging";
import type { Interaction } from "@gt100k/signal-pipeline";

const GAME: Artifact = {
  id: "chess",
  domainPath: ["games-strategy", "chess"],
  affordedModes: ["investigate"],
  kind: "gadget",
  source: "gold",
  origin: "seed",
  tagConfidence: 1,
  tagStatus: "TRUSTED",
};
const catalog = new Map([[GAME.id, GAME]]);
const CELL = "games-strategy/chess::investigate";

const DAY = 86_400_000;
const START = Date.parse("2026-01-05T16:00:00.000Z");
const at = (day: number): string => new Date(START + day * DAY).toISOString();

/** A solve, as the wall emits one. `recovered` rides the depth signal chess now produces. */
const solve = (day: number, recovered = false): Interaction => ({
  kidId: "kid-real",
  artifactId: GAME.id,
  actionType: "inspect",
  timestamp: at(day),
  prompted: false,
  sessionId: `s-${day}`,
  ...(recovered ? { depthSignals: [{ kind: "failure_recovery", value: 1 }] } : {}),
});

describe("a child who keeps coming back can be promoted", () => {
  // Ten weeks of unprompted returns, with a three-week quiet stretch in the middle and one session
  // where the child got stuck and stayed with it. Nothing here is fixture data.
  const days = [0, 4, 9, 15, 22, 50, 57, 64, 71];
  const interactions = days.map((d) => solve(d, d === 22));

  const profile = runCycle(
    emptyProfile("kid-real", "A Real Child"),
    { interactions, surfaced: [] },
    { catalog },
    at(72),
  );

  it("earns a perseverance reference from the session it got hard", () => {
    expect(profile.perseveranceArtifacts[CELL]).toBeDefined();
    // The ref names the moment, so a guide can go and look rather than trust a boolean.
    expect(profile.perseveranceArtifacts[CELL]).toContain("recovery:");
  });

  it("opens all three legs of the gate", () => {
    const gate = deriveGates(profile, { catalog }, at(72)).get(`kid-real::${CELL}`);
    expect(gate).toBeDefined();
    expect(gate!.gapSurvived).toBe(true);
    expect(gate!.durable).toBe(true);
    expect(gate!.hasArtifact).toBe(true);
    expect(gate!.passed).toBe(true);
  });
});

describe("what still refuses to open it", () => {
  it("a child who never hit anything hard has no reference", () => {
    // Perseverance has to be earned. Ten easy weeks are durable, not persevering, and the gate is
    // asking about the second thing.
    const easy = [0, 4, 9, 15, 22, 50, 57, 64, 71].map((d) => solve(d));
    const p = runCycle(
      emptyProfile("kid-easy", "Never Stuck"),
      { interactions: easy, surfaced: [] },
      { catalog },
      at(72),
    );
    expect(p.perseveranceArtifacts[CELL]).toBeUndefined();
  });

  it("one hard afternoon is not two months", () => {
    const brief = [0, 1, 2].map((d) => solve(d, d === 1));
    const p = runCycle(
      emptyProfile("kid-brief", "One Week"),
      { interactions: brief, surfaced: [] },
      { catalog },
      at(3),
    );
    const gate = deriveGates(p, { catalog }, at(3)).get(`kid-brief::${CELL}`);
    expect(gate?.passed ?? false).toBe(false);
  });

  it("does not overwrite a reference a guide already attached", () => {
    // An automatic ref from a recovered puzzle is the weakest thing that can fill this slot. If a
    // richer one is already there, such as a defense record, it has to survive the next cycle.
    const held = emptyProfile("kid-held", "Has A Defense", [], { [CELL]: "defense-record-042" });
    const p = runCycle(held, { interactions: [solve(0, true)], surfaced: [] }, { catalog }, at(1));
    expect(p.perseveranceArtifacts[CELL]).toBe("defense-record-042");
  });
});
