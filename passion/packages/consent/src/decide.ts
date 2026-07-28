import {
  RETENTION_REVIEW_DAYS,
  type ConsentDecision,
  type ConsentRecord,
  type Purpose,
} from "./model.js";

const DAY_MS = 86_400_000;

const parse = (iso: string): number | null => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
};

/**
 * May we collect or use this child's data for this purpose, right now?
 *
 * Denies by default and in every ambiguous case, which is the only defensible direction: the cost
 * of a wrong "no" is a guide seeing a blocked banner, and the cost of a wrong "yes" is a child's
 * data collected without permission. An unparseable timestamp therefore denies rather than being
 * skipped, because a record we cannot read is a record we cannot rely on.
 *
 * The most specific reason wins when several records exist for a child. A withdrawal outranks
 * everything, because a guardian who has taken consent back has taken it back regardless of what
 * else is on file.
 */
export function decideConsent(
  records: readonly ConsentRecord[],
  kidId: string,
  purpose: Purpose,
  now: string,
): ConsentDecision {
  const t = parse(now);
  if (t === null) return { allowed: false, reason: "no-record" };

  const mine = records.filter((r) => r.kidId === kidId);
  if (mine.length === 0) return { allowed: false, reason: "no-record" };

  // A withdrawal is absolute and is checked before anything else, including before we look at
  // whether the withdrawn record even covered this purpose. Someone who says stop means stop.
  if (mine.some((r) => r.withdrawnAt !== undefined && (parse(r.withdrawnAt) ?? 0) <= t)) {
    return { allowed: false, reason: "withdrawn" };
  }

  const forPurpose = mine.filter((r) => r.purposes.includes(purpose));
  if (forPurpose.length === 0) return { allowed: false, reason: "purpose-not-granted" };

  const live = forPurpose.filter((r) => {
    if (r.expiresAt === undefined) return true;
    const exp = parse(r.expiresAt);
    return exp !== null && exp > t;
  });
  if (live.length === 0) return { allowed: false, reason: "expired" };

  // Newest grant decides the review clock: a guardian who re-consented last week has reviewed it,
  // whatever an older record says.
  const newest = live.reduce((a, b) =>
    (parse(a.grantedAt) ?? 0) >= (parse(b.grantedAt) ?? 0) ? a : b,
  );
  const granted = parse(newest.grantedAt);
  if (granted === null) return { allowed: false, reason: "no-record" };

  const ageDays = (t - granted) / DAY_MS;
  if (ageDays > RETENTION_REVIEW_DAYS) return { allowed: false, reason: "stale-needs-review" };

  // Warn a month out, so the review lands before the block does rather than because of it.
  return ageDays > RETENTION_REVIEW_DAYS - 30
    ? { allowed: true, reviewDue: true }
    : { allowed: true };
}

/** Record a withdrawal without destroying the grant it withdraws. */
export function withdraw(
  records: readonly ConsentRecord[],
  kidId: string,
  at: string,
): readonly ConsentRecord[] {
  return records.map((r) =>
    r.kidId === kidId && r.withdrawnAt === undefined ? { ...r, withdrawnAt: at } : r,
  );
}
