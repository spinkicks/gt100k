import { readFileSync } from "node:fs";
import {
  CATALOG,
  type DeviceCaps,
  type InitialArenaView,
  type QualityTier,
} from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

const APP_ROOT = new URL("../../../apps/arena/", import.meta.url);

function readAppFile(relativePath: string): string {
  return readFileSync(new URL(relativePath, APP_ROOT), "utf8");
}

async function importAppModule<T>(relativePath: string): Promise<T> {
  return import(/* @vite-ignore */ new URL(relativePath, APP_ROOT).href) as Promise<T>;
}

async function importAppDependency<T>(relativePath: string): Promise<T> {
  return import(
    /* @vite-ignore */ new URL(`node_modules/${relativePath}`, APP_ROOT).href
  ) as Promise<T>;
}

interface ArenaClientModule {
  createArenaClientSnapshot(
    caps: DeviceCaps,
    config: {
      seed: number;
      reducedMotionDefault: "system" | "on" | "off";
      ageBand: "6-8" | "9-11" | "12-14";
      qualityTier: "auto" | QualityTier;
    },
    runtimeTier?: QualityTier,
    avatar?: { learnerRef: string; equipped: string[] },
    preferences?: {
      ageBand: "6-8" | "9-11" | "12-14";
      plainMode: boolean;
      audioEnabled: boolean;
      standingsOptedIn: boolean;
    },
  ): { view: InitialArenaView; renderer: "canvas" | "fallback-2d"; audioMuted: boolean };
}

interface RendererQualityModule {
  buildRendererQualityPlan(
    view: InitialArenaView,
    cameraTarget: { x: number; y: number; z: number },
  ): {
    canvas: boolean;
    shadows: boolean;
    waterMode: string;
    postFxMode: string;
    ambientMotion: boolean;
    particleScale: number;
    staticMotion: boolean;
  };
}

interface HudModule {
  default(props: {
    view: InitialArenaView;
    catalog: typeof CATALOG;
    eventBus: { emit(name: string, payload: unknown): void };
    onOpenOnboarding(): void;
    audioEnabled: boolean;
    standingsOptedIn: boolean;
  }): unknown;
}

interface LedgerModule {
  default(props: {
    view: InitialArenaView;
    catalog: typeof CATALOG;
    eventBus: { emit(name: string, payload: unknown): void };
    audioEnabled: boolean;
    standingsOptedIn: boolean;
  }): unknown;
}

interface OnboardingModule {
  installOnboardingInputListeners(target: EventTarget, onAdvance: () => void): () => void;
}

const CONFIG = {
  seed: 42,
  reducedMotionDefault: "system",
  ageBand: "9-11",
  qualityTier: "auto",
} as const;

const FULL_CAPS: DeviceCaps = {
  webgl2: true,
  webgl1: true,
  prefersReducedMotion: false,
  deviceMemoryGB: 8,
  hardwareConcurrency: 8,
};

