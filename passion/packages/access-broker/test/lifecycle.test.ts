import { describe, it, expect } from "vitest";
import {
  proposeMatch,
  approve,
  advanceHandoff,
  declineMatch,
  type SpikeRef,
} from "../src/lifecycle.js";
import { brokerAccess } from "../src/broker.js";
import { stubCatalog } from "../src/catalog.js";
import type { Match } from "../src/broker.js";
import { PLAN_S3 } from "../src/__fixtures__/plans.js";
import { okWellbeing } from "../src/__fixtures__/wellbeing.js";

const NOW = "2026-07-24T00:00:00.000Z";
const LATER = "2026-07-25T00:00:00.000Z";
const spike: SpikeRef = { kidId: PLAN_S3.kidId, cellKey: PLAN_S3.cellKey };

function firstMentorMatch(): Match {
  const bp = brokerAccess(
    {
      plan: PLAN_S3,
      wellbeing: okWellbeing(PLAN_S3.kidId, PLAN_S3.cellKey),
      ageBand: "9-11",
      existing: [],
    },
    { catalog: stubCatalog },
    NOW,
  );
  return bp.mentorMatches[0]!;
}

describe("lifecycle transitions (SC-2)", () => {
  it("proposeMatch → state proposed, content-derived stable id, no consent yet", () => {
    const m = firstMentorMatch();
    const b = proposeMatch(m, spike, NOW);
    expect(b.state).toBe("proposed");
    expect(b.opportunityId).toBe(m.opportunity.id);
    expect(b.kind).toBe("mentor");
    expect(b.guardianConsent).toBeUndefined();
    expect(b.id).toBe(proposeMatch(m, spike, NOW).id); // deterministic id
    expect(b.id).toMatch(/^brk_[0-9a-f]{8}$/);
  });

  it("approve REFUSES without guardianConsent === true (CONSENT_REQUIRED hard blocker)", () => {
    const b = proposeMatch(firstMentorMatch(), spike, NOW);
    expect(() => approve(b, { guardianConsent: false, guideId: "guide-1" }, LATER)).toThrow(
      "CONSENT_REQUIRED",
    );
    // @ts-expect-error — consent must be an explicit boolean true
    expect(() => approve(b, { guideId: "guide-1" }, LATER)).toThrow("CONSENT_REQUIRED");
  });

  it("approve SUCCEEDS with consent → approved, records guide + consent", () => {
    const b = proposeMatch(firstMentorMatch(), spike, NOW);
    const a = approve(b, { guardianConsent: true, guideId: "guide-1" }, LATER);
    expect(a.state).toBe("approved");
    expect(a.guardianConsent).toBe(true);
    expect(a.approvedBy).toBe("guide-1");
    expect(a.updatedAt).toBe(LATER);
    // the input is not mutated (pure).
    expect(b.state).toBe("proposed");
  });

  it("advanceHandoff walks approved → introduced → active → transferred in order", () => {
    let b = approve(
      proposeMatch(firstMentorMatch(), spike, NOW),
      { guardianConsent: true, guideId: "g" },
      NOW,
    );
    b = advanceHandoff(b, "introduced", NOW, {
      warmIntro: true,
      overlap: true,
      whyNow: "deadline soon",
    });
    expect(b.state).toBe("introduced");
    expect(b.handoff).toEqual({ warmIntro: true, overlap: true, whyNow: "deadline soon" });
    b = advanceHandoff(b, "active", NOW);
    expect(b.state).toBe("active");
    b = advanceHandoff(b, "transferred", NOW);
    expect(b.state).toBe("transferred");
  });

  it("advanceHandoff rejects skips and reversals", () => {
    const approved = approve(
      proposeMatch(firstMentorMatch(), spike, NOW),
      { guardianConsent: true, guideId: "g" },
      NOW,
    );
    expect(() => advanceHandoff(approved, "active", NOW)).toThrow("INVALID_TRANSITION"); // skip
    expect(() => advanceHandoff(approved, "transferred", NOW)).toThrow("INVALID_TRANSITION");
    const active = advanceHandoff(advanceHandoff(approved, "introduced", NOW), "active", NOW);
    expect(() => advanceHandoff(active, "introduced", NOW)).toThrow("INVALID_TRANSITION"); // reversal
  });

  it("approve only from proposed; declineMatch → declined", () => {
    const approved = approve(
      proposeMatch(firstMentorMatch(), spike, NOW),
      { guardianConsent: true, guideId: "g" },
      NOW,
    );
    expect(() => approve(approved, { guardianConsent: true, guideId: "g" }, NOW)).toThrow(
      "INVALID_TRANSITION",
    );
    const declined = declineMatch(proposeMatch(firstMentorMatch(), spike, NOW), NOW);
    expect(declined.state).toBe("declined");
  });
});
