/**
 * The rule table itself: coverage, length, and tone.
 *
 * The coverage test walks the gadget registry, so shipping activity thirteen without a rule sentence
 * breaks the build instead of shipping an activity nobody explained. PROJECT.md's binding condition
 * is that *every* activity is explained; this is that condition, mechanised.
 */
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { GADGETS } from "../gadgets/registry";
import { TEACH_INS } from "./rules";

/** Tokens that carry a word. Splitting on whitespace alone counts "—" as a word. */
function words(text: string): string[] {
  return text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token));
}

/** Sentence ends: a full stop, question or exclamation mark followed by a space or the end. */
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])(?:\s+|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

test("every activity in the registry has a rule sentence — no activity ships unexplained", () => {
  const missing = GADGETS.filter((gadget) => !Object.hasOwn(TEACH_INS, gadget.id)).map((g) => g.id);
  expect(missing).toEqual([]);
});

test("the three activities parked off the roster keep their rules, so re-adding one stays one line", () => {
  // src/gadgets/registry.ts promises re-adding Logic Grid / LITS / Minesweeper is a one-line change.
  // That promise is only true if their rules are already written.
  for (const id of ["logic-grid", "lits", "minesweeper"]) {
    expect(Object.hasOwn(TEACH_INS, id)).toBe(true);
  }
});

test("all seventeen activities in the tree are covered, registered or not", () => {
  expect(Object.keys(TEACH_INS)).toHaveLength(17);
});

describe.each(Object.entries(TEACH_INS))("%s", (id, entry) => {
  test("states the rule in at most two sentences", () => {
    const count = sentences(entry.rule).length;
    expect(count, `${id}: ${count} sentences`).toBeLessThanOrEqual(2);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("fits the ~20 second reading budget", () => {
    // ~150 words per minute is a fair silent-reading rate for ages 9-12, so 45 words is about 18
    // seconds. PROJECT.md's vigilance-decrement argument is what makes this a ceiling and not taste.
    const count = words(entry.rule).length;
    expect(count, `${id}: ${count} words`).toBeLessThanOrEqual(45);
  });

  test("is direct instruction, not a probe question", () => {
    // Chen & Klahr 1999: probes without instruction taught 7-10-year-olds nothing measurable. A
    // teach-in that asks the child what they think is the design the evidence rules out.
    expect(entry.rule).not.toMatch(/\?/);
    expect(entry.rule.toLowerCase()).not.toMatch(
      /\b(can you (work|figure|guess)|what do you think|try to (work|figure) out|see if you can)\b/,
    );
  });

  test("uses no score, points, streak, star, timer or progress language", () => {
    const banned =
      /\b(score|scores|point|points|star|stars|streak|timer|timed|seconds|attempt|attempts|tries|level up|best|record|badge|reward|combo|lives?)\b/i;
    expect(entry.rule).not.toMatch(banned);
    expect(entry.title).not.toMatch(banned);
  });

  test("has a diagram whose own labels are clean too", () => {
    const { container } = render(<entry.Diagram />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("viewBox")).toBe("0 0 260 92");
    // Labelled, so "plus a labelled diagram" is true of every one of them.
    expect(container.querySelectorAll("text").length).toBeGreaterThan(0);
    const banned =
      /\b(score|scores|point|points|star|stars|streak|timer|timed|seconds|attempt|attempts|tries|best|record|badge|reward|combo)\b/i;
    expect(container.textContent ?? "").not.toMatch(banned);
  });

  test("has a title", () => {
    expect(entry.title.length).toBeGreaterThan(0);
  });
});
