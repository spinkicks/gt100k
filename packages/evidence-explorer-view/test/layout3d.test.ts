import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import {
  SHELL_R,
  SHELL_SLOTS,
  buildFixtureGraph,
  layoutExplorer3D,
} from "@gt100k/evidence-explorer-view";
import { describe, expect, it } from "vitest";

/** Golden 3D layout (§U8.2, exact via authored slot table; tolerance ±1e-6). */
describe("layoutExplorer3D", () => {
  const { graph, ids } = buildFixtureGraph(new NodeCryptoHasher());
  const { positions, bounds, center } = layoutExplorer3D(graph);
  const at = (key: string) => positions.get(ids[key as keyof typeof ids]);

  const expectVec = (got: readonly number[] | undefined, want: readonly number[]) => {
    expect(got).toBeDefined();
    for (let i = 0; i < 3; i += 1) {
      expect(got?.[i]).toBeCloseTo(want[i] as number, 6);
    }
  };

  it("has 12 authored shell slots", () => {
    expect(SHELL_SLOTS).toHaveLength(12);
    expect(SHELL_SLOTS[0]).toEqual({ uy: 1.0, uz: 0.0 });
    expect(SHELL_SLOTS[3]).toEqual({ uy: 0.0, uz: 1.0 });
    expect(SHELL_SLOTS[6]).toEqual({ uy: -1.0, uz: 0.0 });
  });

  it("golden positions match §U8.2 (recomputed via SHELL_R · slot)", () => {
    const z = SHELL_R * 0.866025; // 2.77128
    expectVec(at("plan"), [0, 3.2, 0]);
    expectVec(at("assist-research"), [0, -1.6, z]);
    expectVec(at("assist-tutor"), [0, -1.6, -z]);
    expectVec(at("src-artifact"), [6, 3.2, 0]);
    expectVec(at("attempt-1"), [12, 3.2, 0]);
    expectVec(at("attempt-2"), [18, 3.2, 0]);
    expectVec(at("claim-repro"), [24, 3.2, 0]);
    expectVec(at("review-technical"), [24, 0, 3.2]);
    expectVec(at("released-artifact"), [24, -3.2, 0]);
    expectVec(at("contribution-self"), [24, 0, -3.2]);
    expectVec(at("review-craft"), [30, 3.2, 0]);
    expectVec(at("outcome-grade"), [30, -3.2, 0]);
  });

  it("island sits at ISLAND [0,-9,0]", () => {
    expectVec(at("island-note"), [0, -9, 0]);
  });

  it("AABB bounds + authored center", () => {
    expectVec(bounds.min, [0, -9, -3.2]);
    expectVec(bounds.max, [30, 3.2, 3.2]);
    expect(center).toEqual([15, -1, 0]);
  });

  it("is deterministic across runs", () => {
    const second = layoutExplorer3D(buildFixtureGraph(new NodeCryptoHasher()).graph);
    expect(second.positions.size).toBe(positions.size);
    expectVec(second.center, center);
  });
});
