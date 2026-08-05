import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { assertConformant, listIconSvgs } from "./icon-conformance";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..", "app", "pursuit-icons");

describe("every staged icon conforms to the locked style", () => {
  const svgs = listIconSvgs(SRC);
  it("finds staged icons", () => {
    expect(svgs.length).toBeGreaterThan(0);
  });
  it.each(svgs)("%s uses only palette colors and the locked stroke", (path) => {
    expect(assertConformant(readFileSync(path, "utf8"))).toEqual([]);
  });
});
