import { describe, it, expect } from "vitest";
import { emptyStore, applyInterestRead, getForKid } from "../src/store.js";
import { consoleViewModel } from "../src/view.js";
import { park } from "../src/actions.js";
import type { GateStatus } from "../src/gate.js";
import type { HumanActor } from "../src/model.js";
import type { InterestRead } from "@gt100k/interest-inference";

const NOW = "2026-02-01T00:00:00.000Z";
const human: HumanActor = { id: "guide-1", role: "guide" };

const read: InterestRead = {
  cells: [
    {
      cellKey: "music-sound/audio-systems::build",
      domainPath: ["music-sound", "audio-systems"],
      mode: "build",
      alpha: 5,
      beta: 1.5,
      mean: 0.77,
      sd: 0.14,
      lowerBound: 0.7,
      evidenceMass: 4.5,
      confident: true,
      attribution: "style",
      supporting: ["voluntary_return", "unrequired_revision"],
      disconfirming: [],
    },
    {
      cellKey: "movement-body/dance::perform",
      domainPath: ["movement-body", "dance"],
      mode: "perform",
      alpha: 1.2,
      beta: 1,
      mean: 0.5,
      sd: 0.2,
      lowerBound: 0.3,
      evidenceMass: 0.5,
      confident: false,
      attribution: null,
      supporting: ["voluntary_return"],
      disconfirming: ["skip"],
    },
  ],
  candidates: [
    {
      cellKey: "music-sound/audio-systems::build",
      domainPath: ["music-sound", "audio-systems"],
      mode: "build",
      lowerBound: 0.7,
      attribution: "style",
    },
  ],
};

describe("consoleViewModel", () => {
  it("returns cards ranked by lowerBound with supporting/disconfirming separate", () => {
    const s = applyInterestRead(emptyStore(), "kid-1", read, NOW);
    const vm = consoleViewModel(s, "kid-1");
    expect(vm.kidId).toBe("kid-1");
    expect(vm.cards.map((c) => c.cellKey)).toEqual([
      "music-sound/audio-systems::build",
      "movement-body/dance::perform",
    ]);
    const top = vm.cards[0]!;
    expect(top.state).toBe("EMERGING"); // confident → auto-advanced
    expect(top.supporting).toEqual(["voluntary_return", "unrequired_revision"]);
    expect(top.disconfirming).toEqual([]);
    // never a scalar score — separate arrays, not a sum.
    expect(top).not.toHaveProperty("score");
    expect(top).not.toHaveProperty("passion");
  });

  it("surfaces coverage gaps (domain×mode combos observed but not yet sampled) — from the read", () => {
    const s = applyInterestRead(emptyStore(), "kid-1", read, NOW);
    const vm = consoleViewModel(s, "kid-1");
    // observed axes: domains {music-sound, movement-body} × modes {build, perform}.
    // sampled: music-sound::build, movement-body::perform → the other two are gaps (sorted).
    expect(vm.coverageGaps).toEqual(["movement-body::build", "music-sound::perform"]);
  });

  it("gives each card a next distinguishing probe (never a fixed label)", () => {
    const s = applyInterestRead(emptyStore(), "kid-1", read, NOW);
    const vm = consoleViewModel(s, "kid-1");
    // EMERGING, no gate supplied → the gap-survival probe.
    expect(vm.cards[0]!.state).toBe("EMERGING");
    expect(vm.cards[0]!.nextProbe).toBe(
      "Watch for a voluntary return after a ≥14-day quiet gap.",
    );
    // EXPLORING (thin) → offer the cell again unprompted.
    expect(vm.cards[1]!.state).toBe("EXPLORING");
    expect(vm.cards[1]!.nextProbe).toBe(
      "Offer the cell again unprompted and watch for a voluntary return.",
    );
    // language is a next test, never "you are an X".
    expect(vm.cards[0]!.nextProbe.toLowerCase()).not.toContain("you are");
  });

  it("allowedActions reflect state (exact actionsFor output)", () => {
    const s = applyInterestRead(emptyStore(), "kid-1", read, NOW);
    const vm = consoleViewModel(s, "kid-1");
    // EMERGING (top) offers the full set; EXPLORING (thin) only park (nothing to promote/contest yet).
    expect(vm.cards[0]!.state).toBe("EMERGING");
    expect(vm.cards[0]!.allowedActions).toEqual(["promote", "park", "contest"]);
    expect(vm.cards[1]!.state).toBe("EXPLORING");
    expect(vm.cards[1]!.allowedActions).toEqual(["park"]);
  });

  it("PARKED cards offer only reopen", () => {
    let s = applyInterestRead(emptyStore(), "kid-1", read, NOW);
    const id = getForKid(s, "kid-1")[0]!.id;
    s = park(s, id, human, "pause", NOW);
    const vm = consoleViewModel(s, "kid-1");
    const parkedCard = vm.cards.find((c) => c.id === id)!;
    expect(parkedCard.allowedActions).toEqual(["reopen"]);
  });

  it("attaches a gate status when supplied", () => {
    const s = applyInterestRead(emptyStore(), "kid-1", read, NOW);
    const id = getForKid(s, "kid-1")[0]!.id;
    const gate: GateStatus = { gapSurvived: true, durable: true, hasArtifact: true, passed: true };
    const vm = consoleViewModel(s, "kid-1", new Map([[id, gate]]));
    expect(vm.cards[0]!.gate).toEqual(gate);
    expect(vm.cards[1]!.gate).toBeUndefined();
    // a passed gate re-points the next probe at the human decision (sign-off), not another test.
    expect(vm.cards[0]!.nextProbe).toBe(
      "Gate passed. A human may promote with an autonomy sign-off.",
    );
  });
});
