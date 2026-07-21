import type { CohortHealthEvent } from "../../../packages/cohort-compiler/src/model";
import type { SafeguardingSink } from "../../../packages/cohort-compiler/src/ports";

function cloneEvent(event: CohortHealthEvent): CohortHealthEvent {
  return {
    ...event,
    affectedMembers: [...event.affectedMembers],
  };
}

/** Synthetic human-queue stub; production safeguarding case management is not implemented. */
export class InMemorySafeguardingSink implements SafeguardingSink {
  private readonly events: CohortHealthEvent[] = [];

  async submit(event: CohortHealthEvent): Promise<void> {
    this.events.push(cloneEvent(event));
  }

  async pending(): Promise<CohortHealthEvent[]> {
    return this.events.map(cloneEvent);
  }
}
