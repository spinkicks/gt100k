import { describe, expect, expectTypeOf, it } from "vitest";

import {
  SYNTHETIC_ARTIFACT_FIXTURES,
  SYNTHETIC_NARRATIVE_FIXTURES,
  type SyntheticArtifactFixture,
  type SyntheticNarrativeFixture,
  TALENT_SNAPSHOT_CONTRACT_VERSION,
} from "../src/snapshot.js";

describe("Track B Talent Snapshot contracts", () => {
  it("exposes only fixed, born-synthetic evidence fixtures with complete review metadata", () => {
    expect(TALENT_SNAPSHOT_CONTRACT_VERSION).toBe("TS-SYN-01");
    expect(SYNTHETIC_ARTIFACT_FIXTURES.map(({ fixtureId }) => fixtureId)).toEqual([
      "artifact-syn-robotics-001",
      "artifact-syn-writing-001",
    ]);
    expect(SYNTHETIC_NARRATIVE_FIXTURES.map(({ fixtureId }) => fixtureId)).toEqual([
      "narrative-syn-patterns-001",
    ]);

    for (const fixture of SYNTHETIC_ARTIFACT_FIXTURES) {
      expect(fixture).toMatchObject({
        fixtureVersion: "evidence-fixtures-syn-v1",
        bornSynthetic: true,
        provenance: {
          childAgeYears: expect.any(Number),
          artifactDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          taskContext: expect.any(String),
          timeSpentMinutes: expect.any(Number),
          toolsAndMaterials: expect.any(Array),
          assistanceDisclosure: expect.any(String),
          repeatedElsewhere: expect.any(Boolean),
        },
      });
      expect(Object.isFrozen(fixture)).toBe(true);
      expect(Object.isFrozen(fixture.provenance)).toBe(true);
      expect(Object.isFrozen(fixture.provenance.toolsAndMaterials)).toBe(true);
    }

    const narrative = SYNTHETIC_NARRATIVE_FIXTURES[0]!;
    expect(narrative).toMatchObject({
      fixtureVersion: "evidence-fixtures-syn-v1",
      bornSynthetic: true,
      observerContext: {
        relationshipToChild: expect.any(String),
        observationDuration: expect.any(String),
        observationFrequency: expect.any(String),
        observationSetting: expect.any(String),
        paidRelationship: expect.any(Boolean),
        instructionOrAssistance: expect.any(String),
        opportunityContext: expect.any(String),
        conflictOfInterest: expect.any(String),
      },
    });
    expect(narrative.body.trim().split(/\s+/)).toHaveLength(68);
    expect(narrative.body.trim().split(/\s+/).length).toBeLessThanOrEqual(400);
    expect(Object.isFrozen(narrative)).toBe(true);
    expect(Object.isFrozen(narrative.observerContext)).toBe(true);

    type UnsafeFixtureKey = Extract<
      keyof SyntheticArtifactFixture | keyof SyntheticNarrativeFixture,
      "upload" | "file" | "url" | "path" | "bytes" | "childName" | "dateOfBirth"
    >;
    expectTypeOf<UnsafeFixtureKey>().toEqualTypeOf<never>();
  });
});
