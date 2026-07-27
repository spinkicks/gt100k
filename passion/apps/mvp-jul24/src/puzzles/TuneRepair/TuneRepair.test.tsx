/**
 * The music stand.
 *
 * Three of these tests are the design rather than the implementation, and all three would be easy to
 * break with a reasonable-looking edit:
 *
 *  - **nothing numeric on screen** (no note names, no key, no interval sizes);
 *  - **nothing that rewards** (PRD §11, memo 06 D7);
 *  - **the answer is not in the picture** — the test that did not exist in the first version, which is
 *    why the first version shipped a shape puzzle. An earlier test here actually asserted the puzzle
 *    was *"fully solvable in silence"* and treated that as a feature. It has been deleted and replaced
 *    by its opposite.
 *
 * jsdom has no `AudioContext`, so `getAudioEngine()` returns the silent engine and these tests drive
 * the puzzle from its data rather than by ear. That is fine for asserting mechanics — but it is exactly
 * why "can a player solve this by looking?" has to be asserted against the generator's guarantees
 * (`generate.test.ts`) rather than inferred from a test suite that always knows the answer.
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetAudioEngineForTests, silentEngine } from "../../audio/engine";
import TuneRepair from "./TuneRepair";
import { generateForRound } from "./generate";
import { isSolved, sourIndices } from "./logic";

beforeEach(() => {
  resetAudioEngineForTests();
});

const setup = (seed = 7, tier = 0) => {
  const onSolved = vi.fn();
  const onExit = vi.fn();
  const utils = render(<TuneRepair seed={seed} tier={tier} onSolved={onSolved} onExit={onExit} />);
  return { ...utils, onSolved, onExit, puzzle: generateForRound(seed, tier) };
};

const noteButtons = () => screen.getAllByRole("button", { name: /note$|note, picked up$/ });

/** Pick up the sour note, then nudge it the way that restores the key. */
function solve(puzzle: ReturnType<typeof generateForRound>) {
  fireEvent.click(noteButtons()[puzzle.brokenIndex] as HTMLElement);
  const direction = puzzle.fix > 0 ? "up" : "down";
  fireEvent.click(screen.getByRole("button", { name: `Nudge it ${direction}` }));
}

describe("nothing numeric on screen", () => {
  it("renders no digit anywhere in visible text", () => {
    const { container } = setup();
    expect(container.textContent ?? "").not.toMatch(/[0-9]/);
  });

  it("never names the key, which would turn listening into lookup", () => {
    const { container } = setup();
    const text = (container.textContent ?? "").toLowerCase();
    for (const word of ["major", "minor", "key of", "sharp", "flat", "semitone"]) {
      expect(text, `found "${word}"`).not.toContain(word);
    }
  });

  it("describes a nudge as a direction, not a coordinate", () => {
    setup();
    fireEvent.click(noteButtons()[2] as HTMLElement);
    const labels = screen
      .getAllByRole("button", { name: /^Nudge it/ })
      .map((b) => b.getAttribute("aria-label"));
    expect(labels.sort()).toEqual(["Nudge it down", "Nudge it up"]);
  });
});

