import { fireEvent, render, screen } from "@testing-library/react";
import { useGame } from "../game/store";
import MapScreen from "./MapScreen";

beforeEach(() => {
  useGame.getState().goToMap();
});

test("clicking the math node opens the math cabin", () => {
  render(<MapScreen />);
  fireEvent.click(screen.getByRole("button", { name: /Math & Puzzles/ }));
  expect(useGame.getState().screen).toBe("cabin");
  expect(useGame.getState().cabinId).toBe("math");
});

test('math node carries data-cabin="math" and is enabled', () => {
  render(<MapScreen />);
  const mathNode = document.querySelector('[data-cabin="math"]') as HTMLButtonElement;
  expect(mathNode).toBeInTheDocument();
  expect(mathNode).not.toBeDisabled();
  expect(mathNode.style.left).toBe("50%");
  expect(mathNode.style.top).toBe("55%");
});

test("inactive nodes are disabled, show a soon hint, and do not open a cabin", () => {
  render(<MapScreen />);
  const musicNode = document.querySelector('[data-cabin="music"]') as HTMLButtonElement;
  expect(musicNode).toBeDisabled();
  expect(musicNode.textContent).toMatch(/soon/i);

  fireEvent.click(musicNode);
  expect(useGame.getState().screen).toBe("map");
  expect(useGame.getState().cabinId).toBeNull();
});

test("renders the map background image", () => {
  render(<MapScreen />);
  const img = document.querySelector("img.map-screen-bg") as HTMLImageElement;
  expect(img).toBeInTheDocument();
  expect(img.getAttribute("src")).toBe("/art/map.png");
});
