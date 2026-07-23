import { describe, it, expect } from "vitest";
import * as pkg from "../src/index.js";

describe("package", () => {
  it("is importable", () => {
    expect(pkg).toBeTypeOf("object");
  });
});
