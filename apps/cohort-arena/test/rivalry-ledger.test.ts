import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { buildLedger } from "@gt100k/cohort-arena-view";

import { CohortLedger } from "../components/ledger/CohortLedger.js";
import { buildSyntheticCohortView } from "../components/synthetic-view.js";

const SPEAKER_DESCRIPTORS = [
  "S1: turn share 66.7%; interruptions 0.",
  "S2: turn share 16.7%; interruptions 0.",
  "S3: turn share 16.7%; interruptions 0.",
] as const;

describe("the RivalryMix Cohort Ledger", () => {
  it("renders confidence, observable speaker descriptors, and detected-pattern evidence", () => {
    const view = buildSyntheticCohortView();
    const before = structuredClone(view);
    const ledger = buildLedger(view);
    const markup = renderToStaticMarkup(createElement(CohortLedger, { ledger }));

    expect(ledger.rivalryList).toEqual([
      "Confidence 100%.",
      ...SPEAKER_DESCRIPTORS,
      "dominance: S1 — S1 holds 4/6 turns (66.7%) > 50%",
    ]);
    expect(markup).toContain('<section class="ledger-supporting-state"');
    expect(markup).toContain('aria-labelledby="ledger-rivalry-heading"');
    expect(markup).toContain("Observable turn-taking");
    expect(markup).toContain("S1: turn share 66.7%; interruptions 0.");
    expect(markup).toContain("S1 holds 4/6 turns (66.7%) &gt; 50%");
    expect(view).toEqual(before);
  });

  it("keeps low-confidence descriptors while suppressing every detected pattern", () => {
    const view = buildSyntheticCohortView();
    if (!view.rivalry) throw new Error("Fixture V3 rivalry view is required");

    const ledger = buildLedger({
      ...view,
      rivalry: {
        ...view.rivalry,
        confidence: 0.225,
        suppressed: true,
      },
    });
    const markup = renderToStaticMarkup(createElement(CohortLedger, { ledger }));

    expect(ledger.rivalryList).toEqual([
      "Confidence low — prompts suppressed.",
      "Confidence 22.5%.",
      ...SPEAKER_DESCRIPTORS,
    ]);
    expect(markup).toContain("Confidence low — prompts suppressed.");
    expect(markup).not.toContain("dominance:");
    expect(markup).not.toContain("repeated_interruption:");
  });

  it("renders missing and empty analytics as the same neutral semantic Ledger state", () => {
    const view = buildSyntheticCohortView();
    const offText = "Analytics off — no turn-taking analytics were supplied.";

    for (const rivalry of [
      null,
      { seats: [], patterns: [], confidence: 0, suppressed: true } as const,
    ]) {
      const ledger = buildLedger({ ...view, rivalry });
      const markup = renderToStaticMarkup(createElement(CohortLedger, { ledger }));

      expect(ledger.rivalryList).toEqual([offText]);
      expect(markup).toContain("Observable turn-taking");
      expect(markup).toContain(offText);
      expect(markup).not.toContain("Confidence low");
    }
  });

  it("rejects adversarial trait-label text and keeps the canvas hidden from assistive technology", () => {
    const view = buildSyntheticCohortView();
    if (!view.rivalry) throw new Error("Fixture V3 rivalry view is required");

    const ledger = buildLedger({
      ...view,
      rivalry: {
        seats: [
          { ...view.rivalry.seats[0]!, speaker: "emotion", turnShare: 0.6 },
          { ...view.rivalry.seats[1]!, speaker: "personality", turnShare: 0.4 },
        ],
        patterns: [
          {
            kind: "dominance",
            subjects: ["personality"],
            evidence: "honesty says motivation",
          },
        ],
        confidence: 1,
        suppressed: false,
      },
    });
    const markup = renderToStaticMarkup(createElement(CohortLedger, { ledger }));
    const shellSource = readFileSync(
      new URL("../components/CohortArena.client.tsx", import.meta.url),
      "utf8",
    );

    expect(ledger.rivalryList).toEqual([
      "Confidence 100%.",
      "Speaker 1: turn share 60%; interruptions 0.",
      "Speaker 2: turn share 40%; interruptions 0.",
      "dominance: Speaker 2 — Speaker 2 met the observable turn-share threshold.",
    ]);
    for (const prohibited of ["honesty", "emotion", "personality", "motivation"]) {
      expect(markup.toLowerCase()).not.toContain(prohibited);
    }
    expect(shellSource).toMatch(/<Canvas\s+aria-hidden="true"/);
  });
});
