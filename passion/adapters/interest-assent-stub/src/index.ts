import type { AssentRecordPort } from "@gt100k/interest-lab-domain";

/** Synthetic, learner-scoped withdrawal record; it has no program-access capability. */
export class StubAssentRecord implements AssentRecordPort {
  private readonly withdrawals = new Set<string>();

  isWithdrawn(learnerRef: string, reflectionId: string): Promise<boolean> {
    return Promise.resolve(this.withdrawals.has(this.key(learnerRef, reflectionId)));
  }

  recordWithdrawal(learnerRef: string, reflectionId: string): Promise<void> {
    this.withdrawals.add(this.key(learnerRef, reflectionId));
    return Promise.resolve();
  }

  private key(learnerRef: string, reflectionId: string): string {
    return JSON.stringify([learnerRef, reflectionId]);
  }
}
