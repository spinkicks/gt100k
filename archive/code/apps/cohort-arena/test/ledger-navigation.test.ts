import { describe, expect, it } from "vitest";

import {
  type LedgerTreeStructure,
  createLedgerNavigationState,
  nextLedgerNavigationState,
  visibleLedgerNodeIds,
} from "../components/ledger/navigation.js";

const STRUCTURE: LedgerTreeStructure = [
  { id: "cohort-1", childIds: ["cohort-1-member-1", "cohort-1-member-2"] },
  { id: "cohort-2", childIds: ["cohort-2-member-1"] },
];

describe("Cohort Ledger keyboard navigation", () => {
  it("starts on the first expanded cohort and exposes every visible node in reading order", () => {
    const state = createLedgerNavigationState(STRUCTURE);

    expect(state).toEqual({
      activeId: "cohort-1",
      expandedIds: ["cohort-1", "cohort-2"],
    });
    expect(visibleLedgerNodeIds(STRUCTURE, state)).toEqual([
      "cohort-1",
      "cohort-1-member-1",
      "cohort-1-member-2",
      "cohort-2",
      "cohort-2-member-1",
    ]);
  });

  it("moves through visible nodes with Arrow keys and supports Home and End", () => {
    let state = createLedgerNavigationState(STRUCTURE);

    state = nextLedgerNavigationState(STRUCTURE, state, "ArrowDown");
    expect(state.activeId).toBe("cohort-1-member-1");
    state = nextLedgerNavigationState(STRUCTURE, state, "ArrowDown");
    expect(state.activeId).toBe("cohort-1-member-2");
    state = nextLedgerNavigationState(STRUCTURE, state, "ArrowUp");
    expect(state.activeId).toBe("cohort-1-member-1");
    state = nextLedgerNavigationState(STRUCTURE, state, "End");
    expect(state.activeId).toBe("cohort-2-member-1");
    state = nextLedgerNavigationState(STRUCTURE, state, "Home");
    expect(state.activeId).toBe("cohort-1");
  });

  it("uses Right and Left Arrow to enter, expand, return to, and collapse a cohort", () => {
    let state = createLedgerNavigationState(STRUCTURE);

    state = nextLedgerNavigationState(STRUCTURE, state, "ArrowRight");
    expect(state.activeId).toBe("cohort-1-member-1");
    state = nextLedgerNavigationState(STRUCTURE, state, "ArrowLeft");
    expect(state.activeId).toBe("cohort-1");
    state = nextLedgerNavigationState(STRUCTURE, state, "ArrowLeft");
    expect(state.expandedIds).toEqual(["cohort-2"]);
    expect(visibleLedgerNodeIds(STRUCTURE, state)).toEqual([
      "cohort-1",
      "cohort-2",
      "cohort-2-member-1",
    ]);
    state = nextLedgerNavigationState(STRUCTURE, state, "ArrowRight");
    expect(state.expandedIds).toEqual(["cohort-1", "cohort-2"]);
    expect(state.activeId).toBe("cohort-1");
  });

  it("lets Enter toggle a branch and Escape return to and collapse its parent", () => {
    let state = createLedgerNavigationState(STRUCTURE);

    state = nextLedgerNavigationState(STRUCTURE, state, "Enter");
    expect(state.expandedIds).toEqual(["cohort-2"]);
    state = nextLedgerNavigationState(STRUCTURE, state, "Enter");
    expect(state.expandedIds).toEqual(["cohort-1", "cohort-2"]);
    state = nextLedgerNavigationState(STRUCTURE, state, "ArrowDown");
    state = nextLedgerNavigationState(STRUCTURE, state, "Escape");
    expect(state).toEqual({ activeId: "cohort-1", expandedIds: ["cohort-2"] });
  });

  it("is inert for an empty tree or unrelated keys", () => {
    const empty = createLedgerNavigationState([]);
    expect(empty).toEqual({ activeId: null, expandedIds: [] });
    expect(nextLedgerNavigationState([], empty, "ArrowDown")).toEqual(empty);

    const state = createLedgerNavigationState(STRUCTURE);
    expect(nextLedgerNavigationState(STRUCTURE, state, "Tab")).toBe(state);
  });
});
