import type { BenefitLCB } from "../../../packages/cohort-compiler/src/model";
import type { BenefitEstimator } from "../../../packages/cohort-compiler/src/ports";

/**
 * Non-production shadow seam for deferred causal-uplift estimation.
 * The host injects already-locked assignment ids; no solve or repair reads this output.
 */
export class ShadowBenefitEstimator implements BenefitEstimator {
  private readonly lockedAssignmentIds: ReadonlySet<string>;

  constructor(lockedAssignmentIds: Iterable<string>) {
    this.lockedAssignmentIds = new Set(lockedAssignmentIds);
  }

  async logAfterLock(assignmentId: string, at: string): Promise<BenefitLCB> {
    if (!this.lockedAssignmentIds.has(assignmentId)) {
      throw new Error(`Cannot log shadow benefit before assignment ${assignmentId} is locked`);
    }

    return {
      assignmentId,
      lcb: 0,
      loggedAt: at,
      shadow: true,
    };
  }
}
