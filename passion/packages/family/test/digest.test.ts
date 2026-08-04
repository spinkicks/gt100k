/**
 * What a parent may be shown.
 *
 * Almost every test here is a refusal, and that is the point. The obvious build is a progress
 * dashboard, the evidence says it is harmful, and the harm arrives through details that look
 * harmless one at a time: a count here, a trend line there, a cheerful note that the child is doing
 * better than last month. These tests are the thing standing between a future edit and that
 * product.
 *
 * The strongest reason is not ethical. Our only signal is the child returning unprompted, and a
 * parent-visible return metric converts it into compliance we can no longer distinguish from
 * introjection. A dashboard would cost us the measurement, not just the child.
 */
import { describe, expect, it } from "vitest";

import { parentDigest, type TheirWords } from "../src/digest.js";

const words: TheirWords[] = [
  {
    about: "getting the servo to stop jamming",
    said: "I reprinted the bracket twice and the second one held",
    on: "2026-07-20",
  },
  { about: "a knight fork", said: "I saw it two moves early this time", on: "2026-07-28" },
];

const digest = (phase: "new" | "growing" | "their-own" = "growing") =>
  parentDigest({ kidId: "kid-1", covering: "July", words, phase });

describe("what the digest contains", () => {
  it("carries the child's own sentences, not a summary of them", () => {
    const d = digest();
    expect(d.words.map((w) => w.said)).toContain("I saw it two moves early this time");
  });

  it("leads with the most recent thing, which is what they could ask about tonight", () => {
    expect(digest().words[0]?.on).toBe("2026-07-28");
  });

  it("suggests exactly one thing, because a list is a checklist", () => {
    const d = digest();
    expect(typeof d.oneThing.say).toBe("string");
    expect(d.oneThing.say.length).toBeGreaterThan(10);
  });

  it("asks the parent to go first", () => {
    // The finding is about who opens the subject. Children disengaged when a parent opened a review
    // of their work, including a kind one, and talked warmly when they started it themselves.
    expect(digest().oneThing.say).toMatch(/tell them about|share|you (got|found)/i);
  });

  it("says to do nothing when the interest is running itself", () => {
    // The one thing only we can tell a parent. We can read the phase; they cannot.
    const d = digest("their-own");
    expect(d.leaveItAlone).toBe(true);
    expect(d.oneThing.say).toMatch(/nothing/i);
  });

  it("still has something to offer in a month the child sent nothing", () => {
    const empty = parentDigest({ kidId: "k", covering: "July", words: [], phase: "new" });
    expect(empty.oneThing.say.length).toBeGreaterThan(10);
    // And it must not be a nag. "They have not opened it in a while" converts our core signal into
    // a prompt and then destroys it: a return a parent triggered is not a voluntary return.
    expect(empty.oneThing.say).not.toMatch(
      /has ?n[o']t|hasn't|remind|encourage them to|get them to/i,
    );
  });
});

describe("what the digest must never contain", () => {
  const all = (phase: "new" | "growing" | "their-own") => JSON.stringify(digest(phase));

  it("carries no number a parent could watch move", () => {
    // Hours, sessions, streaks, percentages, scores. Butler: a comment shown beside a grade
    // performs like the grade alone, so there is no safe amount of this.
    for (const phase of ["new", "growing", "their-own"] as const) {
      const text = [digest(phase).oneThing.say, digest(phase).oneThing.because].join(" ");
      expect(text).not.toMatch(/\d+\s*(%|hours?|sessions?|times|days in a row|streak)/i);
      expect(text).not.toMatch(/\b(score|streak|total|average|rank|level \d)\b/i);
      expect(all(phase)).not.toMatch(/"(count|total|score|streak|hours|sessions|percent)"/i);
    }
  });

  it("never compares the child to anyone", () => {
    for (const phase of ["new", "growing", "their-own"] as const) {
      const text = [digest(phase).oneThing.say, digest(phase).oneThing.because].join(" ");
      expect(text).not.toMatch(
        /\b(other children|peers|typical|average for|ahead of|behind|percentile)\b/i,
      );
    }
  });

  it("never compares the child to their own past either", () => {
    // Subtler and still a metric. "More than last month" is a trend line in a sentence, and it is
    // the affordance that turns a parent into someone managing a number.
    for (const phase of ["new", "growing", "their-own"] as const) {
      const text = [digest(phase).oneThing.say, digest(phase).oneThing.because].join(" ");
      expect(text).not.toMatch(
        /\b(more than last|less than last|improved|declined|up from|down from)\b/i,
      );
    }
  });

  it("never tells a parent their child is exceptional", () => {
    // Parental overvaluation predicts narcissism and buys no self-esteem, while warmth predicts
    // self-esteem and no narcissism. The two are separable and we want only one of them.
    for (const phase of ["new", "growing", "their-own"] as const) {
      const text = [digest(phase).oneThing.say, digest(phase).oneThing.because].join(" ");
      expect(text).not.toMatch(
        /\b(gifted|talented|exceptional|special|prodigy|natural|potential)\b/i,
      );
    }
  });

  it("never predicts what the child will become", () => {
    for (const phase of ["new", "growing", "their-own"] as const) {
      const text = [digest(phase).oneThing.say, digest(phase).oneThing.because].join(" ");
      expect(text).not.toMatch(/\b(will be|could become|on track|likely to|headed for)\b/i);
    }
  });

  it("never makes the parent responsible for the child's output", () => {
    // No "here is how to help her improve". The homework meta-analysis found content support and
    // control both bought nothing; only autonomy support was positive.
    for (const phase of ["new", "growing", "their-own"] as const) {
      const text = [digest(phase).oneThing.say, digest(phase).oneThing.because].join(" ");
      expect(text).not.toMatch(
        /\b(help (them|her|him) improve|practise more|push them|set a goal)\b/i,
      );
    }
  });
});
