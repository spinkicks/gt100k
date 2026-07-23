// src/__fixtures__/tfy-responses.ts
// Recorded TrueFoundry Chat Completions response CONTENT (the JSON the model is asked to return via
// `response_format: { type: "json_object" }`). Stored as `.ts`, NOT `.json` — the repo tsconfig does
// not set `resolveJsonModule`. SYNTHETIC samples — no live/child data, no network. Used ONLY by the
// hermetic parse test.

/** A well-formed Type III brief — all five model-authored text fields present. */
export const BRIEF_VALID = {
  title: "A Community Sample Pack",
  drivingQuestion: "What sound could your neighbourhood make that no one has heard before?",
  authenticMethod: "Field-record, edit, and mix a sample pack the way a working producer would.",
  craftScaffold:
    "Practice one clean edit + gain-stage pass, grounded in: Home Studio: Recording & Mixing Basics (https://curated.example/music/home-studio-basics).",
  successLooksLike: "Real makers used your pack and you improved it from what they said.",
};

/** Missing a required field (`craftScaffold`) ⇒ parse fails ⇒ caller uses the stub. */
export const BRIEF_MISSING_FIELD = {
  title: "A Community Sample Pack",
  drivingQuestion: "What sound could your neighbourhood make?",
  authenticMethod: "Field-record and mix like a producer.",
  successLooksLike: "Real makers used your pack.",
};

/** An empty field (blank title) ⇒ parse fails ⇒ caller uses the stub. */
export const BRIEF_EMPTY_FIELD = {
  title: "   ",
  drivingQuestion: "What sound could your neighbourhood make?",
  authenticMethod: "Field-record and mix like a producer.",
  craftScaffold: "Practice one clean edit.",
  successLooksLike: "Real makers used your pack.",
};
