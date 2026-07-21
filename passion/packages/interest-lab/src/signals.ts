import type { EngagementEvent, SignalFamily, SignalSummary } from "./events";
import { SIGNAL_FAMILIES } from "./events";

export function summarizeSignals(events: readonly EngagementEvent[]): SignalSummary {
  const summary: Omit<SignalSummary, "familiesPresent"> = {
    voluntaryReturn: { day7: 0, day30: 0 },
    unrequiredRevision: 0,
    chosenChallenge: 0,
    failureRecovery: 0,
    scopeAuthorship: 0,
    competenceGrowth: 0,
    noveltyDecay: 0,
    promptDependence: 0,
    contextEffects: [],
  };
  const present = new Set<SignalFamily>();

  for (const event of events) {
    if (event.withdrawn) {
      continue;
    }

    switch (event.type) {
      case "VOLUNTARY_RETURN":
        if (event.occurredAtDayOffset === 7) {
          summary.voluntaryReturn.day7 += 1;
          present.add("voluntary_return");
        } else if (event.occurredAtDayOffset === 30) {
          summary.voluntaryReturn.day30 += 1;
          present.add("voluntary_return");
        }
        break;
      case "PROMPTED_RETURN":
        summary.promptDependence += 1;
        if (event.interventionContext !== undefined) {
          summary.contextEffects.push(event.interventionContext.source);
        }
        break;
      case "UNREQUIRED_REVISION":
        summary.unrequiredRevision += 1;
        present.add("unrequired_revision");
        break;
      case "CHOSEN_CHALLENGE":
        summary.chosenChallenge += 1;
        present.add("chosen_challenge");
        break;
      case "FAILURE_RECOVERY":
        summary.failureRecovery += 1;
        present.add("failure_recovery");
        break;
      case "SELF_AUTHORED_SCOPE":
        summary.scopeAuthorship += 1;
        present.add("self_authored_scope");
        break;
      case "ARTIFACT_COMPETENCE":
        summary.competenceGrowth += 1;
        present.add("artifact_competence");
        break;
      case "ASSISTIVE":
      case "SAFETY_RESCUE":
        break;
    }
  }

  return {
    ...summary,
    familiesPresent: SIGNAL_FAMILIES.filter((family) => present.has(family)),
  };
}
