/**
 * The listening bench.
 *
 * The load-bearing test here is **"nothing distinguishes the options visually"**. That is R2 for this
 * gadget, and it is the exact failure the cabin's other gadget shipped and had to be rewritten for, so it
 * is asserted against rendered DOM rather than trusted to review.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetAudioEngineForTests, silentEngine } from "../../audio/engine";
import ChordFit from "./ChordFit";
import { generateForRound } from "./generate";
import { supportingIndices } from "./logic";

beforeEach(() => {
  resetAudioEngineForTests();
});

const setup = (seed = 7, tier = 0) => {
  const onSolved = vi.fn();
  const onExit = vi.fn();
  const utils = render(<ChordFit seed={seed} tier={tier} onSolved={onSolved} onExit={onExit} />);
  return { ...utils, onSolved, onExit, puzzle: generateForRound(seed, tier) };
};

const picks = () => screen.getAllByRole("button", { name: /^Choose the/ });
const plays = () => screen.getAllByRole("button", { name: /^Hear the .* chord/ });

describe("R2 — nothing distinguishes the options by eye", () => {
  it("renders the three options identically before any choice", () => {
    const { container } = setup();
    const options = container.querySelectorAll(".cf-option");
    expect(options).toHaveLength(3);
    const classes = new Set([...options].map((o) => o.className));
    expect(classes.size).toBe(1);
  });

  /**
   * Scoped to the OPTIONS, not the whole screen: the teach-in is allowed a diagram, because explanation
   * is not solvable state — and its diagram is deliberately abstract for the same reason (see
   * `ChordFitDiagram`). What must contain no drawing is the part the child answers with.
   */
  it("draws nothing inside the options — no notes, staff, roll or heights", () => {
    const { container } = setup();
    const options = container.querySelector(".cf-options") as HTMLElement;
    expect(options).not.toBeNull();
    expect(options.querySelector("svg")).toBeNull();
    expect(options.querySelector("canvas")).toBeNull();
    expect(options.querySelectorAll("[class*=roll], [class*=note], [class*=row]")).toHaveLength(0);
    // The only text inside an option is the pick label; nothing describes the chord.
    expect(options.textContent).toBe("▶This one▶This one▶This one");
  });

  it("labels the options only by position, never by chord content", () => {
    setup();
    const labels = picks().map((b) => b.getAttribute("aria-label"));
    expect(labels).toEqual([
      "Choose the first chord",
      "Choose the second chord",
      "Choose the third chord",
    ]);
  });

  it("renders no digit and no chord or key name", () => {
    const { container } = setup();
    const text = (container.textContent ?? "").toLowerCase();
    expect(text).not.toMatch(/[0-9]/);
    for (const word of ["major", "minor", "key of", "sharp", "flat", "triad", "chord of"]) {
      expect(text, `found "${word}"`).not.toContain(word);
    }
  });
});

describe("nothing here rewards", () => {
  it("shows no score, points, stars, streak or timer", () => {
    const { container } = setup();
    const banned =
      /\b(score|scores|point|points|star|stars|streak|timer|timed|seconds|attempt|attempts|tries|best|record|badge|reward|combo|lives?)\b/i;
    expect(container.textContent ?? "").not.toMatch(banned);
  });

  it("does not count wrong picks", () => {
    const { container, puzzle } = setup();
    const wrong = [0, 1, 2].filter((i) => i !== puzzle.answer);
    fireEvent.click(picks()[wrong[0] as number] as HTMLElement);
    fireEvent.click(picks()[wrong[1] as number] as HTMLElement);
    expect(container.textContent).toContain("That one clashes");
    expect(container.textContent ?? "").not.toMatch(/[0-9]/);
  });
});

describe("playing it", () => {
  it("offers exactly one supporting chord", () => {
    const { puzzle } = setup();
    expect(supportingIndices(puzzle)).toEqual([puzzle.answer]);
  });

  it("plays the chord together with the melody note, because support is a relation", () => {
    const spy = vi.spyOn(silentEngine, "playChord");
    const { puzzle } = setup();
    fireEvent.click(plays()[0] as HTMLElement);
    expect(spy).toHaveBeenCalledTimes(1);
    const notes = spy.mock.calls[0]?.[0] ?? [];
    expect(notes.map((n) => n.semitone)).toContain(puzzle.melodyNote);
    spy.mockRestore();
  });

  it("can play the melody note on its own, because knowing the target is not a hint", () => {
    const spy = vi.spyOn(silentEngine, "playNote");
    const { puzzle } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Hear the note/ }));
    expect(spy).toHaveBeenCalledWith(
      { semitone: puzzle.melodyNote, beats: puzzle.beats },
      puzzle.bpm,
    );
    spy.mockRestore();
  });

  it("fires onSolved once for the supporting chord", () => {
    const { puzzle, onSolved } = setup();
    fireEvent.click(picks()[puzzle.answer] as HTMLElement);
    expect(onSolved).toHaveBeenCalledTimes(1);
    expect(screen.getByText("That one holds it up.")).toBeInTheDocument();
  });

  it("lets a wrong pick be followed by the right one, at no cost", () => {
    const { puzzle, onSolved } = setup();
    const wrong = [0, 1, 2].find((i) => i !== puzzle.answer) as number;
    fireEvent.click(picks()[wrong] as HTMLElement);
    expect(onSolved).not.toHaveBeenCalled();
    fireEvent.click(picks()[puzzle.answer] as HTMLElement);
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it("plays a wrong pick too, so the clash is what teaches", () => {
    const spy = vi.spyOn(silentEngine, "playChord");
    const { puzzle } = setup();
    spy.mockClear();
    const wrong = [0, 1, 2].find((i) => i !== puzzle.answer) as number;
    fireEvent.click(picks()[wrong] as HTMLElement);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("locks the picks once solved, so there is nothing to undo", () => {
    const { puzzle } = setup();
    fireEvent.click(picks()[puzzle.answer] as HTMLElement);
    for (const b of picks()) expect(b).toBeDisabled();
  });

  it("offers another note only after this one is right", () => {
    const { puzzle } = setup();
    expect(screen.queryByRole("button", { name: /Another note/ })).not.toBeInTheDocument();
    fireEvent.click(picks()[puzzle.answer] as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: /Another note/ }));
    expect(screen.queryByText("That one holds it up.")).not.toBeInTheDocument();
  });

  it("exits", () => {
    const { onExit } = setup();
    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

describe("the tier prop", () => {
  it("opens at the tier it is given", () => {
    for (const tier of [0, 1, 2]) {
      const { unmount } = render(
        <ChordFit seed={3} tier={tier} onSolved={() => {}} onExit={() => {}} />,
      );
      expect(within(document.body).getAllByRole("button", { name: /^Choose the/ })).toHaveLength(3);
      unmount();
    }
  });

  it("rings longer at the easiest tier, giving more time to judge", () => {
    expect(generateForRound(3, 0).beats).toBeGreaterThanOrEqual(generateForRound(3, 2).beats);
  });
});

describe("without Web Audio", () => {
  it("says the activity needs sound", () => {
    const { container } = setup();
    expect(container.textContent).toContain("needs sound");
  });

  it("hides the sound toggle rather than offering a dead one", () => {
    setup();
    expect(screen.queryByRole("button", { name: /^Turn sound/ })).not.toBeInTheDocument();
  });
});
