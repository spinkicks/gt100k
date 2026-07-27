// @gt100k/boundaries — executable architecture rules. Currently one: the EvidenceGraph product
// boundary (`docs/decisions/evidencegraph-v1-design.md` §13a). See `src/check.ts` for the rules and
// why each is an error or a warning; `test/boundaries.test.ts` is the standing gate that runs it over
// this repo, and it runs in CI via the root `pnpm test` with no CI configuration of its own.
export * from "./check.js";
