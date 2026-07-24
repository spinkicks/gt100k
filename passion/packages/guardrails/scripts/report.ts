// Opt-in CLI (the demo): prints the program metrics + compliance report over the 014 pilot roster.
// Run headless (no network): `pnpm exec tsx passion/packages/guardrails/scripts/report.ts`
// (or `pnpm --filter @gt100k/guardrails report`). SYNTHETIC ONLY — buildPilotRoster is a fixture.
import { buildPilotRoster, PILOT_NOW } from "@gt100k/student-profile";
import { LIFECYCLE } from "@gt100k/hypothesis-store";
import { programMetrics, checkCompliance } from "../src/index.js";

const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;

function main(): void {
  const roster = buildPilotRoster(PILOT_NOW);
  const metrics = programMetrics(roster);
  const report = checkCompliance(roster);

  console.log("=== GT100K Guardrails — Program Report (G6) ===");
  console.log(`generated over the 014 pilot roster (synthetic) — kids: ${metrics.kids}`);

  console.log("\n-- Program metrics (aggregate, never kid-facing) --");
  console.log("lifecycle funnel:");
  for (const state of LIFECYCLE) console.log(`  ${state.padEnd(10)} ${metrics.funnel[state]}`);
  console.log("coverage-breadth:");
  console.log(`  avg distinct domains / kid : ${metrics.coverage.avgDomainsPerKid}`);
  console.log(`  kids passing coverage       : ${pct(metrics.coverage.pctKidsCoveragePass)}`);
  console.log("calibration:");
  console.log(`  confident rate     : ${pct(metrics.calibration.confidentRate)}`);
  console.log(`  "not sure yet" rate: ${pct(metrics.calibration.notSureYetRate)}`);
  console.log(`reopen rate: ${pct(metrics.reopenRate)}`);

  console.log("\n-- Compliance checks (locked rules → executable) --");
  for (const check of report.checks) {
    console.log(`  [${check.ok ? "PASS" : "FAIL"}] ${check.id} — ${check.detail}`);
  }
  if (report.violations.length > 0) {
    console.log("\nviolations:");
    for (const v of report.violations) {
      const where = [v.kidId, v.cellKey].filter(Boolean).join("/");
      console.log(`  - ${v.checkId}${where ? ` (${where})` : ""}: ${v.message}`);
    }
  }

  console.log(`\nOVERALL: ${report.ok ? "COMPLIANT ✅" : "VIOLATIONS FOUND ❌"}`);
}

main();
