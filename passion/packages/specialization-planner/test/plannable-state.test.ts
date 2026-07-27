/**
 * The precondition the planner documents but never used to enforce.
 *
 * `PlanInputs.hypothesisState` was written by the deriver and read by nobody, so a full staged
 * specialization plan (technical mentor, real-community audience, a deliberate-practice dose) could
 * be produced for a spike sitting at EXPLORING, which is the state every hypothesis is born in. The
 * guide console happened to filter for ACTIVE/CANDIDATE before calling in, so nothing shipped wrong,
 * but the rule lived in the caller: the next caller inherited nothing.
 *
 * "The system proposes, a human disposes" only means something if the system cannot propose a
 * specialization for a child no human has certified. That is what these tests hold.
 */
import { type Lifecycle, LIFECYCLE, withState } from "@gt100k/hypothesis-store";
import type { StudentProfile } from "@gt100k/student-profile";
import { describe, expect, it } from "vitest";

import {
  buildS3Profile,
  DERIVE_CATALOG,
  DERIVE_CELL_KEY,
  DERIVE_KID,
  DERIVE_NOW,
} from "../src/__fixtures__/derive-profile.js";
import { calmWellbeing } from "../src/__fixtures__/inputs.js";
import { derivePlanInputs } from "../src/derive.js";
import { isPlannableState, PLANNABLE_STATES } from "../src/model.js";

const CERTIFIED = buildS3Profile();

/** The same profile with its one hypothesis forced to `state`, bypassing the legality table. */
function inState(state: Lifecycle): StudentProfile {
  const byId = Object.fromEntries(
    Object.entries(CERTIFIED.store.byId).map(([id, h]) => [
      id,
      withState(h, state, "test", "forced for this test", DERIVE_NOW),
    ]),
  );
  return { ...CERTIFIED, store: { byId } };
}

function derive(profile: StudentProfile) {
  return derivePlanInputs(
    profile,
    profile.store,
    DERIVE_CELL_KEY,
    calmWellbeing(DERIVE_KID, DERIVE_CELL_KEY),
    DERIVE_NOW,
    DERIVE_CATALOG,
  );
}

describe("a plan is only derivable for a spike a human certified", () => {
  it.each([...PLANNABLE_STATES])("derives inputs when the hypothesis is %s", (state) => {
    const inputs = derive(inState(state));

    expect(inputs).not.toBeNull();
    expect(inputs?.hypothesisState).toBe(state);
  });

  const refused = LIFECYCLE.filter((s) => !isPlannableState(s));

  it("refuses every other lifecycle state", () => {
    // Named explicitly rather than only derived, so adding a state to the lifecycle without
    // deciding whether it is plannable shows up here as a failure instead of silently passing.
    expect(refused).toEqual(["EXPLORING", "EMERGING", "PARKED", "CONTESTED", "REOPENED"]);
  });

  it.each(refused)("returns null when the hypothesis is %s", (state) => {
    expect(derive(inState(state))).toBeNull();
  });

  it("returns null when the cell has no hypothesis at all", () => {
    // The state this used to read as "UNKNOWN" and plan for anyway. Nobody has looked at this cell,
    // which is the strongest possible reason not to hand back a specialization plan for it.
    const profile: StudentProfile = { ...CERTIFIED, store: { byId: {} } };

    expect(derive(profile)).toBeNull();
  });

  it("the fixture is certified the way a real child would be, not by assignment", () => {
    // If the log ever stops clearing the confidence and durability bars, `promote` throws inside the
    // fixture rather than handing back a profile that claims a certification it did not earn.
    const hyp = Object.values(CERTIFIED.store.byId)[0];

    expect(hyp?.state).toBe("ACTIVE");
    expect(hyp?.evidence.confident).toBe(true);
    expect(hyp?.history.map((h) => h.to)).toContain("CANDIDATE");
  });
});
