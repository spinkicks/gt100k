// src/__fixtures__/tfy-response.ts
// Recorded TrueFoundry Chat Completions response content (captured from a live call
// on 2026-07-22). Stored as `.ts`, NOT `.json` — the repo tsconfig does not set
// `resolveJsonModule`, so a JSON import would fail `tsc -b`. SYNTHETIC sample artifact.
export const TFY_RESPONSE = {
  domainPath: ["making-engineering"],
  affordedModes: ["build", "investigate", "explain"],
  confidence: 0.97,
  rationale:
    "Designing and constructing a subwoofer enclosure using Thiele-Small parameters — an engineering/building topic that supports building, investigating enclosure acoustics, and explaining the basics.",
};
