import { describe, it, expect } from "vitest";
import {
  canTransition,
  GAP_DAYS,
  MIN_TERM_DAYS,
  MIN_REVIEW_CYCLES,
  SPIKE_THRESHOLD,
} from "../src/lifecycle.js";

describe("transition legality", () => {
  it("auto EXPLORING→EMERGING allowed; auto EMERGING→CANDIDATE forbidden", () => {
    expect(canTransition("EXPLORING", "EMERGING", "auto")).toBe(true);
    expect(canTransition("EMERGING", "CANDIDATE", "auto")).toBe(false); // human-only
    expect(canTransition("EMERGING", "CANDIDATE", "human")).toBe(true);
  });
  it("no auto-promotion to CANDIDATE/ACTIVE", () => {
    expect(canTransition("EMERGING", "CANDIDATE", "auto")).toBe(false);
    expect(canTransition("CANDIDATE", "ACTIVE", "auto")).toBe(false);
  });
  it("no demote on silence (EMERGING→EXPLORING never)", () => {
    expect(canTransition("EMERGING", "EXPLORING", "auto")).toBe(false);
    expect(canTransition("EMERGING", "EXPLORING", "human")).toBe(false);
  });
  it("park is human + always from a live state; reopen→EMERGING", () => {
    expect(canTransition("CANDIDATE", "PARKED", "human")).toBe(true);
    expect(canTransition("PARKED", "REOPENED", "human")).toBe(true);
    expect(canTransition("REOPENED", "EMERGING", "human")).toBe(true);
  });
  it("humans may also perform the auto transitions", () => {
    expect(canTransition("EXPLORING", "EMERGING", "human")).toBe(true);
  });
  it("golden constants match spec §3.4", () => {
    expect(GAP_DAYS).toBe(14);
    expect(MIN_TERM_DAYS).toBe(56);
    expect(MIN_REVIEW_CYCLES).toBe(2);
    expect(SPIKE_THRESHOLD).toBe(0.6);
  });
});
