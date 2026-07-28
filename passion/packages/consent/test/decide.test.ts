/**
 * The gate that blocks live use.
 *
 * Every case here is written from the same asymmetry: a wrong "no" shows a guide a blocked banner,
 * and a wrong "yes" collects a child's data without permission. So the tests are mostly about the
 * denials, and specifically about denying in the situations where a permissive reading would have
 * been easy — a missing record, an unreadable date, a grant that covers something else.
 */
import { describe, expect, it } from "vitest";

import { decideConsent, withdraw } from "../src/decide.js";
import { RETENTION_REVIEW_DAYS, type ConsentRecord } from "../src/model.js";

const KID = "kid-1";
const NOW = "2026-07-27T00:00:00.000Z";
const daysBefore = (n: number): string => new Date(Date.parse(NOW) - n * 86_400_000).toISOString();

const grant = (over: Partial<ConsentRecord> = {}): ConsentRecord => ({
  kidId: KID,
  guardianRef: "guardian-1",
  method: "signed-form",
  purposes: ["discovery-measurement"],
  grantedAt: daysBefore(10),
  ...over,
});

describe("no record means no", () => {
  it("denies a child nobody has consented for", () => {
    expect(decideConsent([], KID, "discovery-measurement", NOW)).toEqual({
      allowed: false,
      reason: "no-record",
    });
  });

  it("does not let one child's consent cover another", () => {
    const d = decideConsent([grant({ kidId: "kid-2" })], KID, "discovery-measurement", NOW);
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("no-record");
  });
});

describe("consent is per purpose", () => {
  it("allows the purpose that was granted", () => {
    expect(decideConsent([grant()], KID, "discovery-measurement", NOW).allowed).toBe(true);
  });

  it("refuses one that was not, however similar", () => {
    // Agreeing that we may measure a child's interests is not agreeing to put their work in front
    // of a stranger. A single yes covering every future use is what purpose limitation prevents.
    const d = decideConsent([grant()], KID, "external-audience", NOW);
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("purpose-not-granted");
  });
});

describe("withdrawal is absolute", () => {
  it("stops collection even where a grant covers the purpose", () => {
    const records = withdraw([grant()], KID, daysBefore(1));
    const d = decideConsent(records, KID, "discovery-measurement", NOW);
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("withdrawn");
  });

  it("is not undone by a second, still-valid grant on file", () => {
    // Two records, one withdrawn and one not. Someone who says stop means stop, and the reading
    // that finds any surviving yes is the reading that ignores them.
    const records = [
      { ...grant(), withdrawnAt: daysBefore(1) },
      grant({ guardianRef: "guardian-2" }),
    ];
    expect(decideConsent(records, KID, "discovery-measurement", NOW).reason).toBe("withdrawn");
  });

  it("keeps the withdrawn record rather than deleting it", () => {
    const records = withdraw([grant()], KID, daysBefore(1));
    expect(records).toHaveLength(1);
    expect(records[0]!.grantedAt).toBe(grant().grantedAt);
  });

  it("does not re-stamp an already-withdrawn record", () => {
    const once = withdraw([grant()], KID, daysBefore(5));
    const twice = withdraw(once, KID, daysBefore(1));
    expect(twice[0]!.withdrawnAt).toBe(daysBefore(5));
  });
});

describe("consent does not last forever", () => {
  it("denies past an explicit expiry", () => {
    const d = decideConsent(
      [grant({ expiresAt: daysBefore(1) })],
      KID,
      "discovery-measurement",
      NOW,
    );
    expect(d.reason).toBe("expired");
  });

  it("denies an unreviewed grant older than the retention window", () => {
    const old = grant({ grantedAt: daysBefore(RETENTION_REVIEW_DAYS + 1) });
    expect(decideConsent([old], KID, "discovery-measurement", NOW).reason).toBe(
      "stale-needs-review",
    );
  });

  it("warns before it blocks, so the review lands first", () => {
    const nearly = grant({ grantedAt: daysBefore(RETENTION_REVIEW_DAYS - 10) });
    const d = decideConsent([nearly], KID, "discovery-measurement", NOW);
    expect(d).toEqual({ allowed: true, reviewDue: true });
  });

  it("lets a fresh re-consent reset the clock", () => {
    const records = [grant({ grantedAt: daysBefore(RETENTION_REVIEW_DAYS + 1) }), grant()];
    expect(decideConsent(records, KID, "discovery-measurement", NOW)).toEqual({ allowed: true });
  });
});

describe("anything unreadable is a no", () => {
  it("denies on an unparseable grant date rather than skipping the check", () => {
    const d = decideConsent(
      [grant({ grantedAt: "not a date" })],
      KID,
      "discovery-measurement",
      NOW,
    );
    expect(d.allowed).toBe(false);
  });

  it("denies on an unparseable expiry, which is the direction that costs least", () => {
    const d = decideConsent([grant({ expiresAt: "soon" })], KID, "discovery-measurement", NOW);
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("expired");
  });

  it("denies when the clock itself is nonsense", () => {
    expect(decideConsent([grant()], KID, "discovery-measurement", "???").allowed).toBe(false);
  });
});

describe("the method is recorded, not flattened", () => {
  it("allows a guide-asserted grant while keeping it distinguishable", () => {
    // A guide typing that a parent said yes is NOT verifiable parental consent. It is what a pilot
    // will actually have, so it is allowed; it is kept as its own value so a stricter policy can
    // refuse it later without every record having to be re-read.
    const records = [grant({ method: "guide-asserted" })];
    expect(decideConsent(records, KID, "discovery-measurement", NOW).allowed).toBe(true);
    expect(records[0]!.method).toBe("guide-asserted");
  });
});
