// The console's side of the recovery citation contract. recoveryFor lives in @gt100k/wellbeing and
// references research claims by id; a typo or a renamed claim would silently drop the reason from a
// move's WhyThis. This is the loud part.
import { describe, expect, test } from "vitest";
import { claim } from "@gt100k/research";
import { recoveryFor } from "@gt100k/wellbeing";
import { planClaimIds, recoveryTriggerForState } from "../app/recovery.js";

const TRIGGERS = ["BURNOUT_TIP", "EARLY_BURNOUT", "ENGAGEMENT_FADING"] as const;

describe("recovery citations", () => {
  test("every claim id referenced by every plan resolves in the registry", () => {
    for (const t of TRIGGERS) {
      const plan = recoveryFor(t)!;
      for (const id of planClaimIds(plan)) {
        expect(claim(id), `${t} references ${id}, which is not in the registry`).toBeDefined();
      }
    }
  });
});

describe("recoveryTriggerForState", () => {
  test("maps the two burnout states to a trigger", () => {
    expect(recoveryTriggerForState("BURNOUT_TIP")).toBe("BURNOUT_TIP");
    expect(recoveryTriggerForState("EARLY_BURNOUT")).toBe("EARLY_BURNOUT");
  });
  test("returns null for states with no recovery plan", () => {
    expect(recoveryTriggerForState("IN_ZONE")).toBeNull();
    expect(recoveryTriggerForState("GAP")).toBeNull();
  });
});
