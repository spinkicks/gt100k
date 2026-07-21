import { describe, expect, it } from "vitest";

describe("passion-tutor P0 public contract", () => {
  it("exposes the fixed golden constants and deterministic domain operations", async () => {
    const api = await import("../src/public.js").catch(() => undefined);

    expect(api).toBeDefined();
    expect(api?.FACETS).toEqual(["what", "why", "how", "challenge", "next", "audience"]);
    expect(api?.THIN).toBe(0.45);
    expect(api?.COVERED).toBe(0.6);
    expect(api?.MAX_TURNS).toBe(12);
    expect(api?.assessAnswer).toBeTypeOf("function");
    expect(api?.selectNextQuestion).toBeTypeOf("function");
    expect(api?.coverageFromTranscript).toBeTypeOf("function");
    expect(api?.getGaps).toBeTypeOf("function");
    expect(api?.isSessionComplete).toBeTypeOf("function");
  });
});
