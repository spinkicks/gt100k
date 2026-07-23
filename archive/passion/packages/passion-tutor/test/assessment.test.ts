import { describe, expect, it } from "vitest";

import {
  GOLDEN_ANSWER_FIXTURES,
  GOLDEN_PROJECT_PROFILE,
} from "../src/__fixtures__/answer-fixtures.js";
import { assessAnswer } from "../src/public.js";

describe("answer assessment (SC-3)", () => {
  it.each(GOLDEN_ANSWER_FIXTURES)(
    "matches the golden score for $name",
    ({ answer, expectedScore }) => {
      expect(assessAnswer(answer, GOLDEN_PROJECT_PROFILE)).toBeCloseTo(expectedScore, 3);
    },
  );

  it("clamps a maximally signaled answer to one", () => {
    const answer = Array.from(
      { length: 10 },
      (_, index) => `Arduino ${index} robotics because first then next`,
    ).join(" ");

    expect(assessAnswer(answer, GOLDEN_PROJECT_PROFILE)).toBe(1);
  });
});
