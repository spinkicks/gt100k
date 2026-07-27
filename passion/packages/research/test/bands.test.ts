/**
 * Which people a finding was actually established on.
 *
 * This started as a check on one suspected mismatch — the engine is calibrated on 6-8 evidence and
 * the discovery app targets 9-12 — and turned up a larger one. Tracing the participants in all
 * eighteen cited studies found that **seven of them were established on adults**, including the
 * claim the whole product rests on. `voluntary-returns` cites a meta-analysis of employed adults
 * and college students, and 858 undergraduates. Not one child.
 *
 * That does not make the claims wrong. Several are genuinely structural, and the free-choice
 * paradigm behind `voluntary-returns` has been run on children many times — just not in the two
 * papers cited there. What it makes them is *unlabelled*, and a registry whose stated purpose is
 * that "dressing a chosen default up as science is the fastest way to lose a guide's trust the
 * first time they look closely" cannot also let an adult finding read as a finding about children.
 *
 * So `band` is required on every evidence claim, and anything established on adults has to say so
 * in language a guide reads. The tests below are the mechanism; the honesty is the point.
 */
import { describe, expect, it } from "vitest";

import { CLAIMS } from "../src/registry.js";

describe("every finding says who it was established on", () => {
  it("declares a band on every evidence claim", () => {
    const missing = CLAIMS.filter((c) => c.basis === "evidence" && c.band === undefined);

    expect(missing.map((c) => c.id)).toEqual([]);
  });

  it("does not invent a population for our own defaults", () => {
    // A `chosen` value has no participants, and giving it a band would dress a default as a
    // finding, which is the exact failure this registry exists to prevent.
    for (const c of CLAIMS.filter((x) => x.basis === "chosen")) {
      expect(c.band, `${c.id} is our own default and should claim no population`).toBeUndefined();
    }
  });
});

describe("a finding established on adults has to admit it", () => {
  const onAdults = CLAIMS.filter((c) => c.band === "adult");

  it("finds the ones there are, so a regression to silence fails here", () => {
    // Pinned at the number actually verified. If this drops, either someone relabelled a band
    // without new evidence or a claim lost its sources, and both should fail rather than pass.
    expect(onAdults.length).toBe(7);
  });

  it("states the limit in plain language on every one of them", () => {
    for (const c of onAdults) {
      expect(c.limit, `${c.id} rests on adults and must say so`).toBeDefined();
      expect(c.limit?.length ?? 0).toBeGreaterThan(40);
    }
  });
});

describe("the weakest claim carries the loudest caveat", () => {
  it("says the 85% figure was never tested on a person", () => {
    // Verified against the paper: three simulations, being a Perceptron on artificial stimuli, a
    // two-layer network on MNIST digits, and a model of monkeys on Random Dot Motion. Zero human
    // participants. Our wellbeing engine turns this into a success setpoint for a child, which is
    // an extrapolation across species and substrate before it is one across age.
    const c = CLAIMS.find((x) => x.id === "optimal-difficulty");

    expect(c?.limit).toMatch(/never been tested on a child|never been tested on a person/i);
    expect(c?.limit).toMatch(/simulation|Perceptron|MNIST|monkey/i);
  });
});
