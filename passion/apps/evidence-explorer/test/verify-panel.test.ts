import { describe, expect, it } from "vitest";
import {
  buildSyntheticExplorerView,
  buildSyntheticVerification,
} from "../components/synthetic-view.js";
import {
  IDLE_VISUAL,
  isEdgeLit,
  merkleRootOf,
  recomputedRootOf,
  resolveVisual,
  revealedStepCount,
  sealAnnouncement,
  shortRoot,
  waveLitCount,
} from "../components/verify-machine.js";

/**
 * U3 verify sequence (UE032–UE035, §U8.8). The pass/fail truth is domain-derived server-side; these
 * tests pin (a) that the honest packet verifies and the tampered packet mismatches on the byte-level
 * body, (b) that the presentation sequencing (light-wave / stepped checks) is deterministic and pure,
 * and (c) the SC-E09/UE034 invariant that red + fracture stay on the byte-body + root — never a person.
 */
describe("U3 verify — server-derived verification views", () => {
  it("honest packet verifies; every non-stub step passes; the log step is a non-production stub", async () => {
    const { verified } = await buildSyntheticVerification();
    expect(verified.sealState).toBe("verified");

    const nonStub = verified.steps.filter((s) => s.status !== "stub");
    expect(nonStub.every((s) => s.status === "pass")).toBe(true);

    const stub = verified.steps.find((s) => s.id === "transparency-log-stub");
    expect(stub?.status).toBe("stub");
    expect(stub?.nonProduction).toBe(true);

    // Committed and recomputed Merkle roots match on the honest packet.
    expect(merkleRootOf(verified)).not.toBeNull();
    expect(recomputedRootOf(verified)).toBe(merkleRootOf(verified));
  });

  it("tampered packet mismatches: merkle-root fails with committed ≠ recomputed", async () => {
    const { tampered } = await buildSyntheticVerification();
    expect(tampered.sealState).toBe("mismatch");

    const merkle = tampered.steps.find((s) => s.id === "merkle-root");
    expect(merkle?.status).toBe("fail");
    expect(merkleRootOf(tampered)).not.toBe(recomputedRootOf(tampered));

    // Subject-digest + human-authority remain intact — only the bytes diverged.
    expect(tampered.steps.find((s) => s.id === "subject-digest")?.status).toBe("pass");
    expect(tampered.steps.find((s) => s.id === "human-authority")?.status).toBe("pass");
  });

  it("the byte-tamper target is a byte-level Artifact — never a person, Outcome, or Assistance (SC-E09)", async () => {
    const { tamperNodeId } = await buildSyntheticVerification();
    const view = buildSyntheticExplorerView();
    const node = view.nodes.find((n) => n.id === tamperNodeId);
    expect(node).toBeDefined();
    expect(node?.type).toBe("Artifact");
    expect(node?.isHumanOwned).toBe(false);
    expect(node?.isCitedAssistance).toBe(false);
    expect(node?.type).not.toBe("Outcome");
  });

  it("fracture only ever fires on the byte-body, and only on a mismatch run (UE034)", async () => {
    const { verified, tampered, tamperNodeId } = await buildSyntheticVerification();
    // Idle → nothing implicated.
    expect(resolveVisual("idle", null, tamperNodeId, 0).fractureNodeId).toBeNull();
    // Honest verify run → sealed, no fracture on anyone.
    expect(resolveVisual("verify", verified, tamperNodeId, 12).fractureNodeId).toBeNull();
    // Tamper run → fracture is exactly the byte-body, nothing else.
    const tamperVisual = resolveVisual("tamper", tampered, tamperNodeId, 12);
    expect(tamperVisual.sealState).toBe("mismatch");
    expect(tamperVisual.fractureNodeId).toBe(tamperNodeId);
  });

  it("the aria-live announcements are non-accusatory (§U8.14)", async () => {
    const { verified, tampered } = await buildSyntheticVerification();
    const ok = sealAnnouncement(verified);
    expect(ok).toMatch(/verified/i);

    const bad = sealAnnouncement(tampered);
    expect(bad).toMatch(/tamper detected/i);
    expect(bad).toMatch(/no person, learner, or grade/i);
    // Never blames a person / accuses anyone.
    expect(bad.toLowerCase()).not.toMatch(/accus|blame|cheat|guilt|fraud/);
  });
});

describe("U3 verify — deterministic presentation sequencing (pure)", () => {
  const order = [
    { from: "a", to: "b" },
    { from: "b", to: "c" },
    { from: "c", to: "d" },
  ] as const;

  it("waveLitCount sweeps 0→total across the duration and lights all at once when instant", () => {
    expect(waveLitCount(3, 0, 1800)).toBe(0);
    expect(waveLitCount(3, 900, 1800)).toBe(2); // round(0.5 * 3)
    expect(waveLitCount(3, 1800, 1800)).toBe(3);
    expect(waveLitCount(3, 5000, 1800)).toBe(3); // clamped
    expect(waveLitCount(3, 50, 0)).toBe(3); // reduced motion → instant, all lit
  });

  it("isEdgeLit lights only the prefix of the wave order", () => {
    expect(isEdgeLit(order, 0, "a", "b")).toBe(false);
    expect(isEdgeLit(order, 1, "a", "b")).toBe(true);
    expect(isEdgeLit(order, 1, "b", "c")).toBe(false);
    expect(isEdgeLit(order, 3, "c", "d")).toBe(true);
    expect(isEdgeLit(order, 3, "x", "y")).toBe(false); // not in the order
  });

  it("revealedStepCount ticks one row per step and reveals all under reduced motion", () => {
    expect(revealedStepCount(4, 0, 420)).toBe(1);
    expect(revealedStepCount(4, 420, 420)).toBe(2);
    expect(revealedStepCount(4, 9999, 420)).toBe(4); // clamped to total
    expect(revealedStepCount(4, 0, 0)).toBe(4); // reduced motion → whole list
  });

  it("IDLE_VISUAL is inert (baseline render unchanged) and shortRoot abbreviates", () => {
    expect(IDLE_VISUAL).toEqual({
      run: "idle",
      sealState: "unverified",
      litEdgeCount: 0,
      fractureNodeId: null,
    });
    expect(shortRoot(null)).toBe("—");
    expect(shortRoot("0123456789abcdef0123")).toContain("…");
    expect(shortRoot("short")).toBe("short");
  });
});
