// What a child can be offered, named once so the emitter and the receiver cannot disagree.
//
// The crosswalk used to live inside `mvp-jul24`, which was fine while nothing else read it. It
// stopped being fine the moment the game started posting its records somewhere: `buildActionEvents`
// resolves an artifact id against a catalog, so a receiver holding a different catalog discards
// exactly the records it cannot resolve, silently, as `unknown-artifact`. Two copies of this table
// would drift and the symptom would be a child whose play stops counting.
//
// DATA ONLY, ON PURPOSE. `mvp-jul24` holds the engine packages as `import type` so they erase at
// build and cost its bundle nothing, and moving the table here must not undo that. So this package
// exports literals and map lookups, imports `Artifact` as a type, and contains no engine logic. A
// runtime import of anything that computes belongs on the receiver's side of the wire.
export type { SolveVerb } from "./gadgets.js";
export { CATALOG, artifactFor, pathForTopic, pursuitsFor, solveVerbFor } from "./gadgets.js";
