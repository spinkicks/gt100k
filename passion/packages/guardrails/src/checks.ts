// checkCompliance — each locked pipeline rule (GC1–GC6) turned into an executable check (spec §3.2).
// Pure + deterministic; aggregate/never kid-facing. Scans object KEYS (shape), never string VALUES —
// an evidence string containing the word "score" is fine; a *field named* `score` is not.
import { getForKid, type InterestHypothesis } from "@gt100k/hypothesis-store";
import type { Roster } from "@gt100k/student-profile";
import {
  GAMIFICATION_KEYS,
  SCALAR_KEYS,
  type CheckResult,
  type ComplianceReport,
  type Violation,
} from "./model.js";

// Raw novelty / first-exposure markers (012/011 — triggered situational interest is discounted).
// The clean roster never carries these in `supporting` (novelty events are excluded from the fold).
const NOVELTY_MARKERS: readonly string[] = ["novelty", "first_exposure", "novel"];

/** Token before any `:count` suffix (supporting/disconfirming entries are `kind` or `kind:count`). */
function token(entry: string): string {
  return entry.split(":")[0] ?? entry;
}

/** A human transition is one whose actor role is not SYSTEM/MODEL (actor persists the id, e.g. "guide-…"). */
function isHumanActor(actor: string): boolean {
  const role = actor.toUpperCase();
  return role !== "SYSTEM" && role !== "MODEL";
}

/** Recursively visit every object key in `value`, reporting any that is a banned field name. */
function scanBannedKeys(value: unknown, banned: readonly string[], onHit: (key: string) => void): void {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) scanBannedKeys(item, banned, onHit);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (banned.includes(key)) onHit(key);
    scanBannedKeys(child, banned, onHit);
  }
}

function result(id: string, name: string, violations: readonly Violation[]): CheckResult {
  const ok = violations.length === 0;
  return { id, name, ok, detail: ok ? `${name}: clean` : `${violations.length} violation(s)` };
}

/**
 * Run the six guardrail checks over the roster:
 * - GC1 no scalar score / fixed label (banned key scan);
 * - GC2 prompted ≠ voluntary (`prompted_return` never in `supporting`);
 * - GC3 novelty discounted (no raw novelty marker in `supporting`);
 * - GC4 no auto-promotion (every CANDIDATE/ACTIVE has a human transition into that state in history);
 * - GC5 no demote on silence (no EMERGING→EXPLORING history entry);
 * - GC6 no gamification (banned key scan).
 * `report.ok = checks.every(ok)`.
 */
export function checkCompliance(roster: Roster): ComplianceReport {
  const all: InterestHypothesis[] = [];
  for (const [kidId, profile] of roster) all.push(...getForKid(profile.store, kidId));

  const gc1: Violation[] = [];
  const gc2: Violation[] = [];
  const gc3: Violation[] = [];
  const gc4: Violation[] = [];
  const gc5: Violation[] = [];
  const gc6: Violation[] = [];

  for (const h of all) {
    const where = { kidId: h.kidId, cellKey: h.cellKey };

    // GC1 — no scalar/label field anywhere on the hypothesis (incl. evidence + history).
    scanBannedKeys(h, SCALAR_KEYS, (key) =>
      gc1.push({ checkId: "GC1", ...where, message: `banned scalar/label field "${key}"` }),
    );

    // GC6 — no gamification field anywhere on the hypothesis.
    scanBannedKeys(h, GAMIFICATION_KEYS, (key) =>
      gc6.push({ checkId: "GC6", ...where, message: `banned gamification field "${key}"` }),
    );

    // GC2 — a prompted return is weak/disconfirming, never a voluntary return in `supporting`.
    if (h.evidence.supporting.some((s) => token(s) === "prompted_return")) {
      gc2.push({ checkId: "GC2", ...where, message: `prompted_return counted as voluntary in supporting` });
    }

    // GC3 — confidence is never attributable to a raw novelty / first-exposure signal.
    const novelty = h.evidence.supporting.find((s) => NOVELTY_MARKERS.includes(token(s)));
    if (novelty) {
      gc3.push({ checkId: "GC3", ...where, message: `raw novelty marker "${novelty}" in supporting` });
    }

    // GC4 — a CANDIDATE/ACTIVE must have been put there by a human transition in history.
    if (h.state === "CANDIDATE" || h.state === "ACTIVE") {
      const humanPromote = h.history.some((e) => e.to === h.state && isHumanActor(e.actor));
      if (!humanPromote) {
        gc4.push({ checkId: "GC4", ...where, message: `${h.state} lacks a human transition into ${h.state}` });
      }
    }

    // GC5 — no demote on silence.
    if (h.history.some((e) => e.from === "EMERGING" && e.to === "EXPLORING")) {
      gc5.push({ checkId: "GC5", ...where, message: `illegal demote EMERGING→EXPLORING in history` });
    }
  }

  const checks: readonly CheckResult[] = [
    result("GC1", "no scalar score / fixed label", gc1),
    result("GC2", "prompted ≠ voluntary", gc2),
    result("GC3", "novelty discounted", gc3),
    result("GC4", "no auto-promotion", gc4),
    result("GC5", "no demote on silence", gc5),
    result("GC6", "no gamification", gc6),
  ];
  const violations: readonly Violation[] = [...gc1, ...gc2, ...gc3, ...gc4, ...gc5, ...gc6];

  return { ok: checks.every((c) => c.ok), checks, violations };
}
