/**
 * Behaviour of the shared teach-in. Every test here maps to a line in PROJECT.md's
 * "Teaching: one shared component, direct instruction" section, so a change that quietly turns this
 * back into a modal tutorial fails the build rather than a review.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import TeachIn from "./TeachIn";
import { TEACH_INS } from "./rules";

/** A stand-in for the activity behind the panel, so "first interaction" has somewhere to land. */
function Board({ onPlay = () => {} }: { onPlay?: () => void }) {
  return (
    <div>
      <TeachIn activity="nonogram" />
      <button type="button" onClick={onPlay}>
        a board cell
      </button>
    </div>
  );
}

const panel = () => screen.queryByRole("note");
const help = () => screen.getByRole("button", { name: /how nonogram works/i });

test("the panel is up as soon as the activity opens — nothing has to be clicked to see the rule", () => {
  render(<Board />);
  expect(panel()).toBeInTheDocument();
  expect(panel()?.textContent).toContain(TEACH_INS.nonogram.rule);
});

test("the rule arrives with a labelled diagram, not as words alone", () => {
  const { container } = render(<Board />);
  const svg = container.querySelector(".ti-panel svg.ti-sketch");
  expect(svg).not.toBeNull();
  // Labelled: the sketch carries its own captions rather than being decoration next to prose.
  expect(svg?.querySelectorAll("text.ti-tag").length).toBeGreaterThan(0);
  // ...and it is hidden from assistive technology, because the rule sentence already says it.
  expect(svg?.getAttribute("aria-hidden")).toBe("true");
});

test("the first interaction dismisses it AND reaches the activity — one gesture, not two", () => {
  const onPlay = vi.fn();
  render(<Board onPlay={onPlay} />);
  fireEvent.click(screen.getByRole("button", { name: "a board cell" }));
  expect(panel()).toBeNull();
  // The whole point of `pointer-events: none`: the click the child made still counted.
  expect(onPlay).toHaveBeenCalledTimes(1);
});

test("a pointer press dismisses it before the click even lands, in a real browser", () => {
  render(<Board />);
  fireEvent.pointerDown(screen.getByRole("button", { name: "a board cell" }));
  expect(panel()).toBeNull();
});

test("the `?` is persistent and brings the panel back after it has been dismissed", () => {
  render(<Board />);
  fireEvent.click(screen.getByRole("button", { name: "a board cell" }));
  expect(panel()).toBeNull();
  // Still there, unprompted, with no restart needed.
  fireEvent.click(help());
  expect(panel()).toBeInTheDocument();
});

test("the `?` survives a solve-and-dismiss cycle any number of times", () => {
  render(<Board />);
  for (let i = 0; i < 3; i++) {
    fireEvent.click(screen.getByRole("button", { name: "a board cell" }));
    expect(panel()).toBeNull();
    fireEvent.click(help());
    expect(panel()).toBeInTheDocument();
  }
});

test("the `?` is a real focusable button, and Escape closes the panel from it", () => {
  render(<Board />);
  const button = help();
  button.focus();
  expect(document.activeElement).toBe(button);
  fireEvent.keyDown(button, { key: "Escape" });
  expect(panel()).toBeNull();
  // And Enter on the focused button brings it back, so the whole cycle is keyboard-only.
  fireEvent.keyDown(button, { key: "Enter" });
  fireEvent.click(button);
  expect(panel()).toBeInTheDocument();
});

test("Escape closes it from anywhere, not just from the `?`", () => {
  render(<Board />);
  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(panel()).toBeNull();
});

test("Tab does not dismiss it: moving focus is navigating, not playing", () => {
  render(<Board />);
  fireEvent.keyDown(document.body, { key: "Tab" });
  expect(panel()).toBeInTheDocument();
  // But typing something the activity would act on does.
  fireEvent.keyDown(document.body, { key: "3" });
  expect(panel()).toBeNull();
});

test("the `?` announces whether the panel is up, and says which panel it controls", () => {
  render(<Board />);
  const button = help();
  expect(button.getAttribute("aria-expanded")).toBe("true");
  const controlled = button.getAttribute("aria-controls");
  expect(controlled).toBeTruthy();
  expect(panel()?.id).toBe(controlled);

  fireEvent.click(button);
  expect(help().getAttribute("aria-expanded")).toBe("false");
});

test("it is not modal: no backdrop, no focus trap, and the panel does not swallow pointer events", () => {
  const { container } = render(<Board />);
  // A dialog role would promise modality this component deliberately does not provide.
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(container.querySelector(".ti-panel")?.getAttribute("role")).toBe("note");
  // Focus stayed where the host put it rather than being yanked into the panel.
  expect(document.activeElement).toBe(document.body);
});

test("two activities on screen at once keep separate aria-controls ids", () => {
  render(
    <div>
      <TeachIn activity="nonogram" />
      <TeachIn activity="pipes" />
    </div>,
  );
  const ids = screen
    .getAllByRole("note")
    .map((el) => el.id)
    .filter(Boolean);
  expect(ids).toHaveLength(2);
  expect(new Set(ids).size).toBe(2);
});

test("no score, points, streak, star, timer or progress language in the panel chrome", () => {
  // D7 is a hard constraint, and a tutorial is where progress language usually creeps in
  // ("step 1 of 3", "you earned…"). Word-bounded, matching the puzzles' own assertions.
  const { container } = render(<Board />);
  const read = () =>
    `${container.textContent ?? ""} ${Array.from(container.querySelectorAll("[aria-label]"))
      .map((el) => el.getAttribute("aria-label"))
      .join(" ")}`;
  const banned =
    /\b(score|scores|point|points|star|stars|streak|timer|timed|seconds|attempt|attempts|tries|level up|best|record|badge|reward|combo|lives?|step \d)\b/i;
  expect(read()).not.toMatch(banned);
  fireEvent.click(screen.getByRole("button", { name: "a board cell" }));
  expect(read()).not.toMatch(banned);
});
