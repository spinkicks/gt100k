/**
 * The Trace & Repair board and listing.
 *
 * The load-bearing tests are the two that keep the answer hidden: **no line is marked as the faulty
 * one**, and the intended program is never printed. If either slipped, the round would be readable
 * without ever stepping through it, which is the whole construct.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { printLine } from "../../code/parse";
import TraceRepair from "./TraceRepair";
import { generateForRound } from "./generate";

const renderPuzzle = (seed = 7, tier = 0) =>
  render(<TraceRepair seed={seed} tier={tier} onSolved={vi.fn()} onExit={vi.fn()} />);

const listing = () => screen.getByRole("list", { name: /the program/i });
const inputs = () => within(listing()).getAllByRole("textbox");

describe("TraceRepair", () => {
  it("shows one editable field per line of the program", () => {
    renderPuzzle();
    expect(inputs()).toHaveLength(generateForRound(7, 0).buggy.length);
  });

  it("shows the program as it actually is, not as it was meant to be", () => {
    renderPuzzle();
    const puzzle = generateForRound(7, 0);
    const shown = inputs().map((el) => (el as HTMLInputElement).value);
    expect(shown).toEqual(puzzle.buggy.map(printLine));
    expect(shown).not.toEqual(puzzle.intended.map(printLine));
  });

  it("never marks which line is at fault", () => {
    const { container } = renderPuzzle();
    const puzzle = generateForRound(7, 0);
    const faulty = inputs()[puzzle.bugLine]!;
    // The faulty line must carry no class the other lines do not.
    const classes = inputs().map((el) => el.className);
    expect(new Set(classes).size).toBe(1);
    expect(faulty.className).toBe(classes[0]);
    expect(container.querySelector(".tr-bug, .tr-faulty, [data-bug]")).toBeNull();
  });

  it("does not report a solve for the program as it arrives", () => {
    const onSolved = vi.fn();
    render(<TraceRepair seed={7} tier={0} onSolved={onSolved} onExit={vi.fn()} />);
    expect(onSolved).not.toHaveBeenCalled();
  });

  it("reports a solve exactly once when the faulty line is retyped correctly", () => {
    const onSolved = vi.fn();
    const puzzle = generateForRound(7, 0);
    render(<TraceRepair seed={7} tier={0} onSolved={onSolved} onExit={vi.fn()} />);
    fireEvent.change(inputs()[puzzle.bugLine]!, {
      target: { value: printLine(puzzle.intended[puzzle.bugLine]!) },
    });
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it("stops claiming success once a line is edited again", () => {
    // Found by review: the success state was sticky and only reset on a new round.
    const puzzle = generateForRound(7, 0);
    renderPuzzle();
    fireEvent.change(inputs()[puzzle.bugLine]!, {
      target: { value: printLine(puzzle.intended[puzzle.bugLine]!) },
    });
    expect(screen.getByText(/both go the same way/i)).toBeInTheDocument();
    fireEvent.change(inputs()[0]!, { target: { value: "move 4" } });
    expect(screen.queryByText(/both go the same way/i)).toBeNull();
  });

  it("counts one round's solve once, even if it is broken and repaired again", () => {
    const onSolved = vi.fn();
    const puzzle = generateForRound(7, 0);
    render(<TraceRepair seed={7} tier={0} onSolved={onSolved} onExit={vi.fn()} />);
    const fix = printLine(puzzle.intended[puzzle.bugLine]!);
    fireEvent.change(inputs()[puzzle.bugLine]!, { target: { value: fix } });
    expect(onSolved).toHaveBeenCalledTimes(1);
    fireEvent.change(inputs()[puzzle.bugLine]!, { target: { value: "move 4" } });
    fireEvent.change(inputs()[puzzle.bugLine]!, { target: { value: fix } });
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it("says what an unreadable line needs rather than calling it invalid", () => {
    const { container } = renderPuzzle();
    fireEvent.change(inputs()[0]!, { target: { value: "move" } });
    expect(screen.getByText(/how many\?/i)).toBeInTheDocument();
    fireEvent.change(inputs()[0]!, { target: { value: "jump 2" } });
    expect(screen.getByText(/do not know that word/i)).toBeInTheDocument();

    // Scoped to the feedback itself. Asserting against the whole screen catches the teach-in
    // diagram's "one line is wrong", which is the rule of the puzzle rather than a scolding.
    const said = [...container.querySelectorAll(".tr-problem")]
      .map((el) => el.textContent ?? "")
      .join(" ");
    expect(said).not.toMatch(/invalid|error|wrong|bad/i);
  });

  it("survives a half-typed line without breaking the board", () => {
    const { container } = renderPuzzle();
    for (const junk of ["m", "move -", "turn", "", "   "]) {
      fireEvent.change(inputs()[0]!, { target: { value: junk } });
      expect(container.querySelector(".tr-board")).not.toBeNull();
    }
  });

  it("offers a scrubber that steps through the run", () => {
    renderPuzzle();
    const slider = screen.getByRole("slider");
    expect(slider).toBeInTheDocument();
    fireEvent.change(slider, { target: { value: "2" } });
    expect((slider as HTMLInputElement).value).toBe("2");
  });

  it("moves the creature when the scrubber moves — the instrument does something", () => {
    const { container } = renderPuzzle();
    const posOf = () => {
      const el = container.querySelector(".tr-mine") as HTMLElement;
      return `${el.style.gridColumn},${el.style.gridRow},${el.style.transform}`;
    };
    const atStart = posOf();
    fireEvent.change(screen.getByRole("slider"), { target: { value: "3" } });
    expect(posOf()).not.toBe(atStart);
  });

  it("shows the word list, so no word has to be guessed", () => {
    renderPuzzle();
    const words = screen.getByText(/words you can use/i).textContent ?? "";
    for (const v of ["move", "turn", "wait", "left", "right"]) {
      expect(words).toContain(v);
    }
  });

  it("shows no score, points, stars, streak or timer", () => {
    const banned =
      /\b(score|scores|point|points|star|stars|streak|timer|timed|seconds|attempt|attempts|tries|best|record|badge|reward|combo|lives?)\b/i;
    const { container } = renderPuzzle();
    expect(container.textContent ?? "").not.toMatch(banned);
  });

  it("mounts the teach-in", () => {
    renderPuzzle();
    expect(screen.getByText(/stop agreeing/i)).toBeInTheDocument();
  });

  it("offers a way out", () => {
    const onExit = vi.fn();
    render(<TraceRepair seed={7} tier={0} onSolved={vi.fn()} onExit={onExit} />);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
