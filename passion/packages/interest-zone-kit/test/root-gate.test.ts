import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const rootVitestConfig = readFileSync(
  new URL("../../../../vitest.config.ts", import.meta.url),
  "utf8",
);

describe("root Interest Lab gate", () => {
  it("discovers React component acceptance tests", () => {
    expect(rootVitestConfig).toContain('"passion/packages/**/test/**/*.test.tsx"');
  });
});
