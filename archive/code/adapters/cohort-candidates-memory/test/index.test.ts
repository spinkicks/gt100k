import { describe, expect, it } from "vitest";
import { generateCandidates } from "../../../packages/cohort-compiler/src/candidates";
import type { CandidateIndex } from "../../../packages/cohort-compiler/src/ports";
import { caliper8 } from "../../../packages/cohort-compiler/test/fixtures/caliper-8";
import { DeferredHnswCandidateIndex, InMemoryCandidateIndex } from "../src/index";

describe("InMemoryCandidateIndex (T006, FR-005)", () => {
  it("returns the same Fixture A sets as the domain generator", async () => {
    const index: CandidateIndex = new InMemoryCandidateIndex(caliper8.pool);
    const expected = generateCandidates(caliper8.pool, caliper8.caliper);

    await expect(
      Promise.all(
        caliper8.pool.map(({ learnerRef }) => index.candidatesFor(learnerRef, caliper8.caliper)),
      ),
    ).resolves.toEqual(expected);
  });

  it("keeps the production HNSW seam explicitly deferred and not implemented", async () => {
    const index: CandidateIndex = new DeferredHnswCandidateIndex();

    await expect(index.candidatesFor("L1", caliper8.caliper)).rejects.toThrow(
      "HNSW candidate index is deferred and not implemented",
    );
  });
});
