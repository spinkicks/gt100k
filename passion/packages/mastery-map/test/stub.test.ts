/**
 * The deterministic stub generator (spec §4). The first test is the real one: the stub's map must
 * pass the validator with ZERO errors, so CI always has a generator whose output the gate accepts.
 * If it ever fails, the finding is in the rules or in the generator, and never in a weakened rule.
 *
 * BE PRECISE ABOUT WHAT THAT PROVES, because it is less than it looks. Four of the ten error rules
 * are satisfied here by construction rather than by getting anything right: every milestone the
 * stub writes says `basis: "model"` and carries no sources (rule 4), claims only modes it was
 * handed (rule 7), is built from a fixed set of field names (rule 8), and writes prose with no
 * number in it at all (rule 9). Passing those four costs the stub nothing and says nothing about
 * whether a real map could pass them.
 *
 * What the stub does earn are the rules it could plausibly fail: rule 1, since it wires a real
 * chain of `requires`; rule 2 and rule 3, since every capability it writes has to name something
 * from its own demonstration; rule 5, since it filters the resources it was handed; rule 6, since
 * it assigns stage floors down a chain; and rule 10, since it mints ids from a domain path. The
 * golden fixtures in `golden.test.ts` are where rules 4, 7, 8 and 9 are exercised against content
 * that could have broken them.
 */
import type { CuratedResource } from "@gt100k/concierge";
import { describe, expect, it } from "vitest";

import type { MapContext } from "../src/ports.js";
import { STUB_GENERATED_AT, buildStubMap, stubMapGenerator } from "../src/stub-generator.js";
import { validateMap } from "../src/validate.js";

const USABLE: CuratedResource = {
  id: "cr-usable",
  title: "A worked introduction",
  url: "https://example.org/intro",
  domainPath: ["games-strategy", "chess"],
  pursuits: ["chess"],
  affordedModes: ["investigate"],
  reputation: 0.9,
  ageTiers: ["9-11"],
  provenance: "sha256:aaaa",
};

/** Covers no band the context claims, so error 5 would fire if the stub attached it. */
const WRONG_AGE: CuratedResource = { ...USABLE, id: "cr-wrong-age", ageTiers: ["12-14"] };

/** No provenance, so error 5 would fire if the stub attached it. */
const NO_PROVENANCE: CuratedResource = { ...USABLE, id: "cr-no-provenance", provenance: "" };

const CTX: MapContext = {
  domainPath: ["games-strategy", "chess"],
  modes: ["investigate", "build"],
  ageBands: ["9-11"],
  resources: [USABLE, WRONG_AGE, NO_PROVENANCE],
};

describe("stubMapGenerator", () => {
  it("produces a map the validator accepts with zero errors", () => {
    expect(validateMap(buildStubMap(CTX)).errors).toEqual([]);
  });

  it("is a pure function of its context: same input, same output", () => {
    expect(buildStubMap(CTX)).toEqual(buildStubMap(CTX));
  });

  it("reads no clock, so every timestamp it writes is the same fixed constant", () => {
    const map = buildStubMap(CTX);
    expect(map.provenance.generatedAt).toBe(STUB_GENERATED_AT);
    expect(map.revalidatedAt).toBe(STUB_GENERATED_AT);
  });

  it("varies with the context rather than emitting one canned map", () => {
    const other = buildStubMap({ ...CTX, domainPath: ["music-sound", "production"] });
    expect(other).not.toEqual(buildStubMap(CTX));
    expect(other.domainPath).toEqual(["music-sound", "production"]);
  });

  it("embeds the validation record its own map earns", () => {
    const map = buildStubMap(CTX);
    expect(map.validation).toEqual(validateMap(map));
  });

  /**
   * The stub has no external support for anything it orders, so it says so. Fabricating a citation
   * to quieten the warning is exactly the failure the ordering rule exists to expose, which is why
   * these two warnings firing is the correct behaviour and not a defect.
   */
  it("is honest that it rests on nothing external, and takes the warnings for it", () => {
    const map = buildStubMap(CTX);
    expect(map.milestones.every((m) => m.ordering.basis === "model")).toBe(true);
    expect(map.milestones.every((m) => m.ordering.sources.length === 0)).toBe(true);
    const codes = validateMap(map).warnings.map((w) => w.code);
    expect(codes).toContain("W1_MODEL_HEAVY");
    expect(codes).toContain("W2_NO_SYLLABUS");
  });

  /**
   * Nothing above S2_FOUNDATIONS is reachable by any child today, so a map whose only complete path
   * runs through a branch would be a map nobody can enter.
   */
  it("contains a complete trunk-only path at or below S2_FOUNDATIONS", () => {
    const map = buildStubMap(CTX);
    const trunk = map.milestones.filter((m) => m.modes.length === 0);
    const trunkIds = new Set(trunk.map((m) => m.id));
    expect(trunk.length).toBeGreaterThan(1);
    expect(trunk.some((m) => m.requires.length === 0)).toBe(true);
    for (const m of trunk) {
      expect(["S1_IGNITION", "S2_FOUNDATIONS"]).toContain(m.stageFloor);
      for (const dep of m.requires) expect(trunkIds.has(dep)).toBe(true);
    }
  });

  it("gives every afforded mode a branch, and claims no mode the domain lacks", () => {
    const map = buildStubMap(CTX);
    const branches = map.milestones.filter((m) => m.modes.length > 0);
    expect(branches.flatMap((m) => [...m.modes]).sort()).toEqual(["build", "investigate"]);
    for (const b of branches) for (const mode of b.modes) expect(map.modes).toContain(mode);
  });

  it("still produces a valid trunk-only map for a domain that affords no modes", () => {
    const map = buildStubMap({ ...CTX, modes: [] });
    expect(validateMap(map).errors).toEqual([]);
    expect(map.milestones.every((m) => m.modes.length === 0)).toBe(true);
  });

  /**
   * The generator attaches, never fetches. It also refuses to attach a resource that would make its
   * own map invalid, rather than emitting a map it knows the validator will reject.
   */
  it("attaches only resources that pass rule 5, dropping the rest", () => {
    const map = buildStubMap(CTX);
    const attached = map.milestones.flatMap((m) => m.resources).map((r) => r.id);
    expect(attached).toEqual(["cr-usable"]);
  });

  it("resolves through the port to the same map the pure builder returns", async () => {
    await expect(stubMapGenerator.generate(CTX)).resolves.toEqual(buildStubMap(CTX));
  });
});
