import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SafeguardingBanner } from "../components/hud/SafeguardingBanner.js";
import { buildObservatoryScene } from "../components/observatory/scene.js";
import { buildSyntheticRollbackViews } from "../components/synthetic-view.js";

function withoutMotionMetadata(markup: string): string {
  return markup
    .replaceAll(/ data-motion-mode="[^"]+"/g, "")
    .replaceAll(/ data-motion-duration-ms="[^"]+"/g, "")
    .replaceAll(/ data-motion-easing="[^"]+"/g, "");
}

describe("the safeguarding-bypass affordance", () => {
  it("renders a color-independent safeguarding lane from the shared view", () => {
    const view = buildSyntheticRollbackViews({ standingsOptIn: true }).current;
    const markup = renderToStaticMarkup(
      createElement(SafeguardingBanner, {
        safeguarding: view.safeguarding,
        reducedMotion: false,
      }),
    );

    expect(markup).toContain('data-safeguarding-state="optimization-bypassed"');
    expect(markup).toContain('data-state-icon="shield"');
    expect(markup).toContain("Safeguarding lane");
    expect(markup).toContain("Optimization bypassed");
    expect(markup).toContain("1 conflicting move paused");
    expect(markup).toContain('data-paused-move="mv-1"');
    expect(markup).toContain("A3, A5");
    expect(markup).toContain("sg-queue-1");
    expect(view.ledger.safeguardingAlert).toBe(
      "Optimization bypassed; 1 conflicting move paused for the safeguarding lane.",
    );
    expect(view.standings).toMatchObject({ selfGain: 300, gainToBandTop: 40 });
    expect(JSON.stringify(view)).not.toMatch(/"(?:rating|objective)"/i);
  });

  it("freezes only the stars touched by the paused move", () => {
    const view = buildSyntheticRollbackViews().current;
    const scene = buildObservatoryScene(view);
    const paused = scene.stars.filter((star) => star.paused).map(({ ref }) => ref);
    const sceneSource = readFileSync(
      new URL("../components/observatory/ObservatoryScene.tsx", import.meta.url),
      "utf8",
    );

    expect(paused).toEqual(["A3", "A5"]);
    expect(scene.stars.filter((star) => !star.paused)).toHaveLength(scene.stars.length - 2);
    expect(sceneSource).toMatch(/if \(star\.paused\) continue/);
  });

  it("keeps identical state in the reduced static treatment", () => {
    const safeguarding = buildSyntheticRollbackViews().current.safeguarding;
    const animated = renderToStaticMarkup(
      createElement(SafeguardingBanner, { safeguarding, reducedMotion: false }),
    );
    const reduced = renderToStaticMarkup(
      createElement(SafeguardingBanner, { safeguarding, reducedMotion: true }),
    );
    const clientSource = readFileSync(
      new URL("../components/CohortArena.client.tsx", import.meta.url),
      "utf8",
    );
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

    expect(animated).toContain('data-motion-kind="safeguardSweep"');
    expect(animated).toContain('data-motion-mode="animated"');
    expect(animated).toContain('data-motion-duration-ms="300"');
    expect(animated).toContain('data-motion-easing="enter"');
    expect(reduced).toContain('data-motion-mode="reduced"');
    expect(reduced).toContain('data-motion-duration-ms="0"');
    expect(reduced).toContain('data-motion-easing="linear"');
    expect(withoutMotionMetadata(reduced)).toBe(withoutMotionMetadata(animated));
    expect(clientSource).toContain("<SafeguardingBanner");
    expect(css).toMatch(/\.safeguarding-banner\s*\{[\s\S]*?var\(--safeguard\)/);
    expect(css).not.toMatch(/\.safeguarding-banner\s*\{[\s\S]*?#(?:dc2626|ef4444|ff0000)/i);
  });
});
