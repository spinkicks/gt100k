export const TALENT_SNAPSHOT_CONTRACT_VERSION = "TS-SYN-01" as const;
export const EVIDENCE_FIXTURE_VERSION = "evidence-fixtures-syn-v1" as const;

export const TALENT_DOMAIN_CODES = Object.freeze([
  "mathematics",
  "science",
  "engineering",
  "writing",
  "visual_arts",
  "music",
  "other",
] as const);

export type TalentDomainCode = (typeof TALENT_DOMAIN_CODES)[number];
export type ArtifactMediaKind = "audio" | "document" | "photo" | "video";

export interface SyntheticArtifactFixture {
  readonly fixtureId: string;
  readonly fixtureVersion: typeof EVIDENCE_FIXTURE_VERSION;
  readonly bornSynthetic: true;
  readonly domainCode: TalentDomainCode;
  readonly mediaKind: ArtifactMediaKind;
  readonly title: string;
  readonly provenance: {
    readonly childAgeYears: number;
    readonly artifactDate: string;
    readonly taskContext: string;
    readonly timeSpentMinutes: number;
    readonly toolsAndMaterials: readonly string[];
    readonly assistanceDisclosure: string;
    readonly repeatedElsewhere: boolean;
  };
}

export interface SyntheticNarrativeFixture {
  readonly fixtureId: string;
  readonly fixtureVersion: typeof EVIDENCE_FIXTURE_VERSION;
  readonly bornSynthetic: true;
  readonly domainCode: TalentDomainCode;
  readonly title: string;
  readonly body: string;
  readonly observerContext: {
    readonly relationshipToChild: string;
    readonly observationDuration: string;
    readonly observationFrequency: string;
    readonly observationSetting: string;
    readonly paidRelationship: boolean;
    readonly instructionOrAssistance: string;
    readonly opportunityContext: string;
    readonly conflictOfInterest: string;
  };
}

export const SYNTHETIC_ARTIFACT_FIXTURES = Object.freeze([
  Object.freeze({
    fixtureId: "artifact-syn-robotics-001",
    fixtureVersion: EVIDENCE_FIXTURE_VERSION,
    bornSynthetic: true,
    domainCode: "engineering",
    mediaKind: "photo",
    title: "Synthetic modular rover prototype",
    provenance: Object.freeze({
      childAgeYears: 10,
      artifactDate: "2026-01-15",
      taskContext: "Fictional self-directed redesign of a modular rover for uneven terrain.",
      timeSpentMinutes: 180,
      toolsAndMaterials: Object.freeze(["cardboard", "reusable electronics kit"]),
      assistanceDisclosure:
        "An adult provided safety-only supervision; no peer, teacher, or AI help.",
      repeatedElsewhere: true,
    }),
  }),
  Object.freeze({
    fixtureId: "artifact-syn-writing-001",
    fixtureVersion: EVIDENCE_FIXTURE_VERSION,
    bornSynthetic: true,
    domainCode: "writing",
    mediaKind: "document",
    title: "Synthetic dual-perspective short story",
    provenance: Object.freeze({
      childAgeYears: 9,
      artifactDate: "2026-02-03",
      taskContext: "Fictional self-initiated story retelling one event from two viewpoints.",
      timeSpentMinutes: 95,
      toolsAndMaterials: Object.freeze(["paper", "pencil"]),
      assistanceDisclosure:
        "An adult answered one spelling question; no peer, teacher, or AI help.",
      repeatedElsewhere: true,
    }),
  }),
] as const satisfies readonly SyntheticArtifactFixture[]);

export const SYNTHETIC_NARRATIVE_FIXTURES = Object.freeze([
  Object.freeze({
    fixtureId: "narrative-syn-patterns-001",
    fixtureVersion: EVIDENCE_FIXTURE_VERSION,
    bornSynthetic: true,
    domainCode: "mathematics",
    title: "Synthetic observation of pattern transfer",
    body: "In this synthetic example, a child notices repeating number patterns during home projects. The observer describes the child predicting later terms, explaining more than one rule, and transferring the same idea to tile designs and music rhythms. Across several fictional sessions, the child revisits explanations, corrects an overgeneralization without prompting, and creates a pattern for the observer to solve. No new child work was requested for this Snapshot.",
    observerContext: Object.freeze({
      relationshipToChild: "fictional guardian",
      observationDuration: "two fictional years",
      observationFrequency: "weekly",
      observationSetting: "home projects",
      paidRelationship: false,
      instructionOrAssistance: "The observer supplied ordinary materials and clarification only.",
      opportunityContext: "Repeated access to household paper, tiles, and music activities.",
      conflictOfInterest: "The observer is the fictional guardian completing the application.",
    }),
  }),
] as const satisfies readonly SyntheticNarrativeFixture[]);

export type SyntheticArtifactFixtureId = (typeof SYNTHETIC_ARTIFACT_FIXTURES)[number]["fixtureId"];
export type SyntheticNarrativeFixtureId =
  (typeof SYNTHETIC_NARRATIVE_FIXTURES)[number]["fixtureId"];