describe("nothing here rewards", () => {
  it("shows no score, points, stars, streak or timer", () => {
    const { container } = setup();
    // Word boundaries, matching rules.test.tsx: a substring scan trips on the teach-in's own
    // "Touch the board to start".
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

/**
 * The replacement for the deleted "solvable in silence" test.
 *
 * It cannot prove a negative about human perception, so it asserts the two things it can: the app
 * *tells* the player sound is required, and the visual channel is not silently sufficient — the only
 * marker on the roll is which note is currently sounding, never which note is wrong.
 */
describe("the answer is not in the picture", () => {
  it("says so when sound is off, rather than presenting an unsolvable board", () => {
    const { container } = setup();
    expect(container.textContent).toContain("needs sound");
  });

  it("marks no note as wrong, in any state", () => {
    const { container, puzzle } = setup();
    expect(sourIndices(puzzle.broken, puzzle.key)).toHaveLength(1);
    // Nothing in the DOM distinguishes the sour note: no class, no attribute, no label.
    const sour = noteButtons()[puzzle.brokenIndex] as HTMLElement;
    const ordinary = noteButtons()[puzzle.brokenIndex === 1 ? 2 : 1] as HTMLElement;
    expect(sour.className).toBe(ordinary.className);
    expect(container.querySelectorAll("[class*=sour], [data-sour]")).toHaveLength(0);
  });

  it("offers only two destinations, so a long column cannot be read for the answer", () => {
    setup();
    fireEvent.click(noteButtons()[2] as HTMLElement);
    expect(screen.getAllByRole("button", { name: /^Nudge it/ })).toHaveLength(2);
  });
});

describe("playing it", () => {
  it("draws one note per slot of the melody", () => {
    const { puzzle } = setup();
    expect(noteButtons()).toHaveLength(puzzle.broken.length);
  });

  it("opens unsolved, because the melody as presented is sour", () => {
    const { puzzle, onSolved } = setup();
    expect(isSolved(puzzle.broken, puzzle.key)).toBe(false);
    expect(onSolved).not.toHaveBeenCalled();
    expect(screen.queryByText("That is the tune.")).not.toBeInTheDocument();
  });

  it("prompts for a direction once a note is picked up", () => {
    setup();
    fireEvent.click(noteButtons()[2] as HTMLElement);
    expect(screen.getByText("Nudge it up or down a step.")).toBeInTheDocument();
  });

  it("clicking a picked-up note again puts it down without moving it", () => {
    setup();
    fireEvent.click(noteButtons()[2] as HTMLElement);
    expect(screen.getByText("Nudge it up or down a step.")).toBeInTheDocument();
    fireEvent.click(noteButtons()[2] as HTMLElement);
    expect(screen.queryByText("Nudge it up or down a step.")).not.toBeInTheDocument();
  });

  it("fires onSolved exactly once when the melody is back in key", () => {
    const { puzzle, onSolved } = setup();
    solve(puzzle);
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  /**
   * Both directions of the sour note are in the key, so both are accepted — see naive.ts for why that
   * is forced rather than lenient.
   */
  it("accepts either direction on the sour note", () => {
    for (const direction of ["up", "down"]) {
      const { unmount } = render(
        <TuneRepair seed={7} tier={0} onSolved={() => {}} onExit={() => {}} />,
      );
      const puzzle = generateForRound(7, 0);
      const notes = within(document.body).getAllByRole("button", {
        name: /note$|note, picked up$/,
      });
      fireEvent.click(notes[puzzle.brokenIndex] as HTMLElement);
      fireEvent.click(within(document.body).getByRole("button", { name: `Nudge it ${direction}` }));
      expect(within(document.body).getByText("That is the tune.")).toBeInTheDocument();
      unmount();
    }
  });

  it("does not solve when a note that was already in key is nudged", () => {
    const { puzzle, onSolved } = setup();
    const innocent = puzzle.brokenIndex === 1 ? 2 : 1;
    fireEvent.click(noteButtons()[innocent] as HTMLElement);
    fireEvent.click(screen.getAllByRole("button", { name: /^Nudge it/ })[0] as HTMLElement);
    expect(onSolved).not.toHaveBeenCalled();
    expect(screen.queryByText("That is the tune.")).not.toBeInTheDocument();
  });

  it("can be put back, and the control is dead until something has moved", () => {
    const putBackName = "Put it back";
    const { puzzle } = setup();
    expect(screen.getByRole("button", { name: putBackName })).toBeDisabled();
    fireEvent.click(noteButtons()[puzzle.brokenIndex] as HTMLElement);
    fireEvent.click(screen.getAllByRole("button", { name: /^Nudge it/ })[0] as HTMLElement);
    expect(screen.getByRole("button", { name: putBackName })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: putBackName }));
    expect(screen.getByRole("button", { name: putBackName })).toBeDisabled();
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

describe("hearing the result of your own move", () => {
  it("plays the whole melody back after a nudge, not just the moved note", () => {
    const spy = vi.spyOn(silentEngine, "playSequence");
    const { puzzle } = setup();
    spy.mockClear();
    fireEvent.click(noteButtons()[puzzle.brokenIndex] as HTMLElement);
    fireEvent.click(screen.getAllByRole("button", { name: /^Nudge it/ })[0] as HTMLElement);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toHaveLength(puzzle.broken.length);
    spy.mockRestore();
  });

  it("plays at the melody's own tempo rather than a hardcoded one", () => {
    const spy = vi.spyOn(silentEngine, "playSequence");
    const { puzzle } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Play the tune/ }));
    expect(spy).toHaveBeenCalledWith(expect.anything(), puzzle.bpm);
    spy.mockRestore();
  });

  it("plays back after a wrong move too, so the replay is feedback and not a reward", () => {
    const spy = vi.spyOn(silentEngine, "playSequence");
    const { puzzle } = setup();
    spy.mockClear();
    const innocent = puzzle.brokenIndex === 1 ? 2 : 1;
    fireEvent.click(noteButtons()[innocent] as HTMLElement);
    fireEvent.click(screen.getAllByRole("button", { name: /^Nudge it/ })[0] as HTMLElement);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

describe("the tier prop", () => {
  it("opens at the tier it is given, so 'an easier one' is one number", () => {
    for (const tier of [0, 1, 2]) {
      const { unmount } = render(
        <TuneRepair seed={11} tier={tier} onSolved={() => {}} onExit={() => {}} />,
      );
      const expected = generateForRound(11, tier);
      expect(
        within(document.body).getAllByRole("button", { name: /note$|note, picked up$/ }),
      ).toHaveLength(expected.broken.length);
      unmount();
    }
  });

  it("plays the easiest tier more slowly than the hardest", () => {
    expect(generateForRound(11, 0).bpm).toBeLessThan(generateForRound(11, 2).bpm);
  });
});

describe("without Web Audio", () => {
  it("hides the sound toggle rather than offering one that does nothing", () => {
    setup();
    expect(screen.queryByRole("button", { name: /sound/i })).not.toBeInTheDocument();
  });

  it("says the device has no sound, rather than blaming a setting", () => {
    const { container } = setup();
    expect(container.textContent).toContain("this device has none");
  });

  it("still offers play without throwing", () => {
    setup();
    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: /Play the tune/ })),
    ).not.toThrow();
  });
});
