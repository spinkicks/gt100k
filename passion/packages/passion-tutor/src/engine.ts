import {
  COVERED,
  type CoverageByFacet,
  FACETS,
  type Facet,
  MAX_TURNS,
  type QuestionPrompt,
  type QuestionSelectionInput,
  type QuestionTemplate,
  THIN,
  type TranscriptTurn,
} from "./model.js";
import { QUESTION_BANK } from "./question-bank.js";

function emptyCoverage(): CoverageByFacet {
  return { what: 0, why: 0, how: 0, challenge: 0, next: 0, audience: 0 };
}

function normalizedScore(score: number): number {
  return Number.isFinite(score) ? Math.max(0, Math.min(score, 1)) : 0;
}

function stableIndex(seed: number, turnIndex: number, length: number): number {
  const candidate = (seed | 0) + turnIndex;
  return ((candidate % length) + length) % length;
}

function makePrompt(
  facet: Facet,
  templates: readonly QuestionTemplate[],
  input: QuestionSelectionInput,
  isFollowUp: boolean,
): QuestionPrompt {
  const template = templates[stableIndex(input.seed, input.transcript.length, templates.length)]!;
  return { ...template, facet, isFollowUp };
}

export function coverageFromTranscript(transcript: readonly TranscriptTurn[]): CoverageByFacet {
  const coverage = emptyCoverage();
  for (const turn of transcript) {
    coverage[turn.facet] = Math.max(coverage[turn.facet], normalizedScore(turn.score));
  }
  return coverage;
}

export function getGaps(coverage: Readonly<CoverageByFacet>): Facet[] {
  return FACETS.filter((facet) => normalizedScore(coverage[facet]) < COVERED);
}

export function isSessionComplete(transcript: readonly TranscriptTurn[]): boolean {
  return transcript.length >= MAX_TURNS || getGaps(coverageFromTranscript(transcript)).length === 0;
}

function leastCoveredFacet(coverage: Readonly<CoverageByFacet>, excluded?: Facet): Facet {
  let selected: Facet | undefined;
  for (const facet of FACETS) {
    if (facet === excluded) continue;
    if (selected === undefined || coverage[facet] < coverage[selected]) selected = facet;
  }
  return selected ?? FACETS[0];
}

function selectForEngineTranscript(input: QuestionSelectionInput): QuestionPrompt | null {
  if (isSessionComplete(input.transcript)) return null;

  const lastTurn = input.transcript.at(-1);
  if (lastTurn && normalizedScore(lastTurn.score) < THIN && !lastTurn.isFollowUp) {
    return makePrompt(lastTurn.facet, QUESTION_BANK[lastTurn.facet].followUp, input, true);
  }

  const excludedFacet = lastTurn?.isFollowUp ? lastTurn.facet : undefined;
  const facet = leastCoveredFacet(coverageFromTranscript(input.transcript), excludedFacet);

  return makePrompt(facet, QUESTION_BANK[facet].base, input, false);
}

export function selectNextQuestion(input: QuestionSelectionInput): QuestionPrompt | null {
  return selectForEngineTranscript(input);
}
