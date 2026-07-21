import type { SignalSummary } from "./events";

export interface CandidateGateEvaluation {
  eligible: boolean;
  missing: string[];
}

export function evaluateCandidateGate(summary: SignalSummary): CandidateGateEvaluation {
  const families = new Set(summary.familiesPresent);
  const missing: string[] = [];

  if (families.size < 3) {
    missing.push(`<3 signal families (have ${families.size}, need 3)`);
  }
  if (!families.has("voluntary_return")) {
    missing.push("no delayed-discretionary signal");
  }
  if (!families.has("artifact_competence")) {
    missing.push("no artifact/competence signal");
  }

  return {
    eligible: missing.length === 0,
    missing,
  };
}
