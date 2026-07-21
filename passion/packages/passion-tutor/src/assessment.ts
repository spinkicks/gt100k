import type { ProjectProfile } from "./model.js";

const FILLER_WORDS = new Set(["erm", "hmm", "uh", "um"]);
const DOMAIN_STOP_WORDS = new Set(["and", "for", "the", "with"]);
const TOKEN_PATTERN = /\d+(?:\.\d+)?|[A-Za-z]+(?:['’-][A-Za-z]+)*/g;

interface Token {
  readonly text: string;
  readonly index: number;
}

function tokensIn(text: string): Token[] {
  return Array.from(text.matchAll(TOKEN_PATTERN), (match) => ({
    text: match[0],
    index: match.index,
  }));
}

function isSentenceStart(answer: string, token: Token): boolean {
  if (token.index === 0) return true;
  const prefix = answer.slice(0, token.index).trimEnd();
  return prefix.length === 0 || /[.!?]$/.test(prefix);
}

function countReasoningMarkers(words: readonly string[]): number {
  let count = 0;
  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    if (
      word === "because" ||
      word === "if" ||
      word === "then" ||
      word === "first" ||
      word === "next"
    ) {
      count += 1;
    }
    if (word === "so" && words[index + 1] === "that") count += 1;
  }
  return count;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(value, 1));
}

export function assessAnswer(answer: string, profile: ProjectProfile): number {
  const tokens = tokensIn(answer).filter((token) => !FILLER_WORDS.has(token.text.toLowerCase()));
  if (tokens.length === 0) return 0;

  const words = tokens.map((token) => token.text.toLowerCase());
  const domainTerms = new Set(
    tokensIn(profile.domain)
      .map((token) => token.text.toLowerCase())
      .filter((term) => !DOMAIN_STOP_WORDS.has(term)),
  );

  const numberCount = tokens.filter((token) => /^\d/.test(token.text)).length;
  const properNounCount = tokens.filter(
    (token) => /^[A-Z][a-z]/.test(token.text) && !isSentenceStart(answer, token),
  ).length;
  const domainTermCount = words.filter((word) => domainTerms.has(word)).length;

  const lenNorm = Math.min(tokens.length / 40, 1);
  const reasoningMarkers = Math.min(countReasoningMarkers(words) / 3, 1);
  const specificity = Math.min((numberCount + properNounCount + domainTermCount) / 4, 1);

  return clamp01(0.4 * lenNorm + 0.35 * reasoningMarkers + 0.25 * specificity);
}
