// SC-9 (P4): standing "honesty" regression guard. The REAL 014 pilot roster must stay clean —
// zero guardrail violations, every check passing. If a future change leaks a scalar/label,
// auto-promotes a hypothesis, counts a prompted return as voluntary, discounts nothing on novelty,
// demotes on silence, or adds gamification, THIS test fails (not a shipped regression).
// SYNTHETIC ONLY — buildPilotRoster is a deterministic fixture; no network.
import { describe, expect, it } from "vitest";
import { buildPilotRoster, PILOT_NOW } from "@gt100k/student-profile";
import { checkCompliance } from "../src/index.js";

describe("honesty regression guard — the real pilot roster is compliant", () => {
  const report = checkCompliance(buildPilotRoster(PILOT_NOW));

  it("has zero violations and passes every check (GC1–GC6)", () => {
    expect(report.ok).toBe(true);
    expect(report.violations).toEqual([]);
    expect(report.checks).toHaveLength(6);
    for (const check of report.checks) expect(check.ok).toBe(true);
  });

  it("names the six locked-rule checks in order", () => {
    expect(report.checks.map((c) => c.id)).toEqual(["GC1", "GC2", "GC3", "GC4", "GC5", "GC6"]);
  });
});
