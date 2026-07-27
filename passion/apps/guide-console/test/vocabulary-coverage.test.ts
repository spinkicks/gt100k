/**
 * Every signal the engine can emit must have plain language before a guide sees it.
 *
 * The console renders raw engine keys through `SIGNALS`, and an unmapped one reaches a human as
 * `external_report`. That nearly shipped: E10's report kind was added to the engine and the
 * vocabulary was only updated because someone went looking. Nothing failed.
 *
 * `EVENT_KINDS` exists as a value for exactly this test, so adding a kind to the engine fails here
 * rather than showing up in front of a guide.
 */
import { EVENT_KINDS } from "@gt100k/interest-inference";
import { describe, expect, it } from "vitest";

import { SIGNALS } from "../app/vocab.js";

describe("the console can speak about every signal the engine emits", () => {
  it.each([...EVENT_KINDS])("has plain language for %s", (kind) => {
    expect(SIGNALS[kind]).toBeDefined();
  });

  it("gives each one a label and a description, not just a key", () => {
    for (const kind of EVENT_KINDS) {
      const term = SIGNALS[kind];
      expect(term?.label ?? "").not.toBe("");
      expect(term?.desc ?? "").not.toBe("");
    }
  });

  it("never leaves an engine key showing in the label a guide reads", () => {
    // A label like "external_report" would technically pass the checks above.
    for (const kind of EVENT_KINDS) {
      expect(SIGNALS[kind]?.label).not.toContain("_");
    }
  });
});
