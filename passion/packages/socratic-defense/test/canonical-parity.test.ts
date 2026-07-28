// Proves this package's `canonicalize` is byte-identical to `@gt100k/evidence-graph`'s.
//
// `src/canonical.ts` is a deliberate copy: the `@gt100k/evidence-*` packages are a separate product
// intended for extraction, and nothing outside that namespace may import a value from inside it
// (`docs/decisions/evidencegraph-v1-design.md` §13a). The copy is the price; this test is what makes
// the price safe, turning a silent drift into a red build.
//
// THIS TEST IMPORTS ACROSS THE PRODUCT BOUNDARY ON PURPOSE. It is the one file in this package
// permitted to, because proving parity against the other implementation is the entire point — it
// cannot do its job without naming it. The boundary check carries a named exemption for exactly this
// path. If the graph is ever actually extracted, this test is what gets deleted, and the copy in
// `src/canonical.ts` simply becomes the only implementation.
import { canonicalize as fromEvidenceGraph } from "@gt100k/evidence-graph";
import { describe, expect, it } from "vitest";

import { canonicalize as ours } from "../src/canonical.js";

/**
 * Inputs chosen to exercise every branch of the normalizer rather than to look realistic: key
 * ordering, recursion through both objects and arrays, `undefined` dropping at each depth, and the
 * primitives that are easy to serialize differently by accident.
 */
const FIXTURES: readonly { readonly name: string; readonly value: unknown }[] = [
  { name: "an empty object", value: {} },
  { name: "an empty array", value: [] },
  { name: "keys already in order", value: { a: 1, b: 2, c: 3 } },
  { name: "keys out of order", value: { c: 3, a: 1, b: 2 } },
  {
    name: "capitals and digits in keys (sort is codepoint, not locale)",
    value: { B: 1, a: 2, A: 3, "1": 4 },
  },
  { name: "a dropped undefined field", value: { a: 1, b: undefined, c: 3 } },
  { name: "every field undefined", value: { a: undefined, b: undefined } },
  { name: "null, which is NOT dropped", value: { a: null, b: 1 } },
  {
    name: "nested objects, each unordered",
    value: { z: { y: 2, x: 1 }, a: { c: 3, b: { e: 5, d: 4 } } },
  },
  { name: "undefined nested two deep", value: { a: { b: { c: undefined, d: 1 } } } },
  {
    name: "an array of unordered objects",
    value: [
      { b: 1, a: 2 },
      { d: 3, c: 4 },
    ],
  },
  { name: "undefined inside an array (arrays keep holes as null)", value: [1, undefined, 3] },
  {
    name: "arrays nested in objects nested in arrays",
    value: [{ a: [{ b: [1, { d: 2, c: 3 }] }] }],
  },
  { name: "numbers that stringify awkwardly", value: { a: 0, b: -0, c: 1e21, d: 0.1, e: -1.5 } },
  { name: "strings needing escapes", value: { a: 'quote " backslash \\ newline \n tab \t' } },
  { name: "unicode and emoji", value: { ké: "vàl", 日: "本", "🔑": "🙂" } },
  { name: "booleans", value: { t: true, f: false } },
  { name: "a bare primitive, not an object", value: 42 },
  { name: "a bare string", value: "hello" },
  { name: "bare null", value: null },
  { name: "bare true", value: true },
  {
    // The real shape this package hashes — the one that would actually break if the two drifted.
    name: "an assembled evidence record",
    value: {
      studentId: "child:synthetic-01",
      projectId: "proj-01",
      title: "Mini Arcade Game",
      domain: "code-computers",
      readinessLevel: 2,
      turns: [
        {
          facet: "process",
          question: "How did you start?",
          answer: "I drew it first.",
          credited: true,
        },
        { facet: "authorship", question: "Which part is yours?", answer: "All the movement code." },
      ],
      coverageByFacet: { process: 1, authorship: 1, understanding: 0 },
      gaps: ["understanding"],
      createdAt: "2026-07-27T09:00:00.000Z",
    },
  },
];

describe("canonicalize parity with @gt100k/evidence-graph", () => {
  for (const { name, value } of FIXTURES) {
    it(`is byte-identical for ${name}`, () => {
      expect(ours(value)).toBe(fromEvidenceGraph(value));
    });
  }

  it("covers every fixture, so a shrinking fixture set is visible", () => {
    expect(FIXTURES).toHaveLength(22);
  });

  it("agrees that a non-serializable value throws", () => {
    // `JSON.stringify` returns undefined for a bare function or symbol; both implementations turn
    // that into a TypeError rather than returning the string "undefined".
    for (const value of [() => 1, Symbol("s")]) {
      expect(() => ours(value)).toThrow(TypeError);
      expect(() => fromEvidenceGraph(value)).toThrow(TypeError);
    }
  });

  it("agrees on a BigInt, which throws inside JSON.stringify rather than returning undefined", () => {
    // Different error type (TypeError from the engine, not from our guard) — but the point is that
    // both fail the same way, so a caller cannot get a hash from one and an exception from the other.
    expect(() => ours({ a: 1n })).toThrow();
    expect(() => fromEvidenceGraph({ a: 1n })).toThrow();
  });

  it("agrees on circular structures", () => {
    const makeCircular = (): Record<string, unknown> => {
      const node: Record<string, unknown> = { a: 1 };
      node.self = node;
      return node;
    };
    expect(() => ours(makeCircular())).toThrow();
    expect(() => fromEvidenceGraph(makeCircular())).toThrow();
  });
});
