import {
  type AgeBand,
  CATALOG,
  type DeviceCaps,
  type InitialArenaView,
  type QualityTier,
  plainViewEquals,
} from "@gt100k/arena-world";
import { describe, expect, it, vi } from "vitest";

const APP_ROOT = new URL("../../../apps/arena/", import.meta.url);

async function importAppModule<T>(relativePath: string): Promise<Partial<T>> {
  return import(/* @vite-ignore */ new URL(relativePath, APP_ROOT).href) as Promise<T>;
}

async function importAppDependency<T>(relativePath: string): Promise<T> {
  return import(
    /* @vite-ignore */ new URL(`node_modules/${relativePath}`, APP_ROOT).href
  ) as Promise<T>;
}

interface ArenaPreferences {
  ageBand: AgeBand;
  plainMode: boolean;
  audioEnabled: boolean;
  standingsOptedIn: boolean;
}

interface ArenaPublicConfig {
  seed: number;
  reducedMotionDefault: "system" | "on" | "off";
  ageBand: AgeBand;
  qualityTier: "auto" | QualityTier;
}

interface ArenaClientModule {
  createArenaClientSnapshot(
    caps: DeviceCaps,
    config: ArenaPublicConfig,
    runtimeTier?: QualityTier,
    avatar?: { learnerRef: string; equipped: string[] },
    preferences?: ArenaPreferences,
  ): { view: InitialArenaView; renderer: "canvas" | "fallback-2d"; audioMuted: boolean };
}

interface ControlsProps {
  view: InitialArenaView;
  audioEnabled: boolean;
  standingsOptedIn: boolean;
  eventBus: { emit(name: string, payload: unknown): void };
}

interface HudModule {
  default: (
    props: ControlsProps & { catalog: typeof CATALOG; onOpenOnboarding(): void },
  ) => unknown;
}

interface LedgerModule {
  default: (props: ControlsProps & { catalog: typeof CATALOG }) => unknown;
}

interface WorldRootModule {
  buildWorldRenderPlan(view: InitialArenaView): {
    rewardLabel: string | null;
    nodes: Array<{
      nodeId: string;
      label: string;
      markerScale: number;
      touchTargetPx: number;
      showCanvasNumbers: boolean;
    }>;
  };
}

interface FxModule {
  buildFxPlan(
    view: InitialArenaView,
    feedback: {
      sequence: number;
      signal: { type: "independent-unlock"; nodeId: string; transferCritical: true };
    },
  ): { particleCount: number; durationMs: number; bloomPeak: number; cameraPunch: boolean };
}

const FULL_CAPS: DeviceCaps = {
  webgl2: true,
  webgl1: true,
  prefersReducedMotion: false,
  deviceMemoryGB: 8,
  hardwareConcurrency: 8,
};

const CONFIG: ArenaPublicConfig = {
  seed: 42,
  reducedMotionDefault: "system",
  ageBand: "9-11",
  qualityTier: "auto",
};

const PREFERENCES: ArenaPreferences = {
  ageBand: "9-11",
  plainMode: false,
  audioEnabled: false,
  standingsOptedIn: false,
};

