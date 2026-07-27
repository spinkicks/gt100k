// @gt100k/surfacing — the surfacing policy: what a session must offer regardless of what the model
// believes. Pure and deterministic. See `holdout.ts` for the two findings that shape it.
//
// Named `surfacing` and not `coverage`, which is the domain term §D5 uses, because a package
// directory called `coverage` is swallowed by the `coverage/` line every JS .gitignore carries for
// test-report output. It was: the package existed on disk, passed every local gate, and was never
// committed or linted, and CI only caught it because tsc could not find a tsconfig that git had
// never seen.
export * from "./holdout.js";
