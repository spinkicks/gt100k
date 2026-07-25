// Pure mirror of @gt100k/family assess.ts decide(). SOURCE OF TRUTH for the inline widget.
// Inputs are the nine parent-observable booleans (spec §5.1). Outputs match the engine's
// branch-determining fields exactly (verified by test/widget-parity.test.mjs). No clock, no random.
export function decide(s) {
  const elevated =
    s.parentalOverValuation === true ||
    s.conditionalRegardObserved === true ||
    s.familyControlObserved === true ||
    (s.pressuredSpecialization === true && s.anyDevaluation === true) ||
    (s.overIdentification === true && s.anyStakesEvent === true);

  if (elevated) {
    return {
      branch: "elevated", risk: "elevated",
      autonomySupport: "up", structure: "steady", warmth: "non_contingent",
      decouple: true, escalate: true, talkToHuman: true,
      offers: ["keep_warmth_same", "reduce_evaluation",
        ...(s.overIdentification === true ? ["second_door"] : []), "logistics_only"],
    };
  }
  if (s.anyStakesEvent === true) {
    return {
      branch: "rising_stakes", risk: "watch",
      autonomySupport: "up", structure: "steady", warmth: "non_contingent",
      decouple: true, escalate: false, talkToHuman: false,
      offers: ["reduce_evaluation", "logistics_only", "access"],
    };
  }
  if (s.anyBackOffOrRest === true || s.anyDevaluation === true) {
    return {
      branch: "strain", risk: "watch",
      autonomySupport: "up", structure: "steady", warmth: "non_contingent",
      decouple: false, escalate: true, talkToHuman: true,
      offers: ["guilt_free_break", "access", "structure"],
    };
  }
  if (s.lowFamilyEngagement === true) {
    return {
      branch: "low_engagement", risk: "none",
      autonomySupport: "steady", structure: "up", warmth: "non_contingent",
      decouple: false, escalate: false, talkToHuman: false,
      offers: ["structure", "access"],
    };
  }
  return {
    branch: "healthy", risk: "none",
    autonomySupport: "steady", structure: "steady", warmth: "non_contingent",
    decouple: false, escalate: false, talkToHuman: false,
    offers: ["access", "structure", "community"],
  };
}
