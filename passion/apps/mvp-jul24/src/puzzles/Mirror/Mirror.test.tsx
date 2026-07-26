import { fireEvent, render, screen } from "@testing-library/react";
import Mirror from "./Mirror";
import { generateLevel } from "./generate";
import { traceBeam } from "./logic";

// Mirror.tsx's CELL and GAP, written out longhand on purpose. The bug these guard against was the
// SVG overlay computing from the tile size alone and ignoring the grid's gap, so a test that
// imported the component's own constants — or derived one number from the other — could not have
// caught it. Two independent copies is the point.
const CELL = 56;
const GAP = 2;

// Every generated level's mirrors start flipped from the solution orientation
// (see generate.ts), so clicking every mirror on the board exactly once is
// always the full solution regardless of which board a given seed produced.
function solveByClickingEveryMirror() {
  const mirrors = document.querySelectorAll<HTMLButtonElement>(".mr-mirror");
  expect(mirrors.length).toBeGreaterThan(0);
  for (const mirror of mirrors) fireEvent.click(mirror);
}

test("rotating every mirror once routes the beam to the target and fires onSolved once", () => {
  const onSolved = vi.fn();
  render(<Mirror seed={0} onSolved={onSolved} onExit={() => {}} />);

  expect(onSolved).not.toHaveBeenCalled();

  solveByClickingEveryMirror();

  expect(onSolved).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("status")).toHaveTextContent(/locked onto the target/i);

  // Clicking further (rotating back and forth) must not call onSolved again.
  const mirrors = document.querySelectorAll<HTMLButtonElement>(".mr-mirror");
  for (const mirror of mirrors) {
    fireEvent.click(mirror);
    fireEvent.click(mirror);
  }
  expect(onSolved).toHaveBeenCalledTimes(1);
});

test("clicking a floor or target cell does nothing (only mirrors rotate)", () => {
  const onSolved = vi.fn();
  render(<Mirror seed={0} onSolved={onSolved} onExit={() => {}} />);
  fireEvent.click(screen.getByLabelText("target"));
  expect(onSolved).not.toHaveBeenCalled();
});

test("the beam lands on tile centres however far across the board a run goes", () => {
  render(<Mirror seed={7} onSolved={() => {}} onExit={() => {}} />);

  const level = generateLevel(7);
  const trace = traceBeam(level.size, level.mirrors, level.emitter, level.target);
  const points = document
    .querySelector(".mr-beam-core")!
    .getAttribute("points")!
    .split(" ")
    .map((pair) => pair.split(",").map(Number) as [number, number]);

  expect(points).toHaveLength(trace.path.length);
  points.forEach(([x, y], i) => {
    const cell = trace.path[i]!;
    expect(x).toBe(cell.col * (CELL + GAP) + CELL / 2);
    expect(y).toBe(cell.row * (CELL + GAP) + CELL / 2);
  });

  // The beam has to reach at least the third column for this to be a real check: on the old
  // gap-blind geometry column 0 was still correct and column 1 was only 2px out.
  expect(Math.max(...trace.path.map((p) => p.col))).toBeGreaterThan(1);

  // …and the overlay has to be the same size as the grid it sits on, or the coordinates above are
  // measured in a viewBox that is stretched to a different footprint.
  const span = level.size * CELL + (level.size - 1) * GAP;
  const svg = document.querySelector(".mr-beam-layer")!;
  expect(svg.getAttribute("width")).toBe(String(span));
  expect(svg.getAttribute("height")).toBe(String(span));
  expect(svg.getAttribute("viewBox")).toBe(`0 0 ${span} ${span}`);

  // The grid is laid out from the same two numbers the overlay used.
  const grid = document.querySelector<HTMLElement>(".mr-grid")!;
  expect(grid.style.gridTemplateColumns).toBe(`repeat(${level.size}, ${CELL}px)`);
  expect(grid.style.gridTemplateRows).toBe(`repeat(${level.size}, ${CELL}px)`);
  expect(grid.style.gap).toBe(`${GAP}px`);
});

test("the wood frame wraps the grid rather than being handed a size border-box then eats", () => {
  render(<Mirror seed={3} onSolved={() => {}} onExit={() => {}} />);

  // jsdom does no layout, so the assertion is on the shape of the fix rather than on pixels: the
  // board must carry no explicit size at all. Setting one is what broke it — under the global
  // border-box rule the 10px padding and 4px border came out of the stated width, while the grid
  // kept the footprint its own tile template gives it, so it hung 22px past the outer edge of the
  // frame on a 5-wide board (measured in Chromium) and 2px more for every column after that.
  const board = document.querySelector<HTMLElement>(".mr-board")!;
  expect(board.style.width).toBe("");
  expect(board.style.height).toBe("");
});

test("a mirror's slant is carried by shape and label, never by colour alone", () => {
  render(<Mirror seed={5} onSolved={() => {}} onExit={() => {}} />);

  const mirrors = Array.from(document.querySelectorAll<HTMLButtonElement>(".mr-mirror"));
  expect(mirrors.length).toBeGreaterThan(0);

  for (const mirror of mirrors) {
    const isSlash = mirror.classList.contains("mr-mirror-slash");
    // Exactly one of the two slant classes: Mirror.css hangs the shard's rotation and the pair of
    // corner mounts off these, which is what makes the slant readable in greyscale.
    expect(isSlash).not.toBe(mirror.classList.contains("mr-mirror-back"));
    expect(mirror.getAttribute("aria-label")).toContain(isSlash ? "forward slash" : "backslash");
    expect(mirror.querySelector(".mr-mirror-glass")).not.toBeNull();
  }

  const first = mirrors[0]!;
  const before = { class: first.className, label: first.getAttribute("aria-label") };
  fireEvent.click(first);
  expect(first.className).not.toBe(before.class);
  expect(first.getAttribute("aria-label")).not.toBe(before.label);
});

test("Back button calls onExit", () => {
  const onExit = vi.fn();
  render(<Mirror seed={0} onSolved={() => {}} onExit={onExit} />);
  fireEvent.click(document.querySelector(".mr-exit")!);
  expect(onExit).toHaveBeenCalled();
});

test('"Next puzzle" only appears once solved, and generates a fresh, unsolved board', () => {
  const onSolved = vi.fn();
  render(<Mirror seed={0} onSolved={onSolved} onExit={() => {}} />);

  expect(document.querySelector(".mr-next")).toBeNull();

  const firstBoardMirrors = Array.from(document.querySelectorAll(".mr-mirror")).map((el) =>
    el.getAttribute("aria-label"),
  );

  solveByClickingEveryMirror();
  expect(onSolved).toHaveBeenCalledTimes(1);

  const nextButton = document.querySelector<HTMLButtonElement>(".mr-next");
  expect(nextButton).not.toBeNull();
  fireEvent.click(nextButton!);

  // The new round starts unsolved again, and the "Next puzzle" control
  // disappears until the player solves this new board too.
  expect(document.querySelector(".mr-next")).toBeNull();
  expect(screen.getByRole("status")).toHaveTextContent(/rotate it and guide the beam/i);

  const secondBoardMirrors = Array.from(document.querySelectorAll(".mr-mirror")).map((el) =>
    el.getAttribute("aria-label"),
  );
  expect(secondBoardMirrors).not.toEqual(firstBoardMirrors);

  // Solving the new board fires onSolved again (once per round).
  solveByClickingEveryMirror();
  expect(onSolved).toHaveBeenCalledTimes(2);
});
