import { describe, it, expect } from "vitest";
import { runDemo } from "../src/demo.js";

describe("demo", () => {
  it("runs a scripted session and emits a hashed, gradeless record", async () => {
    const r = await runDemo();
    expect(r.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect("grade" in r).toBe(false);
    expect(r.turns.length).toBeGreaterThan(0);
  });
});
