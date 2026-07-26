// The Family Check-In decision logic: a pure, exact mirror of the @gt100k/family engine's
// `assess.ts` decide() (branch-determining outputs). This is the single source of truth for the
// widget. Proven identical to the real engine across all 512 boolean combinations by
// test/decide.test.ts. No clock, no randomness, no I/O.

export type Branch = "elevated" | "rising_stakes" | "strain" | "low_engagement" | "healthy";
export type Risk = "none" | "watch" | "elevated";
export type Knob = "up" | "steady";

/** The nine parent-observable signals the widget exposes (spec 5.1). */
export interface Signals {
  readonly anyStakesEvent: boolean;
  readonly anyDevaluation: boolean;
  readonly anyBackOffOrRest: boolean;
  readonly pressuredSpecialization: boolean;
  readonly overIdentification: boolean;
  readonly parentalOverValuation: boolean;
  readonly conditionalRegardObserved: boolean;
  readonly familyControlObserved: boolean;
  readonly lowFamilyEngagement: boolean;
}

export interface Decision {
  readonly branch: Branch;
  readonly risk: Risk;
  readonly autonomySupport: Knob;
  readonly structure: Knob;
  readonly warmth: "non_contingent";
  readonly decouple: boolean;
  readonly escalate: boolean;
  readonly talkToHuman: boolean;
  readonly offers: readonly string[];
}

export function decide(s: Signals): Decision {
  const elevated =
    s.parentalOverValuation === true ||
    s.conditionalRegardObserved === true ||
    s.familyControlObserved === true ||
    (s.pressuredSpecialization === true && s.anyDevaluation === true) ||
    (s.overIdentification === true && s.anyStakesEvent === true);

  if (elevated) {
    return {
      branch: "elevated",
      risk: "elevated",
      autonomySupport: "up",
      structure: "steady",
      warmth: "non_contingent",
      decouple: true,
      escalate: true,
      talkToHuman: true,
      offers: [
        "keep_warmth_same",
        "reduce_evaluation",
        ...(s.overIdentification === true ? ["second_door"] : []),
        "logistics_only",
      ],
    };
  }
  if (s.anyStakesEvent === true) {
    return {
      branch: "rising_stakes",
      risk: "watch",
      autonomySupport: "up",
      structure: "steady",
      warmth: "non_contingent",
      decouple: true,
      escalate: false,
      talkToHuman: false,
      offers: ["reduce_evaluation", "logistics_only", "access"],
    };
  }
  if (s.anyBackOffOrRest === true || s.anyDevaluation === true) {
    return {
      branch: "strain",
      risk: "watch",
      autonomySupport: "up",
      structure: "steady",
      warmth: "non_contingent",
      decouple: false,
      escalate: true,
      talkToHuman: true,
      offers: ["guilt_free_break", "access", "structure"],
    };
  }
  if (s.lowFamilyEngagement === true) {
    return {
      branch: "low_engagement",
      risk: "none",
      autonomySupport: "steady",
      structure: "up",
      warmth: "non_contingent",
      decouple: false,
      escalate: false,
      talkToHuman: false,
      offers: ["structure", "access"],
    };
  }
  return {
    branch: "healthy",
    risk: "none",
    autonomySupport: "steady",
    structure: "steady",
    warmth: "non_contingent",
    decouple: false,
    escalate: false,
    talkToHuman: false,
    offers: ["access", "structure", "community"],
  };
}

export const SIGNAL_KEYS: readonly (keyof Signals)[] = [
  "anyStakesEvent",
  "anyDevaluation",
  "anyBackOffOrRest",
  "pressuredSpecialization",
  "overIdentification",
  "parentalOverValuation",
  "conditionalRegardObserved",
  "familyControlObserved",
  "lowFamilyEngagement",
];
