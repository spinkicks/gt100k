import { expect, it } from "vitest";
import type { TimeBackSnapshot } from "../src/index.js";

it("TimeBackSnapshot literal exposes the raw signal fields", () => {
  const snapshot: TimeBackSnapshot = {
    kidId: "kid-1",
    asOf: "2026-04-01T00:00:00.000Z",
    subjects: [
      { subject: "math", mastery: 0.8, discretionaryXp: 40, offered: true },
      { subject: "music", mastery: 0.3, discretionaryXp: 0, offered: false },
    ],
  };
  expect(snapshot.subjects.length).toBe(2);
  const [first] = snapshot.subjects;
  expect(first?.subject).toBe("math");
  expect(first?.mastery).toBe(0.8);
  expect(first?.discretionaryXp).toBe(40);
  expect(first?.offered).toBe(true);
});
