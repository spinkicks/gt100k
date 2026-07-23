// The pure, priority-ordered Family Co-Engagement decision engine (spec 019 §3.3).
//
// Evaluate the branches in a DETERMINISTIC priority (first match wins):
//   1 Elevated pressure (obsessive-tip) → 2 Rising stakes (counter-cyclical) → 3 Strain present
//   → 4 Low family engagement → 5 Baseline (healthy).
// The engine only PROPOSES to the guide: elevated pressure or strain ALWAYS escalate to a human,
// nothing is ever sent to a parent, and no read ever carries a child/family-facing label, score, or
// reward. Warmth is ALWAYS non-contingent. Counter-cyclical: any stakes/pressure ⇒ autonomy support
// UP + decouple worth from outcome, and NEVER a "raise pressure / push harder" recommendation. Any
// invalid/thrown input falls back to the SAFE default (baseline, risk none, no escalation).
import {
  MAX_ASKS,
  MAX_SHARED_ACTIVITIES,
  type CoachingPosture,
  type FamilyRead,
  type FamilySignals,
  type Knob,
  type PressureRisk,
} from "./model.js";

// Standing guardrail reminders, carried on every read as the contract in plain sight.
const NON_CONTINGENT = "warmth is non-contingent — same warmth win or lose; never contingent praise or reward";
const NEVER_GAMIFY = "never gamify; no child- or family-facing label, score, or reward";
const HUMAN_DISPOSES = "system proposes, human disposes — nothing is ever sent to a parent automatically";
const AUTONOMY_OFFER = "asks are OFFERS of opportunity/structure/access — the child keeps choosing problem, method, and pace";
const PLURALITY = "keep spikes plural and reversible — never narrow the child to a single identity";

// Door-opening asks (OFFERS the child can decline — the family opens doors it can source, the child
// keeps choosing). Framed as opportunity / structure / access; never a mandate, never contingent.
const ASK_ACCESS = "Offer access the child can't self-source — a tool, space, mentor, or event — their choice whether to take it.";
const ASK_STRUCTURE = "Offer a regular, low-stakes time and place for the pursuit; leave the what and how to the child.";
const ASK_COMMUNITY = "Offer to connect them with a community or showcase; participating is optional and reversible.";
const ASK_REDUCE_EVALUATION = "Ahead of the stakes window, reduce evaluative talk — ask what they're curious about, not about the result.";
const ASK_LOGISTICS_ONLY = "Handle logistics and access without attaching pride to the outcome; the pursuit stays theirs.";
const ASK_DECOUPLE = "Keep warmth the same before and after — separate how you treat them from how it goes.";
const ASK_SECOND_DOOR = "Offer a second, unrelated door (a different domain) so their identity stays plural and reversible.";
const ASK_GUILT_FREE = "Offer a genuinely guilt-free, reversible break — stepping back is a legitimate outcome, not a failure.";

// Structured shared-activity / showcase ideas that build the "complex" high-support + high-challenge
// environment: the adult participates as a co-learner, never a judge.
const ACT_COLEARN = "A shared build/make evening where the adult joins as a co-learner, not a judge.";
const ACT_EXPOSE = "Visit a venue, lab, exhibition, or performance together — expose to the field without evaluating.";
const ACT_TEACH_BACK = "A family 'demo night' where the child teaches the adult something — autonomy-supportive by design.";

function isKnob(x: unknown): x is Knob {
  return x === "up" || x === "steady";
}

function cap<T>(xs: readonly T[], n: number): readonly T[] {
  return xs.slice(0, n);
}

interface Branch {
  readonly risk: PressureRisk;
  readonly autonomySupport: Knob;
  readonly structure: Knob;
  readonly decouple: boolean;
  readonly escalate: boolean;
  readonly escalationReason?: string;
  readonly antecedents: readonly string[];
  readonly asks: readonly string[];
  readonly activities: readonly string[];
  readonly rationale: string;
  readonly notes: readonly string[];
}

/** The healthy baseline branch — also the SAFE default for invalid input. */
function baseline(): Branch {
  return {
    risk: "none",
    autonomySupport: "steady",
    structure: "steady",
    decouple: false,
    escalate: false,
    antecedents: [],
    asks: [ASK_ACCESS, ASK_STRUCTURE, ASK_COMMUNITY],
    activities: [ACT_COLEARN, ACT_TEACH_BACK],
    rationale:
      "Things look healthy. Keep warmth non-contingent and hold steady; open doors the child can't reach alone and let them keep choosing.",
    notes: [NON_CONTINGENT, AUTONOMY_OFFER, NEVER_GAMIFY],
  };
}

/** Which named obsessive-tip antecedents fired (§3.3 branch 1), in a stable order. */
function elevatedAntecedents(s: FamilySignals): string[] {
  const out: string[] = [];
  if (s.parentalOverValuation === true) out.push("parental over-valuation");
  if (s.conditionalRegardObserved === true) out.push("conditional regard");
  if (s.familyControlObserved === true) out.push("family control / intrusion");
  if (s.pressuredSpecialization === true && s.anyDevaluation === true) {
    out.push("pressured specialization with declining return");
  }
  if (s.overIdentification === true && s.anyStakesEvent === true) {
    out.push("over-identification under rising stakes");
  }
  return out;
}

