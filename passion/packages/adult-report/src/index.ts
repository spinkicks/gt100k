// @gt100k/adult-report — what an adult saw, in a form worth trusting.
//
// Three things this system needs are not ours to guess: whether a child seems worn out, whether
// something high-stakes is coming, and what they did away from our screens. This package is how an
// adult tells us, and what we are allowed to do with it afterwards.
//
// The one rule that governs everything here: a report CORROBORATES and never ESTABLISHES. See
// `docs/decisions/2026-08-04-what-can-be-sensed.md` for why, and for what was deleted rather than
// approximated.
export * from "./model.js";
export * from "./read.js";
