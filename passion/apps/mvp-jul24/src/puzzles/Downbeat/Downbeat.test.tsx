/**
 * The pulse strip.
 *
 * The load-bearing test is that **every pulse renders identically**, which is R2 for this gadget: the
 * stress pattern is the answer, so nothing in the picture may hint at it. The spec originally carried the
 * metre in note lengths, which would have made this test impossible to pass.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetAudioEngineForTests, silentEngine } from "../../audio/engine";
import Downbeat from "./Downbeat";
import { generateForRound } from "./generate";
import { downbeatIndices } from "./logic";

beforeEach(() => {
  resetAudioEngineForTests();
});

const setup = (seed = 7, tier = 0) => {
  const onSolved = vi.fn();
  const onExit = vi.fn();
  const utils = render(<Downbeat seed={seed} tier={tier} onSolved={onSolved} onExit={onExit} />);
  return { ...utils, onSolved, onExit, puzzle: generateForRound(seed, tier) };
};

const pulses = () => screen.getAllByRole("button", { name: /pulse$/ });
const markAll = (indices: number[]) => {
  for (const i of indices) fireEvent.click(pulses()[i] as HTMLElement);
};

describe("R2 — the strip cannot carry the answer", () => {
  it("renders every pulse with an identical class list before any marking", () => {
    const { container } = setup();
    const nodes = [...container.querySelectorAll(".db-pulse")];
    expect(nodes.length).toBeGreaterThan(5);
    expect(new Set(nodes.map((n) => n.className)).size).toBe(1);
  });

  it("gives every slot the same flex sizing, so no width encodes a grouping", () => {
    const { container } = setup();
    const slots = [...container.querySelectorAll(".db-slot")];
    expect(new Set(slots.map((s) => s.className)).size).toBe(1);
  });

  it("labels pulses only by position, never by stress", () => {
    const { puzzle } = setup();
    const labels = pulses().map((b) => b.getAttribute("aria-label"));
    expect(labels[0]).toBe("first pulse");
    expect(labels).toHaveLength(puzzle.pulses);
    for (const l of labels) expect(l).not.toMatch(/loud|stress|accent|down/i);
  });

  it("renders no digit anywhere", () => {
    const { container } = setup();
    expect(container.textContent ?? "").not.toMatch(/[0-9]/);
  });

  it("never says how many beats are in a bar", () => {
    const { container } = setup();
    const text = (container.textContent ?? "").toLowerCase();
    for (const w of ["metre", "meter", "time signature", "duple", "triple", "quadruple"]) {
      expect(text, `found "${w}"`).not.toContain(w);
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

  it("tells you HOW MANY are missing but never which", () => {
    const { puzzle, container } = setup();
    markAll([downbeatIndices(puzzle)[0] as number]);
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(container.textContent).toContain("still to find");
    // No pulse is revealed: only the child's own marks are marked.
    expect(container.querySelectorAll(".db-marked")).toHaveLength(1);
  });
});

describe("playing it", () => {
  it("draws one pulse per beat of the loop", () => {
    const { puzzle } = setup();
    expect(pulses()).toHaveLength(puzzle.pulses);
  });

  it("plays the loop with the stress in loudness alone", () => {
    const spy = vi.spyOn(silentEngine, "playSequence");
    const { puzzle } = setup();
    fireEvent.click(screen.getByRole("button", { name: /Play the loop/ }));
    const notes = spy.mock.calls[0]?.[0] ?? [];
    expect(notes).toHaveLength(puzzle.pulses);
    expect(new Set(notes.map((n) => n.beats)).size).toBe(1);
    expect(new Set(notes.map((n) => n.velocity)).size).toBe(2);
    spy.mockRestore();
  });

  it("solves when exactly the stressed pulses are marked", () => {
    const { puzzle, onSolved } = setup();
    markAll(downbeatIndices(puzzle));
    expect(onSolved).toHaveBeenCalledTimes(1);
    expect(screen.getByText("That is the beat.")).toBeInTheDocument();
  });

  it("does not solve on a subset", () => {
    const { puzzle, onSolved } = setup();
    markAll(downbeatIndices(puzzle).slice(0, 1));
    expect(onSolved).not.toHaveBeenCalled();
  });

  it("does not solve on the right count in the wrong places", () => {
    const { puzzle, onSolved } = setup();
    const right = new Set(downbeatIndices(puzzle));
    const wrong: number[] = [];
    for (let i = 0; i < puzzle.pulses && wrong.length < right.size; i++) {
      if (!right.has(i)) wrong.push(i);
    }
    markAll(wrong);
    expect(onSolved).not.toHaveBeenCalled();
  });

  it("lets a mark be taken back", () => {
    setup();
    fireEvent.click(pulses()[1] as HTMLElement);
    expect(pulses()[1]).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(pulses()[1] as HTMLElement);
    expect(pulses()[1]).toHaveAttribute("aria-pressed", "false");
  });

  it("can clear every mark, and the control is dead until there is one", () => {
    const name = "Clear the marks";
    setup();
    expect(screen.getByRole("button", { name })).toBeDisabled();
    fireEvent.click(pulses()[1] as HTMLElement);
    expect(screen.getByRole("button", { name })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name }));
    expect(screen.getByRole("button", { name })).toBeDisabled();
  });

  it("offers another loop only once this one is right", () => {
    const { puzzle } = setup();
    expect(screen.queryByRole("button", { name: /Another loop/ })).not.toBeInTheDocument();
    markAll(downbeatIndices(puzzle));
    fireEvent.click(screen.getByRole("button", { name: /Another loop/ }));
    expect(screen.queryByText("That is the beat.")).not.toBeInTheDocument();
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
        <Downbeat seed={4} tier={tier} onSolved={() => {}} onExit={() => {}} />,
      );
      const expected = generateForRound(4, tier);
      expect(within(document.body).getAllByRole("button", { name: /pulse$/ })).toHaveLength(
        expected.pulses,
      );
      unmount();
    }
  });

  it("always starts on a downbeat at the easiest tier", () => {
    expect(generateForRound(4, 0).phase).toBe(0);
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
