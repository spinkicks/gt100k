// Types + golden constants for the honesty layer (spec §3.1, §3.4).
// Program metrics are aggregate / never kid-facing; each locked pipeline rule is an executable check.
import type { Lifecycle } from "@gt100k/hypothesis-store";

/** Aggregate, program-level health signals over the 014 roster — never kid-facing. */
export interface ProgramMetrics {
  /** number of kids in the roster */
  readonly kids: number;
  /** lifecycle funnel — counts across all kids' hypotheses */
  readonly funnel: Record<Lifecycle, number>;
  readonly coverage: {
    /** mean distinct `domainPath[0]` sampled per kid */
    readonly avgDomainsPerKid: number;
    /** fraction of kids sampling ≥ COVERAGE_MIN_DOMAINS distinct domains */
    readonly pctKidsCoveragePass: number;
  };
  readonly calibration: {
    /** confident / total hypotheses */
    readonly confidentRate: number;
    /** (EXPLORING & !confident) / total hypotheses — "not sure yet" is a real state */
    readonly notSureYetRate: number;
  };
  /** fraction of hypotheses whose history includes a REOPENED transition */
  readonly reopenRate: number;
}

/** Outcome of one guardrail check (GC1–GC6). */
export interface CheckResult {
  readonly id: string;
  readonly name: string;
  readonly ok: boolean;
  readonly detail: string;
}

/** A single flagged violation of a locked rule. */
export interface Violation {
  readonly checkId: string;
  readonly kidId?: string;
  readonly cellKey?: string;
  readonly message: string;
}

/** The full compliance report: every check + every violation; `ok` iff all checks pass. */
export interface ComplianceReport {
  readonly ok: boolean;
  readonly checks: readonly CheckResult[];
  readonly violations: readonly Violation[];
}

// Golden constants — spec §3.4. Do not change without changing the spec.

/** Domains a kid should sample for the coverage pass (self-fulfilling-loop watch). */
export const COVERAGE_MIN_DOMAINS = 6;

/** Banned gamification field names (GC6 / 016 burnout guardrail #1). */
export const GAMIFICATION_KEYS = [
  "streak",
  "points",
  "reward",
  "xp",
  "badge",
  "leaderboard",
] as const;

/** Banned scalar/label field names (GC1 / 011+013 D4 — never a single summed score or fixed label). */
export const SCALAR_KEYS = ["score", "rating", "passionScore", "label"] as const;
