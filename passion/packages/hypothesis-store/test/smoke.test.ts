import { describe, expect, it } from "vitest";

describe("@gt100k/hypothesis-store scaffold", () => {
  it("imports the interest-inference dependency by name (workspace symlink is live)", async () => {
    const inference = await import("@gt100k/interest-inference");
    expect(typeof inference.serializeCellKey).toBe("function");
  });
});
