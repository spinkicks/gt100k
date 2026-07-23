import { describe, it, expect } from "vitest";
import { deriveStage } from "../src/stage.js";
import {
  INPUTS_S1,
  INPUTS_S2,
  INPUTS_S3,
  INPUTS_S4,
  INPUTS_S3_OLD,
  INPUTS_HIGH_MONTHS_LOW_READINESS,
} from "../src/__fixtures__/inputs.js";

describe("deriveStage — readiness thresholds, highest qualifying wins (spec §3.3)", () => {
  it("maps each stage's readiness bundle to its stage (SC-1)", () => {
    expect(deriveStage(INPUTS_S1)).toBe("S1_IGNITION");
    expect(deriveStage(INPUTS_S2)).toBe("S2_FOUNDATIONS");
    expect(deriveStage(INPUTS_S3)).toBe("S3_AUTHORSHIP");
    expect(deriveStage(INPUTS_S4)).toBe("S4_SIGNATURE");
  });

  it("does NOT advance to S3 without stretch-seeking (foundations without authorship)", () => {
    // S2 readiness has the S3 depth/return but no stretchSeeking → held at S2.
    const almostS3 = { ...INPUTS_S3, stretchSeeking: false };
    expect(deriveStage(almostS3)).toBe("S2_FOUNDATIONS");
  });

  it("does NOT advance to S4 without producer identity (authorship without signature)", () => {
    const almostS4 = { ...INPUTS_S4, producerIdentity: false };
    expect(deriveStage(almostS4)).toBe("S3_AUTHORSHIP");
  });
});

describe("readiness NOT age (SC-2)", () => {
  it("identical readiness signals + wildly different monthsInPursuit ⇒ the SAME stage", () => {
    expect(INPUTS_S3.monthsInPursuit).not.toBe(INPUTS_S3_OLD.monthsInPursuit);
    expect(deriveStage(INPUTS_S3)).toBe("S3_AUTHORSHIP");
    expect(deriveStage(INPUTS_S3_OLD)).toBe("S3_AUTHORSHIP");
  });

  it("high monthsInPursuit + low readiness ⇒ still S1 (age never gates)", () => {
    expect(INPUTS_HIGH_MONTHS_LOW_READINESS.monthsInPursuit).toBe(240);
    expect(deriveStage(INPUTS_HIGH_MONTHS_LOW_READINESS)).toBe("S1_IGNITION");
  });
});
