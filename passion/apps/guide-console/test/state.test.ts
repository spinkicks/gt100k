/**
 * CI test for the guide-console's PURE surface (SC-7 groundwork).
 *
 * The served DOM + the live `window.__qa` contract are verified by the `LOOP_QA` usability gate
 * (spec §9). Here — headless, no jsdom, no network — we pin the pure wiring the page renders and the
 * harness reads: the seeded store, the console view-model, `buildQaState`, the seeded gates, and the
 * primary action (promote the top gate-passed candidate) actually moving `state()`.
 */
import {
  applyGuidePrimaryAction,
  buildQaState,
  topPromotableId,
} from "../app/console-state.js";
import {
  ARTIFACT_REF,
  SEED_KID,
  SEED_NOW,
  SEED_TOP_ID,
  buildSeedGates,
  buildSeedStore,
} from "../app/seed.js";
import { consoleViewModel, getForKid } from "@gt100k/hypothesis-store";
import { describe, expect, it } from "vitest";

describe("guide-console seed", () => {
  it("seeds one confident candidate (→ EMERGING) + one thin cell (→ EXPLORING)", () => {
    const store = buildSeedStore();
    const cards = getForKid(store, SEED_KID);
    expect(cards).toHaveLength(2);
    // Ranked by lowerBound desc: music (0.7, confident) then movement (0.24, thin).
    expect(cards.map((h) => h.state)).toEqual(["EMERGING", "EXPLORING"]);
    expect(cards[0]!.id).toBe(SEED_TOP_ID);
    expect(cards[0]!.perseveranceArtifactRef).toBe(ARTIFACT_REF);
  });

  it("view-model separates supporting/disconfirming and exposes coverage gaps (no scalar score)", () => {
    const vm = consoleViewModel(buildSeedStore(), SEED_KID, buildSeedGates(buildSeedStore()));
    expect(vm.cards.map((c) => c.cellKey)).toEqual([
      "music-sound/audio-systems::build",
      "movement-body/dance::perform",
    ]);
    const top = vm.cards[0]!;
    expect(top.supporting).toEqual(["voluntary_return", "depth_climb"]);
    expect(top.disconfirming).toEqual([]);
    const thin = vm.cards[1]!;
    expect(thin.supporting).toEqual(["prompted_return"]);
    expect(thin.disconfirming).toEqual(["skip"]);
    expect(vm.coverageGaps).toEqual(["movement-body::build", "music-sound::perform"]);
    // No scalar passion score anywhere on a card.
    expect(Object.keys(top)).not.toContain("score");
  });
});

describe("buildQaState", () => {
  it("reports selectedId, count, and ranked states", () => {
    const store = buildSeedStore();
    expect(buildQaState(store, SEED_KID, SEED_TOP_ID)).toEqual({
      selectedId: SEED_TOP_ID,
      count: 2,
      states: ["EMERGING", "EXPLORING"],
    });
  });
});

describe("seeded gates + primary action", () => {
  it("the confident cell's gate passes; the thin cell's does not", () => {
    const store = buildSeedStore();
    const gates = buildSeedGates(store);
    expect(gates.get(SEED_TOP_ID)).toEqual({
      gapSurvived: true,
      durable: true,
      hasArtifact: true,
      passed: true,
    });
    const thinId = getForKid(store, SEED_KID)[1]!.id;
    expect(gates.get(thinId)!.passed).toBe(false);
  });

  it("topPromotableId is the top gate-passed EMERGING candidate", () => {
    const store = buildSeedStore();
    expect(topPromotableId(store, SEED_KID, buildSeedGates(store))).toBe(SEED_TOP_ID);
  });

  it("the primary action promotes the top candidate → state() changes (SC-7)", () => {
    const store = buildSeedStore();
    const gates = buildSeedGates(store);
    const before = buildQaState(store, SEED_KID, SEED_TOP_ID);
    const next = applyGuidePrimaryAction(store, SEED_KID, gates, SEED_NOW);
    expect(next).not.toBeNull();
    const after = buildQaState(next!, SEED_KID, SEED_TOP_ID);
    expect(before.states).toEqual(["EMERGING", "EXPLORING"]);
    expect(after.states).toEqual(["CANDIDATE", "EXPLORING"]); // top promoted, thin untouched
    // Immutable: the original store is unchanged.
    expect(buildQaState(store, SEED_KID, SEED_TOP_ID).states).toEqual(["EMERGING", "EXPLORING"]);
  });

  it("primary action is a no-op (null) when no gate-passed candidate exists", () => {
    // A store with only the thin cell has no gate-passed candidate → dead primary action returns null.
    const store = buildSeedStore();
    const emptyGates = new Map(); // no gate passes
    expect(applyGuidePrimaryAction(store, SEED_KID, emptyGates, SEED_NOW)).toBeNull();
  });
});
