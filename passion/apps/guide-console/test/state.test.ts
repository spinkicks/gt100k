/**
 * CI test for the guide-console's PURE surface (SC-7 groundwork).
 *
 * The served DOM + the live `window.__qa` contract are verified by the `LOOP_QA` usability gate
 * (spec §9). Here — headless, no jsdom, no network — we pin the pure wiring the page renders and the
 * harness reads, now that the roster is GENUINELY DERIVED by the orchestrator (`buildPilotRoster`
 * runs the real 012 → 011 → 013 chain over synthetic interaction logs) rather than a hand-built
 * `InterestRead`: the derived store, the console view-model, `buildQaState`, the derived gates, and
 * the primary action (promote the top gate-passed candidate) actually moving `state()`.
 */
import { applyGuidePrimaryAction, buildQaState, topPromotableId } from "../app/console-state.js";
import { children, ROSTER_NOW, buildRosterGates, buildRosterStore } from "../app/console-data.js";
import { escalationCount, wellbeingForKid } from "../app/wellbeing.js";
import { serializeCellKey } from "@gt100k/interest-inference";
import { consoleViewModel, getForKid } from "@gt100k/hypothesis-store";
import { describe, expect, it } from "vitest";

// Ari (kid-synthetic-001) is the canonical window.__qa kid; his confident cell keeps the same
// derived id as the old hand-built seed (the build cellKey is unchanged), so the __qa contract and
// SEED_KID are preserved — only the DATA SOURCE changed.
const ARI = "kid-synthetic-001";
const ARI_BUILD_KEY = serializeCellKey(["music-sound", "audio-systems"], "build");
const ARI_TOP_ID = `${ARI}::${ARI_BUILD_KEY}`;

describe("guide-console derived roster", () => {
  it("renders the five canonical synthetic kids, Ari first (the window.__qa kid)", () => {
    expect(children().map((c) => c.id)).toEqual([
      "kid-synthetic-001",
      "kid-synthetic-002",
      "kid-synthetic-003",
      "kid-synthetic-004",
      "kid-synthetic-005",
    ]);
    expect(children()[0]).toEqual({ id: ARI, name: "Ari Mercado" });
    expect(ROSTER_NOW).toBe("2026-04-01T00:00:00.000Z");
  });

  it("derives one confident candidate (→ EMERGING) + one thin cell (→ EXPLORING) for Ari", () => {
    const cards = getForKid(buildRosterStore(), ARI);
    expect(cards).toHaveLength(2);
    // Ranked by lowerBound desc: audio-systems (confident) then dance (thin).
    expect(cards.map((h) => h.state)).toEqual(["EMERGING", "EXPLORING"]);
    expect(cards[0]!.id).toBe(ARI_TOP_ID);
    expect(cards[0]!.evidence.confident).toBe(true);
    expect(cards[0]!.evidence.lowerBound).toBeGreaterThanOrEqual(0.6);
    // Synthetic perseverance artifact attached in runCycle step 5 (never fabricated by 013).
    expect(cards[0]!.perseveranceArtifactRef).toBe("defense-record-042");
  });

  it("view-model separates supporting/disconfirming and exposes coverage gaps (no scalar score)", () => {
    const store = buildRosterStore();
    const vm = consoleViewModel(store, ARI, buildRosterGates(store));
    expect(vm.cards.map((c) => c.cellKey)).toEqual([
      "music-sound/audio-systems::build",
      "art-motion/dance::perform",
    ]);
    const top = vm.cards[0]!;
    // artifact_competence is deliberately absent (E11). It is a work-quality judgement, so it no
    // longer moves the interest belief, and a reason that moved no belief must not be shown to a
    // guide as one. It is still emitted and still read by the planner's producerIdentity.
    expect(top.supporting).toEqual(["cross_day_return"]);
    expect(top.supporting).not.toContain("artifact_competence");
    expect(top.disconfirming).toEqual([]);
    const thin = vm.cards[1]!;
    expect(thin.supporting).toEqual([]);
    expect(thin.disconfirming).toEqual(["prompted_return:1"]);
    expect(vm.coverageGaps).toEqual(["art-motion::build", "music-sound::perform"]);
    // No scalar passion score anywhere on a card.
    expect(Object.keys(top)).not.toContain("score");
  });
});

describe("buildQaState", () => {
  it("reports selectedId, count, ranked states, and the wellbeing escalation count", () => {
    expect(buildQaState(buildRosterStore(), ARI, ARI_TOP_ID)).toEqual({
      selectedId: ARI_TOP_ID,
      count: 2,
      states: ["EMERGING", "EXPLORING"],
      escalations: 0, // additive field; defaults to 0 for existing callers
    });
  });

  it("passes through a live wellbeing escalation count when supplied", () => {
    expect(buildQaState(buildRosterStore(), ARI, ARI_TOP_ID, 3).escalations).toBe(3);
  });
});

