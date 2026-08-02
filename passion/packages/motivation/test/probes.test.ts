/**
 * The tests are mostly about what this module REFUSES to say.
 *
 * A motivation feature is the easiest place in this product to accidentally ship a verdict about a
 * child, because a verdict is what was asked for and what a stakeholder finds satisfying. These
 * assertions are the standing argument against putting one back.
 */
import { describe, expect, it } from "vitest";

import { MOVES, PROBES, movesFor, ranked } from "../src/index.js";

describe("the probes", () => {
  it("has exactly the two the evidence supports", () => {
    // Not a stylistic limit. A third probe would need its own separation result, and there isn't
    // one; the interruption and exit tests are where the literature actually distinguishes anything.
    expect(PROBES.map((p) => p.id).sort()).toEqual(["exit", "interruption"]);
  });

  it("tells a guide what to do, not what the child is", () => {
    for (const p of PROBES) {
      expect(p.how.length).toBeGreaterThan(40);
      // "You are an X" is the failure mode. The hypothesis store guards the same phrasing on its own
      // probe line, for the same reason.
      expect(p.how.toLowerCase()).not.toContain("the child is");
      expect(p.title.split(/\s+/).length).toBeLessThanOrEqual(6);
    }
  });

  it("says what it cannot establish, on every probe, always", () => {
    // Required rather than optional in the type, and checked here because a probe read as a
    // detector is worse than no probe: it launders an observation into a classification.
    for (const p of PROBES) {
      expect(p.cannotTell.length).toBeGreaterThan(20);
    }
  });

  it("offers readings that are consistent with something, never verdicts", () => {
    for (const p of PROBES) {
      expect(p.readings.length).toBeGreaterThanOrEqual(2);
      for (const r of p.readings) {
        expect(r.ifYouSee.length).toBeGreaterThan(10);
        expect(r.consistentWith.length).toBeGreaterThan(10);
        // The words a verdict would need. "May", "consistent with" and "worth finding out" are the
        // register this whole surface has to stay in.
        expect(r.consistentWith).not.toMatch(
          /\b(is obsessive|is harmonious|is burnt ?out|is unmotivated|is over-?motivated)\b/i,
        );
      }
    }
  });

  it("points every reading that suggests a move at a move that exists", () => {
    const ids = new Set(MOVES.map((m) => m.id));
    for (const p of PROBES) {
      for (const r of p.readings) {
        if (r.suggests !== undefined) expect(ids, `${p.id} -> ${r.suggests}`).toContain(r.suggests);
      }
    }
  });

  it("leaves the good outcome with nothing to do", () => {
    // Every probe has at least one reading that suggests no move. A framework where every result
    // requires an intervention is a framework that manufactures problems, and the commonest honest
    // answer to "how is their motivation" is "fine, leave it alone".
    for (const p of PROBES) {
      expect(p.readings.some((r) => r.suggests === undefined)).toBe(true);
    }
  });
});

