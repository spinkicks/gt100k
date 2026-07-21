import { existsSync, readFileSync } from "node:fs";
import {
  CATALOG,
  FIXTURE,
  type InitialArenaView,
  TIERS,
  buildArenaView,
  createSyntheticMasteryFeed,
} from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";
import { createSyntheticCohortBase } from "./view-fixture";

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

function buildView(tier: "A" | "B" | "D" = "A", reducedMotion = false): InitialArenaView {
  return buildArenaView({
    world: FIXTURE,
    signals: createSyntheticMasteryFeed(),
    tierTable: TIERS,
    catalog: CATALOG,
    avatar: { learnerRef: "learner-synthetic-001", equipped: [] },
    base: createSyntheticCohortBase(),
    nearPeers: [],
    caps: {
      webgl2: tier !== "D",
      webgl1: tier !== "D",
      prefersReducedMotion: reducedMotion,
      isSafari: tier === "B",
      deviceMemoryGB: 8,
      hardwareConcurrency: 8,
    },
    options: {
      ageBand: "9-11",
      reducedMotion,
      plainMode: false,
      standingsOptedIn: false,
    },
  });
}

interface BaseCampPlan {
  island: { position: { x: number; y: number; z: number } };
  features: Array<{
    feature: string;
    zone: string;
    by: string;
    missionId: string;
    position: { x: number; y: number; z: number };
  }>;
  dynamicCampfireLight: boolean;
}

interface BaseCampModule {
  default: (props: {
    view: InitialArenaView;
    focusedFeature?: string;
    onFocusFeature?(feature: string): void;
  }) => unknown;
  buildBaseCampRenderPlan(view: InitialArenaView): BaseCampPlan;
  resolveBaseAccretionScale(elapsedMs: number, reducedMotion: boolean): number;
}

interface LedgerBaseEntry {
  feature: string;
  zone: string;
  by: string;
  missionId: string;
  accessibleName: string;
}

interface LedgerModule {
  default: (props: {
    view: InitialArenaView;
    eventBus: { emit(name: string, payload?: unknown): void };
  }) => unknown;
  buildLedgerBaseEntries(view: InitialArenaView): LedgerBaseEntry[];
}

interface FallbackModule {
  default: (props: { view: InitialArenaView }) => unknown;
  buildFallback2DPlan(view: InitialArenaView): {
    baseFeatures: Array<{ feature: string; zone: string; x: number; y: number; by: string }>;
  };
}

interface CameraModule {
  resolveSceneTransitionProgress(elapsedMs: number, reducedMotion: boolean): number;
}

