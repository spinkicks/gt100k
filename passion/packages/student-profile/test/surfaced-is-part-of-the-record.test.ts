/**
 * What was offered is half the log, and the profile only kept the other half.
 *
 * `StudentProfile.interactions` is documented as "the longitudinal source of truth", and inference
 * recomputes from it every cycle. But the surfaced records the pipeline needs alongside it lived on
 * `OrchestratorContext`, which is rebuilt per call and never persisted. Nothing in the repository
 * ever populated it, so in practice the orchestrator has derived every read with `surfaced: []`:
 * no skip and no decline has ever reached a profile.
 *
 * Two things break as soon as a real surface starts sending data.
 *
 * The disconfirming half of the model is simply absent, so a child who is offered five cabins and
 * takes one looks identical to a child offered only that one. Memo 06 §8.4 P2 is precisely the
 * argument that these are not the same child.
 *
 * And exposure history is what the novelty window is measured from. A cell first *seen* three weeks
 * ago and first *engaged* today is not novel, but with no surfacing history the engine can only
 * date it from the engagement. Persisting interactions while discarding surfacings does not lose
 * half the signal, it silently redates the other half.
 *
 * So `surfaced` becomes a second append-only log on the profile, and a cycle takes both together.
 * Pairing them in one argument is deliberate: the reason this bug existed is that the API let you
 * append one and forget the other.
 */
import type { Artifact } from "@gt100k/two-axis-tagging";
import type { Interaction, SurfacedRecord } from "@gt100k/signal-pipeline";
import { describe, expect, it } from "vitest";

import { emptyProfile } from "../src/model.js";
import { runCycle } from "../src/orchestrator.js";
import { currentRead } from "../src/gates.js";
import { createMemoryProfileStore } from "../src/store-port.js";

const art = (id: string, cabin: Artifact["domainPath"][0]): Artifact => ({
  id,
  domainPath: [cabin, "intro"],
  affordedModes: ["build"],
  kind: "gadget",
  source: "gold",
  origin: "seed",
  tagConfidence: 1,
  tagStatus: "TRUSTED",
});

const CATALOG = new Map<string, Artifact>([
  ["synth", art("synth", "music-sound")],
  ["loom", art("loom", "making-engineering")],
]);

const KID = "kid-1";
const day = (n: number): string => `2026-03-${String(n).padStart(2, "0")}T00:00:00.000Z`;
const NOW = day(28);

const engage = (artifactId: string, session: string, at: string): Interaction => ({
  kidId: KID,
  artifactId,
  actionType: "assemble",
  timestamp: at,
  prompted: false,
  sessionId: session,
});

const show = (artifactId: string, session: string, at: string): SurfacedRecord => ({
  kidId: KID,
  artifactId,
  sessionId: session,
  timestamp: at,
});

/** Both cabins on offer well before the sessions that matter, so nothing below is merely novel. */
const WARMUP = [show("synth", "s0", day(1)), show("loom", "s0", day(1))];

describe("a cycle records what was offered, not only what was taken", () => {
  it("declines the cabin the child was shown and passed over", () => {
    const after = runCycle(
      emptyProfile(KID, "Test"),
      {
        interactions: [engage("synth", "s1", day(20))],
        surfaced: [...WARMUP, show("synth", "s1", day(20)), show("loom", "s1", day(20))],
      },
      { catalog: CATALOG },
      NOW,
    );

    const read = currentRead(after, { catalog: CATALOG }, NOW);
    const loom = read.cells.find((c) => c.domainPath[0] === "making-engineering");
    expect(loom).toBeDefined();
    // Being passed over is weak evidence, but it has to be *some* evidence.
    expect(loom!.evidenceMass).toBeGreaterThan(0);

    // The control, and the reason this test is worth having: the same child with the same
    // engagement but no record of what else was on the screen. This is what every read this package
    // produced before the offer log existed, and the loom is not in it at all.
    const blind = runCycle(
      emptyProfile(KID, "Test"),
      { interactions: [engage("synth", "s1", day(20))], surfaced: [] },
      { catalog: CATALOG },
      NOW,
    );
    const blindRead = currentRead(blind, { catalog: CATALOG }, NOW);
    expect(blindRead.cells.find((c) => c.domainPath[0] === "making-engineering")).toBeUndefined();
  });

  it("keeps the offer history across a save and load, so it is not re-dated on reload", () => {
    const store = createMemoryProfileStore();
    const first = runCycle(
      emptyProfile(KID, "Test"),
      { interactions: [], surfaced: WARMUP },
      { catalog: CATALOG },
      day(2),
    );

    return store
      .save(first)
      .then(() => store.load(KID))
      .then((loaded) => {
        expect(loaded).not.toBeNull();
        expect(loaded!.surfaced).toHaveLength(WARMUP.length);

        // The second cycle sends only what is new, exactly as a live emitter would.
        const second = runCycle(
          loaded!,
          {
            interactions: [engage("synth", "s1", day(20))],
            surfaced: [show("synth", "s1", day(20)), show("loom", "s1", day(20))],
          },
          { catalog: CATALOG },
          NOW,
        );

        expect(second.surfaced).toHaveLength(WARMUP.length + 2);
        // Dated from the day-1 warmup rather than from the day-20 batch, so the loom is out of its
        // novelty window and can be declined. Lose the history and it reads as first sight.
        const read = currentRead(second, { catalog: CATALOG }, NOW);
        const loom = read.cells.find((c) => c.domainPath[0] === "making-engineering");
        expect(loom?.evidenceMass ?? 0).toBeGreaterThan(0);
      });
  });

  it("appends rather than replaces, so a replayed batch does not shorten the record", () => {
    const p1 = runCycle(
      emptyProfile(KID, "Test"),
      { interactions: [], surfaced: WARMUP },
      { catalog: CATALOG },
      day(2),
    );
    const p2 = runCycle(p1, { interactions: [], surfaced: [] }, { catalog: CATALOG }, day(3));

    expect(p2.surfaced).toHaveLength(WARMUP.length);
  });

  it("an empty cycle is still a no-op on the store (SC-2 holds with the new log)", () => {
    const p1 = runCycle(
      emptyProfile(KID, "Test"),
      {
        interactions: [engage("synth", "s1", day(20))],
        surfaced: [...WARMUP, show("loom", "s1", day(20))],
      },
      { catalog: CATALOG },
      NOW,
    );
    const p2 = runCycle(p1, { interactions: [], surfaced: [] }, { catalog: CATALOG }, NOW);

    expect(p2.store).toEqual(p1.store);
  });
});
