import { describe, expect, it } from "vitest";
import * as concierge from "../src/index.js";

describe("@gt100k/concierge scaffold", () => {
  it("module loads", () => {
    expect(concierge).toBeDefined();
  });
});
