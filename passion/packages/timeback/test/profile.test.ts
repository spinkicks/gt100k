// SC-6: `withPriors` sets priors immutably (original unchanged; updatedAt bumped to the snapshot asOf);
// a subsequent `runCycle` runs unchanged and — per SC-3 — its outcomes match the no-prior run (a prior
// never manufactures a hypothesis: empty log + any priors ⇒ empty store either way).
import { describe, expect, it } from "vitest";
import type { OrchestratorContext } from "@gt100k/student-profile";
import { emptyProfile, runCycle } from "@gt100k/student-profile";
import { toDomainPriors, withPriors } from "../src/index.js";
import { GOLDEN_SNAPSHOT } from "../src/__fixtures__/snapshots.js";

describe("withPriors (SC-6)", () => {
  const priors = toDomainPriors(GOLDEN_SNAPSHOT);

  it("sets priors immutably + bumps updatedAt to the snapshot asOf; original untouched", () => {
    const p = emptyProfile("k", "K");
    const p2 = withPriors(p, priors, GOLDEN_SNAPSHOT.asOf);

    expect(p2).not.toBe(p);
    expect(p2.priors).toEqual(priors);
    expect(p2.priors.length).toBeGreaterThan(0);
    expect(p2.updatedAt).toBe(GOLDEN_SNAPSHOT.asOf); // bumped

    // original profile is unchanged (immutable)
    expect(p.priors).toHaveLength(0);
    expect(p.updatedAt).toBe("1970-01-01T00:00:00.000Z");

    // every other field is preserved by reference (pure spread)
    expect(p2.kidId).toBe("k");
    expect(p2.displayName).toBe("K");
    expect(p2.interactions).toBe(p.interactions);
    expect(p2.store).toBe(p.store);
    expect(p2.perseveranceArtifacts).toBe(p.perseveranceArtifacts);
  });

  it("leaves runCycle unchanged: with-priors outcomes match the no-prior run (SC-3 no-gate)", () => {
    const now = "2026-04-01T00:00:00.000Z";
    const ctx: OrchestratorContext = { catalog: new Map() };

    const withP = runCycle(
      withPriors(emptyProfile("k", "K"), priors, GOLDEN_SNAPSHOT.asOf),
      [],
      ctx,
      now,
    );
    const without = runCycle(emptyProfile("k", "K"), [], ctx, now);

    // empty log + any priors ⇒ empty store either way (the prior never gates)
    expect(Object.keys(withP.store.byId)).toHaveLength(0);
    expect(withP.store).toEqual(without.store);
  });
});