describe("derived gates + primary action", () => {
  it("Ari's confident cell's gate passes (derived from the log); the thin cell's does not", () => {
    const store = buildRosterStore();
    const gates = buildRosterGates(store);
    expect(gates.get(ARI_TOP_ID)).toEqual({
      gapSurvived: true,
      durable: true,
      hasArtifact: true,
      passed: true,
    });
    const thinId = getForKid(store, ARI)[1]!.id;
    expect(gates.get(thinId)!.passed).toBe(false);
  });

  it("topPromotableId is the top gate-passed EMERGING candidate", () => {
    const store = buildRosterStore();
    expect(topPromotableId(store, ARI, buildRosterGates(store))).toBe(ARI_TOP_ID);
  });

  it("the primary action promotes the top candidate → state() changes (SC-7)", () => {
    const store = buildRosterStore();
    const gates = buildRosterGates(store);
    const before = buildQaState(store, ARI, ARI_TOP_ID);
    const next = applyGuidePrimaryAction(store, ARI, gates, ROSTER_NOW);
    expect(next).not.toBeNull();
    const after = buildQaState(next!, ARI, ARI_TOP_ID);
    expect(before.states).toEqual(["EMERGING", "EXPLORING"]);
    expect(after.states).toEqual(["CANDIDATE", "EXPLORING"]); // top promoted, thin untouched
    // Immutable: the original store is unchanged.
    expect(buildQaState(store, ARI, ARI_TOP_ID).states).toEqual(["EMERGING", "EXPLORING"]);
  });

  it("primary action is a no-op (null) when no gate-passed candidate exists", () => {
    const store = buildRosterStore();
    const emptyGates = new Map(); // no gate passes
    expect(applyGuidePrimaryAction(store, ARI, emptyGates, ROSTER_NOW)).toBeNull();
  });
});

describe("wellbeing panel data (016) — system proposes, human disposes", () => {
  it("holds the pressure half for a child still sampling (discovery-phase spikes never escalate)", () => {
    const cards = wellbeingForKid(ARI);
    expect(cards).toHaveLength(2);
    // Both of Ari's spikes are pre-specialization (audio EMERGING, dance EXPLORING). His dance cell
    // has gone quiet, which for an ACTIVE pursuit would be a GAP escalation — but you can't burn out
    // on what you're only sampling, so the pressure half is held and only challenge calibration can
    // surface. Neither spike routes a review to a human, and each read shows the gate was applied.
    const PRESSURE_STATES = ["BURNOUT_TIP", "EARLY_BURNOUT", "GAP", "DANGER_WINDOW"];
    for (const c of cards) {
      expect(c.read.escalateToHuman).toBe(false);
      expect(PRESSURE_STATES).not.toContain(c.read.state);
      expect(c.read.guardrailNotes.some((n) => n.includes("discovery"))).toBe(true);
      // Every read carries the two-knob recommendation and never a child-facing label/score.
      expect(["PUSH", "HOLD", "SCAFFOLD"]).toContain(c.read.challenge);
      expect(["AUTONOMY_UP", "STEADY"]).toContain(c.read.pressure);
      for (const key of Object.keys(c.read)) {
        expect(key.toLowerCase()).not.toContain("score");
      }
    }
  });

  it("discovery-phase children raise no escalations (Ari 0, Bex 0)", () => {
    // Ari and Bex are both pre-specialization, so the pressure half is held for every spike and
    // nothing routes to a human. A quiet sampling cell is exploration, not burnout.
    expect(escalationCount(ARI)).toBe(0);
    expect(escalationCount("kid-synthetic-002")).toBe(0);
  });

  it("an ACTIVE specialization gone quiet DOES escalate (Elle) — the recovery surface's live trigger", () => {
    // The mirror image of the discovery children above: Elle's music-sound/production spike was
    // promoted to ACTIVE when she was thriving and has since gone prompted-only (devaluation). Because
    // it is an active pursuit, the pressure half is LIVE, so it reads BURNOUT_TIP and routes a review
    // to a human — the realistic trigger the #282 recovery surface needs to demo against. No held-gate
    // note here: this is exactly the case the phase gate is meant to let through.
    const elle = wellbeingForKid("kid-synthetic-005");
    const prod = elle.find((c) => c.read.state === "BURNOUT_TIP");
    expect(prod).toBeDefined();
    expect(prod!.read.escalateToHuman).toBe(true);
    expect(prod!.read.guardrailNotes.some((n) => n.includes("discovery"))).toBe(false);
    expect(escalationCount("kid-synthetic-005")).toBeGreaterThanOrEqual(1);
  });

  it("a healthy confident spike is IN_ZONE / HOLD (push only from strength: no PUSH without instrumented success)", () => {
    const ari = wellbeingForKid(ARI);
    const audio = ari.find((c) => c.cellKey === ARI_BUILD_KEY);
    expect(audio).toBeDefined();
    expect(audio!.read.state).toBe("IN_ZONE");
    expect(audio!.read.challenge).toBe("HOLD");
    expect(audio!.read.escalateToHuman).toBe(false);
  });
});
