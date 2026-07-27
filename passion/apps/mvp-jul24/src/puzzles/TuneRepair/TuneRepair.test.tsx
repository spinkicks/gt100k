/**
 * The music stand.
 *
 * Two of these tests are the design, not the implementation: **R1** (nothing numeric on screen) and
 * **D7** (nothing that rewards). Both would be easy to break by a reasonable-looking edit, which is
 * why they are asserted against the rendered output rather than trusted to review.
 *
 * Audio is absent here and deliberately not stubbed: jsdom has no `AudioContext`, so
 * `getAudioEngine()` returns the silent engine by design (see `src/audio/engine.ts`). Every assertion
 * below therefore also proves the puzzle is fully playable with no sound at all, which is the
 * dual-coding requirement the cabin design turns on.
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetAudioEngineForTests } from "../../audio/engine";
import TuneRepair, { stepsLabel } from "./TuneRepair";
import { generateForRound } from "./generate";
import { isSolved } from "./logic";

beforeEach(() => {
  resetAudioEngineForTests();
});

const setup = (seed = 7) => {
  const onSolved = vi.fn();
  const onExit = vi.fn();
  const utils = render(<TuneRepair seed={seed} onSolved={onSolved} onExit={onExit} />);
  return { ...utils, onSolved, onExit, puzzle: generateForRound(seed, 0) };
};

/** The notes currently drawn, in time order, as their row positions. */
const noteButtons = () => screen.getAllByRole("button", { name: /note$|note, picked up$/ });

describe("R1 — the visual channel is musical notation, never numeric", () => {
  it("renders no digit anywhere in visible text", () => {
    const { container } = setup();
    // The teach-in and every label are included. A semitone count, degree, interval size or note
    // name with a number in it would land here and fail.
    expect(container.textContent ?? "").not.toMatch(/[0-9]/);
  });

  it("still renders no digit after a note has been picked up and moved", () => {
    const { container } = setup();
    const notes = noteButtons();
    fireEvent.click(notes[2] as HTMLElement);
    const landing = screen.getAllByRole("button", { name: /^Move it/ })[0] as HTMLElement;
    fireEvent.click(landing);
    expect(container.textContent ?? "").not.toMatch(/[0-9]/);
  });

  it("describes a move in relative steps in words, not coordinates", () => {
    expect(stepsLabel(1)).toBe("a step higher");
    expect(stepsLabel(-1)).toBe("a step lower");
    expect(stepsLabel(3)).toBe("three steps higher");
    expect(stepsLabel(-2)).toBe("two steps lower");
    expect(stepsLabel(2)).not.toMatch(/[0-9]/);
  });
});

describe("D7 — nothing here rewards", () => {
  it("shows no score, points, stars, streak or timer", () => {
    const { container } = setup();
    /**
     * Word boundaries, matching `src/teachin/rules.test.tsx`'s own regex rather than a substring
     * scan. A substring check fails on the teach-in's "Touch the board to **star**t", which is how
     * this test was first written and what it caught — the banned thing is reward vocabulary, not
     * the letters.
     */
    const banned =
      /\b(score|scores|point|points|star|stars|streak|timer|timed|seconds|attempt|attempts|tries|best|record|badge|reward|combo|lives?)\b/i;
    expect(container.textContent ?? "").not.toMatch(banned);
  });

  it("confirms a solve by naming the tune, not by celebrating the player", () => {
    const { puzzle } = setup();
    solve(puzzle);
    expect(screen.getByText("That is the tune.")).toBeInTheDocument();
  });
});

/** Click the broken note, then click the landing cell in its column at the correct pitch. */
function solve(puzzle: ReturnType<typeof generateForRound>) {
  const notes = noteButtons();
  fireEvent.click(notes[puzzle.brokenIndex] as HTMLElement);
  const target = puzzle.correct[puzzle.brokenIndex] as number;
  const current = puzzle.broken[puzzle.brokenIndex] as number;
  const label = new RegExp(`^Move it ${stepsLabel(target - current)}$`);
  fireEvent.click(screen.getByRole("button", { name: label }));
}

