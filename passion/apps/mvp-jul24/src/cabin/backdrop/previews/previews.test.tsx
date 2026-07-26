import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PreviewFor } from "./registry";
import { PREVIEW_KINDS, buildSnapshot, previewSeed } from "./snapshots";

function renderPreview(kind: (typeof PREVIEW_KINDS)[number], solved: boolean) {
  return render(<PreviewFor snapshot={buildSnapshot(kind, previewSeed(kind), solved)} />);
}

describe("every preview", () => {
  for (const kind of PREVIEW_KINDS) {
    describe(kind, () => {
      it("renders an svg with a viewBox sized to its own board", () => {
        const { container } = renderPreview(kind, false);
        const svg = container.querySelector("svg");
        expect(svg).not.toBeNull();
        const [, , w, h] = (svg!.getAttribute("viewBox") ?? "").split(" ").map(Number);
        expect(w).toBeGreaterThan(0);
        expect(h).toBeGreaterThan(0);
      });

      it("letterboxes rather than stretching, so a square board stays square on a wide surface", () => {
        const { container } = renderPreview(kind, false);
        expect(container.querySelector("svg")!.getAttribute("preserveAspectRatio")).toBe(
          "xMidYMid meet",
        );
      });

      it("is hidden from assistive tech — the hotspot polygon is the named control", () => {
        const { container } = renderPreview(kind, false);
        expect(container.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
      });

      it("is non-interactive: no focusable node, no role, no handler-bearing element", () => {
        const { container } = renderPreview(kind, false);
        expect(screen.queryAllByRole("button")).toHaveLength(0);
        expect(container.querySelectorAll("[tabindex]")).toHaveLength(0);
        expect(container.querySelectorAll("button, a, input")).toHaveLength(0);
        // `focusable="false"` keeps IE/Edge-legacy SVG out of the tab order too, matching the
        // convention GadgetObject.tsx already uses for decorative SVG.
        expect(container.querySelector("svg")!.getAttribute("focusable")).toBe("false");
      });

      it("carries the class that turns off pointer events", () => {
        // The rule itself lives in previews.css (jsdom applies no stylesheets), so the contract this
        // can hold is "the element opts in to that rule".
        const { container } = renderPreview(kind, false);
        expect(container.querySelector("svg")!.classList.contains("cbd-preview-svg")).toBe(true);
      });

      it("renders something, and something different, once solved", () => {
        const unsolved = renderPreview(kind, false).container.innerHTML;
        const solved = renderPreview(kind, true).container.innerHTML;
        expect(unsolved.length).toBeGreaterThan(100);
        expect(solved).not.toBe(unsolved);
      });

      it("emits no text nodes, which would be illegible at prop scale anyway", () => {
        // Every preview encodes state as shape and colour, never as a numeral or a word — see the
        // reasoning in each component. This also means no font loading affects the room.
        const { container } = renderPreview(kind, true);
        expect(container.querySelectorAll("text")).toHaveLength(0);
        expect(container.textContent).toBe("");
      });
    });
  }
});

describe("solved previews pick up the warm rim", () => {
  it("adds an ember-bright stroke on the puzzles that have a win state", () => {
    // Minesweeper, Pipes and LITS draw a rim so "done" reads before the cell pattern does.
    for (const kind of ["minesweeper", "pipes", "lits"] as const) {
      const solved = renderPreview(kind, true).container.innerHTML;
      const unsolved = renderPreview(kind, false).container.innerHTML;
      expect(solved.includes("--ember-bright"), `${kind} solved rim`).toBe(true);
      expect(
        solved.split("--ember-bright").length,
        `${kind} has more ember-bright than unsolved`,
      ).toBeGreaterThan(unsolved.split("--ember-bright").length);
    }
  });
});

describe("MirrorPreview", () => {
  it("draws the beam reaching a lit target only when the maze is solved", () => {
    const solved = renderPreview("mirror", true).container;
    const unsolved = renderPreview("mirror", false).container;
    // The target ring is filled with ember-bright only on a solved trace, so the count of
    // ember-bright references rises. The beam polyline exists in both.
    expect(solved.querySelectorAll("polyline").length).toBeGreaterThan(0);
    expect(unsolved.querySelectorAll("polyline").length).toBeGreaterThan(0);
    expect(solved.innerHTML.split("--ember-bright").length).toBeGreaterThan(
      unsolved.innerHTML.split("--ember-bright").length,
    );
  });
});

describe("NonogramPreview", () => {
  it("fills exactly the cells the solution fills", () => {
    const snapshot = buildSnapshot("nonogram", previewSeed("nonogram"), true);
    if (snapshot.kind !== "nonogram") throw new Error("kind");
    const expected = snapshot.puzzle.solution.flat().filter(Boolean).length;
    const { container } = render(<PreviewFor snapshot={snapshot} />);
    const filled = [...container.querySelectorAll("rect")].filter(
      (r) => r.getAttribute("fill") === "var(--ink)",
    );
    expect(filled).toHaveLength(expected);
  });

  it("draws clue-rail ticks matching the real run counts", () => {
    const snapshot = buildSnapshot("nonogram", previewSeed("nonogram"), false);
    if (snapshot.kind !== "nonogram") throw new Error("kind");
    const runs = [...snapshot.puzzle.rowClues, ...snapshot.puzzle.colClues]
      .flat()
      .filter((n) => n > 0).length;
    const { container } = render(<PreviewFor snapshot={snapshot} />);
    const ticks = [...container.querySelectorAll("rect")].filter(
      (r) => r.getAttribute("fill") === "var(--ink-soft)",
    );
    expect(ticks).toHaveLength(runs);
  });
});
