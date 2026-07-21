import { describe, expect, it } from "vitest";

import * as arena from "@gt100k/cohort-arena-view";
import { viewCohort12 } from "./fixtures/view-cohort-12.js";

describe("cohort arena view smoke", () => {
  it("builds the seeded Fixture V1 through the public entrypoint", () => {
    const view = arena.buildCohortArenaView(viewCohort12.input);

    expect(arena).toBeTypeOf("object");
    expect(view.constellation.hexes.map((hex) => hex.members.map(({ ref }) => ref))).toEqual(
      viewCohort12.expected.cohortMemberRefs,
    );
    expect(
      view.constellation.hexes.map((hex) =>
        hex.members.map(({ ref, pos, pos2d }) => ({ ref, pos, pos2d })),
      ),
    ).toEqual(viewCohort12.expected.settledMembers);
    expect(view.cohorts.map(({ members }) => members.map(({ role }) => role))).toEqual([
      viewCohort12.expected.roleVector,
      viewCohort12.expected.roleVector,
    ]);
    expect(view.cohorts.map(({ nonHarmFloor }) => nonHarmFloor)).toEqual([
      viewCohort12.expected.nonHarmFloor,
      viewCohort12.expected.nonHarmFloor,
    ]);
    expect(view.cohorts.map(({ badges }) => badges)).toEqual([
      viewCohort12.expected.badges,
      viewCohort12.expected.badges,
    ]);
    expect(view.cohorts.map(({ churnDelta }) => churnDelta)).toEqual([0, 0]);
    expect(view.standings).toBeNull();
    expect(view.safeguarding).toEqual(viewCohort12.expected.safeguarding);
  });
});