describe("playing it", () => {
  it("draws one note per beat slot of the phrase", () => {
    const { puzzle } = setup();
    expect(noteButtons()).toHaveLength(puzzle.broken.length);
  });

  it("opens unsolved, because the presented phrase is broken", () => {
    const { puzzle, onSolved } = setup();
    expect(isSolved(puzzle.broken)).toBe(false);
    expect(onSolved).not.toHaveBeenCalled();
    expect(screen.queryByText("That is the tune.")).not.toBeInTheDocument();
  });

  it("prompts for a destination once a note is picked up", () => {
    setup();
    fireEvent.click(noteButtons()[2] as HTMLElement);
    expect(screen.getByText("Now click where it should go.")).toBeInTheDocument();
  });

  it("offers landing places only in the picked-up note's own column", () => {
    const { puzzle } = setup();
    fireEvent.click(noteButtons()[2] as HTMLElement);
    const landings = screen.getAllByRole("button", { name: /^Move it/ });
    // One per reachable row in that column, minus the row the note already occupies.
    expect(landings).toHaveLength(puzzle.hi - puzzle.lo);
  });

  it("clicking a picked-up note again puts it down without moving it", () => {
    setup();
    const note = noteButtons()[2] as HTMLElement;
    fireEvent.click(note);
    expect(screen.getByText("Now click where it should go.")).toBeInTheDocument();
    fireEvent.click(noteButtons()[2] as HTMLElement);
    expect(screen.queryByText("Now click where it should go.")).not.toBeInTheDocument();
  });

  it("fires onSolved exactly once when the tune is right", () => {
    const { puzzle, onSolved } = setup();
    solve(puzzle);
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it("does not fire onSolved for a wrong move", () => {
    const { puzzle, onSolved } = setup();
    const notes = noteButtons();
    fireEvent.click(notes[puzzle.brokenIndex] as HTMLElement);
    // Move it somewhere that is not the answer.
    const wrong = screen
      .getAllByRole("button", { name: /^Move it/ })
      .find(
        (b) =>
          b.getAttribute("aria-label") !==
          `Move it ${stepsLabel((puzzle.correct[puzzle.brokenIndex] as number) - (puzzle.broken[puzzle.brokenIndex] as number))}`,
      );
    fireEvent.click(wrong as HTMLElement);
    expect(onSolved).not.toHaveBeenCalled();
  });

  it("can be put back, and the control is dead until something has moved", () => {
    const { puzzle } = setup();
    const putBack = screen.getByRole("button", { name: "Put it back" });
    expect(putBack).toBeDisabled();
    fireEvent.click(noteButtons()[puzzle.brokenIndex] as HTMLElement);
    fireEvent.click(screen.getAllByRole("button", { name: /^Move it/ })[0] as HTMLElement);
    expect(putBack).toBeEnabled();
    fireEvent.click(putBack);
    expect(putBack).toBeDisabled();
  });

  it("offers another tune only after this one is right", () => {
    const { puzzle } = setup();
    expect(screen.queryByRole("button", { name: /Another tune/ })).not.toBeInTheDocument();
    solve(puzzle);
    fireEvent.click(screen.getByRole("button", { name: /Another tune/ }));
    expect(screen.queryByText("That is the tune.")).not.toBeInTheDocument();
  });

  it("exits", () => {
    const { onExit } = setup();
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

describe("with no Web Audio at all", () => {
  it("hides the sound control rather than offering one that does nothing", () => {
    setup();
    expect(screen.queryByRole("button", { name: /sound/i })).not.toBeInTheDocument();
  });

  it("still offers play, because the highlight follows the phrase either way", () => {
    setup();
    expect(screen.getByRole("button", { name: /Play the tune/ })).toBeInTheDocument();
    // Must not throw when there is nothing to play it with.
    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: /Play the tune/ })),
    ).not.toThrow();
  });

  it("is fully solvable in silence, which is the dual-coding requirement", () => {
    const { puzzle, onSolved } = setup(23);
    solve(puzzle);
    expect(onSolved).toHaveBeenCalledTimes(1);
  });
});

describe("across many instances", () => {
  it("is solvable from the roll alone for a spread of seeds", () => {
    for (const seed of [1, 2, 3, 5, 8, 13, 21, 34]) {
      const { unmount } = render(<TuneRepair seed={seed} onSolved={() => {}} onExit={() => {}} />);
      const puzzle = generateForRound(seed, 0);
      const notes = within(document.body).getAllByRole("button", {
        name: /note$|note, picked up$/,
      });
      fireEvent.click(notes[puzzle.brokenIndex] as HTMLElement);
      const delta =
        (puzzle.correct[puzzle.brokenIndex] as number) -
        (puzzle.broken[puzzle.brokenIndex] as number);
      fireEvent.click(
        within(document.body).getByRole("button", {
          name: new RegExp(`^Move it ${stepsLabel(delta)}$`),
        }),
      );
      expect(within(document.body).getByText("That is the tune.")).toBeInTheDocument();
      unmount();
    }
  });
});
