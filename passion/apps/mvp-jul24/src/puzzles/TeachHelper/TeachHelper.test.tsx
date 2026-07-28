/**
 * The Teach the Helper board.
 *
 * The load-bearing test is that **the hidden floors are not rendered before the helper is sent**. If
 * they were, a child would write for them and the round would measure nothing — which is the whole
 * construct, not a detail of presentation.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TeachHelper from "./TeachHelper";
import { generateForRound } from "./generate";
import { writtenForWhatCouldBeThere, writtenForWhatYouSee } from "./naive";
import { printLine } from "../../code/parse";

const renderPuzzle = (seed = 7, tier = 0) =>
  render(<TeachHelper seed={seed} tier={tier} onSolved={vi.fn()} onExit={vi.fn()} />);

const write = (text: string) =>
  fireEvent.change(screen.getByRole("textbox"), { target: { value: text } });

const asText = (p: ReturnType<typeof writtenForWhatCouldBeThere>) => p.map(printLine).join("\n");

const send = () => fireEvent.click(screen.getByRole("button", { name: /send the helper/i }));

describe("TeachHelper", () => {
  it("shows one floor before the helper is sent, never the hidden ones", () => {
    const { container } = renderPuzzle();
    expect(container.querySelectorAll(".th-corridor")).toHaveLength(1);
  });

  it("shows the other floors only after a run, so they cannot be written for", () => {
    const { container } = renderPuzzle();
    write(asText(writtenForWhatCouldBeThere()));
    expect(container.querySelectorAll(".th-corridor")).toHaveLength(1);
    send();
    expect(container.querySelectorAll(".th-corridor").length).toBeGreaterThan(1);
  });

  it("echoes back what the helper understood as the child types", () => {
    renderPuzzle();
    write("take\nmove 1");
    const chips = screen.getByRole("list", { name: /what the helper understood/i });
    expect(chips.textContent).toContain("take");
    expect(chips.textContent).toContain("move 1");
  });

  it("says what an unreadable line needs rather than calling it invalid", () => {
    renderPuzzle();
    write("grab it");
    expect(screen.getByText(/do not know that word/i)).toBeInTheDocument();
  });

  it("cannot be sent with nothing written", () => {
    renderPuzzle();
    expect(screen.getByRole("button", { name: /send the helper/i })).toBeDisabled();
  });

  it("does not solve for a program written only for the visible floor", () => {
    const onSolved = vi.fn();
    const puzzle = generateForRound(7, 0);
    render(<TeachHelper seed={7} tier={0} onSolved={onSolved} onExit={vi.fn()} />);
    write(asText(writtenForWhatYouSee(puzzle.visible)));
    send();
    expect(onSolved).not.toHaveBeenCalled();
    expect(screen.getAllByText(/something left behind/i).length).toBeGreaterThan(0);
  });

  it("shows that the visible floor was cleared even when a hidden one was not", () => {
    const puzzle = generateForRound(7, 0);
    renderPuzzle();
    write(asText(writtenForWhatYouSee(puzzle.visible)));
    send();
    // The near-miss is told truthfully: it did work on the floor they could see.
    expect(screen.getAllByText(/all picked up/i).length).toBeGreaterThan(0);
  });

  it("solves exactly once for a program that takes everywhere", () => {
    const onSolved = vi.fn();
    render(<TeachHelper seed={7} tier={0} onSolved={onSolved} onExit={vi.fn()} />);
    write(asText(writtenForWhatCouldBeThere()));
    send();
    expect(onSolved).toHaveBeenCalledTimes(1);
    send();
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it("hides the other floors again when the instructions change", () => {
    const { container } = renderPuzzle();
    write(asText(writtenForWhatCouldBeThere()));
    send();
    expect(container.querySelectorAll(".th-corridor").length).toBeGreaterThan(1);
    write("take");
    expect(container.querySelectorAll(".th-corridor")).toHaveLength(1);
  });

  it("shows the word list, so no word has to be guessed", () => {
    renderPuzzle();
    const words = screen.getByText(/words the helper knows/i).textContent ?? "";
    for (const v of ["move", "turn", "wait", "take"]) expect(words).toContain(v);
  });

  it("shows no score, points, stars, streak or timer", () => {
    const banned =
      /\b(score|scores|point|points|star|stars|streak|timer|timed|seconds|attempt|attempts|tries|best|record|badge|reward|combo|lives?)\b/i;
    const { container } = renderPuzzle();
    expect(container.textContent ?? "").not.toMatch(banned);
  });

  it("mounts the teach-in", () => {
    renderPuzzle();
    expect(screen.getByText(/floors you will not see/i)).toBeInTheDocument();
  });

  it("offers a way out", () => {
    const onExit = vi.fn();
    render(<TeachHelper seed={7} tier={0} onSolved={vi.fn()} onExit={onExit} />);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
