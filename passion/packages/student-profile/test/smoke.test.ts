import { describe, it, expect } from "vitest";
import { STUDENT_PROFILE_PACKAGE } from "../src/index.js";

describe("@gt100k/student-profile scaffold", () => {
  it("exposes a package sentinel export", () => {
    expect(STUDENT_PROFILE_PACKAGE).toBe("@gt100k/student-profile");
  });
});
