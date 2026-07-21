import { describe, expect, it } from "vitest";

import { canonicalize } from "../src/canonicalize.js";
import { goldenArtifact } from "./fixtures/seed.js";

const GOLDEN_ARTIFACT_CANONICAL =
  '{"actor":{"kind":"human","ref":"learner-synthetic-001"},"consentScope":{"scope":"synthetic"},"inputs":[],"payload":{"title":"hello world"},"timestamp":"2026-01-01T00:00:00.000Z","tool":{"name":"gt100k-editor","version":"0.1.0"},"type":"Artifact"}';

describe("canonicalize", () => {
  it("encodes the G1 artifact as the exact canonical string regardless of key order", () => {
    const keyShuffledArtifact = {
      type: "Artifact",
      tool: { version: "0.1.0", name: "gt100k-editor" },
      timestamp: "2026-01-01T00:00:00.000Z",
      payload: { title: "hello world" },
      inputs: [],
      consentScope: { scope: "synthetic" },
      actor: { ref: "learner-synthetic-001", kind: "human" },
    };

    expect(canonicalize(goldenArtifact)).toBe(GOLDEN_ARTIFACT_CANONICAL);
    expect(canonicalize(keyShuffledArtifact)).toBe(GOLDEN_ARTIFACT_CANONICAL);
  });

  it("removes insignificant source formatting", () => {
    const pretty = JSON.parse(`{
      "z": ["last", { "b": "second", "a": "first" }],
      "a": "start"
    }`) as unknown;
    const minified = JSON.parse('{"a":"start","z":["last",{"a":"first","b":"second"}]}') as unknown;

    expect(canonicalize(pretty)).toBe(canonicalize(minified));
    expect(canonicalize(pretty)).toBe('{"a":"start","z":["last",{"a":"first","b":"second"}]}');
  });
});
