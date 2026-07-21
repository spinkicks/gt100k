import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as viewApi from "../src/index";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

describe("interest-lab view README", () => {
  it("documents every public runtime entry point", () => {
    const undocumented = Object.keys(viewApi).filter((entryPoint) => !readme.includes(entryPoint));

    expect(undocumented).toEqual([]);
  });

  it("documents the composed domain inputs and presentation options", () => {
    for (const input of ["lab", "coverage", "hypothesis", "events", "gate", "options"]) {
      expect(readme).toContain(`\`${input}\``);
    }

    for (const option of [
      "surface",
      "ageBand",
      "reducedMotion",
      "plainMode",
      "deviceCaps",
      "history",
    ]) {
      expect(readme).toContain(`\`${option}\``);
    }
  });

  it("states the package boundary and product guardrails", () => {
    expect(readme).toMatch(/GPU-free/i);
    expect(readme).toMatch(/never re-computes? (?:a )?(?:domain )?rule/i);
    expect(readme).toMatch(/no scalar passion score/i);
    expect(readme).toMatch(/no fixed label/i);
    expect(readme).toMatch(/no floating score/i);
  });
});
