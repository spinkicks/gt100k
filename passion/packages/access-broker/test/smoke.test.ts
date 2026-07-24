import { describe, it, expect } from "vitest";
import { ACCESS_BROKER_PACKAGE } from "../src/index.js";

describe("@gt100k/access-broker smoke", () => {
  it("exposes the package name constant", () => {
    expect(ACCESS_BROKER_PACKAGE).toBe("@gt100k/access-broker");
  });
});
