/**
 * A guard against our vocabulary reaching a guide's screen.
 *
 * WHY IT EXISTS. The people who read this console are homeschool guides and classroom teachers. The
 * people who wrote it spend all day in a codebase where a domain-by-mode pair is a "cell", a belief
 * is a "hypothesis", the pessimistic end of a Beta posterior is a "lower bound", and a child who
 * stops coming back has produced "disconfirming evidence". Every one of those had leaked onto a
 * screen at some point, and the worst of them was on `nextProbe`: the single most-read, most
 * actionable line in the product told a teacher to "offer the cell again unprompted".
 *
 * WHAT IT CANNOT DO. It cannot judge prose. It checks a specific list of words we know are ours, on
 * the specific strings the engines hand to the UI, and it will not catch a sentence that is merely
 * too long or badly organised. It exists so the words we have already fixed cannot come back.
 *
 * WHY THE ENGINE STRINGS AND NOT THE JSX. The strings that failed are generated in packages and
 * rendered verbatim, so the leak happens at the source rather than in the markup. A guide-facing
 * string produced by an engine has no reviewer between it and the screen, which is exactly why it
 * needs a test.
 */
import { describe, expect, it } from "vitest";

import { buildRosterGates, children, profileFor } from "../app/console-data.js";
import { consoleViewModel } from "@gt100k/hypothesis-store";
import { wellbeingForKid } from "../app/wellbeing.js";
import { plansForKid } from "../app/plan.js";

/**
 * Words that mean something to us and nothing to a teacher.
 *
 * Each is here because it appeared on screen, not because it sounds technical. Deliberately NOT
 * banned: "specialization" and "evidence", which are ordinary English a teacher already uses, and
 * "artefact", which appears only in developer-facing places.
 */
const OURS: readonly RegExp[] = [
  /\bcells?\b/i, // our name for a domain-by-mode pair
  /\blower[- ]bounds?\b/i, // the pessimistic end of a Beta posterior
  /\bposterior\b/i,
  /\bbayes/i,
  /\bdisconfirm/i, // "disconfirming evidence"
  /\bre-?sample\b/i,
  /\bsalience\b/i,
  /\bcalibrated\b/i,
  /\bperseverance artifact\b/i,
  /\bautonomy sign-?off\b/i,
  /\bPCDE\b/,
  /\bpsychosocial\b/i,
  /\bprovenance\b/i,
  /\bidempoten/i,
  /\bheuristic\b/i,
];

/** Mathematical notation, which is a register problem rather than a vocabulary one. */
const NOTATION = /[≥≤±σ]|\bp\s*<\s*0?\.\d/;

const KIDS = children().map((c) => c.id);

function probesFor(kid: string): readonly string[] {
  const profile = profileFor(kid);
  if (!profile) return [];
  const { cards } = consoleViewModel(profile.store, kid, buildRosterGates(profile.store));
  return cards.map((c) => c.nextProbe);
}

describe("what an engine puts in front of a guide", () => {
  it("is actually looking at something", () => {
    // A vocabulary guard that iterates an empty list passes forever and protects nothing. If the
    // roster or the view model changes shape, this fails first and says so, rather than letting the
    // four tests below go quietly green on zero strings.
    expect(KIDS.length).toBeGreaterThan(2);
    const all = KIDS.flatMap(probesFor);
    expect(all.length, "no next steps were produced to check").toBeGreaterThan(4);
  });

  it("never calls a specialization a cell, or anything else only we call it", () => {
    for (const kid of KIDS) {
      for (const probe of probesFor(kid)) {
        for (const bad of OURS) {
          expect(probe, `next step for ${kid} uses our vocabulary: "${probe}"`).not.toMatch(bad);
        }
      }
    }
  });

  it("writes the next step in sentences, not in notation", () => {
    for (const kid of KIDS) {
      for (const probe of probesFor(kid)) {
        expect(probe, `next step for ${kid} uses notation: "${probe}"`).not.toMatch(NOTATION);
      }
    }
  });

  it("keeps the next step short enough to act on", () => {
    // Twenty-five words. Past that a guide is reading rather than being told, and this line's whole
    // job is to be the one thing they can do next.
    for (const kid of KIDS) {
      for (const probe of probesFor(kid)) {
        const words = probe.trim().split(/\s+/).length;
        expect(
          words,
          `next step for ${kid} runs to ${words} words: "${probe}"`,
        ).toBeLessThanOrEqual(25);
      }
    }
  });

  it("says why a child needs review in the guide's words", () => {
    for (const kid of KIDS) {
      for (const c of wellbeingForKid(kid)) {
        const text = `${c.read.rationale} ${c.read.escalationReason ?? ""}`;
        for (const bad of OURS) {
          expect(text, `wellbeing reason for ${kid} uses our vocabulary: "${text}"`).not.toMatch(
            bad,
          );
        }
      }
    }
  });

  it("keeps the plan's own prose free of it too", () => {
    for (const kid of KIDS) {
      for (const card of plansForKid(kid)) {
        const p = card.plan.nextProject;
        const text = [
          p.title,
          p.drivingQuestion,
          p.authenticMethod,
          p.successLooksLike,
          card.plan.terminalNote,
        ].join(" ");
        for (const bad of OURS) {
          expect(text, `plan prose for ${kid} uses our vocabulary`).not.toMatch(bad);
        }
      }
    }
  });
});
