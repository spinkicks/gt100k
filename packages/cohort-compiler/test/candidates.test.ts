import { describe, expect, it } from "vitest";
import { generateCandidates } from "../src/candidates";
import { caliper8 } from "./fixtures/caliper-8";

function fnv1a32hex(value: string): string {
  let hash = 0x811c9dc5;

  for (const byte of new TextEncoder().encode(value)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}

describe("generateCandidates (T005, SC-001)", () => {
  it("returns the exact ordered Fixture A candidate sets", () => {
    const result = generateCandidates(caliper8.pool, caliper8.caliper);
    const learnersByRef = new Map(caliper8.pool.map((learner) => [learner.learnerRef, learner]));

    expect(
      result.map(({ learnerRef, candidates }) => ({
        learnerRef,
        candidates,
      })),
    ).toEqual(
      Object.entries(caliper8.expected.candidates).map(([learnerRef, expectedRefs]) => {
        const subject = learnersByRef.get(learnerRef);

        if (!subject) {
          throw new Error(`Fixture subject ${learnerRef} is missing`);
        }

        return {
          learnerRef,
          candidates: expectedRefs.map((ref) => {
            const peer = learnersByRef.get(ref);

            if (!peer) {
              throw new Error(`Fixture peer ${ref} is missing`);
            }

            return {
              ref,
              distance:
                Math.abs(subject.level - peer.level) + Math.abs(subject.velocity - peer.velocity),
            };
          }),
        };
      }),
    );
  });

  it("keeps every peer within both calipers and excludes self and separations", () => {
    const result = generateCandidates(caliper8.pool, caliper8.caliper);
    const learnersByRef = new Map(caliper8.pool.map((learner) => [learner.learnerRef, learner]));

    for (const candidateSet of result) {
      const subject = learnersByRef.get(candidateSet.learnerRef);

      if (!subject) {
        throw new Error(`Fixture subject ${candidateSet.learnerRef} is missing`);
      }

      for (const candidate of candidateSet.candidates) {
        const peer = learnersByRef.get(candidate.ref);

        if (!peer) {
          throw new Error(`Fixture peer ${candidate.ref} is missing`);
        }

        expect(candidate.ref).not.toBe(subject.learnerRef);
        expect(subject.separations).not.toContain(candidate.ref);
        expect(Math.abs(subject.level - peer.level)).toBeLessThanOrEqual(
          caliper8.caliper.levelTolerance,
        );
        expect(Math.abs(subject.velocity - peer.velocity)).toBeLessThanOrEqual(
          caliper8.caliper.velocityTolerance,
        );
      }
    }

    expect(result.find(({ learnerRef }) => learnerRef === "L5")?.candidates).toEqual([]);
    expect(result.find(({ learnerRef }) => learnerRef === "L1")?.candidates).not.toContainEqual(
      expect.objectContaining({ ref: "L8" }),
    );
    expect(result.find(({ learnerRef }) => learnerRef === "L8")?.candidates).not.toContainEqual(
      expect.objectContaining({ ref: "L1" }),
    );
  });

  it("is byte-identical across runs and uses the pinned FNV-1a hash recipe", () => {
    const first = generateCandidates(caliper8.pool, caliper8.caliper);
    const second = generateCandidates(caliper8.pool, caliper8.caliper);
    const preimagesByRef = new Map(Object.entries(caliper8.expected.preimages));

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));

    for (const candidateSet of first) {
      const preimage = `${candidateSet.learnerRef}>${candidateSet.candidates
        .map(({ ref }) => ref)
        .join(",")}`;

      expect(preimage).toBe(preimagesByRef.get(candidateSet.learnerRef));
      expect(candidateSet.hash).toBe(fnv1a32hex(preimage));
    }
  });

  it("applies the k cap after deterministic distance and ref ordering", () => {
    const result = generateCandidates(caliper8.pool, { ...caliper8.caliper, k: 2 });

    expect(result.find(({ learnerRef }) => learnerRef === "L2")?.candidates).toEqual([
      { ref: "L1", distance: 2 },
      { ref: "L6", distance: 2 },
    ]);
    expect(result.every(({ candidates }) => candidates.length <= 2)).toBe(true);
  });

  it("exposes only per-learner near-peer fields without caste or full-field ranking", () => {
    const result = generateCandidates(caliper8.pool, caliper8.caliper);

    for (const candidateSet of result) {
      expect(Object.keys(candidateSet).sort()).toEqual(["candidates", "hash", "learnerRef"]);
      for (const candidate of candidateSet.candidates) {
        expect(Object.keys(candidate).sort()).toEqual(["distance", "ref"]);
      }
    }
  });
});
