/**
 * The hold-out policy, finally read by something.
 *
 * `@gt100k/surfacing` encodes a finding that is counterintuitive enough to be worth acting on:
 * children whose interest in a domain was triggered and then not maintained ended up *less*
 * interested than children never triggered at all (n = 212, memo 06 §2.3). So showing a child
 * something new is a debt, and the policy pays debts before it buys breadth.
 *
 * It has been imported by nothing since it was written. The child surface cannot use it, because
 * the map has two enterable cabins and shows both, so there is no selection to make. The guide can,
 * and a harm nobody can see is a harm nobody avoids.
 */
import { describe, expect, it } from "vitest";

import { offersForKid } from "../app/offer-next.js";
import { children, profileFor } from "../app/console-data.js";

describe("offersForKid", () => {
  it("says nothing when there is no child", () => {
    expect(offersForKid(undefined)).toEqual([]);
  });

  it("reads the child's own surfaced log rather than a display copy", () => {
    // Every synthetic child should produce a slate or an empty one without throwing, whatever their
    // history looks like. The fixtures have no surfaced records at all, which is itself the case
    // most likely to break a policy that counts exposures.
    for (const c of children()) {
      expect(() => offersForKid(profileFor(c.id))).not.toThrow();
    }
  });

  it("gives every suggestion a reason a guide can read", () => {
    for (const c of children()) {
      for (const o of offersForKid(profileFor(c.id))) {
        expect(o.label.length).toBeGreaterThan(0);
        expect(o.because.length).toBeGreaterThan(20);
        expect(["maintenance-debt", "falsification-probe", "never-offered"]).toContain(o.reason);
      }
    }
  });

  it("puts what is owed before what is new, because that is the policy", () => {
    for (const c of children()) {
      const reasons = offersForKid(profileFor(c.id)).map((o) => o.reason);
      const lastDebt = reasons.lastIndexOf("maintenance-debt");
      const firstFresh = reasons.indexOf("never-offered");
      if (lastDebt !== -1 && firstFresh !== -1) expect(lastDebt).toBeLessThan(firstFresh);
    }
  });

  it("does not repeat a domain across reasons", () => {
    // One cabin listed twice with two different justifications reads as two separate asks, and a
    // guide would do it twice.
    for (const c of children()) {
      const labels = offersForKid(profileFor(c.id)).map((o) => o.label);
      expect(new Set(labels).size).toBe(labels.length);
    }
  });
});
