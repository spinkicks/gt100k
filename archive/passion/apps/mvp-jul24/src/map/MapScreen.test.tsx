import { fireEvent, render, screen } from "@testing-library/react";
import { useGame } from "../game/store";
import MapScreen from "./MapScreen";
import { CABINS } from "./cabins.data";

beforeEach(() => {
  useGame.getState().goToMap();
});

test("clicking the Logic Games node opens the logic-games cabin", () => {
  render(<MapScreen />);
  fireEvent.click(screen.getByRole("button", { name: /Logic Games/ }));
  expect(useGame.getState().screen).toBe("cabin");
  expect(useGame.getState().cabinId).toBe("logic-games");
});

test('logic-games node carries data-cabin="logic-games" and is enabled', () => {
  render(<MapScreen />);
  const node = document.querySelector('[data-cabin="logic-games"]') as HTMLButtonElement;
  expect(node).toBeInTheDocument();
  expect(node).not.toBeDisabled();
  expect(node).not.toHaveAttribute("aria-disabled");
  // Positioned FROM the data, not at a literal percentage. The old assertion pinned "12%"/"35%" and
  // broke the moment the plate was repainted at 3:2 and the coordinates were re-measured against it —
  // while never checking the thing that actually matters, since a label floating in the empty sky
  // would have satisfied it just as well. Whether a label sits on its cabin is a visual property and
  // is verified against the plate itself (see the measurement note in cabins.data.ts). What a unit
  // test can hold is that MapScreen applies each cabin's own coordinates and does not swap the axes.
  const logic = CABINS.find((c) => c.id === "logic-games");
  expect(logic).toBeDefined();
  expect(node.style.left).toBe(`${logic?.xPct}%`);
  expect(node.style.top).toBe(`${logic?.yPct}%`);
  expect(node.style.left).not.toBe(node.style.top);
});

// `math` is active and openable even though it has no gadgets yet — the empty room is deliberate
// (see src/gadgets/registry.ts), so the node must not be treated as coming-soon.
test("clicking the Math node opens the (currently gadget-free) math cabin", () => {
  render(<MapScreen />);
  const node = document.querySelector('[data-cabin="math"]') as HTMLButtonElement;
  expect(node).not.toBeDisabled();
  expect(node).not.toHaveAttribute("aria-disabled");

  fireEvent.click(node);
  expect(useGame.getState().screen).toBe("cabin");
  expect(useGame.getState().cabinId).toBe("math");
});

test("renders a node for all five cabins", () => {
  render(<MapScreen />);
  expect(document.querySelectorAll("[data-cabin]")).toHaveLength(5);
  for (const cabin of CABINS) {
    expect(document.querySelector(`[data-cabin="${cabin.id}"]`)).toBeInTheDocument();
  }
});

test.each(["art"])("the %s node reads as coming soon and does not open a cabin", (id) => {
  render(<MapScreen />);
  const node = document.querySelector(`[data-cabin="${id}"]`) as HTMLButtonElement;
  expect(node.className).toMatch(/inactive/);
  expect(node.textContent).toMatch(/coming soon/i);

  fireEvent.click(node);
  expect(useGame.getState().screen).toBe("map");
  expect(useGame.getState().cabinId).toBeNull();
});

// aria-disabled rather than the `disabled` attribute, so keyboard users can still reach the node and
// hear what's coming instead of having it skipped entirely (see MapScreen.tsx).
test("coming-soon nodes stay focusable and announce themselves as coming soon", () => {
  render(<MapScreen />);
  // Was `music` until that cabin opened on 2026-07-27, then `code` until it opened on 2026-07-28.
  // `art` is the only coming-soon node left, so when it opens this test needs a different subject —
  // or deleting, because there will be nothing left for it to assert.
  const node = document.querySelector('[data-cabin="art"]') as HTMLButtonElement;
  expect(node).not.toBeDisabled();
  expect(node).toHaveAttribute("aria-disabled", "true");
  expect(node).toHaveAccessibleName("Art — coming soon");

  node.focus();
  expect(document.activeElement).toBe(node);
});

test("coming-soon nodes are marked up without a padlock glyph", () => {
  render(<MapScreen />);
  const node = document.querySelector('[data-cabin="art"]') as HTMLButtonElement;
  expect(node.querySelector("svg")).toBeNull();
});

test("renders the map background image", () => {
  render(<MapScreen />);
  const img = document.querySelector("img.map-screen-bg") as HTMLImageElement;
  expect(img).toBeInTheDocument();
  // `map-v3.png`, not `map-v2.png`, since 2026-07-28: the three-near-cabin plate the node coordinates
  // in cabins.data.ts are measured against. Asserted rather than left implicit because the two files
  // are both on disk on purpose, so pointing at the wrong one would misplace every label and throw
  // no error at all.
  expect(img.getAttribute("src")).toBe("/art/map-v3.png");
});
