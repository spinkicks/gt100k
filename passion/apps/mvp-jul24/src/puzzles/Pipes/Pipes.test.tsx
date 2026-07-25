import { fireEvent, render } from "@testing-library/react";
import Pipes from "./Pipes";
import { LEVELS } from "./levels.data";
import { makeGrid } from "./logic";

test("rotating every tile into its solved orientation calls onSolved", () => {
  const seed = 0;
  const level = LEVELS[seed % LEVELS.length]!;
  // Same deterministic shuffle the component will render for this seed.
  const initial = makeGrid(level, seed);
  const onSolved = vi.fn();
  render(<Pipes seed={seed} onSolved={onSolved} onExit={() => {}} />);

  expect(onSolved).not.toHaveBeenCalled();

  for (let r = 0; r < initial.length; r++) {
    for (let c = 0; c < initial[r]!.length; c++) {
      const tile = initial[r]![c]!;
      if (tile.kind === "blank") continue;
      const clicksNeeded = (tile.solvedRotation - tile.rotation + 4) % 4;
      const btn = document.querySelector(`[aria-label^="pipe row ${r + 1} column ${c + 1}"]`);
      expect(btn).toBeTruthy();
      for (let i = 0; i < clicksNeeded; i++) fireEvent.click(btn!);
    }
  }

  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("exit button calls onExit", () => {
  const onExit = vi.fn();
  render(<Pipes seed={1} onSolved={() => {}} onExit={onExit} />);
  fireEvent.click(document.querySelector(".pp-exit")!);
  expect(onExit).toHaveBeenCalled();
});
