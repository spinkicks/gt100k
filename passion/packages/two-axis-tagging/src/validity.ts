// Validity harness (spec §7) — inter-tagger agreement, the per-topic trust gate, and the review queue.
// Pure/sync. No network. The reliability bar governs whether a topic's tags are TRUSTED (decision [D6]).
import type { TagStatus } from "./records.js";

/** Krippendorff's conventional tentative-reliability threshold (spec §9 golden). */
export const ALPHA_BAR = 0.667;

/**
 * Krippendorff's alpha for nominal data via the closed form:
 *   α = 1 − (n−1)(n − Σ o_cc) / (n² − Σ n_c²)
 * units[i] = ratings for item i across raters (undefined = missing). Units with <2 ratings are skipped.
 */
export function krippendorffAlphaNominal(
  units: ReadonlyArray<ReadonlyArray<string | undefined>>,
): number {
  const o = new Map<string, Map<string, number>>();
  const bump = (a: string, b: string, w: number) => {
    const row = o.get(a) ?? new Map<string, number>();
    row.set(b, (row.get(b) ?? 0) + w);
    o.set(a, row);
  };

  for (const unit of units) {
    const vals = unit.filter((v): v is string => v !== undefined);
    const m = vals.length;
    if (m < 2) continue;
    const w = 1 / (m - 1);
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        if (i === j) continue;
        bump(vals[i]!, vals[j]!, w);
      }
    }
  }

  // marginals
  const nByCat = new Map<string, number>();
  let n = 0;
  for (const [a, row] of o) {
    let rowSum = 0;
    for (const [, w] of row) rowSum += w;
    nByCat.set(a, rowSum);
    n += rowSum;
  }
  if (n === 0) return 1; // no pairable data → treat as no disagreement

  let sumDiag = 0;
  for (const [a, row] of o) sumDiag += row.get(a) ?? 0;

  let sumNc2 = 0;
  for (const [, nc] of nByCat) sumNc2 += nc * nc;

  const denom = n * n - sumNc2;
  if (denom === 0) return 1; // all one category → perfect agreement
  return 1 - ((n - 1) * (n - sumDiag)) / denom;
}

/** The per-topic validity gate: a topic is TRUSTED only when its axis α clears ALPHA_BAR. */
export function topicTrust(alpha: number): TagStatus {
  return alpha >= ALPHA_BAR ? "TRUSTED" : "PROVISIONAL";
}

/**
 * Consumer helper wiring the trust gate to an artifact: set `tagStatus` from its topic's inter-rater
 * alpha. Exported so the guide console / inference layer (C3/C4) promote a topic's artifacts from
 * PROVISIONAL to TRUSTED once its tags clear ALPHA_BAR — the validity gate is not dead code.
 */
export function applyTrust<T extends { readonly tagStatus: TagStatus }>(
  artifact: T,
  topicAlpha: number,
): T {
  return { ...artifact, tagStatus: topicTrust(topicAlpha) };
}

/** An item awaiting human spot-audit (spec §7): low-confidence auto-tags, unresolved actions, audit samples. */
export interface ReviewItem {
  readonly id: string;
  readonly reason: "low-confidence" | "unresolved" | "audit-sample";
}

export interface ReviewQueue {
  enqueue(item: ReviewItem): void;
  list(): readonly ReviewItem[];
  resolve(id: string, outcome: "promoted" | "corrected" | "rejected"): void;
}

/** In-memory review queue; keyed by item id so re-enqueue is idempotent, resolve removes. */
export function createReviewQueue(): ReviewQueue {
  const items = new Map<string, ReviewItem>();
  return {
    enqueue(item) {
      items.set(item.id, item);
    },
    list() {
      return [...items.values()];
    },
    resolve(id) {
      items.delete(id);
    },
  };
}
