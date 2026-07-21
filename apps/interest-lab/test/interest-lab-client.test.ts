import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InterestLabClient } from "../app/InterestLabClient";
import Page from "../app/page";
import {
  InterestLabControls,
  type InterestLabControlsProps,
} from "../app/ui/controls/InterestLabControls";
import {
  readInterestLabClientDefaults,
  resolveHydrationSafeReducedMotionPreference,
  resolveReducedMotionPreference,
} from "../app/ui/controls/settings";

const noOp = () => undefined;

const controls: InterestLabControlsProps = {
  ageBand: "9-11",
  motionPreference: "system",
  plainMode: false,
  surface: "child",
  renderTierOverride: "auto",
  effectiveReducedMotion: false,
  activeRenderTier: "board-2d",
  onAgeBandChange: noOp,
  onMotionPreferenceChange: noOp,
  onPlainModeChange: noOp,
  onSurfaceChange: noOp,
  onRenderTierOverrideChange: noOp,
};

describe("Interest Lab client shell", () => {
  it("parses public defaults conservatively and rejects unsupported values", () => {
    expect(readInterestLabClientDefaults({})).toEqual({
      ageBand: "9-11",
      motionPreference: "system",
      surface: "child",
      renderTierOverride: "auto",
    });
    expect(
      readInterestLabClientDefaults({
        NEXT_PUBLIC_DEFAULT_AGE_BAND: "6-8",
        NEXT_PUBLIC_REDUCED_MOTION_DEFAULT: "on",
        NEXT_PUBLIC_DEFAULT_SURFACE: "guide",
        NEXT_PUBLIC_RENDER_TIER: "quest-world-3d-lite",
      }),
    ).toEqual({
      ageBand: "6-8",
      motionPreference: "on",
      surface: "guide",
      renderTierOverride: "quest-world-3d-lite",
    });
    expect(
      readInterestLabClientDefaults({
        NEXT_PUBLIC_DEFAULT_AGE_BAND: "adult",
        NEXT_PUBLIC_REDUCED_MOTION_DEFAULT: "sometimes",
        NEXT_PUBLIC_DEFAULT_SURFACE: "admin",
        NEXT_PUBLIC_RENDER_TIER: "cinematic",
      }),
    ).toEqual(readInterestLabClientDefaults({}));
  });

  it("combines the public motion preference with the OS preference", () => {
    expect(resolveReducedMotionPreference("system", true)).toBe(true);
    expect(resolveReducedMotionPreference("system", false)).toBe(false);
    expect(resolveReducedMotionPreference("on", false)).toBe(true);
    expect(resolveReducedMotionPreference("off", true)).toBe(false);
  });

  it("defers the OS motion preference until hydration without deferring explicit settings", () => {
    expect(resolveHydrationSafeReducedMotionPreference("system", true, false)).toBe(false);
    expect(resolveHydrationSafeReducedMotionPreference("system", true, true)).toBe(true);
    expect(resolveHydrationSafeReducedMotionPreference("on", false, false)).toBe(true);
    expect(resolveHydrationSafeReducedMotionPreference("off", true, false)).toBe(false);
  });

  it("renders one semantic presentation-control cluster with every required flag", () => {
    const markup = renderToStaticMarkup(createElement(InterestLabControls, controls));

    expect(markup).toContain("Interest Lab controls");
    expect(markup).toContain('name="age-band"');
    expect(markup).toContain('name="motion-preference"');
    expect(markup).toContain('name="plain-mode"');
    expect(markup).toContain('name="surface"');
    expect(markup).toContain('name="render-tier"');
    expect(markup).toContain('value="quest-world-3d"');
    expect(markup).toContain('value="quest-world-3d-lite"');
    expect(markup).toContain("Showing the accessible 2D board");
  });

  it.each([
    ["6-8", 56],
    ["9-11", 48],
    ["12-14", 44],
  ] as const)("uses the pinned %s control target size", (ageBand, targetPx) => {
    const markup = renderToStaticMarkup(
      createElement(InterestLabControls, { ...controls, ageBand }),
    );

    expect(markup).toContain(`--control-target:${targetPx}px`);
  });

  it("renders the synthetic child ledger as the board-2d default", () => {
    const markup = renderToStaticMarkup(createElement(InterestLabClient));

    expect(markup).toContain('data-active-surface="child"');
    expect(markup).toContain('data-active-render-tier="board-2d"');
    expect(markup).toContain('data-requested-render-tier="auto"');
    expect(markup.match(/data-quest-card="true"/g)).toHaveLength(6);
    expect(markup).toContain("Synthetic data only");
    expect(markup).not.toMatch(/price|score|rank|percentile|verdict/i);
  });

  it("wires the App Router page directly to the operable client shell", () => {
    const markup = renderToStaticMarkup(createElement(Page));

    expect(markup).toContain('href="#interest-lab-content"');
    expect(markup).toContain("Your quest constellation");
    expect(markup).not.toContain("Foundation ready");
  });
});
