import { describe, expect, expectTypeOf, it } from "vitest";

import type {
  ErasureService,
  InclusionProofStub,
  TransparencyLog,
} from "../../../packages/evidence-graph/src/ports.js";
import { StubErasureService, StubTransparencyLog } from "../src/index.js";

const MERKLE_ROOT = "3c7f4d3c2a824ad9df7bbf211d8ebd3f1e2086ce2f5b0aea27f8bc994dea441c";
const SUBJECT_KEY_REF = "synthetic-key:learner-001";

describe("deferred pre-live adapters", () => {
  it("implements the deferred domain ports", () => {
    expectTypeOf<StubTransparencyLog>().toMatchTypeOf<TransparencyLog>();
    expectTypeOf<StubErasureService>().toMatchTypeOf<ErasureService>();
  });

  it("returns and verifies only the deterministic transparency-log placeholder", async () => {
    const transparencyLog = new StubTransparencyLog();
    const first = await transparencyLog.anchor(MERKLE_ROOT);
    const second = await transparencyLog.anchor(MERKLE_ROOT);

    expect(first).toEqual({
      root: MERKLE_ROOT,
      logIndex: 0,
      proof: [],
      stub: true,
    });
    expect(second).toEqual(first);
    await expect(transparencyLog.verifyInclusion(MERKLE_ROOT, first)).resolves.toBe(true);
    await expect(transparencyLog.verifyInclusion("different-root", first)).resolves.toBe(false);

    const alteredProof: InclusionProofStub = { ...first, logIndex: 1 };
    await expect(transparencyLog.verifyInclusion(MERKLE_ROOT, alteredProof)).resolves.toBe(false);
  });

  it("returns a deterministic erasure tombstone without invalidating retained commitments", async () => {
    const transparencyLog = new StubTransparencyLog();
    const erasureService = new StubErasureService();
    const retainedProof = await transparencyLog.anchor(MERKLE_ROOT);

    const first = await erasureService.shred(SUBJECT_KEY_REF);
    const second = await erasureService.shred(SUBJECT_KEY_REF);

    expect(first).toEqual({
      subjectKeyRef: SUBJECT_KEY_REF,
      shredded: true,
      stub: true,
    });
    expect(second).toEqual(first);
    await expect(transparencyLog.verifyInclusion(MERKLE_ROOT, retainedProof)).resolves.toBe(true);
  });
});
