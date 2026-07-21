import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StandingsPanel } from "../components/hud/StandingsPanel.js";
import { buildSyntheticCohortView } from "../components/synthetic-view.js";

function occurrences(value: string, token: string): number {
  return value.split(token).length - 1;
}

function withoutMotionMetadata(markup: string): string {
  return markup
    .replaceAll(/ data-motion-mode="[^"]+"/g, "")
    .replaceAll(/ data-bar-duration-ms="[^"]+"/g, "")
    .replaceAll(/ data-bar-easing="[^"]+"/g, "")
    .replaceAll(/ data-celebrate-duration-ms="[^"]+"/g, "")
    .replaceAll(/ data-celebrate-easing="[^"]+"/g, "")
    .replaceAll(/ style="[^"]*"/g, "")
    .replace(">0<", ">300<");
}

describe("the opt-in own-growth standings panel", () => {
  it("renders nothing while the shared standings view is opted out", () => {
    const view = buildSyntheticCohortView();

    expect(view.standings).toBeNull();
    expect(
      renderToStaticMarkup(
        createElement(StandingsPanel, {
          standings: view.standings,
          reducedMotion: false,
        }),
      ),
    ).toBe("");
  });

  it("renders Fixture V2 as anonymized near-peer context and own growth only", () => {
    const view = buildSyntheticCohortView({ standingsOptIn: true });
    const markup = renderToStaticMarkup(
      createElement(StandingsPanel, {
        standings: view.standings,
        reducedMotion: true,
      }),
    );
    const source = readFileSync(
      new URL("../components/hud/StandingsPanel.tsx", import.meta.url),
      "utf8",
    );

    expect(view.standings).toEqual({
      band: "near-peer",
      anonymizedPeers: [
        { pseudonym: "finch", gain: 300 },
        { pseudonym: "kestrel", gain: 260 },
        { pseudonym: "otter", gain: 340 },
      ],
      selfGain: 300,
      gainToBandTop: 40,
    });
    expect(markup).toContain('data-standings-panel="own-growth"');
    expect(markup).toContain('data-self-gain="300"');
    expect(markup).toContain('data-gain-to-band-top="40"');
    expect(markup).toContain("Your own gain this sprint");
    expect(markup).toContain("40 to the near-peer band top");
    expect(occurrences(markup, "data-peer-pseudonym=")).toBe(3);
    expect(markup).toContain('data-peer-pseudonym="finch" data-peer-gain="300"');
    expect(markup).toContain('data-peer-pseudonym="kestrel" data-peer-gain="260"');
    expect(markup).toContain('data-peer-pseudonym="otter" data-peer-gain="340"');
    expect(markup).toMatch(/finch[\s\S]*\+300/);
    expect(markup).toMatch(/kestrel[\s\S]*\+260/);
    expect(markup).toMatch(/otter[\s\S]*\+340/);
    expect(source).not.toMatch(/\b(?:rank|position|percentile|leaderboard)\b/i);
    expect(source).not.toMatch(/last\s+of|out\s+of|beating|beat\s+others/i);
  });

  it("uses golden bar and celebration motion with an instant state-equal reduced form", () => {
    const standings = buildSyntheticCohortView({ standingsOptIn: true }).standings;
    const animated = renderToStaticMarkup(
      createElement(StandingsPanel, { standings, reducedMotion: false }),
    );
    const reduced = renderToStaticMarkup(
      createElement(StandingsPanel, { standings, reducedMotion: true }),
    );
    const source = readFileSync(
      new URL("../components/hud/StandingsPanel.tsx", import.meta.url),
      "utf8",
    );
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    const shellSource = readFileSync(
      new URL("../components/CohortArena.client.tsx", import.meta.url),
      "utf8",
    );

    expect(animated).toContain('data-motion-mode="animated"');
    expect(animated).toContain('data-bar-duration-ms="420"');
    expect(animated).toContain('data-bar-easing="enter"');
    expect(animated).toContain('data-celebrate-duration-ms="240"');
    expect(animated).toContain('data-celebrate-easing="settle"');
    expect(reduced).toContain('data-motion-mode="reduced"');
    expect(reduced).toContain('data-bar-duration-ms="0"');
    expect(reduced).toContain('data-bar-easing="linear"');
    expect(reduced).toContain('data-celebrate-duration-ms="0"');
    expect(reduced).toContain('data-celebrate-easing="linear"');
    expect(reduced).toContain(">300</span>");
    expect(withoutMotionMetadata(reduced)).toBe(withoutMotionMetadata(animated));
    expect(source).toContain('from "motion/react"');
    expect(source).toContain('resolveMotion("standingsBar"');
    expect(source).toContain('resolveMotion("gainCelebrate"');
    expect(source).toContain('transform: "scaleX(0)"');
    expect(css).toMatch(/\.standings-bar-fill\s*\{[\s\S]*?transform-origin:\s*left center/);
    expect(css).toMatch(/\.standings-value\s*\{[\s\S]*?font-variant-numeric:\s*tabular-nums/);
    expect(shellSource).toContain("<StandingsPanel");
  });
});
