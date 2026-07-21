import { describe, expect, it } from "vitest";
import { benefitOf } from "../../../packages/cohort-compiler/src/benefit";
import { generateCandidates } from "../../../packages/cohort-compiler/src/candidates";
import type { BenefitLCB } from "../../../packages/cohort-compiler/src/model";
import type { BenefitEstimator } from "../../../packages/cohort-compiler/src/ports";
import type { repairCohort } from "../../../packages/cohort-compiler/src/repair";
import type { assignCohorts } from "../../../packages/cohort-compiler/src/solver";
import { churnRollback } from "../../../packages/cohort-compiler/test/fixtures/churn-rollback";
import { cohort12 } from "../../../packages/cohort-compiler/test/fixtures/cohort-12";
import { safeguardingShadow } from "../../../packages/cohort-compiler/test/fixtures/safeguarding-shadow";
import { ShadowBenefitEstimator } from "../src/index";

type ForbiddenShadowKey = "benefitEstimator" | "lcb" | "learnedModel" | "shadow";

type HasForbiddenShadowKey<Value> = Value extends (...args: infer _Arguments) => unknown
  ? false
  : Value extends readonly (infer Item)[]
    ? HasForbiddenShadowKey<Item>
    : Value extends object
      ? true extends {
          [Key in keyof Value]-?: Key extends ForbiddenShadowKey
            ? true
            : HasForbiddenShadowKey<Value[Key]>;
        }[keyof Value]
        ? true
        : false
      : false;

type InputsHaveForbiddenShadowKey<Inputs extends readonly unknown[]> = true extends {
  [Index in keyof Inputs]-?: HasForbiddenShadowKey<Inputs[Index]>;
}[number]
  ? true
  : false;

const solveInputsHaveNoShadowData: InputsHaveForbiddenShadowKey<Parameters<typeof assignCohorts>> =
  false;
const repairInputsHaveNoShadowData: InputsHaveForbiddenShadowKey<Parameters<typeof repairCohort>> =
  false;

function nestedKeys(value: unknown): string[] {
  if (value === null || typeof value !== "object") {
    return [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => [
    key,
    ...nestedKeys(nested),
  ]);
}

describe("BenefitEstimator shadow adapter (T018, FR-019, SC-006)", () => {
  it("returns Fixture D's exact placeholder only for a locked assignment", async () => {
    const estimator: BenefitEstimator = new ShadowBenefitEstimator(["asg-1"]);

    await expect(
      estimator.logAfterLock("asg-1", safeguardingShadow.expected.shadowBenefit.loggedAt),
    ).resolves.toEqual(safeguardingShadow.expected.shadowBenefit);
  });

  it("produces no estimate before an assignment is locked", async () => {
    const estimator: BenefitEstimator = new ShadowBenefitEstimator([]);

    await expect(
      estimator.logAfterLock("asg-1", safeguardingShadow.expected.shadowBenefit.loggedAt),
    ).rejects.toThrow("Cannot log shadow benefit before assignment asg-1 is locked");
  });

  it("keeps shadow output absent from every solve and repair input", () => {
    const solveInputs = [
      cohort12.pool,
      generateCandidates(cohort12.pool, cohort12.caliper),
      cohort12.withBenefitOf(benefitOf),
      cohort12.weights,
      cohort12.churn,
    ] satisfies Parameters<typeof assignCohorts>;
    const repairInputs = [
      churnRollback.assignments.asg2,
      churnRollback.budgets.capTwo,
      churnRollback.assignments.asg1,
    ] satisfies Parameters<typeof repairCohort>;
    const forbidden = new Set<ForbiddenShadowKey>([
      "benefitEstimator",
      "lcb",
      "learnedModel",
      "shadow",
    ]);
    const observedForbiddenKeys = [...nestedKeys(solveInputs), ...nestedKeys(repairInputs)].filter(
      (key): key is ForbiddenShadowKey => forbidden.has(key as ForbiddenShadowKey),
    );

    expect(solveInputsHaveNoShadowData).toBe(false);
    expect(repairInputsHaveNoShadowData).toBe(false);
    expect(observedForbiddenKeys).toEqual([]);
  });

  it("conforms to the shadow port without widening the golden output", async () => {
    const estimator = new ShadowBenefitEstimator(["asg-1"]);
    const result: BenefitLCB = await estimator.logAfterLock(
      "asg-1",
      safeguardingShadow.expected.shadowBenefit.loggedAt,
    );

    expect(Object.keys(result).sort()).toEqual(["assignmentId", "lcb", "loggedAt", "shadow"]);
    expect(result.shadow).toBe(true);
  });
});
