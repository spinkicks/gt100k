// THE STANDING GATE. This is the file that keeps the EvidenceGraph product boundary true.
//
// It runs in CI through the root `pnpm test` (the root vitest config globs
// `passion/packages/**/test/**/*.test.ts`), so it needed no CI configuration of its own — the same way
// `guardrails/test/honesty.test.ts` enforces the no-gamification rules.
//
// If this fails, someone has coupled PassionLab and the EvidenceGraph in a way that makes extraction
// stop being a mechanical copy. The fix is not to add an exemption; it is to route the dependency
// through the seam adapter, or to make the import type-only. See `src/check.ts` for the rules.
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { checkBoundaries } from "../src/check.js";

const REPO_ROOT = fileURLToPath(new URL("../../../..", import.meta.url));

describe("the EvidenceGraph product boundary holds", () => {
  const report = checkBoundaries({ repoRoot: REPO_ROOT });

  it("finds no violation", () => {
    // Printed in full on failure, because "the boundary broke" is useless without the file and line.
    expect(report.problems, JSON.stringify(report.problems, null, 2)).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("actually discovered the workspace, so a passing run cannot mean an empty scan", () => {
    // The failure mode this guards: a path typo makes the scan find nothing and report ok:true.
    expect(report.packagesScanned.length).toBeGreaterThan(40);
    expect(report.packagesScanned).toContain("@gt100k/evidence-graph");
    expect(report.packagesScanned).toContain("@gt100k/project-workspace");
    expect(report.packagesScanned).toContain("@gt100k/project-evidence-sink");
  });

  it("reports the known, accepted costs as warnings rather than hiding them", () => {
    const codes = report.warnings.map((warning) => warning.code);

    // apps/evidence-explorer shares the GT School design system (#188, #189). Deliberate, and it means
    // design-tokens + ui must travel or be replaced on extraction day.
    expect(codes).toContain("EVIDENCE_APP_OUTWARD_DEP");
    const appWarnings = report.warnings.filter((w) => w.code === "EVIDENCE_APP_OUTWARD_DEP");
    expect(appWarnings.every((w) => w.where.startsWith("passion/apps/evidence-"))).toBe(true);
    // Only presentation infrastructure is tolerated here. A domain dependency would need promoting
    // to an error, so pin exactly what is accepted today.
    expect(appWarnings.map((w) => w.detail.match(/@gt100k\/[a-z-]+, which/)?.[0]).sort()).toEqual([
      "@gt100k/design-tokens, which",
      "@gt100k/ui, which",
    ]);
  });
});
