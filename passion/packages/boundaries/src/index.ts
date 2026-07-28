// @gt100k/boundaries — executable architecture rules. Two of them, each with a standing gate that
// runs over this repo in CI via the root `pnpm test`, with no CI configuration of its own:
//
//   1. The EvidenceGraph product boundary (`docs/decisions/evidencegraph-v1-design.md` §13a) —
//      `src/check.ts`, gated by `test/boundaries.test.ts`.
//   2. CSS custom properties resolve — every `var(--x)` names a token something defines —
//      `src/css-tokens.ts`, gated by `test/css-tokens.test.ts`.
//
// See each source file for its rules and why each finding is an error or a warning.
//
// Only rule 1 is re-exported here, because only rule 1 has a caller outside its own gate. Rule 2 is
// imported directly by its test rather than widening this barrel for no consumer.
export * from "./check.js";
