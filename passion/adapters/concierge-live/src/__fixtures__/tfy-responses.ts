// src/__fixtures__/tfy-responses.ts
// Recorded TrueFoundry Chat Completions response CONTENT (the JSON the model is asked to
// return via `response_format: { type: "json_object" }`). Stored as `.ts`, NOT `.json` — the
// repo tsconfig does not set `resolveJsonModule`, so a JSON import would fail `tsc -b`.
// SYNTHETIC samples — no live/child data, no network. Used ONLY by the hermetic parse tests.

/** Input/doc/output moderation verdict — the message is clean. */
export const MODERATION_SAFE = { safe: true, reason: "no policy concerns" };

/** Moderation verdict — the text trips a safety policy (refuse at input/output, drop at doc). */
export const MODERATION_UNSAFE = { safe: false, reason: "weapons instructions" };

/** Distress verdict — an ordinary curiosity question, no distress. */
export const DISTRESS_NONE = { distress: false, reason: "topic question" };

/** Distress verdict — self-harm language ⇒ escalate to a human immediately. */
export const DISTRESS_HIT = { distress: true, reason: "self-harm language" };

/** A grounded, cited generation built from the passed (spotlighted) docs. */
export const GENERATION = {
  text: "Tardigrades survive space by entering a dried-out tun state.",
  citations: [{ url: "https://en.wikipedia.org/wiki/Tardigrade", title: "Tardigrade" }],
};

/** A grounded faithfulness verdict — the answer is supported by the docs. */
export const FAITHFULNESS_GROUNDED = { grounded: true, score: 0.92 };

/** An ungrounded faithfulness verdict — the answer is NOT supported ⇒ cite-or-refuse refuses. */
export const FAITHFULNESS_UNGROUNDED = { grounded: false, score: 0.2 };
