import { describe, it, expect } from "vitest";
import {
  OPPORTUNITY_KINDS,
  MENTOR_SOURCE_LAYERS,
  AUDIENCE_CHANNELS,
  VETTING_STATUSES,
  HANDOFF_STATES,
  MENTOR_ROLES,
  AUDIENCE_LEVELS,
  AGE_BANDS,
  type Opportunity,
  type Brokerage,
} from "../src/model.js";

// ── SC-7: type-level guarantee — no gamification field on any broker type ──────────────────────
type Forbidden =
  | "score"
  | "rank"
  | "ranking"
  | "streak"
  | "streaks"
  | "points"
  | "xp"
  | "badge"
  | "badges"
  | "leaderboard"
  | "win"
  | "lose"
  | "childScore"
  | "childFacing";
type AssertNoForbidden<T> = Extract<keyof T, Forbidden> extends never ? true : false;
const _oppNoForbidden: AssertNoForbidden<Opportunity> = true;
const _brkNoForbidden: AssertNoForbidden<Brokerage> = true;
void _oppNoForbidden;
void _brkNoForbidden;

describe("access-broker model constants (spec §4.1)", () => {
  it("pins the exact OpportunityKind set", () => {
    expect(OPPORTUNITY_KINDS).toEqual(["mentor", "audience"]);
  });

  it("pins every mentor source layer (§7.3)", () => {
    expect(MENTOR_SOURCE_LAYERS).toEqual(["AI", "FAMILY", "NEAR_PEER", "THIN_EXPERT", "MASTER"]);
  });

  it("pins every audience channel", () => {
    expect(AUDIENCE_CHANNELS).toEqual(["COMPETITION", "PUBLISHING", "COMMUNITY", "MARKETPLACE"]);
  });

  it("pins the vetting statuses (only vetted surfaces)", () => {
    expect(VETTING_STATUSES).toEqual(["vetted", "pending", "rejected"]);
  });

  it("pins the full access-transfer lifecycle ([D2])", () => {
    expect(HANDOFF_STATES).toEqual([
      "matched",
      "proposed",
      "approved",
      "introduced",
      "active",
      "transferred",
      "declined",
      "held",
    ]);
  });

  it("re-exports the reused ladders in ascending order", () => {
    expect(MENTOR_ROLES).toEqual(["WARM", "TECHNICAL", "DOMAIN_EXPERT", "MASTER"]);
    expect(AUDIENCE_LEVELS).toEqual(["SELF", "MENTOR_PEERS", "REAL_COMMUNITY", "FIELD"]);
    expect(AGE_BANDS).toEqual(["6-8", "9-11", "12-14"]);
  });
});
