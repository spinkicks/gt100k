import { fireEvent, render } from "@testing-library/react";
import Minesweeper from "./Minesweeper";
import { makeBoard } from "./logic";

test("revealing every safe cell calls onSolved", () => {
  const seed = 12345;
  const onSolved = vi.fn();
  render(<Minesweeper seed={seed} onSolved={onSolved} onExit={() => {}} />);

  // Know the mine layout ahead of time (same pure logic the component uses)
  // so the test can click every safe cell without ever touching a mine.
  const board = makeBoard(seed);
  for (let r = 0; r < board.height; r++) {
    for (let c = 0; c < board.width; c++) {
      if (!board.mines[r]![c]) {
        const el = document.querySelector(`[aria-label="row ${r + 1} column ${c + 1}"]`);
        if (el) fireEvent.click(el);
      }
    }
  }

  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("clicking a mine ends the game and 'Try again' resets the same seed without exploding again immediately", () => {
  const seed = 999;
  const board = makeBoard(seed);
  let mineRow = -1;
  let mineCol = -1;
  for (let r = 0; r < board.height && mineRow === -1; r++) {
    for (let c = 0; c < board.width; c++) {
      if (board.mines[r]![c]) {
        mineRow = r;
        mineCol = c;
        break;
      }
    }
  }

  render(<Minesweeper seed={seed} onSolved={() => {}} onExit={() => {}} />);

  // First-click-safety means the very first click can never explode, so
  // reveal a definitely-safe neighbor cell first (or the mine cell itself if
  // it happens to also be the very first click — either way it stays safe).
  // To actually trigger a loss we click the mine on a *second* click.
  const anySafe = document.querySelector('[data-mine="0"]')!;
  fireEvent.click(anySafe);

  const mineEl = document.querySelector(`[aria-label="row ${mineRow + 1} column ${mineCol + 1}"]`)!;
  fireEvent.click(mineEl);

  expect(document.querySelector(".ms-overlay")).toBeTruthy();

  const tryAgain = document.querySelector(".ms-again")!;
  fireEvent.click(tryAgain);

  expect(document.querySelector(".ms-overlay")).toBeFalsy();
});

test("exit button calls onExit", () => {
  const onExit = vi.fn();
  render(<Minesweeper seed={1} onSolved={() => {}} onExit={onExit} />);
  fireEvent.click(document.querySelector(".ms-exit")!);
  expect(onExit).toHaveBeenCalled();
});
