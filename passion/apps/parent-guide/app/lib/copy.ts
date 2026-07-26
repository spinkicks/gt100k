import type { Branch, Knob, Signals } from "./decide.js";

export interface Question {
  readonly signal: keyof Signals;
  readonly label: string;
}

// Parent-observable questions (spec 5.1). Each maps to one signal the engine reads.
export const QUESTIONS: readonly Question[] = [
  {
    signal: "anyStakesEvent",
    label: "A big test, competition, showcase, or deadline is coming up soon.",
  },
  { signal: "anyDevaluation", label: "Lately they do it flatly, cancel, or stop sharing it." },
  { signal: "anyBackOffOrRest", label: "They seem worn out, or they are asking for a break." },
  {
    signal: "pressuredSpecialization",
    label: "The schedule pushes them harder into this even as their interest fades.",
  },
  {
    signal: "overIdentification",
    label: "This is the only thing they will do or talk about, with nothing else alive.",
  },
  { signal: "parentalOverValuation", label: "Honestly, I am more invested in this than they are." },
  {
    signal: "conditionalRegardObserved",
    label: "My warmth or approval shifts with how they perform.",
  },
  {
    signal: "familyControlObserved",
    label: "I catch myself hovering, correcting, or taking over.",
  },
  {
    signal: "lowFamilyEngagement",
    label: "There is little we actually do together around their interests.",
  },
];

export interface BranchCopy {
  readonly heading: string;
  readonly body: string;
}

// Offer-framed guidance per branch (spec 5.3). No score, no label, no verdict.
export const BRANCH_COPY: Record<Branch, BranchCopy> = {
  healthy: {
    heading: "Things look steady",
    body: "What tends to help here is to keep opening a door they cannot reach on their own, offer a community around what they love, and keep your warmth the same no matter how things go.",
  },
  low_engagement: {
    heading: "There is not much shared time right now",
    body: "What tends to help is to set up a regular, low-stakes time and place, and do something together around it, like a build night, a visit, or a teach-back. Keep your warmth the same no matter how things go.",
  },
  strain: {
    heading: "They may be worn out or pulling back",
    body: "What tends to help is to offer a genuinely guilt-free, reversible break, keep a regular time and easy access open for when they want it, and keep your warmth exactly the same. If this lasts, this is a moment to talk to your guide or a trusted professional.",
  },
  rising_stakes: {
    heading: "Something higher-stakes is coming up",
    body: "What tends to help is to add more freedom and less evaluation, not more pressure. Make it clear the result does not change how you feel about them, keep access open, and offer to handle the logistics only.",
  },
  elevated: {
    heading: "This is a moment to protect the relationship first",
    body: "What tends to help is to keep your warmth exactly the same before and after any result, and make clear it never depends on how things go. Ease off evaluation, hand back ownership of the how, and offer to handle the logistics only. This is a moment to talk to your guide or a trusted professional.",
  },
};

export const SECOND_DOOR_NOTE =
  "It may also help to keep a second, unrelated door open, so a setback in one place is not a crisis of who they are.";

const AUTONOMY_WORDS: Record<Knob, string> = {
  up: "give them more room to choose",
  steady: "keep their room to choose steady",
};
const STRUCTURE_WORDS: Record<Knob, string> = {
  up: "add a little more structure and rhythm",
  steady: "keep the structure and rhythm steady",
};

export function postureLine(autonomySupport: Knob, structure: Knob, decouple: boolean): string {
  return `Posture: ${AUTONOMY_WORDS[autonomySupport]}, ${STRUCTURE_WORDS[structure]}, and keep your warmth non-contingent${
    decouple ? ", separating their worth from how it goes." : "."
  }`;
}
