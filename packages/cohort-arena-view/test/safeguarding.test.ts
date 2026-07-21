import { describe, expect, expectTypeOf, it } from "vitest";

import { safeguardingShadow } from "../../cohort-compiler/test/fixtures/safeguarding-shadow.js";
import {
  type BuildCohortArenaViewInput,
  type SafeguardingView,
  buildCohortArenaView,
} from "../src/index.js";
import { viewCohort12 } from "./fixtures/view-cohort-12.js";

type SafeguardingInput = NonNullable<BuildCohortArenaViewInput["safeguarding"]>;

const STANDINGS = {
  self: { selfGain: 300 },
  nearPeers: [
    { pseudonym: "kestrel", gain: 260 },
    { pseudonym: "otter", gain: 340 },
  ],
  optedIn: true,
} as const;

describe("the safeguarding display projection", () => {
  it("bypasses optimization and pauses only moves touching an affected member", () => {
    const safeguarding = {
      pending: [safeguardingShadow.event],
      activeMoves: safeguardingShadow.activeMoves,
    } satisfies SafeguardingInput;
    const assignmentBefore = JSON.stringify(viewCohort12.input.assignment);
    const eventBefore = structuredClone(safeguardingShadow.event);
    const movesBefore = structuredClone(safeguardingShadow.activeMoves);

    const view = buildCohortArenaView({
      ...viewCohort12.input,
      standings: STANDINGS,
      flags: { ...viewCohort12.input.flags, standingsOptIn: true },
      safeguarding,
    });

    expect(view.safeguarding).toEqual({
      pending: [safeguardingShadow.event],
      pausedMoves: [{ moveId: "mv-1", touches: ["A3", "A5"] }],
      optimizationBypassed: true,
    });
    expect(view.ledger.safeguardingAlert).toBe(
      "Optimization bypassed; 1 conflicting move paused for the safeguarding lane.",
    );
    expect(view.standings).toMatchObject({ selfGain: 300, gainToBandTop: 40 });
    expect(JSON.stringify(viewCohort12.input.assignment)).toBe(assignmentBefore);
    expect(safeguardingShadow.event).toEqual(eventBefore);
    expect(safeguardingShadow.activeMoves).toEqual(movesBefore);
  });

  it("keeps the safeguarding input and output display-only by type", () => {
    expectTypeOf<SafeguardingInput>().toEqualTypeOf<{
      readonly pending: readonly SafeguardingView["pending"][number][];
      readonly activeMoves: readonly {
        readonly moveId: string;
        readonly touches: readonly string[];
      }[];
    }>();
    expectTypeOf<keyof SafeguardingView>().toEqualTypeOf<
      "pending" | "pausedMoves" | "optimizationBypassed"
    >();
  });
});
