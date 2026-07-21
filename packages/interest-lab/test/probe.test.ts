import { describe, expect, expectTypeOf, it } from "vitest";
import {
  AUDIENCE_CONDITIONS,
  DIFFICULTY_BANDS,
  PROVENANCES,
  SAFETY_CLASSES,
  SOCIAL_MODES,
  WORK_MODES,
} from "../src/probe";
import type {
  AudienceCondition,
  DifficultyBand,
  Domain,
  Probe,
  ProbeFamily,
  Provenance,
  SafetyClass,
  SocialMode,
  WorkMode,
} from "../src/probe";

describe("probe vocabularies", () => {
  it("defines the exact nine activity work modes", () => {
    expect(WORK_MODES).toEqual([
      "build",
      "investigate",
      "compose",
      "explain",
      "perform",
      "debug",
      "collaborate",
      "care",
      "persuade",
    ]);
    expectTypeOf<WorkMode>().toEqualTypeOf<(typeof WORK_MODES)[number]>();
  });

  it("defines the exact cross-cutting, safety, and provenance vocabularies", () => {
    expect(DIFFICULTY_BANDS).toEqual(["foundational", "stretch"]);
    expect(AUDIENCE_CONDITIONS).toEqual(["audience", "no_audience"]);
    expect(SOCIAL_MODES).toEqual(["solo", "group"]);
    expect(SAFETY_CLASSES).toEqual(["cleared", "review_required", "blocked"]);
    expect(PROVENANCES).toEqual(["GUIDE", "RULE", "SHADOW_MODEL"]);

    expectTypeOf<DifficultyBand>().toEqualTypeOf<(typeof DIFFICULTY_BANDS)[number]>();
    expectTypeOf<AudienceCondition>().toEqualTypeOf<(typeof AUDIENCE_CONDITIONS)[number]>();
    expectTypeOf<SocialMode>().toEqualTypeOf<(typeof SOCIAL_MODES)[number]>();
    expectTypeOf<SafetyClass>().toEqualTypeOf<(typeof SAFETY_CLASSES)[number]>();
    expectTypeOf<Provenance>().toEqualTypeOf<(typeof PROVENANCES)[number]>();
  });
});

describe("probe value types", () => {
  it("keeps domains catalog-supplied and open", () => {
    expectTypeOf<Domain>().toEqualTypeOf<string>();

    const catalogSuppliedDomain: Domain = "new_catalog_theme";
    expect(catalogSuppliedDomain).toBe("new_catalog_theme");
  });

  it("requires every IL-001 probe field", () => {
    expectTypeOf<Probe>().toEqualTypeOf<{
      id: string;
      familyId: string;
      domain: Domain;
      workMode: WorkMode;
      prerequisites: string[];
      difficulty: DifficultyBand;
      autonomy: "low" | "medium" | "high";
      social: SocialMode;
      audience: AudienceCondition;
      equipment: string[];
      accessibilityVariants: string[];
      expectedBurden: number;
      safetyClass: SafetyClass;
      artifactEvidence: string;
    }>();
  });

  it("groups equivalent probe variants under a family id", () => {
    expectTypeOf<ProbeFamily>().toEqualTypeOf<{
      familyId: string;
      variants: Probe[];
    }>();
  });
});
