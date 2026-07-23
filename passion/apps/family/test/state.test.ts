/**
 * CI test for the family co-engagement surface's PURE wiring (SC-8 groundwork).
 *
 * The served DOM + the live `window.__qa` contract are verified by the `LOOP_QA` usability gate
 * (spec §9). Here — headless, no jsdom, no network — we pin the pure pieces the page renders and the
 * harness reads: the derived roster, the per-child family read (genuinely derived by
 * `buildPilotRoster` → 016 wellbeing reads → `deriveFamilySignals` → `assessFamily`, with the
 * synthetic guide-observations overlay), the `buildFamilyQaState` snapshot, and the primary action
 * (approve the top coaching card for the family) actually moving `state()` + the family preview.
 */
import { describe, expect, it } from "vitest";
import {
  CHILDREN,
  FAMILY_NOW,
  familyReadForKid,
  observationsForKid,
  rosterEscalationCount,
} from "../app/family-data.js";
import {
  applyApproveTop,
  approvedCards,
  buildFamilyQaState,
  coachingCards,
  topCoachingCardId,
} from "../app/family-state.js";

const ARI = "kid-synthetic-001";
const BEX = "kid-synthetic-002";
const CYRUS = "kid-synthetic-003";
const DULCE = "kid-synthetic-004";

describe("derived roster", () => {
  it("renders the four canonical synthetic kids, Ari first (the window.__qa kid)", () => {
    expect(CHILDREN.map((c) => c.id)).toEqual([ARI, BEX, CYRUS, DULCE]);
    expect(CHILDREN[0]).toEqual({ id: ARI, name: "Ari Mercado" });
    expect(FAMILY_NOW).toBe("2026-04-01T00:00:00.000Z");
  });
});

describe("family reads over the roster (genuinely derived + synthetic guide overlay)", () => {
  it("Ari — healthy → baseline posture, no escalation (the window.__qa kid)", () => {
    const read = familyReadForKid(ARI)!;
    expect(read.pressureWatch.risk).toBe("none");
    expect(read.escalateToHuman).toBe(false);
    expect(read.posture).toEqual({
      autonomySupport: "steady",
      structure: "steady",
      warmth: "non_contingent",
      decoupleWorthFromOutcome: false,
    });
    expect(read.asks).toHaveLength(3);
    expect(read.sharedActivities).toHaveLength(2);
    expect(observationsForKid(ARI)).toEqual([]);
  });

  it("Bex — a synthetic conditional-regard observation → ELEVATED + escalate (counter-cyclical)", () => {
    const read = familyReadForKid(BEX)!;
    expect(read.pressureWatch.risk).toBe("elevated");
    expect(read.escalateToHuman).toBe(true);
    expect(read.pressureWatch.antecedents).toContain("conditional regard");
    // Counter-cyclical: autonomy support UP + decouple worth from outcome.
    expect(read.posture.autonomySupport).toBe("up");
    expect(read.posture.structure).toBe("steady");
    expect(read.posture.decoupleWorthFromOutcome).toBe(true);
    expect(read.escalationReason).toBeTruthy();
    expect(observationsForKid(BEX)).toEqual(["approval made contingent on performance"]);
  });

  it("Cyrus — a synthetic low-engagement observation → build the complex environment (structure up)", () => {
    const read = familyReadForKid(CYRUS)!;
    expect(read.pressureWatch.risk).toBe("none");
    expect(read.escalateToHuman).toBe(false);
    expect(read.posture.autonomySupport).toBe("steady");
    expect(read.posture.structure).toBe("up");
    expect(read.sharedActivities).toHaveLength(3);
    expect(observationsForKid(CYRUS)).toEqual(["little shared co-engagement"]);
  });

  it("every read keeps warmth non-contingent and carries NO reward / streak / score field", () => {
    for (const child of CHILDREN) {
      const read = familyReadForKid(child.id)!;
      expect(read.posture.warmth).toBe("non_contingent");
      for (const key of Object.keys(read)) expect(key.toLowerCase()).not.toMatch(/score|reward|streak|points/);
      for (const key of Object.keys(read.posture))
        expect(key.toLowerCase()).not.toMatch(/score|reward|streak|points/);
    }
  });

  it("the roster review queue counts exactly the escalating children (Bex only → 1)", () => {
    expect(rosterEscalationCount()).toBe(1);
  });
});

describe("coaching cards + buildFamilyQaState", () => {
  it("orders asks before activities; the top card is the primary offer", () => {
    const read = familyReadForKid(ARI)!;
    const cards = coachingCards(read);
    expect(cards).toHaveLength(5); // 3 asks + 2 activities
    expect(cards.slice(0, 3).every((c) => c.kind === "ask")).toBe(true);
    expect(cards.slice(3).every((c) => c.kind === "activity")).toBe(true);
    expect(topCoachingCardId(read)).toBe(`${ARI}::ask::0`);
  });

  it("reports selectedId, risk, roster escalations, and the approved count", () => {
    const read = familyReadForKid(ARI)!;
    expect(buildFamilyQaState(ARI, read, new Set(), rosterEscalationCount())).toEqual({
      kidId: ARI,
      risk: "none",
      escalations: 1,
      approved: 0,
    });
  });
});

describe("primary action — system proposes, human disposes (SC-8)", () => {
  it("approving the top card is observable in state() + the family preview", () => {
    const read = familyReadForKid(ARI)!;
    const before = buildFamilyQaState(ARI, read, new Set(), 1);
    expect(before.approved).toBe(0);
    expect(approvedCards(read, new Set())).toEqual([]); // family preview empty until approval

    const next = applyApproveTop(read, new Set());
    expect(next).not.toBeNull();
    const after = buildFamilyQaState(ARI, read, next!, 1);
    expect(after.approved).toBe(1);
    // The family preview now shows exactly the one approved (top) card.
    const shown = approvedCards(read, next!);
    expect(shown).toHaveLength(1);
    expect(shown[0]!.id).toBe(`${ARI}::ask::0`);
  });

  it("the primary action is a no-op (null) once the top card is already approved", () => {
    const read = familyReadForKid(ARI)!;
    const once = applyApproveTop(read, new Set())!;
    expect(applyApproveTop(read, once)).toBeNull();
  });
});
