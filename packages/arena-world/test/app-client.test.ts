import { existsSync, readFileSync } from "node:fs";
import type { AgeBand, DeviceCaps, InitialArenaView, QualityTier } from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

const APP_ROOT = new URL("../../../apps/arena/", import.meta.url);

function appFile(relativePath: string): URL {
  return new URL(relativePath, APP_ROOT);
}

function readAppFile(relativePath: string): string {
  const fileUrl = appFile(relativePath);
  return existsSync(fileUrl) ? readFileSync(fileUrl, "utf8") : "";
}

async function importAppModule<T>(relativePath: string): Promise<Partial<T>> {
  const fileUrl = appFile(relativePath);
  if (!existsSync(fileUrl)) return {};
  return import(/* @vite-ignore */ fileUrl.href) as Promise<T>;
}

async function importAppDependency<T>(relativePath: string): Promise<T> {
  return import(/* @vite-ignore */ appFile(`node_modules/${relativePath}`).href) as Promise<T>;
}

type ReducedMotionDefault = "system" | "on" | "off";
type QualityPreference = "auto" | QualityTier;

interface ArenaPublicConfig {
  seed: number;
  reducedMotionDefault: ReducedMotionDefault;
  ageBand: AgeBand;
  qualityTier: QualityPreference;
}

interface BrowserCapabilityProbe {
  getContext(kind: "webgl2" | "webgl"): unknown;
  matches(query: "(prefers-reduced-motion: reduce)" | "(pointer: coarse)"): boolean;
  userAgent: string;
  deviceMemoryGB?: number;
  hardwareConcurrency?: number;
  saveData?: boolean;
}

interface ArenaClientSnapshot {
  view: InitialArenaView;
  renderer: "canvas" | "fallback-2d";
}

interface ArenaClientModule {
  default: () => unknown;
  parseArenaPublicConfig(input: {
    seed?: string;
    reducedMotionDefault?: string;
    ageBand?: string;
    qualityTier?: string;
  }): ArenaPublicConfig;
  gatherDeviceCaps(probe: BrowserCapabilityProbe): DeviceCaps;
  createArenaClientSnapshot(
    caps: DeviceCaps,
    config: ArenaPublicConfig,
    runtimeTier?: QualityTier,
  ): ArenaClientSnapshot;
}

const FULL_CAPS: DeviceCaps = {
  webgl2: true,
  webgl1: true,
  prefersReducedMotion: false,
  savePower: false,
  deviceMemoryGB: 8,
  hardwareConcurrency: 8,
  isSafari: false,
  coarsePointer: false,
};

const AUTO_CONFIG: ArenaPublicConfig = {
  seed: 42,
  reducedMotionDefault: "system",
  ageBand: "9-11",
  qualityTier: "auto",
};