describe("arena P5 presentation controls", () => {
  it("defaults audio and standings off while keeping preference variants state-identical", async () => {
    const client = await importAppModule<ArenaClientModule>("app/ArenaClient.tsx");
    expect(client.createArenaClientSnapshot).toBeTypeOf("function");
    if (!client.createArenaClientSnapshot) return;

    const baseline = client.createArenaClientSnapshot(FULL_CAPS, CONFIG);
    const younger = client.createArenaClientSnapshot(FULL_CAPS, CONFIG, undefined, undefined, {
      ...PREFERENCES,
      ageBand: "6-8",
      standingsOptedIn: true,
    });
    const plain = client.createArenaClientSnapshot(FULL_CAPS, CONFIG, undefined, undefined, {
      ...PREFERENCES,
      plainMode: true,
    });
    const optedIn = client.createArenaClientSnapshot(FULL_CAPS, CONFIG, undefined, undefined, {
      ...PREFERENCES,
      ageBand: "12-14",
      audioEnabled: true,
      standingsOptedIn: true,
    });

    expect([baseline.audioMuted, baseline.view.standing]).toEqual([true, null]);
    expect(younger.view).toMatchObject({
      representation: { band: "6-8", headline: "concrete-marker", showRawNumber: false },
      standing: null,
      presentation: {
        visualBand: {
          showCanvasNumbers: false,
          labelStyle: "story",
          markerScale: 1.25,
          touchTargetPx: 56,
          celebrationCeiling: "medium",
        },
      },
      flags: { ageBand: "6-8", plainMode: false },
    });
    expect(plain.view).toMatchObject({
      flags: { plainMode: true, reducedMotion: true },
      presentation: { qualityTier: "C" },
    });
    expect(plainViewEquals(baseline.view, younger.view)).toBe(true);
    expect(plainViewEquals(baseline.view, plain.view)).toBe(true);
    expect(optedIn.audioMuted).toBe(false);
    expect(optedIn.view.standing).toEqual({
      band: "12-14",
      anonymizedPeers: [
        { pseudonym: "kestrel", gain: 260 },
        { pseudonym: "otter", gain: 340 },
        { pseudonym: "finch", gain: 300 },
      ],
      selfGain: 300,
      gainToBandTop: 40,
    });
    expect(optedIn.view.standing).not.toHaveProperty("rank");
  });

  it("mirrors keyboard-native motion controls in the HUD and Ledger", async () => {
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
    expect(client.createArenaClientSnapshot).toBeTypeOf("function");
    expect(hud.default).toBeTypeOf("function");
    expect(ledger.default).toBeTypeOf("function");
    if (!client.createArenaClientSnapshot || !hud.default || !ledger.default) return;

    const view = client.createArenaClientSnapshot(FULL_CAPS, CONFIG, undefined, undefined, {
      ...PREFERENCES,
      ageBand: "6-8",
    }).view;
    const props = {
      view,
      catalog: CATALOG,
      audioEnabled: false,
      standingsOptedIn: false,
      eventBus: { emit: vi.fn() },
    };
    const hudMarkup = renderToStaticMarkup(
      createElement(hud.default as (props: never) => unknown, {
        ...props,
        onOpenOnboarding: vi.fn(),
      }),
    );
    const ledgerMarkup = renderToStaticMarkup(
      createElement(ledger.default as (props: never) => unknown, props),
    );

    for (const markup of [hudMarkup, ledgerMarkup]) {
      expect(markup).toContain('data-arena-controls="ready"');
      expect(markup).toContain('aria-label="Age band"');
      expect(markup).toContain('data-control-target="56"');
      expect(markup).toContain("Plain mode");
      expect(markup).toContain("Audio muted");
      expect(markup).toContain("Standings unavailable for ages 6–8");
      expect(markup).not.toMatch(/rank|position|percentile|out of/i);
    }
  });

  it("applies story labels, larger markers, and the medium celebration ceiling", async () => {
    const [client, world, fx] = await Promise.all([
      importAppModule<ArenaClientModule>("app/ArenaClient.tsx"),
      importAppModule<WorldRootModule>("app/scene/WorldRoot.tsx"),
      importAppModule<FxModule>("app/scene/Fx.tsx"),
    ]);
    if (!client.createArenaClientSnapshot || !world.buildWorldRenderPlan || !fx.buildFxPlan) return;

    const view = client.createArenaClientSnapshot(FULL_CAPS, CONFIG, undefined, undefined, {
      ...PREFERENCES,
      ageBand: "6-8",
    }).view;
    const youngerPlan = world.buildWorldRenderPlan(view);
    expect(youngerPlan.rewardLabel).toBeNull();
    expect(youngerPlan.nodes[0]).toMatchObject({
      label: "You lit Counting Lighthouse!",
      markerScale: 1.25,
      touchTargetPx: 56,
      showCanvasNumbers: false,
    });
    const olderView = client.createArenaClientSnapshot(FULL_CAPS, CONFIG, undefined, undefined, {
      ...PREFERENCES,
      ageBand: "12-14",
    }).view;
    expect(world.buildWorldRenderPlan(olderView).rewardLabel).toBe("Independence reward: 300");
    expect(
      fx.buildFxPlan(view, {
        sequence: 1,
        signal: { type: "independent-unlock", nodeId: "place-value-point", transferCritical: true },
      }),
    ).toMatchObject({ particleCount: 12, durationMs: 600, bloomPeak: 1.1, cameraPunch: false });
  });
});
