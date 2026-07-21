import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readmeUrl = new URL("../README.md", import.meta.url);
const readme = existsSync(readmeUrl) ? readFileSync(readmeUrl, "utf8") : "";

describe("Cohort Arena app README (T134)", () => {
  it("exists and documents the runnable app commands", () => {
    expect(existsSync(readmeUrl)).toBe(true);

    for (const command of [
      "pnpm --filter @gt100k/cohort-arena dev",
      "pnpm --filter @gt100k/cohort-arena build",
      "pnpm --filter @gt100k/cohort-arena test",
      "pnpm --filter @gt100k/cohort-arena test:smoke",
    ]) {
      expect(readme).toContain(command);
    }
  });

  it("documents the one-view 3D, 2D, and Ledger architecture", () => {
    for (const term of [
      "`CohortArenaView`",
      "`buildCohortArenaView`",
      "`project2D`",
      "Cohort Ledger",
      '`aria-hidden="true"`',
      "`motion/react`",
      "`useFrame`",
    ]) {
      expect(readme).toContain(term);
    }
  });

  it("documents equal access modes and runtime degradation", () => {
    for (const term of [
      "reduced motion",
      "plain mode",
      "degraded 3D",
      "WebGL2",
      "context loss",
      "frame-budget",
      "keyboard",
      "screen reader",
    ]) {
      expect(readme).toContain(term);
    }
  });

  it("states the synthetic-only and no-network guardrails", () => {
    for (const term of [
      "Synthetic-only",
      "no live media",
      "no network",
      "no external fetch",
      "honesty, emotion, personality, or motivation",
      "rank",
      "dark patterns",
    ]) {
      expect(readme).toContain(term);
    }
  });
});