describe("arena P7 accessibility and performance acceptance", () => {
  it("applies the age-band touch target to every HUD and Ledger action", async () => {
    const [client, hud, ledger, { createElement }, { renderToStaticMarkup }] = await Promise.all([
      importAppModule<ArenaClientModule>("app/ArenaClient.tsx"),
      importAppModule<HudModule>("app/hud/Hud.tsx"),
      importAppModule<LedgerModule>("app/ledger/ArenaLedger.tsx"),
      importAppDependency<{
        createElement(type: (props: never) => unknown, props: object): unknown;
      }>("react/index.js"),
      importAppDependency<{ renderToStaticMarkup(element: unknown): string }>(
        "react-dom/server.node.js",
      ),
    ]);
    const view = client.createArenaClientSnapshot(FULL_CAPS, CONFIG, undefined, undefined, {
      ageBand: "6-8",
      plainMode: false,
      audioEnabled: false,
      standingsOptedIn: false,
    }).view;
    const eventBus = { emit() {} };
    const shared = {
      view,
      catalog: CATALOG,
      eventBus,
      audioEnabled: false,
      standingsOptedIn: false,
    };
    const hudMarkup = renderToStaticMarkup(
      createElement(hud.default as (props: never) => unknown, {
        ...shared,
        onOpenOnboarding() {},
      }),
    );
    const ledgerMarkup = renderToStaticMarkup(
      createElement(ledger.default as (props: never) => unknown, shared),
    );

    expect(view.presentation.visualBand.touchTargetPx).toBe(56);
    expect(hudMarkup).toContain('style="--arena-touch-target:56px"');
    expect(ledgerMarkup).toContain('style="--arena-touch-target:56px"');
    expect(hudMarkup).toContain('aria-label="Return home to Base Camp"');
    expect(hudMarkup).toContain('aria-label="Open arena guide"');
    expect(hudMarkup).toContain('aria-controls="arena-cosmetic-drawer"');
    expect(ledgerMarkup).toContain('role="tree"');
    expect(ledgerMarkup).toContain('role="listbox"');
    expect(hudMarkup.match(/style="min-height:56px"/g)).toHaveLength(4);
    expect(ledgerMarkup.match(/style="min-height:56px"/g)).toHaveLength(4);
    const hudCss = readAppFile("app/hud/Hud.module.css");
    expect(hudCss).toMatch(
      /\.homeButton,\s*\.guideButton\s*\{[^}]*min-width:\s*var\(--arena-touch-target,\s*2\.75rem\);[^}]*min-height:\s*var\(--arena-touch-target,\s*2\.75rem\);[^}]*\}/,
    );
    expect(hudCss).toMatch(
      /\.wardrobeTrigger\s*\{[^}]*min-height:\s*var\(--arena-touch-target,\s*2\.75rem\);[^}]*\}/,
    );
    expect(hudCss).toMatch(
      /\.closeButton,\s*\.equipButton\s*\{[^}]*min-width:\s*var\(--arena-touch-target,\s*2\.75rem\);[^}]*min-height:\s*var\(--arena-touch-target,\s*2\.75rem\);[^}]*\}/,
    );
    const ledgerCss = readAppFile("app/ledger/ArenaLedger.module.css");
    expect(ledgerCss).toMatch(
      /\.onboarding button\s*\{[^}]*min-height:\s*var\(--arena-touch-target,\s*2\.75rem\);[^}]*\}/,
    );
    expect(ledgerCss).toMatch(/\.treeItem\s*\{[^}]*min-height:\s*3\.5rem;[^}]*\}/);
    expect(ledgerCss).toMatch(/\.baseList button\s*\{[^}]*min-height:\s*3\.5rem;[^}]*\}/);
    expect(ledgerCss).toMatch(/\.cosmeticOption\s*\{[^}]*min-height:\s*3\.5rem;[^}]*\}/);
  });

  it("keeps reduced motion in static 3D and no-WebGL in the complete 2D fallback", async () => {
    const [client, quality] = await Promise.all([
      importAppModule<ArenaClientModule>("app/ArenaClient.tsx"),
      importAppModule<RendererQualityModule>("app/scene/rendererQuality.ts"),
    ]);
    const reduced = client.createArenaClientSnapshot(
      { ...FULL_CAPS, prefersReducedMotion: true },
      CONFIG,
    );
    const qualityPlan = quality.buildRendererQualityPlan(reduced.view, { x: 0, y: 0, z: 0 });
    expect(reduced).toMatchObject({ renderer: "canvas", audioMuted: true });
    expect(reduced.view).toMatchObject({
      flags: { reducedMotion: true },
      presentation: { qualityTier: "C" },
    });
    expect(qualityPlan).toMatchObject({
      canvas: true,
      shadows: false,
      waterMode: "static",
      postFxMode: "off",
      ambientMotion: false,
      particleScale: 0,
      staticMotion: true,
    });
    expect(reduced.view.presentation.worldTransform.nodes).toHaveLength(9);

    const fallback = client.createArenaClientSnapshot(
      { webgl2: false, webgl1: false, prefersReducedMotion: false },
      CONFIG,
    );
    expect(fallback).toMatchObject({ renderer: "fallback-2d", audioMuted: true });
    expect(fallback.view.presentation.qualityTier).toBe("D");
    expect(readAppFile("app/scene/ArenaCanvas.tsx")).toContain('aria-hidden="true"');
    expect(readAppFile("app/scene/Fallback2D.tsx")).not.toMatch(
      /@react-three\/fiber|from ["']three["']|<Canvas/,
    );
  });

  it("keeps preference styling, live semantics, and onboarding input non-blocking", async () => {
    const onboarding = await importAppModule<OnboardingModule>("app/hud/Onboarding.tsx");
    const target = new EventTarget();
    let advances = 0;
    const cleanup = onboarding.installOnboardingInputListeners(target, () => {
      advances += 1;
    });
    const input = new Event("pointerdown", { cancelable: true });
    target.dispatchEvent(input);
    cleanup();

    expect(advances).toBe(1);
    expect(input.defaultPrevented).toBe(false);
    expect(readAppFile("app/hud/Onboarding.module.css")).toContain("pointer-events: none");
    expect(readAppFile("app/ledger/ArenaLedger.tsx")).toContain('aria-live="polite"');

    const globalCss = readAppFile("app/globals.css");
    expect(globalCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(globalCss).toContain("@media (prefers-reduced-transparency: reduce)");
    expect(globalCss).toContain("@media (prefers-contrast: more)");
    expect(globalCss).toMatch(/:focus-visible\s*\{[\s\S]*?outline:\s*3px solid var\(--focus\);/);
  });
});
