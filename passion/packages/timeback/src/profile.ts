// The immutable profile hook (spec §3.6). Returns a NEW StudentProfile with `priors` replaced and
// `updatedAt` set to the caller's value (the snapshot's asOf when wired). It does NOT touch the interaction
// log, the store, or `runCycle` — the next `runCycle` simply folds the new priors via `foldEvents`. It lives
// here (not in @gt100k/student-profile) so the student-profile package is never edited (disjoint from 018/019).
import type { DomainPrior } from "@gt100k/interest-inference";
import type { StudentProfile } from "@gt100k/student-profile";

/**
 * Replace a profile's priors immutably. `updatedAt` defaults to the profile's current value (unchanged) and
 * is bumped when the caller passes the snapshot's `asOf`. Every other field is preserved by reference.
 */
export function withPriors(
  profile: StudentProfile,
  priors: readonly DomainPrior[],
  updatedAt: string = profile.updatedAt,
): StudentProfile {
  return { ...profile, priors, updatedAt };
}