describe("the adult moves", () => {
  it("aims at the adults", () => {
    // The one controlled child result in this literature works by changing what grown-ups do. A
    // move phrased as something to do TO a child has drifted from the evidence.
    for (const m of MOVES) {
      expect(m.does.length).toBeGreaterThan(30);
      expect(m.why.length).toBeGreaterThan(30);
    }
  });

  it("is mostly subtraction", () => {
    const cut = MOVES.filter((m) => m.isSubtraction).length;
    expect(cut).toBeGreaterThan(MOVES.length / 2);
  });

  it("grades every move, and does not overstate what is graded", () => {
    for (const m of MOVES) {
      expect(["controlled-in-children", "correlational-or-older-sample", "reasoned"]).toContain(
        m.grade,
      );
      // Anything claiming evidence has to cite it. A `reasoned` move may cite nothing, which is the
      // point of having the grade at all.
      if (m.grade !== "reasoned") expect(m.sourceIds.length).toBeGreaterThan(0);
    }
  });

  it("claims a controlled child trial exactly where there is one", () => {
    // Smith, Smoll & Curtis (1979) plus Barnett, Smoll & Smith (1992): coach-behaviour training,
    // next-season dropout 26% to 5%, no change in win-loss. It is the only one, and if this count
    // ever rises somebody has upgraded a claim without a study behind it.
    const controlled = MOVES.filter((m) => m.grade === "controlled-in-children");
    expect(controlled.length).toBe(1);
    expect(controlled[0]?.sourceIds).toContain("smith-smoll-1979");
  });

  it("gives chess its own moves without hiding the general ones", () => {
    const chess = movesFor("chess");
    expect(chess.some((m) => m.domain === "chess")).toBe(true);
    expect(chess.some((m) => m.domain === undefined)).toBe(true);
    // A domain nobody wrote moves for still gets the general ones rather than an empty screen.
    expect(movesFor("basket-weaving").length).toBeGreaterThan(0);
    expect(movesFor("basket-weaving").every((m) => m.domain === undefined)).toBe(true);
  });

  it("puts subtraction first and the tested move above the reasoned one", () => {
    const order = ranked(movesFor("chess"));
    expect(order[0]?.isSubtraction).toBe(true);
    expect(order[0]?.grade).toBe("controlled-in-children");
    const grades = order.map((m) => m.grade);
    expect(grades.indexOf("reasoned")).toBeGreaterThan(grades.indexOf("controlled-in-children"));
  });
});

describe("what this module must never grow", () => {
  it("has no scale, score or quadrant anywhere in it", () => {
    // THE WHOLE POINT. The deliverable originally asked for was a quadrant keyed on intensity, and
    // across 94 studies and 1,308 effect sizes harmonious and obsessive passion correlate with
    // deliberate practice indistinguishably -- obsessive slightly MORE. Such a grid flags the
    // absorbed child as at-risk and misses the pressured one. If these words appear here later,
    // somebody has rebuilt the thing the evidence rules out.
    const text = JSON.stringify({ PROBES, MOVES });

    // Matched as whole words and as things WE would be producing. A blunt substring check failed
    // here on "scoreboard", inside a sentence arguing against letting a rating become one -- which
    // is the module working, not failing. The distinction the test has to draw is between naming a
    // scoring habit as a hazard and having one.
    for (const banned of [
      /\bquadrant\b/i,
      /\bmotivation score\b/i,
      /\bscored?\s+(?:the|this|them|a)\s+child\b/i,
      /\bon a scale of\b/i,
      /\bout of (?:5|10|100)\b/i,
      /\brate (?:their|the child's) motivation\b/i,
    ]) {
      expect(text, `${banned} should not appear in a motivation surface`).not.toMatch(banned);
    }
  });

  it("produces no number at all", () => {
    // The structural version of the assertion above, and the one that actually holds the line. Prose
    // can be argued about; a numeric field cannot be anything but a score, and the moment one exists
    // a UI will render it as a dial and a stakeholder will average it across a term.
    const numeric = (o: unknown): boolean =>
      typeof o === "number" ||
      (Array.isArray(o) && o.some(numeric)) ||
      (typeof o === "object" && o !== null && Object.values(o).some(numeric));
    expect(numeric(PROBES), "a probe carries a number").toBe(false);
    expect(numeric(MOVES), "a move carries a number").toBe(false);
  });

  it("never uses hours or volume as a signal", () => {
    // Volume is the one thing an adult can see and the one variable that does not separate the child
    // you should feed from the child you should intervene on.
    const readings = PROBES.flatMap((p) =>
      p.readings.map((r) => `${r.ifYouSee} ${r.consistentWith}`),
    );
    for (const r of readings) {
      expect(r).not.toMatch(/\b(hours per week|how much they practise|more than \d+ hours)\b/i);
    }
  });
});