describe("arena P4 Base Camp", () => {
  it("plans the exact central island, stable feature slots, attribution, and capped campfire light", async () => {
    const module = await importAppModule<BaseCampModule>("app/scene/BaseCamp.tsx");

    expect(module.default).toBeTypeOf("function");
    expect(module.buildBaseCampRenderPlan).toBeTypeOf("function");
    if (!module.buildBaseCampRenderPlan) return;

    const plan = module.buildBaseCampRenderPlan(buildView("A"));

    expect(plan.island.position).toEqual({ x: 32, y: 0.8, z: 32 });
    expect(plan.features).toEqual([
      {
        feature: "campfire",
        zone: "hearth",
        by: "kestrel",
        missionId: "m1",
        position: { x: 32, y: 0.8, z: 32 },
      },
      {
        feature: "banner",
        zone: "gateway",
        by: "otter",
        missionId: "m2",
        position: { x: 32, y: 0.8, z: 29 },
      },
      {
        feature: "garden",
        zone: "grove",
        by: "kestrel",
        missionId: "m3",
        position: { x: 29.5, y: 0.8, z: 34 },
      },
    ]);
    expect(plan.dynamicCampfireLight).toBe(true);
    expect(module.buildBaseCampRenderPlan(buildView("B")).dynamicCampfireLight).toBe(false);
  });

  it("uses the baseAccretion token with an instant reduced-motion placement", async () => {
    const module = await importAppModule<BaseCampModule>("app/scene/BaseCamp.tsx");

    expect(module.resolveBaseAccretionScale).toBeTypeOf("function");
    if (!module.resolveBaseAccretionScale) return;

    expect(module.resolveBaseAccretionScale(0, false)).toBe(0.9);
    expect(module.resolveBaseAccretionScale(150, false)).toBeGreaterThan(1);
    expect(module.resolveBaseAccretionScale(300, false)).toBe(1);
    expect(module.resolveBaseAccretionScale(0, true)).toBe(1);

    const source = readAppFile("app/scene/BaseCamp.tsx");
    expect(source).toContain('resolveMotion("baseAccretion"');
    expect(source).toContain("<pointLight");
    expect(source).toContain("<Html");
    expect(source).toContain("missionId");
    for (const feature of ["campfire", "banner", "garden", "dock", "workshop", "lookout"]) {
      expect(source).toContain(`case "${feature}"`);
    }
    expect(source).not.toMatch(/Math\.random|scale\s*=\s*\{?0\}?/);
  });

  it("mirrors the same placements and attribution in Tier D and the semantic Ledger", async () => {
    const [fallback, ledger] = await Promise.all([
      importAppModule<FallbackModule>("app/scene/Fallback2D.tsx"),
      importAppModule<LedgerModule>("app/ledger/ArenaLedger.tsx"),
    ]);

    expect(fallback.buildFallback2DPlan).toBeTypeOf("function");
    expect(ledger.buildLedgerBaseEntries).toBeTypeOf("function");
    if (
      !fallback.buildFallback2DPlan ||
      !fallback.default ||
      !ledger.buildLedgerBaseEntries ||
      !ledger.default
    ) {
      return;
    }

    expect(fallback.buildFallback2DPlan(buildView("D")).baseFeatures).toEqual([
      { feature: "campfire", zone: "hearth", x: 1024, y: 1024, by: "kestrel" },
      { feature: "banner", zone: "gateway", x: 1024, y: 928, by: "otter" },
      { feature: "garden", zone: "grove", x: 944, y: 1088, by: "kestrel" },
    ]);
    expect(ledger.buildLedgerBaseEntries(buildView())).toEqual([
      {
        feature: "campfire",
        zone: "hearth",
        by: "kestrel",
        missionId: "m1",
        accessibleName: "Campfire in Hearth, contributed by kestrel for mission m1",
      },
      {
        feature: "banner",
        zone: "gateway",
        by: "otter",
        missionId: "m2",
        accessibleName: "Banner in Gateway, contributed by otter for mission m2",
      },
      {
        feature: "garden",
        zone: "grove",
        by: "kestrel",
        missionId: "m3",
        accessibleName: "Garden in Grove, contributed by kestrel for mission m3",
      },
    ]);

    const [{ createElement }, { renderToStaticMarkup }] = await Promise.all([
      importAppDependency<{
        createElement(type: LedgerModule["default"], props: object): unknown;
      }>("react/index.js"),
      importAppDependency<{ renderToStaticMarkup(element: unknown): string }>(
        "react-dom/server.node.js",
      ),
    ]);
    const markup = renderToStaticMarkup(
      createElement(ledger.default, { view: buildView(), eventBus: { emit() {} } }),
    );
    const fallbackMarkup = renderToStaticMarkup(
      createElement(fallback.default, { view: buildView("D"), focusedFeature: "banner" }),
    );

    expect(markup).toContain('aria-labelledby="arena-ledger-base-title"');
    expect(markup).toContain("Base Camp");
    expect(markup).toContain("kestrel · mission m1");
    expect(markup.match(/data-base-feature=/g)).toHaveLength(3);
    expect(fallbackMarkup).toContain('data-base-camp="true"');
    expect(fallbackMarkup.match(/data-base-feature=/g)).toHaveLength(3);
    expect(fallbackMarkup).toContain('data-base-feature="banner" data-focused="true"');
  });

  it("lands at home while standings are off and tokenizes the interruptible camera return", async () => {
    const camera = await importAppModule<CameraModule>("app/scene/CameraRig.tsx");

    expect(camera.resolveSceneTransitionProgress).toBeTypeOf("function");
    if (!camera.resolveSceneTransitionProgress) return;
    expect(camera.resolveSceneTransitionProgress(0, false)).toBe(0);
    expect(camera.resolveSceneTransitionProgress(175, false)).toBeCloseTo(0.875, 10);
    expect(camera.resolveSceneTransitionProgress(350, false)).toBe(1);
    expect(camera.resolveSceneTransitionProgress(0, true)).toBe(1);

    const client = readAppFile("app/ArenaClient.tsx");
    const canvas = readAppFile("app/scene/ArenaCanvas.tsx");
    const hud = readAppFile("app/hud/Hud.tsx");
    const events = readAppFile("app/scene/eventBus.ts");

    expect(events).toContain('"focus-home"');
    expect(events).toContain('"focus-base-feature"');
    expect(client).toContain("React.useState(true)");
    expect(client).toContain('eventBus.subscribe("focus-home"');
    expect(client).toContain('eventBus.subscribe("focus-base-feature"');
    expect(canvas).toContain("<BaseCamp");
    expect(canvas).toContain("homeFocused={homeFocused}");
    expect(hud).toContain('eventBus.emit("focus-home"');
    expect(hud).toContain('aria-label="Return home to Base Camp"');
  });
});
