import type { HypothesisRevision } from "@gt100k/interest-lab";
import type { ExplanationCard, ExplanationsView } from "./model";

const FIXED_LABEL = /you are (a|an|the) /i;

const strengthFor = (revision: HypothesisRevision): ExplanationCard["strength"] =>
  revision.uncertainty.kind === "grade" ? revision.uncertainty.grade : "moderate";

const assertSafeClaim = (claim: string): void => {
  if (claim.trim().length === 0) {
    throw new Error("Explanation claims cannot be empty");
  }
  if (FIXED_LABEL.test(claim)) {
    throw new Error("A fixed-label explanation cannot be rendered");
  }
};

const withPeriod = (text: string): string =>
  /\p{Sentence_Terminal}$/u.test(text) ? text : `${text}.`;

export function buildExplanationsView(revision: HypothesisRevision): ExplanationsView {
  if (revision.competingExplanations.length === 0) {
    throw new Error("At least one competing explanation is required");
  }

  for (const claim of revision.competingExplanations) {
    assertSafeClaim(claim);
  }

  const strength = strengthFor(revision);
  const evidenceRefs = [...revision.evidenceRefs];
  const card = (claim: string, tone: string): ExplanationCard => ({
    claim,
    evidenceRefs: [...evidenceRefs],
    strength,
    tone,
  });
  const supportingClaim = revision.competingExplanations[0]!;
  const recordedDisconfirming = revision.competingExplanations[1];
  let disconfirming: ExplanationCard;

  if (recordedDisconfirming) {
    disconfirming = card(recordedDisconfirming, "contested");
  } else {
    const claim = `Next test: ${withPeriod(
      revision.nextProbe?.trim() || "gather evidence that could change the current explanation",
    )}`;
    assertSafeClaim(claim);
    disconfirming = { claim, evidenceRefs: [], strength, tone: "contested" };
  }

  return {
    supporting: card(supportingClaim, "support"),
    disconfirming,
    others: revision.competingExplanations.slice(2).map((claim) => card(claim, "prompted")),
    uncertainty: { ...revision.uncertainty },
  };
}
