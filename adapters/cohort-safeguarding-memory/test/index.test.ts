import { describe, expect, it } from "vitest";
import type { CohortHealthEvent } from "../../../packages/cohort-compiler/src/model";
import type { SafeguardingSink } from "../../../packages/cohort-compiler/src/ports";
import {
  type ActiveCohortMove,
  routeHealthEvent,
} from "../../../packages/cohort-compiler/src/safeguarding";
import { safeguardingShadow } from "../../../packages/cohort-compiler/test/fixtures/safeguarding-shadow";
import { InMemorySafeguardingSink } from "../src/index";

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends <
  Value,
>() => Value extends Right ? 1 : 2
  ? true
  : false;

const exactRouteSignature: Equal<
  typeof routeHealthEvent,
  (
    sink: SafeguardingSink,
    event: CohortHealthEvent,
    activeMoves?: ActiveCohortMove[],
  ) => Promise<void>
> = true;

function cloneEvent(event: CohortHealthEvent): CohortHealthEvent {
  return {
    ...event,
    affectedMembers: [...event.affectedMembers],
  };
}

describe("safeguarding bypass (T017, FR-018, SC-005)", () => {
  it("routes Fixture D directly to the human queue and pauses only conflicting moves", async () => {
    const sink: SafeguardingSink = new InMemorySafeguardingSink();
    const event = cloneEvent(safeguardingShadow.event);
    const activeMoves: ActiveCohortMove[] = safeguardingShadow.activeMoves.map((move) => ({
      ...move,
      touches: [...move.touches],
    }));

    const result = await routeHealthEvent(sink, event, activeMoves);

    expect(result).toBeUndefined();
    await expect(sink.pending()).resolves.toEqual([safeguardingShadow.event]);
    expect(activeMoves).toEqual([
      { moveId: "mv-1", touches: ["A3", "A5"], paused: true },
      { moveId: "mv-2", touches: ["A1"] },
    ]);
  });

  it("has no optimizer seam and leaves rating and objective sentinels unchanged", async () => {
    const sink: SafeguardingSink = new InMemorySafeguardingSink();
    const activeMoves = safeguardingShadow.activeMoves.map((move, index) => ({
      ...move,
      touches: [...move.touches],
      rating: 720 + index,
      objective: 81 - index * 10,
    })) satisfies (ActiveCohortMove & { rating: number; objective: number })[];

    await routeHealthEvent(sink, cloneEvent(safeguardingShadow.event), activeMoves);

    expect(exactRouteSignature).toBe(true);
    expect(activeMoves.map(({ rating }) => rating)).toEqual([720, 721]);
    expect(activeMoves.map(({ objective }) => objective)).toEqual([81, 71]);
  });

  it("isolates queued health events from caller and reader mutation", async () => {
    const sink: SafeguardingSink = new InMemorySafeguardingSink();
    const submitted = cloneEvent(safeguardingShadow.event);

    await sink.submit(submitted);
    submitted.affectedMembers[0] = "MUTATED-INPUT";
    submitted.followUpOwner = "MUTATED-INPUT";

    const firstRead = await sink.pending();
    expect(firstRead).toEqual([safeguardingShadow.event]);
    const queued = firstRead[0];
    if (!queued) {
      throw new Error("Expected one queued health event");
    }
    queued.affectedMembers[0] = "MUTATED-READ";
    queued.followUpOwner = "MUTATED-READ";

    await expect(sink.pending()).resolves.toEqual([safeguardingShadow.event]);
  });
});