/** Priority-ordered branch selection (§3.3). */
function decide(s: FamilySignals): Branch {
  const antecedents = elevatedAntecedents(s);

  // 1. Elevated pressure (obsessive-tip).
  if (antecedents.length > 0) {
    const plural = s.overIdentification === true;
    return {
      risk: "elevated",
      autonomySupport: "up",
      structure: "steady",
      decouple: true,
      escalate: true,
      escalationReason:
        "Family-driven pressure pattern — re-coach toward autonomy support and non-contingent warmth; decouple the child's worth from the outcome; keep spikes plural and reversible.",
      antecedents,
      asks: [ASK_DECOUPLE, ASK_REDUCE_EVALUATION, ...(plural ? [ASK_SECOND_DOOR] : []), ASK_LOGISTICS_ONLY],
      activities: [ACT_COLEARN, ACT_TEACH_BACK],
      rationale:
        "The named antecedents of an obsessive tip are showing. This is the moment to dial autonomy support up (not control), keep warmth non-contingent, and hand the pattern to a guide to re-coach the family.",
      notes: [NON_CONTINGENT, HUMAN_DISPOSES, ...(plural ? [PLURALITY] : []), NEVER_GAMIFY],
    };
  }

  // 2. Rising stakes (counter-cyclical): dial autonomy UP exactly when adults reflexively tighten.
  if (s.anyStakesEvent === true) {
    return {
      risk: "watch",
      autonomySupport: "up",
      structure: "steady",
      decouple: true,
      escalate: false,
      antecedents: [],
      asks: [ASK_REDUCE_EVALUATION, ASK_LOGISTICS_ONLY, ASK_ACCESS],
      activities: [ACT_EXPOSE, ACT_TEACH_BACK],
      rationale:
        "Stakes are rising. Counter-cyclically, dial autonomy support up and reduce evaluative surfacing — the opposite of the adult reflex to tighten control. A watch, not yet a re-coach.",
      notes: [NON_CONTINGENT, AUTONOMY_OFFER, NEVER_GAMIFY],
    };
  }

  // 3. Strain present.
  if (s.anyBackOffOrRest === true || s.anyDevaluation === true) {
    return {
      risk: "watch",
      autonomySupport: "up",
      structure: "steady",
      decouple: false,
      escalate: true,
      escalationReason:
        "Strain showing — a warm, non-evaluative check-in; a guilt-free, reversible break is a legitimate outcome, not a failure.",
      antecedents: [],
      asks: [ASK_GUILT_FREE, ASK_ACCESS, ASK_STRUCTURE],
      activities: [ACT_COLEARN],
      rationale:
        "Quiet devaluation or a back-off is showing. Lift pressure (autonomy up), keep warmth non-contingent, and hand this to a guide for a warm, non-evaluative check-in.",
      notes: [NON_CONTINGENT, HUMAN_DISPOSES, NEVER_GAMIFY],
    };
  }

  // 4. Low family engagement — build the complex, high-support + high-challenge environment.
  if (s.lowFamilyEngagement === true) {
    return {
      risk: "none",
      autonomySupport: "steady",
      structure: "up",
      decouple: false,
      escalate: false,
      antecedents: [],
      asks: [ASK_STRUCTURE, ASK_ACCESS],
      activities: [ACT_COLEARN, ACT_EXPOSE, ACT_TEACH_BACK],
      rationale:
        "There's little shared co-engagement. Build the 'complex' environment — high support and high challenge together — through structured shared activities where the adult joins as a co-learner.",
      notes: [NON_CONTINGENT, AUTONOMY_OFFER, NEVER_GAMIFY],
    };
  }

  // 5. Baseline (healthy).
  return baseline();
}

/**
 * Turn per-child family signals into a guide-facing coaching read. Pure + deterministic. Any
 * invalid/thrown input → the SAFE baseline (risk none, no escalation, never a fabricated "push harder").
 */
export function assessFamily(signals: FamilySignals): FamilyRead {
  let b: Branch;
  const kidId = typeof signals?.kidId === "string" ? signals.kidId : "unknown";
  try {
    b = decide(signals);
  } catch {
    b = baseline();
  }

  const posture: CoachingPosture = {
    // Guardrail: warmth is ALWAYS non-contingent — never a knob toward contingent praise.
    warmth: "non_contingent",
    autonomySupport: isKnob(b.autonomySupport) ? b.autonomySupport : "steady",
    structure: isKnob(b.structure) ? b.structure : "steady",
    decoupleWorthFromOutcome: b.decouple === true,
  };

  const read: FamilyRead = {
    kidId,
    posture,
    asks: cap(b.asks, MAX_ASKS),
    sharedActivities: cap(b.activities, MAX_SHARED_ACTIVITIES),
    pressureWatch: { risk: b.risk, antecedents: b.antecedents },
    escalateToHuman: b.escalate === true,
    ...(b.escalationReason !== undefined ? { escalationReason: b.escalationReason } : {}),
    rationale: b.rationale,
    guardrailNotes: b.notes,
  };
  return read;
}
