import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("arena app configuration", () => {
  it("transpiles both domain workspace packages", async () => {
    const configUrl = new URL("../../../apps/arena/next.config.mjs", import.meta.url);

    expect(existsSync(configUrl), "apps/arena/next.config.mjs should exist").toBe(true);

    const { default: config } = await import(configUrl.href);

    expect(config).toEqual({
      transpilePackages: ["@gt100k/arena-world", "@gt100k/learning-loop"],
    });
  });

  it("matches the established strict Next.js TypeScript contract", () => {
    const configUrl = new URL("../../../apps/arena/tsconfig.json", import.meta.url);

    expect(existsSync(configUrl), "apps/arena/tsconfig.json should exist").toBe(true);

    const config = JSON.parse(readFileSync(configUrl, "utf8"));

    expect(config).toEqual({
      extends: "../../tsconfig.base.json",
      compilerOptions: {
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        jsx: "preserve",
        module: "ESNext",
        moduleResolution: "Bundler",
        noEmit: true,
        composite: false,
        declaration: false,
        verbatimModuleSyntax: false,
        allowJs: true,
        incremental: true,
        plugins: [{ name: "next" }],
        resolveJsonModule: true,
        isolatedModules: true,
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    });
  });
});
