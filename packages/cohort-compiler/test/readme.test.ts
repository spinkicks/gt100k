import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readmeUrl = new URL("../README.md", import.meta.url);
const readme = existsSync(readmeUrl) ? readFileSync(readmeUrl, "utf8") : "";

describe("package README (T034)", () => {
  it("exists and documents the complete public function surface", () => {
    expect(existsSync(readmeUrl)).toBe(true);

    for (const api of [
      "analyzeTurns",
      "assignCohorts",
      "benefitOf",
      "caliperDistance",
      "commit",
      "generateCandidates",
      "isFeasibleCohort",
      "membershipChurn",
      "repairCohort",
      "rollback",
      "routeHealthEvent",
      "scoreObjective",
      "withinCaliper",
    ]) {
      expect(readme).toContain(`\`${api}\``);
    }
  });

  it("documents all five replaceable ports and their MVP adapters", () => {
    for (const port of [
      "CandidateIndex",
      "CohortRepository",
      "SafeguardingSink",
      "MediaTurnSource",
      "BenefitEstimator",
    ]) {
      expect(readme).toContain(`\`${port}\``);
    }

    for (const adapterPackage of [
      "@gt100k/cohort-candidates-memory",
      "@gt100k/cohort-repo-memory",
      "@gt100k/cohort-safeguarding-memory",
      "@gt100k/cohort-media-stub",
      "@gt100k/cohort-benefit-shadow",
    ]) {
      expect(readme).toContain(`\`${adapterPackage}\``);
    }
  });

  it("marks every production direction as deferred and not production", () => {
    expect(readme).toContain("## Deferred / not production");

    for (const deferredTarget of [
      "HNSW",
      "CP-SAT",
      "WebRTC",
      "AudioWorklet",
      "LiveKit",
      "peer-effect causal uplift",
      "PostgreSQL",
    ]) {
      expect(readme).toContain(deferredTarget);
    }
  });

  it("states the synthetic-only and observable-only guardrails", () => {
    expect(readme).toContain("Synthetic-only");
    expect(readme).toContain("observable-only");
    expect(readme).toContain("honesty, emotion, personality, or motivation");
  });
});