describe("arena P1 client composition", () => {
  it("parses only safe public settings and falls back deterministically", async () => {
    const module = await importAppModule<ArenaClientModule>("app/ArenaClient.tsx");

    expect(module.parseArenaPublicConfig).toBeTypeOf("function");
    if (!module.parseArenaPublicConfig) return;

    expect(
      module.parseArenaPublicConfig({
        seed: "7",
        reducedMotionDefault: "on",
        ageBand: "12-14",
        qualityTier: "B",
      }),
    ).toEqual({
      seed: 7,
      reducedMotionDefault: "on",
      ageBand: "12-14",
      qualityTier: "B",
    });
    expect(
      module.parseArenaPublicConfig({
        seed: "not-a-seed",
        reducedMotionDefault: "sometimes",
        ageBand: "adult",
        qualityTier: "ultra",
      }),
    ).toEqual(AUTO_CONFIG);
  });

  it("gathers deterministic WebGL, preference, power, and device capability signals", async () => {
    const module = await importAppModule<ArenaClientModule>("app/ArenaClient.tsx");

    expect(module.gatherDeviceCaps).toBeTypeOf("function");
    if (!module.gatherDeviceCaps) return;

    const contexts: string[] = [];
    const caps = module.gatherDeviceCaps({
      getContext(kind) {
        contexts.push(kind);
        return kind === "webgl" ? {} : null;
      },
      matches(query) {
        return query === "(pointer: coarse)";
      },
      userAgent: "Mozilla/5.0 Version/17.5 Mobile Safari/605.1.15",
      deviceMemoryGB: 4,
      hardwareConcurrency: 6,
      saveData: true,
    });

    expect(contexts).toEqual(["webgl2", "webgl"]);
    expect(caps).toEqual({
      webgl2: false,
      webgl1: true,
      prefersReducedMotion: false,
      savePower: true,
      deviceMemoryGB: 4,
      hardwareConcurrency: 6,
      isSafari: true,
      coarsePointer: true,
    });
  });

  it("selects the canvas or Tier-D fallback from one shared deterministic ArenaView", async () => {
    const module = await importAppModule<ArenaClientModule>("app/ArenaClient.tsx");

    expect(module.createArenaClientSnapshot).toBeTypeOf("function");
    if (!module.createArenaClientSnapshot) return;

    const full = module.createArenaClientSnapshot(FULL_CAPS, AUTO_CONFIG);
    const reduced = module.createArenaClientSnapshot(
      { ...FULL_CAPS, prefersReducedMotion: true },
      AUTO_CONFIG,
    );
    const forcedOff = module.createArenaClientSnapshot(
      { ...FULL_CAPS, prefersReducedMotion: true },
      { ...AUTO_CONFIG, reducedMotionDefault: "off" },
    );
    const forcedB = module.createArenaClientSnapshot(FULL_CAPS, {
      ...AUTO_CONFIG,
      qualityTier: "B",
    });
    const noWebGl = module.createArenaClientSnapshot(
      { ...FULL_CAPS, webgl2: false, webgl1: false },
      AUTO_CONFIG,
    );
    const contextLoss = module.createArenaClientSnapshot(
      FULL_CAPS,
      { ...AUTO_CONFIG, qualityTier: "A" },
      "D",
    );

    expect([
      [full.view.presentation.qualityTier, full.renderer, full.view.flags.reducedMotion],
      [reduced.view.presentation.qualityTier, reduced.renderer, reduced.view.flags.reducedMotion],
      [
        forcedOff.view.presentation.qualityTier,
        forcedOff.renderer,
        forcedOff.view.flags.reducedMotion,
      ],
      [forcedB.view.presentation.qualityTier, forcedB.renderer, forcedB.view.flags.reducedMotion],
      [noWebGl.view.presentation.qualityTier, noWebGl.renderer, noWebGl.view.flags.reducedMotion],
      [
        contextLoss.view.presentation.qualityTier,
        contextLoss.renderer,
        contextLoss.view.flags.reducedMotion,
      ],
    ]).toEqual([
      ["A", "canvas", false],
      ["C", "canvas", true],
      ["A", "canvas", false],
      ["B", "canvas", false],
      ["D", "fallback-2d", false],
      ["D", "fallback-2d", false],
    ]);

    expect(reduced.view.nodeStates).toEqual(full.view.nodeStates);
    expect(noWebGl.view.nodeStates).toEqual(full.view.nodeStates);
    expect(contextLoss.view.nodeStates).toEqual(full.view.nodeStates);
    expect(full.view.nodeStates).toHaveLength(9);
    expect(full.view.world.regions).toHaveLength(4);
  });

  it("mounts one visual renderer beside the always-present semantic Ledger", async () => {
    const module = await importAppModule<ArenaClientModule>("app/ArenaClient.tsx");

    expect(module.default).toBeTypeOf("function");
    if (!module.default) return;

    const [{ createElement }, { renderToStaticMarkup }] = await Promise.all([
      importAppDependency<{
        createElement(type: ArenaClientModule["default"], props: object): unknown;
      }>("react/index.js"),
      importAppDependency<{ renderToStaticMarkup(element: unknown): string }>(
        "react-dom/server.node.js",
      ),
    ]);
    const markup = renderToStaticMarkup(createElement(module.default, {}));

    expect(markup).toContain('data-arena-client="ready"');
    expect(markup).toContain('data-quality-tier="D"');
    expect(markup).toContain('data-renderer="tier-d"');
    expect(markup).toContain('role="tree"');
    expect(markup).not.toContain("<canvas");
  });

  it("keeps the 3D bundle client-only and wires focus plus context-loss fallback", () => {
    const client = readAppFile("app/ArenaClient.tsx");
    const canvas = readAppFile("app/scene/ArenaCanvas.tsx");
    const page = readAppFile("app/page.tsx");

    expect(client).toContain('"use client"');
    expect(client).toMatch(
      /dynamic\(\(\)\s*=>\s*import\("\.\/scene\/ArenaCanvas"\)[\s\S]*?ssr:\s*false/,
    );
    expect(client).toContain("<Fallback2D view={view}");
    expect(client).toContain("<ArenaLedger eventBus={eventBus} view={view}");
    expect(client).toContain('eventBus.subscribe("focus-node"');
    expect(client).toContain('eventBus.subscribe("tier-degraded"');
    expect(client).toContain("onFallback={handleCanvasFallback}");

    expect(canvas).toContain("<LightingRig");
    expect(canvas).toContain("<SeaAndSky");
    expect(canvas).toContain("<WorldRoot view={view}");
    expect(canvas).toContain("<Avatar");
    expect(canvas).toContain("<CameraRig");

    expect(page).not.toContain('"use client"');
    expect(page).toContain('import ArenaClient from "./ArenaClient";');
    expect(page).toContain("<ArenaClient />");
  });
});
