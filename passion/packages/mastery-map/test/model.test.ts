/**
 * The four chosen defaults (spec §5). Every one of them is a number we picked, not a number anyone
 * measured, and the central rule of this package is that a decision names what it rests on. A
 * constant nothing asserts on can be moved by anyone in passing, and the move looks like a tidy-up
 * in a diff rather than the change of policy it is.
 *
 * So these are pinned by value. Changing one has to change this file too, which is the whole point:
 * it makes the change deliberate and puts it where a reviewer will see it.
 */
import { describe, expect, it } from "vitest";

import {
  EXPERT_ENTRY_STAGE,
  MODEL_BASIS_MAX_SHARE,
  STALE_AFTER_DAYS,
  TRUNK_MIN_SHARE,
} from "../src/model.js";

describe("the validator's chosen defaults", () => {
  it("caps the model-basis share at 0.34, about a third", () => {
    expect(MODEL_BASIS_MAX_SHARE).toBe(0.34);
  });

  it("puts the trunk floor at 0.2, a fifth, low on purpose", () => {
    expect(TRUNK_MIN_SHARE).toBe(0.2);
  });

  it("calls a map stale after 90 days, a quarter", () => {
    expect(STALE_AFTER_DAYS).toBe(90);
  });

  it("puts expert entry at S3_AUTHORSHIP", () => {
    expect(EXPERT_ENTRY_STAGE).toBe("S3_AUTHORSHIP");
  });

  /** Two shares that are compared against a count divided by a total, so both have to be fractions
      of one. A share of 34 rather than 0.34 would silence warning rule 1 on every map there is. */
  it("keeps both shares as fractions of one, which is what they are compared against", () => {
    for (const share of [MODEL_BASIS_MAX_SHARE, TRUNK_MIN_SHARE]) {
      expect(share).toBeGreaterThan(0);
      expect(share).toBeLessThan(1);
    }
  });
});
