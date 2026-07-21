import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = new URL("../", import.meta.url);
const ACCEPTANCE_FILE = new URL("ACCEPTANCE.md", PACKAGE_ROOT);

function readAcceptance(): string {
  return existsSync(ACCEPTANCE_FILE) ? readFileSync(ACCEPTANCE_FILE, "utf8") : "";
}

function requiredCapture(match: RegExpMatchArray, index: number): string {
  const capture = match[index];
  if (capture === undefined) {
    throw new Error(`Missing capture ${index} in acceptance evidence match`);
  }
  return capture;
}

describe("arena T051 acceptance evidence", () => {
  it("maps every SC-001 through SC-026 exactly once", () => {
    const acceptance = readAcceptance();
    const mappedCriteria = [...acceptance.matchAll(/^\| (SC-\d{3}) \|/gm)].map((match) =>
      requiredCapture(match, 1),
    );
    const expectedCriteria = Array.from(
      { length: 26 },
      (_, index) => `SC-${String(index + 1).padStart(3, "0")}`,
    );

    expect(acceptance).not.toBe("");
    expect(mappedCriteria).toEqual(expectedCriteria);
    expect(new Set(mappedCriteria).size).toBe(26);
  });

  it("keeps live-only limitations explicit instead of marking them green", () => {
    const acceptance = readAcceptance();

    expect(acceptance).toContain("## Live-only gaps");
    expect(acceptance).toContain("minimum managed device");
    expect(acceptance).toContain("real screen reader");
    expect(acceptance).toMatch(/^\| SC-010 \| Partial \|/m);
    expect(acceptance).toMatch(/^\| SC-011 \| Partial \|/m);
    expect(acceptance).toMatch(/^\| SC-012 \| Partial \|/m);
    expect(acceptance).toMatch(/^\| SC-025 \| Partial \|/m);
  });

  it("references test files that exist in the feature package", () => {
    const acceptance = readAcceptance();
    const referencedTests = new Set(
      [...acceptance.matchAll(/`(test\/[^`]+\.test\.ts)`/g)].map((match) =>
        requiredCapture(match, 1),
      ),
    );

    expect(referencedTests.size).toBeGreaterThanOrEqual(26);
    for (const path of referencedTests) {
      expect(existsSync(new URL(path, PACKAGE_ROOT)), path).toBe(true);
    }
  });
});
