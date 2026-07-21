export const FACETS = ["what", "why", "how", "challenge", "next", "audience"] as const;

export type Facet = (typeof FACETS)[number];

export const THIN = 0.45;
export const COVERED = 0.6;
export const MAX_TURNS = 12;

export interface ProjectProfile {
  readonly id: string;
  readonly studentId: string;
  readonly title: string;
  readonly domain: string;
  readonly summary: string;
  readonly artifactRefs: readonly string[];
}

export interface TranscriptTurn {
  readonly facet: Facet;
  readonly questionId: string;
  readonly isFollowUp: boolean;
  readonly answerText: string;
  readonly score: number;
}

export type CoverageByFacet = Record<Facet, number>;

export interface QuestionTemplate {
  readonly id: string;
  readonly text: string;
}

export interface QuestionSet {
  readonly base: readonly QuestionTemplate[];
  readonly followUp: readonly QuestionTemplate[];
}

export interface QuestionPrompt extends QuestionTemplate {
  readonly facet: Facet;
  readonly isFollowUp: boolean;
}

export interface QuestionSelectionInput {
  readonly profile: ProjectProfile;
  readonly seed: number;
  readonly transcript: readonly TranscriptTurn[];
}
