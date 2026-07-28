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
  expect(node.style.left).toBe("12%");
  expect(node.style.top).toBe("35%");
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

test.each(["code", "art"])("the %s node reads as coming soon and does not open a cabin", (id) => {
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
  // Was `music` until that cabin opened on 2026-07-27; `code` is a coming-soon node now.
  const node = document.querySelector('[data-cabin="code"]') as HTMLButtonElement;
  expect(node).not.toBeDisabled();
  expect(node).toHaveAttribute("aria-disabled", "true");
  expect(node).toHaveAccessibleName("Code — coming soon");

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
  // `map-v2.png`, not `map.png`, since 2026-07-27: the three-near-cabin plate the node coordinates
  // in cabins.data.ts are measured against. Asserted rather than left implicit because the two files
  // are both on disk on purpose, so pointing at the wrong one would misplace every label and throw
  // no error at all.
  expect(img.getAttribute("src")).toBe("/art/map-v2.png");
});
