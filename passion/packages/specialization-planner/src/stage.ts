// The pure stage detector (spec §3.3). Advance on EVIDENCE OF READINESS — sustained voluntary
// return + craft-floor accumulation + psychosocial-readiness proxies (stretchSeeking,
// producerIdentity) — NEVER on age. The highest qualifying stage wins (S4 → S3 → S2 → S1).
//
// `deriveStage` reads NO age: `monthsInPursuit` is indicative only (surfaced in the rationale by
// the engine, never a gate), so it is structurally impossible to advance a child on a birthday.
// The strain HOLD (§3.5) is applied later, by `planSpecialization` — this function is pure
// readiness ([D1]).
import {
  DEPTH_S2,
  DEPTH_S3,
  DEPTH_S4,
  RETURN_S2,
  RETURN_S3,
  RETURN_S4,
  type PlanInputs,
  type Stage,
} from "./model.js";

export function deriveStage(inputs: PlanInputs): Stage {
  const { voluntaryReturnsRecent: r, depthAccumulation: d, stretchSeeking, producerIdentity } =
    inputs;

  if (producerIdentity && stretchSeeking && d >= DEPTH_S4 && r >= RETURN_S4) {
    return "S4_SIGNATURE";
  }
  if (stretchSeeking && d >= DEPTH_S3 && r >= RETURN_S3) {
    return "S3_AUTHORSHIP";
  }
  if (d >= DEPTH_S2 && r >= RETURN_S2) {
    return "S2_FOUNDATIONS";
  }
  return "S1_IGNITION";
}
