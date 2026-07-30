/**
 * The per-specialization scoping of the Wellbeing, Plan and Access tabs.
 *
 * WHY THIS FILE EXISTS. The three lenses each derive one row per interest hypothesis, and every one
 * of them was being handed the child's whole set. The bug was invisible in every existing test:
 * each panel rendered exactly what it was given, each view model was correct, and the rail set a
 * selection that nothing outside the Hypotheses tab read. Nothing was wrong except the wiring, so
 * the test has to be about the wiring.
 *
 * The regression is a one-word edit — `scopedTo(ctrl.plans)` back to `ctrl.plans` — which is why
 * `scopeToSpec` is a named function rather than an inline filter. A named thing can be asserted on.
 *
 * `renderToStaticMarkup` and no jsdom, matching `maps-panel.test.tsx` so the console suite stays
 * headless. That means these assert the first render rather than a click, so the components that
 * take the selection as a prop are exercised directly.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { scopeToSpec } from "../app/console-state.js";
import { SpecScope } from "../app/components.js";
import type { HypothesisCard } from "@gt100k/hypothesis-store";

const row = (id: string): { readonly id: string } => ({ id });

const card = (id: string, domainPath: readonly string[], state = "ACTIVE"): HypothesisCard =>
  ({ id, domainPath, state, mode: "BUILD" }) as unknown as HypothesisCard;

describe("scopeToSpec", () => {
  it("keeps only the selected specialization's row", () => {
    const rows = [row("h-chess"), row("h-piano"), row("h-birding")];
    expect(scopeToSpec(rows, "h-piano")).toEqual([row("h-piano")]);
  });

  it("returns nothing when there is no selection, rather than everything", () => {
    // The failure mode this guards is the tempting one: `specId ? filter : rows`, which would make
    // an unselected console silently show every specialization again and look like it works.
    const rows = [row("h-chess"), row("h-piano")];
    expect(scopeToSpec(rows, null)).toEqual([]);
    expect(scopeToSpec(rows, undefined)).toEqual([]);
  });

  it("returns nothing when the selection names a row the lens does not have", () => {
    // Real case: a hypothesis with no plan yet. The lens must not fall back to a neighbour's row,
    // because a plan attributed to the wrong domain is worse than an empty tab.
    expect(scopeToSpec([row("h-chess")], "h-piano")).toEqual([]);
  });

  it("preserves the lens's own ordering among rows that survive", () => {
    // Access emits several proposals per specialization, escalations first. Scoping must not sort.
    const rows = [row("h-a"), row("h-b"), row("h-a")];
    expect(scopeToSpec(rows, "h-a")).toHaveLength(2);
  });
});

describe("SpecScope", () => {
  it("names the specialization the tab is scoped to", () => {
    const html = renderToStaticMarkup(
      <SpecScope card={card("h-1", ["code-computers", "programming"])} total={3} />,
    );
    expect(html).toContain("Showing");
    expect(html.toLowerCase()).toContain("programming");
  });

  it("says how many others there are, and where to switch", () => {
    // An empty Access tab must not read as "nothing for this child" when it means "nothing for this
    // one specialization", so the banner has to carry the denominator.
    const html = renderToStaticMarkup(
      <SpecScope card={card("h-1", ["code-computers", "programming"])} total={3} />,
    );
    expect(html).toContain("1 of 3");
    expect(html).toContain("Specializations");
  });

  it("drops the denominator when the child has only one specialization", () => {
    const html = renderToStaticMarkup(
      <SpecScope card={card("h-1", ["code-computers", "programming"])} total={1} />,
    );
    expect(html).not.toContain("1 of 1");
  });

  it("renders nothing when there is no selection", () => {
    expect(renderToStaticMarkup(<SpecScope card={undefined} total={0} />)).toBe("");
  });
});
