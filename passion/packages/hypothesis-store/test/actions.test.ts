import { describe, it, expect } from "vitest";
import { emptyStore, applyInterestRead, getForKid } from "../src/store.js";
import { promote, park, reopen, contest } from "../src/actions.js";
import type { HumanActor } from "../src/model.js";
import type { GateStatus } from "../src/gate.js";
import type { InterestRead } from "@gt100k/interest-inference";

const human: HumanActor = { id: "guide-1", role: "guide" };
const model: HumanActor = { id: "m", role: "MODEL" };
const system: HumanActor = { id: "s", role: "system" };
const passed: GateStatus = { gapSurvived: true, durable: true, hasArtifact: true, passed: true };
const NOW = "2026-04-01T00:00:00.000Z";
const emerging: InterestRead = {
  cells: [
    {
      cellKey: "c",
      domainPath: ["music-sound"],
      mode: "build",
      alpha: 5,
      beta: 1,
      mean: 0.8,
      sd: 0.1,
      lowerBound: 0.7,
      evidenceMass: 4,
      confident: true,
      attribution: "style",
      supporting: [],
      disconfirming: [],
    },
  ],
  candidates: [
    { cellKey: "c", domainPath: ["music-sound"], mode: "build", lowerBound: 0.7, attribution: "style" },
  ],
};

function seed() {
  return applyInterestRead(emptyStore(), "kid", emerging, NOW);
} // → EMERGING

describe("human transitions", () => {
  it("promote requires human + passed gate + signOff", () => {
    const s = seed();
    const id = getForKid(s, "kid")[0]!.id;
    expect(() => promote(s, id, model, { gate: passed, autonomySignOff: true }, NOW)).toThrow(); // non-human MODEL
    expect(() => promote(s, id, system, { gate: passed, autonomySignOff: true }, NOW)).toThrow(); // non-human SYSTEM
    expect(() =>
      promote(s, id, human, { gate: { ...passed, passed: false }, autonomySignOff: true }, NOW),
    ).toThrow(); // gate not passed
    expect(() => promote(s, id, human, { gate: passed, autonomySignOff: false }, NOW)).toThrow(); // no signOff
    const s2 = promote(s, id, human, { gate: passed, autonomySignOff: true }, NOW);
    const h = getForKid(s2, "kid")[0]!;
    expect(h.state).toBe("CANDIDATE");
    expect(h.history.at(-1)!.actor).toBe("guide-1");
  });

  it("promote CANDIDATE→ACTIVE requires only a human (no gate re-check)", () => {
    const s = seed();
    const id = getForKid(s, "kid")[0]!.id;
    const candidate = promote(s, id, human, { gate: passed, autonomySignOff: true }, NOW);
    const active = promote(candidate, id, human, { gate: passed, autonomySignOff: true }, NOW);
    expect(getForKid(active, "kid")[0]!.state).toBe("ACTIVE");
  });

  it("park is always allowed + reversible; reopen→EMERGING; nothing deleted", () => {
    const s = seed();
    const id = getForKid(s, "kid")[0]!.id;
    const parked = park(s, id, human, "kid asked to pause", NOW);
    expect(getForKid(parked, "kid")[0]!.state).toBe("PARKED");
    const reopened = reopen(parked, id, human, NOW);
    expect(getForKid(reopened, "kid")[0]!.state).toBe("EMERGING");
    expect(Object.keys(reopened.byId)).toHaveLength(1); // never deleted
  });

  it("park/reopen/contest reject non-human actors", () => {
    const s = seed();
    const id = getForKid(s, "kid")[0]!.id;
    expect(() => park(s, id, model, "x", NOW)).toThrow();
    expect(() => contest(s, id, model, "x", NOW)).toThrow();
    const parked = park(s, id, human, "x", NOW);
    expect(() => reopen(parked, id, model, NOW)).toThrow();
  });

  it("contest moves an EMERGING hypothesis to CONTESTED with actor+reason", () => {
    const s = seed();
    const id = getForKid(s, "kid")[0]!.id;
    const contested = contest(s, id, human, "conflicting observation", NOW);
    const h = getForKid(contested, "kid")[0]!;
    expect(h.state).toBe("CONTESTED");
    expect(h.history.at(-1)!.reason).toBe("conflicting observation");
  });
});
