import { describe, expect, it } from "vitest";
import { StubAssentRecord } from "../src/index";

describe("StubAssentRecord", () => {
  it("records idempotent learner-scoped reflection withdrawals", async () => {
    const assent = new StubAssentRecord();

    await expect(
      assent.isWithdrawn("synthetic-learner-001", "synthetic-reflection-001"),
    ).resolves.toBe(false);

    await assent.recordWithdrawal("synthetic-learner-001", "synthetic-reflection-001");
    await assent.recordWithdrawal("synthetic-learner-001", "synthetic-reflection-001");

    await expect(
      assent.isWithdrawn("synthetic-learner-001", "synthetic-reflection-001"),
    ).resolves.toBe(true);
    await expect(
      assent.isWithdrawn("synthetic-learner-002", "synthetic-reflection-001"),
    ).resolves.toBe(false);
    await expect(
      assent.isWithdrawn("synthetic-learner-001", "synthetic-reflection-002"),
    ).resolves.toBe(false);
  });
});
