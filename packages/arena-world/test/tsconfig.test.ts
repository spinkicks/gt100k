import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("arena-world TypeScript configuration", () => {
  it("matches the composite package contract", () => {
    const configUrl = new URL("../tsconfig.json", import.meta.url);

    expect(existsSync(configUrl)).toBe(true);

    const config = JSON.parse(readFileSync(configUrl, "utf8"));

    expect(config).toEqual({
      extends: "../../tsconfig.base.json",
      compilerOptions: {
        composite: true,
        rootDir: ".",
        outDir: "dist",
      },
      include: ["src/**/*.ts", "test/**/*.ts"],
    });
  });

  it("is referenced exactly once by the root TypeScript build", () => {
    const rootConfigUrl = new URL("../../../tsconfig.json", import.meta.url);
    const rootConfig = JSON.parse(readFileSync(rootConfigUrl, "utf8"));
    const arenaReferences = rootConfig.references.filter(
      (reference: { path: string }) => reference.path === "packages/arena-world",
    );

    expect(arenaReferences).toEqual([{ path: "packages/arena-world" }]);
  });
});
