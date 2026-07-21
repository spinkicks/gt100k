import { describe, expect, it } from "vitest";

import * as evidenceGraph from "../src/index.js";

describe("@gt100k/evidence-graph", () => {
  it("exposes a discoverable package entrypoint", () => {
    expect(evidenceGraph).toBeDefined();
  });
});
