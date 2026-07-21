import { describe, expect, it } from "vitest";
import * as cohort from "../src/index";
import { caliper8 } from "./fixtures/caliper-8";

describe("smoke", () => {
  it("package entrypoint loads", () => {
    expect(cohort).toBeTypeOf("object");
  });

  it("seed fixture caliper-8 has 8 learners with unique refs", () => {
    expect(caliper8.pool).toHaveLength(8);
    expect(new Set(caliper8.pool.map((learner) => learner.learnerRef)).size).toBe(8);
  });
});
