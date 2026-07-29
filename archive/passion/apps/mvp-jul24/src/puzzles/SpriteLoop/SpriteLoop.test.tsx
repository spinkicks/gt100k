/**
 * The Sprite Loop board.
 *
 * The load-bearing tests are the two that encode rule X2: **no path is ever drawn** for the
 * demonstration, and the target is never printed as code. Both are the easy build this activity has
 * to refuse — a drawn trail would turn "copy this behaviour" into "match this shape", which is the
 * pattern task `logic-games` already measures four times.
 *
 * `fireEvent` rather than `user-event`, matching every other component test in this app;
 * `@testing-library/user-event` is not a dependency here.
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SpriteLoop from "./SpriteLoop";
import { generateForRound } from "./generate";

const renderPuzzle = (seed = 7, tier = 0) =>
  render(<SpriteLoop seed={seed} tier={tier} onSolved={vi.fn()} onExit={vi.fn()} />);

const tray = () => screen.getByRole("group", { name: /blocks you can use/i });
const stack = () => screen.getByRole("list", { name: /your program/i });

/** Click the tray buttons that spell the round's target, in order. */
function buildTarget(seed: number, index: number): void {
  const puzzle = generateForRound(seed, index);
  const buttons = within(tray()).getAllByRole("button");
  for (const s of puzzle.target) {
    const i = puzzle.tray.findIndex((b) => {
      if (b.kind !== s.kind) return false;
      if (b.kind === "move" && s.kind === "move") return b.steps === s.steps;
      if (b.kind === "turn" && s.kind === "turn") return b.quarters === s.quarters;
      if (b.kind === "wait" && s.kind === "wait") return b.ticks === s.ticks;
      return false;
    });
    expect(i).toBeGreaterThanOrEqual(0);
    fireEvent.click(buttons[i]!);
  }
}

describe("SpriteLoop", () => {
  it("offers every block in the round's tray", () => {
    renderPuzzle();
    expect(within(tray()).getAllByRole("button")).toHaveLength(generateForRound(7, 0).tray.length);
  });

  it("adds a block to the stack on a click, so no drag is required", () => {
    renderPuzzle();
    fireEvent.click(within(tray()).getAllByRole("button")[0]!);
    expect(within(stack()).getAllByRole("listitem")).toHaveLength(1);
  });

  it("never draws a path for the demonstration — rule X2", () => {
    const { container } = renderPuzzle();
    expect(container.querySelector(".sl-trail")).toBeNull();
  });

  it("never prints the target as code", () => {
    renderPuzzle();
    expect(screen.queryByTestId("sl-target-code")).toBeNull();
  });

  it("reports a solve exactly once when the program matches", () => {
    const onSolved = vi.fn();
    render(<SpriteLoop seed={7} tier={0} onSolved={onSolved} onExit={vi.fn()} />);
    buildTarget(7, 0);
    fireEvent.click(screen.getByRole("button", { name: /^run$/i }));
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it("does not report a solve for a program that does not match", () => {
    const onSolved = vi.fn();
    render(<SpriteLoop seed={7} tier={0} onSolved={onSolved} onExit={vi.fn()} />);
    fireEvent.click(within(tray()).getAllByRole("button")[0]!);
    fireEvent.click(screen.getByRole("button", { name: /^run$/i }));
    expect(onSolved).not.toHaveBeenCalled();
  });

  it("stops claiming success once the program is edited again", () => {
    // Found by review. The success state used to be sticky and reset only on a new round, so a child
    // who solved a round and then added one more block was told "yours moves the same way" about a
    // program that no longer did. Editing after solving is exactly what an exploring child does.
    renderPuzzle();
    buildTarget(7, 0);
    fireEvent.click(screen.getByRole("button", { name: /^run$/i }));
    expect(screen.getByText(/moves the same way/i)).toBeInTheDocument();
    fireEvent.click(within(tray()).getAllByRole("button")[0]!);
    expect(screen.queryByText(/moves the same way/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /next one/i })).toBeNull();
  });

  it("counts one round's solve once, even if it is broken and solved again", () => {
    // The other half of the same fix: what the room SAYS follows the program, what it COUNTS must not,
    // because `solves` reaches the belief math and one round must not inflate into several.
    const onSolved = vi.fn();
    const puzzle = generateForRound(7, 0);
    render(<SpriteLoop seed={7} tier={0} onSolved={onSolved} onExit={vi.fn()} />);
    buildTarget(7, 0);
    fireEvent.click(screen.getByRole("button", { name: /^run$/i }));
    expect(onSolved).toHaveBeenCalledTimes(1);
    // Break it, then rebuild the same answer and run again.
    fireEvent.click(within(stack()).getAllByRole("button", { name: /remove/i })[0]!);
    fireEvent.click(screen.getByRole("button", { name: /^run$/i }));
    const buttons = within(tray()).getAllByRole("button");
    const first = puzzle.tray.findIndex((b) => {
      const s = puzzle.target[0]!;
      if (b.kind !== s.kind) return false;
      if (b.kind === "move" && s.kind === "move") return b.steps === s.steps;
      if (b.kind === "turn" && s.kind === "turn") return b.quarters === s.quarters;
      if (b.kind === "wait" && s.kind === "wait") return b.ticks === s.ticks;
      return false;
    });
    fireEvent.click(buttons[first]!);
    fireEvent.click(screen.getByRole("button", { name: /^run$/i }));
    expect(onSolved).toHaveBeenCalledTimes(1);
  });

  it("shows no score, points, stars, streak or timer", () => {
    // Downbeat's exact list, so the whole app is held to one bar (PRD §11, memo 06 D7). Word
    // boundaries matter: without them this matches "star" inside the teach-in's own "touch the board
    // to start", which is a false positive on a shared component's copy.
    const banned =
      /\b(score|scores|point|points|star|stars|streak|timer|timed|seconds|attempt|attempts|tries|best|record|badge|reward|combo|lives?)\b/i;
    const { container } = renderPuzzle();
    expect(container.textContent ?? "").not.toMatch(banned);
  });

  it("lets a block be removed, so a mistake is not a dead end", () => {
    renderPuzzle();
    fireEvent.click(within(tray()).getAllByRole("button")[0]!);
    fireEvent.click(within(stack()).getByRole("button", { name: /remove/i }));
    expect(within(stack()).queryAllByRole("listitem")).toHaveLength(0);
  });

  it("previews where a block would take the creature before it is committed", () => {
    const { container } = renderPuzzle();
    expect(container.querySelector(".sl-preview")).toBeNull();
    fireEvent.mouseEnter(within(tray()).getAllByRole("button")[0]!);
    expect(container.querySelector(".sl-preview")).not.toBeNull();
  });

  it("previews on keyboard focus too, so the affordance is not mouse-only", () => {
    const { container } = renderPuzzle();
    fireEvent.focus(within(tray()).getAllByRole("button")[0]!);
    expect(container.querySelector(".sl-preview")).not.toBeNull();
  });

  it("mounts the teach-in, because every activity is explained", () => {
    renderPuzzle();
    expect(screen.getByText(/build yours out of blocks/i)).toBeInTheDocument();
  });

  it("offers a way out", () => {
    const onExit = vi.fn();
    render(<SpriteLoop seed={7} tier={0} onSolved={vi.fn()} onExit={onExit} />);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
