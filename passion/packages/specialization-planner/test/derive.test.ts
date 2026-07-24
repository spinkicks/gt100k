import { describe, it, expect } from "vitest";
import { derivePlanInputs } from "../src/derive.js";
import { deriveStage } from "../src/stage.js";
import { planSpecialization } from "../src/plan.js";
import { stubBriefGenerator } from "../src/stub-generator.js";
import { DEPTH_S3, RETURN_S3 } from "../src/model.js";
import { calmWellbeing, strainWellbeing } from "../src/__fixtures__/inputs.js";
import {
  buildS3Profile,
  DERIVE_CATALOG,
  DERIVE_CELL_KEY,
  DERIVE_KID,
  DERIVE_NOW,
} from "../src/__fixtures__/derive-profile.js";

const deps = { generator: stubBriefGenerator };

describe("derivePlanInputs (SC-11) — from the 014 log + 013 store + a 016 read", () => {
  const profile = buildS3Profile();

  it("derives S3_AUTHORSHIP readiness signals from a sustained, stretch-seeking log", () => {
    const inputs = derivePlanInputs(
      profile,
      profile.store,
      DERIVE_CELL_KEY,
      calmWellbeing(DERIVE_KID, DERIVE_CELL_KEY),
      DERIVE_NOW,
      DERIVE_CATALOG,
    );
    expect(inputs).not.toBeNull();
    if (!inputs) return;
    expect(inputs.kidId).toBe(DERIVE_KID);
    expect(inputs.cellKey).toBe(DERIVE_CELL_KEY);
    expect(inputs.domainPath).toEqual(["music-sound", "production"]);
    expect(inputs.mode).toBe("build");
    expect(inputs.voluntaryReturnsRecent).toBeGreaterThanOrEqual(RETURN_S3);
    expect(inputs.depthAccumulation).toBeGreaterThanOrEqual(DEPTH_S3);
    expect(inputs.stretchSeeking).toBe(true);
    expect(inputs.producerIdentity).toBe(false);
    expect(inputs.monthsInPursuit).toBeGreaterThan(0); // indicative only
    expect(deriveStage(inputs)).toBe("S3_AUTHORSHIP");
  });

  it("the derived inputs make planSpecialization read S3_AUTHORSHIP", async () => {
    const inputs = derivePlanInputs(
      profile,
      profile.store,
      DERIVE_CELL_KEY,
      calmWellbeing(DERIVE_KID, DERIVE_CELL_KEY),
      DERIVE_NOW,
      DERIVE_CATALOG,
    );
    if (!inputs) throw new Error("expected inputs");
    const plan = await planSpecialization(inputs, deps, DERIVE_NOW);
    expect(plan.stage).toBe("S3_AUTHORSHIP");
    expect(plan.mentorRole).toBe("DOMAIN_EXPERT");
    expect(plan.audience).toBe("REAL_COMMUNITY");
  });

  it("a strained variant (same readiness + rest/back-off) is HELD at S2 with escalation", async () => {
    const inputs = derivePlanInputs(
      profile,
      profile.store,
      DERIVE_CELL_KEY,
      strainWellbeing(DERIVE_KID, DERIVE_CELL_KEY),
      DERIVE_NOW,
      DERIVE_CATALOG,
    );
    if (!inputs) throw new Error("expected inputs");
    // readiness alone still reads S3 — the strain is folded in by the engine, not the deriver
    expect(deriveStage(inputs)).toBe("S3_AUTHORSHIP");
    const plan = await planSpecialization(inputs, deps, DERIVE_NOW);
    expect(plan.stage).toBe("S2_FOUNDATIONS"); // held below the readiness stage
    expect(plan.replan.holdStage).toBe(true);
    expect(plan.escalateToHuman).toBe(true);
  });

  it("a cell with no voluntary engagement is NOT planned (returns null)", () => {
    const none = derivePlanInputs(
      profile,
      profile.store,
      "science-nature/botany::investigate",
      calmWellbeing(DERIVE_KID, "science-nature/botany::investigate"),
      DERIVE_NOW,
      DERIVE_CATALOG,
    );
    expect(none).toBeNull();
  });

  it("no catalog ⇒ the log can't resolve to cells ⇒ null (never a fabricated plan)", () => {
    const none = derivePlanInputs(
      profile,
      profile.store,
      DERIVE_CELL_KEY,
      calmWellbeing(DERIVE_KID, DERIVE_CELL_KEY),
      DERIVE_NOW,
    );
    expect(none).toBeNull();
  });
});
