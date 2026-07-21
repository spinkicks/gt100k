import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readmeUrl = new URL("../README.md", import.meta.url);
const readme = existsSync(readmeUrl) ? readFileSync(readmeUrl, "utf8") : "";

describe("Cohort Arena view README (T134)", () => {
  it("exists and documents the golden registries", () => {
    expect(existsSync(readmeUrl)).toBe(true);

    for (const registry of [
      "PALETTE",
      "STATE_CUES",
      "TYPOGRAPHY",
      "LAYOUT",
      "MOTION",
      "EASINGS",
      "MOTION_KINDS",
    ]) {
      expect(readme).toContain(`\`${registry}\``);
    }
  });

  it("documents the complete public function surface", () => {
    for (const api of [
      "benchSlot",
      "buildArenaRoomView",
      "buildCohortArenaView",
      "buildLedger",
      "center",
      "deriveStandingsView",
      "layoutArenaRing",
      "layoutConstellation",
      "layoutField",
      "plainViewEquals",
      "project2D",
      "resolveMotion",
      "resolveVisualBand",
      "vertexLocal",
    ]) {
      expect(readme).toContain(`\`${api}\``);
    }
  });

  it("documents the public view contracts and their boundaries", () => {
    for (const typeName of [
      "BuildCohortArenaViewInput",
      "CohortArenaView",
      "LedgerView",
      "MotionSpec",
      "StandingsView",
      "ArenaRoomView",
      "SafeguardingView",
    ]) {
      expect(readme).toContain(`\`${typeName}\``);
    }

    for (const boundary of [
      "pure",
      "deterministic",
      "read-only",
      "no I/O",
      "no wall-clock",
      "no `Math.random`",
      "no rank",
      "observable-only",
    ]) {
      expect(readme).toContain(boundary);
    }
  });

  it("documents its focused verification command", () => {
    expect(readme).toContain("pnpm --filter @gt100k/cohort-arena-view test");
  });
});
