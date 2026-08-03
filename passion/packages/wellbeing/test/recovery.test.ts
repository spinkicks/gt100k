import { describe, expect, it } from "vitest";

import { recoveryFor, type RecoveryTrigger } from "../src/recovery.js";

const TRIGGERS: readonly RecoveryTrigger[] = ["BURNOUT_TIP", "EARLY_BURNOUT", "ENGAGEMENT_FADING"];

describe("recoveryFor", () => {
  it("returns null for a state that is not a recovery signal", () => {
    expect(recoveryFor("IN_ZONE")).toBeNull();
    expect(recoveryFor("GAP")).toBeNull();
    expect(recoveryFor("nonsense")).toBeNull();
  });

  it("returns a tailored plan for each recovery trigger", () => {
    for (const t of TRIGGERS) {
      const plan = recoveryFor(t);
      expect(plan, `${t} has no plan`).not.toBeNull();
      expect(plan!.trigger).toBe(t);
      expect(plan!.headline.length).toBeGreaterThan(0);
      expect(plan!.moves.length).toBeGreaterThan(0);
      expect(plan!.pivotGuidance.claimIds.length).toBeGreaterThan(0);
    }
  });

  it("carries both DO_NOT guardrails on every plan", () => {
    for (const t of TRIGGERS) {
      const ids = recoveryFor(t)!
        .moves.filter((m) => m.kind === "DO_NOT")
        .map((m) => m.id);
      expect(ids, `${t} missing guardrails`).toEqual(
        expect.arrayContaining(["do-not-quit", "do-not-rest-only"]),
      );
    }
  });

  it("orders the guardrails last, after the active moves", () => {
    for (const t of TRIGGERS) {
      const moves = recoveryFor(t)!.moves;
      const firstDoNot = moves.findIndex((m) => m.kind === "DO_NOT");
      const lastActive = moves.map((m) => m.kind !== "DO_NOT").lastIndexOf(true);
      expect(firstDoNot, `${t} interleaves guardrails`).toBeGreaterThan(lastActive);
    }
  });

  it("gives EARLY_BURNOUT a break, and does not give BURNOUT_TIP one", () => {
    expect(recoveryFor("EARLY_BURNOUT")!.breakGuidance).toBeDefined();
    expect(recoveryFor("BURNOUT_TIP")!.breakGuidance).toBeUndefined();
  });

  it("leads ENGAGEMENT_FADING with the autonomy move", () => {
    expect(recoveryFor("ENGAGEMENT_FADING")!.moves[0]?.kind).toBe("RESTORE_AUTONOMY");
  });

  it("gives every move a non-empty claim reference and a grade", () => {
    for (const t of TRIGGERS) {
      for (const m of recoveryFor(t)!.moves) {
        expect(m.claimIds.length, `${m.id} has no claim`).toBeGreaterThan(0);
        expect(["controlled-in-children", "correlational-or-older-sample", "reasoned"]).toContain(
          m.grade,
        );
      }
    }
  });
});
