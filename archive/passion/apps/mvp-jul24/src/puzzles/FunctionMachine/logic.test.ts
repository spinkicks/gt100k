import {
  DOMAIN,
  type Rule,
  allCandidateRules,
  applyRule,
  describeRule,
  isIdentifiable,
  longestMisleadingPrefix,
  minimumDeterminingProbes,
  outputsOver,
  spaceOver,
} from "./logic";

const rule = (partial: Partial<Rule> & Pick<Rule, "family">): Rule => ({
  a: 1,
  b: 0,
  c: 0,
  m: 1,
  ...partial,
});

describe("applyRule", () => {
  test("computes each family", () => {
    expect(applyRule(rule({ family: "linear", a: 3, b: 4 }), 5)).toBe(19);
    expect(applyRule(rule({ family: "square", a: 2, b: 1 }), 4)).toBe(33);
    expect(applyRule(rule({ family: "quadratic", a: 3, b: 2 }), 4)).toBe(30);
    expect(applyRule(rule({ family: "modular", a: 3, b: 1, m: 5 }), 4)).toBe(3);
    expect(applyRule(rule({ family: "alternating", a: 2, b: 1, c: 6 }), 4)).toBe(9);
    expect(applyRule(rule({ family: "alternating", a: 2, b: 1, c: 6 }), 5)).toBe(16);
  });

  test("never returns a negative output over the domain", () => {
    for (const candidate of allCandidateRules()) {
      for (const x of DOMAIN) expect(applyRule(candidate, x)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("describeRule", () => {
  test("says what the machine does in words a ten-year-old reads", () => {
    expect(describeRule(rule({ family: "linear", a: 3, b: 4 }))).toBe("multiply by 3, then add 4");
    expect(describeRule(rule({ family: "linear", a: 4, b: 0 }))).toBe("multiply by 4");
    expect(describeRule(rule({ family: "linear", a: 1, b: 7 }))).toBe("add 7");
    expect(describeRule(rule({ family: "modular", a: 3, b: 2, m: 5 }))).toBe(
      "divide 3 times the input plus 2 by 5 and keep only the remainder",
    );
    expect(describeRule(rule({ family: "alternating", a: 2, b: 1, c: 6 }))).toBe(
      "multiply by 2, then add 1 if the input is even and 6 if it is odd",
    );
  });

  test("every rule in the space has a description, and none is empty", () => {
    // The shortest legitimate description is "add 1", so five characters is
    // the floor rather than a placeholder slipping through.
    for (const candidate of allCandidateRules()) {
      expect(describeRule(candidate).length).toBeGreaterThanOrEqual(5);
    }
  });
});

describe("spaceOver", () => {
  test("keeps one representative per distinct behaviour", () => {
    const table = spaceOver();
    expect(table.rules.length).toBe(table.outputs.length);
    expect(table.rules.length).toBe(table.keys.length);
    expect(new Set(table.keys).size).toBe(table.keys.length);
    // Deduplication is doing real work: several families overlap.
    expect(table.rules.length).toBeLessThan(allCandidateRules().length);
  });

  test("collapses rules that are the same function by another name", () => {
    // "x squared plus b" and "x squared plus 0x plus b" are one behaviour.
    const square = rule({ family: "square", a: 1, b: 5 });
    const quadratic = rule({ family: "quadratic", a: 0, b: 5 });
    expect(outputsOver(square)).toEqual(outputsOver(quadratic));
    const table = spaceOver();
    const key = outputsOver(square).join(",");
    expect(table.keys.filter((k) => k === key)).toHaveLength(1);
  });

  test("is memoized per domain", () => {
    expect(spaceOver()).toBe(spaceOver());
    expect(spaceOver([1, 2, 3])).not.toBe(spaceOver());
  });
});

describe("isIdentifiable", () => {
  test("rejects a rule some rival differs from on exactly one input", () => {
    // A hand-made two-rule space where the rivals differ only at x = 3: hold
    // out 3 and the evidence cannot decide between them. This is precisely
    // the case where a child could reason correctly and be marked wrong.
    const domain = [1, 2, 3];
    const target = rule({ family: "linear", a: 2, b: 0 }); // 2 4 6
    const table = {
      rules: [target],
      outputs: [
        [2, 4, 6],
        [2, 4, 7],
      ],
      keys: ["2,4,6", "2,4,7"],
    };
    expect(isIdentifiable(target, domain, table)).toBe(false);
  });

  test("accepts a rule whose every rival differs in at least two places", () => {
    const domain = [1, 2, 3];
    const target = rule({ family: "linear", a: 2, b: 0 });
    const table = {
      rules: [target],
      outputs: [
        [2, 4, 6],
        [2, 5, 7],
      ],
      keys: ["2,4,6", "2,5,7"],
    };
    expect(isIdentifiable(target, domain, table)).toBe(true);
  });

  test("an identical behaviour is not a rival — it predicts the same thing", () => {
    const domain = [1, 2, 3];
    const target = rule({ family: "linear", a: 2, b: 0 });
    const table = { rules: [target], outputs: [[2, 4, 6]], keys: ["2,4,6"] };
    expect(isIdentifiable(target, domain, table)).toBe(true);
  });

  test("guarantees what it claims: withholding any one input still forces the answer", () => {
    // The property restated as the thing it exists to buy. For an identifiable
    // rule, every rival consistent with all-but-one observation also agrees on
    // the one withheld — so there is no held-out input at which a correct
    // reasoner can be told they are wrong.
    const table = spaceOver();
    const target = rule({ family: "linear", a: 3, b: 5 });
    expect(isIdentifiable(target, DOMAIN, table)).toBe(true);

    const mine = outputsOver(target);
    for (let held = 0; held < DOMAIN.length; held++) {
      for (const row of table.outputs) {
        const consistent = mine.every((v, i) => i === held || row[i] === v);
        if (consistent) expect(row[held]).toBe(mine[held]);
      }
    }
  });
});

describe("longestMisleadingPrefix", () => {
  test("counts how far a rival can imitate the rule from the start of the pad", () => {
    const domain = [1, 2, 3, 4];
    const target = rule({ family: "linear", a: 2, b: 0 }); // 2 4 6 8
    const table = {
      rules: [target],
      outputs: [
        [2, 4, 6, 8],
        [2, 4, 6, 9], // imitates for three inputs, then parts company
        [2, 9, 9, 9],
      ],
      keys: ["2,4,6,8", "2,4,6,9", "2,9,9,9"],
    };
    expect(longestMisleadingPrefix(target, domain, table)).toBe(3);
  });

  test("is zero when nothing else even matches the first input", () => {
    const domain = [1, 2];
    const target = rule({ family: "linear", a: 2, b: 0 });
    const table = { rules: [target], outputs: [[9, 9]], keys: ["9,9"] };
    expect(longestMisleadingPrefix(target, domain, table)).toBe(0);
  });
});

describe("minimumDeterminingProbes", () => {
  test("finds the shortest set of inputs that leaves one behaviour standing", () => {
    const domain = [1, 2, 3];
    const target = rule({ family: "linear", a: 2, b: 0 }); // 2 4 6
    const table = {
      rules: [target],
      outputs: [
        [2, 4, 6],
        [2, 5, 6], // matches at inputs 1 and 3, differs at 2
      ],
      keys: ["2,4,6", "2,5,6"],
    };
    // Input 2 alone separates them; nothing else does.
    expect(minimumDeterminingProbes(target, domain, table, 3)).toBe(1);
  });

  test("reports Infinity when no subset within the budget separates the rivals", () => {
    const domain = [1, 2, 3];
    const target = rule({ family: "linear", a: 2, b: 0 }); // 2 4 6
    // One rival survives each single input, so no lone probe can settle it —
    // but no rival survives any pair, so two probes can.
    const table = {
      rules: [target],
      outputs: [
        [2, 4, 6],
        [2, 9, 9],
        [9, 4, 9],
        [9, 9, 6],
      ],
      keys: ["2,4,6", "2,9,9", "9,4,9", "9,9,6"],
    };
    expect(minimumDeterminingProbes(target, domain, table, 1)).toBe(Number.POSITIVE_INFINITY);
    expect(minimumDeterminingProbes(target, domain, table, 2)).toBe(2);
  });

  test("scores every quadratic at 1 — the reason it is not the difficulty knob", () => {
    // Recorded as a test because it is counter-intuitive and it is why the
    // generator tunes difficulty by rule family instead. One probe at a large
    // input returns a number no other rule in the space produces, so the rule
    // is formally pinned by a single observation — which says nothing about
    // whether a child could do it.
    const table = spaceOver();
    for (let b = 0; b <= 9; b++) {
      expect(minimumDeterminingProbes(rule({ family: "quadratic", a: 2, b }), DOMAIN, table)).toBe(
        1,
      );
    }
  });
});
