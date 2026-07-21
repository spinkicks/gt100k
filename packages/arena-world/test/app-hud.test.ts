import { existsSync, readFileSync } from "node:fs";
import {
  CATALOG,
  type Cosmetic,
  type DeviceCaps,
  type InitialArenaView,
  type QualityTier,
} from "@gt100k/arena-world";
import { describe, expect, it, vi } from "vitest";

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

interface HudCosmeticEntry {
  id: string;
  kind: Cosmetic["kind"];
  look: string;
  equipEffect: string;
  eligible: boolean;
  equipped: boolean;
  earnGoal: string;
}

interface HudModule {
  default: (props: {
    view: InitialArenaView;
    catalog: readonly Cosmetic[];
    eventBus: { emit(name: "equip-cosmetic", payload: { cosmeticId: string }): void };
  }) => unknown;
  buildHudCosmeticEntries(view: InitialArenaView, catalog: readonly Cosmetic[]): HudCosmeticEntry[];
}

interface LedgerCosmeticCommand {
  nextIndex: number;
  equip: boolean;
}

interface LedgerModule {
  default: (props: {
    view: InitialArenaView;
    catalog?: readonly Cosmetic[];
    eventBus: {
      emit(
        name: "focus-node" | "equip-cosmetic",
        payload: { nodeId: string } | { cosmeticId: string },
      ): void;
    };
  }) => unknown;
  resolveCosmeticListboxCommand(
    currentIndex: number,
    key: string,
    itemCount: number,
  ): LedgerCosmeticCommand | null;
}

interface AvatarCosmeticPlanEntry {
  id: string;
  slot: "hat" | "cape" | "badge";
  durationMs: number;
  mode: "animated" | "reduced";
}

interface AvatarModule {
  buildAvatarCosmeticPlan(view: InitialArenaView): AvatarCosmeticPlanEntry[];
}

type ReducedMotionDefault = "system" | "on" | "off";
type QualityPreference = "auto" | QualityTier;

interface ArenaPublicConfig {
  seed: number;
  reducedMotionDefault: ReducedMotionDefault;
  ageBand: "6-8" | "9-11" | "12-14";
  qualityTier: QualityPreference;
}

interface ArenaClientModule {
  createArenaClientSnapshot(
    caps: DeviceCaps,
    config: ArenaPublicConfig,
    runtimeTier?: QualityTier,
    avatar?: { learnerRef: string; equipped: string[] },
  ): { view: InitialArenaView; renderer: "canvas" | "fallback-2d" };
}

const FULL_CAPS: DeviceCaps = {
  webgl2: true,
  webgl1: true,
  prefersReducedMotion: false,
  deviceMemoryGB: 8,
  hardwareConcurrency: 8,
};

const AUTO_CONFIG: ArenaPublicConfig = {
  seed: 42,
  reducedMotionDefault: "system",
  ageBand: "9-11",
  qualityTier: "auto",
};

describe("arena P2 HUD and cosmetic equip", () => {
  it("derives the stable earned and locked cosmetic drawer rows with exact earn goals", async () => {
    const [hud, client] = await Promise.all([
      importAppModule<HudModule>("app/hud/Hud.tsx"),
      importAppModule<ArenaClientModule>("app/ArenaClient.tsx"),
    ]);

    expect(hud.buildHudCosmeticEntries).toBeTypeOf("function");
    expect(client.createArenaClientSnapshot).toBeTypeOf("function");
    if (!hud.buildHudCosmeticEntries || !client.createArenaClientSnapshot) return;

    const view = client.createArenaClientSnapshot(FULL_CAPS, AUTO_CONFIG).view;
    const entries = hud.buildHudCosmeticEntries(view, CATALOG);

    expect(entries.map(({ id, eligible, earnGoal }) => ({ id, eligible, earnGoal }))).toEqual([
      { id: "avatar-hat-explorer", eligible: true, earnGoal: "Reach Kindling" },
      { id: "avatar-cape-aurora", eligible: false, earnGoal: "Reach Bright Ember" },
      { id: "avatar-badge-firstlight", eligible: true, earnGoal: "Light 1 beacon" },
      { id: "world-theme-dawn", eligible: true, earnGoal: "Light 3 beacons" },
      { id: "world-theme-dusk", eligible: false, earnGoal: "Reach Beacon" },
      {
        id: "base-banner-unity",
        eligible: false,
        earnGoal: "Light every beacon in Numbers Coast",
      },
      { id: "base-lantern-warm", eligible: true, earnGoal: "Reach Steady Flame" },
      { id: "celebration-bloom", eligible: true, earnGoal: "Light 1 beacon" },
      { id: "celebration-aurora", eligible: false, earnGoal: "Reach Lighthouse" },
    ]);
    expect(entries.map(({ id }) => id)).toEqual(CATALOG.map(({ id }) => id));
    expect(
      entries.every(({ look, equipEffect }) => look.length > 0 && equipEffect.length > 0),
    ).toBe(true);
  });

  it("renders a token-driven growth panel and an origin-aware earned-only drawer", async () => {
    const [hud, client, { createElement }, { renderToStaticMarkup }] = await Promise.all([
      importAppModule<HudModule>("app/hud/Hud.tsx"),
      importAppModule<ArenaClientModule>("app/ArenaClient.tsx"),
      importAppDependency<{
        createElement(
          type: HudModule["default"],
          props: Parameters<HudModule["default"]>[0],
        ): unknown;
      }>("react/index.js"),
      importAppDependency<{ renderToStaticMarkup(element: unknown): string }>(
        "react-dom/server.node.js",
      ),
    ]);

    expect(hud.default).toBeTypeOf("function");
    expect(client.createArenaClientSnapshot).toBeTypeOf("function");
    if (!hud.default || !client.createArenaClientSnapshot) return;

    const markup = renderToStaticMarkup(
      createElement(hud.default, {
        view: client.createArenaClientSnapshot(FULL_CAPS, AUTO_CONFIG).view,
        catalog: CATALOG,
        eventBus: { emit: vi.fn() },
      }),
    );

    expect(markup).toContain('data-arena-hud="ready"');
    expect(markup).toContain("Steady Flame");
    expect(markup).toContain("You vs. past-you");
    expect(markup).toContain("+300");
    expect(markup).toContain('aria-controls="arena-cosmetic-drawer"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain("Wardrobe");
    expect(markup).not.toMatch(/purchase|price|currency|buy|roll|loot/i);

    const source = readAppFile("app/hud/Hud.tsx");
    const styles = readAppFile("app/hud/Hud.module.css");
    expect(source).toContain('from "motion/react"');
    expect(source).toContain('resolveMotion("tierAdvance"');
    expect(source).toContain('resolveMotion("drawerOpen"');
    expect(source).toContain("index * 0.04");
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain("wardrobeTrigger.current?.focus()");
    expect(styles).toContain("font-variant-numeric: tabular-nums");
    expect(styles).toContain("transform-origin: top right");
    expect(styles).toContain("prefers-reduced-transparency");
    expect(styles).toContain("prefers-contrast");
  });

  it("adds a keyboard-operable cosmetic listbox to the semantic Ledger", async () => {
    const [ledger, client, { createElement }, { renderToStaticMarkup }] = await Promise.all([
      importAppModule<LedgerModule>("app/ledger/ArenaLedger.tsx"),
      importAppModule<ArenaClientModule>("app/ArenaClient.tsx"),
      importAppDependency<{
        createElement(
          type: LedgerModule["default"],
          props: Parameters<LedgerModule["default"]>[0],
        ): unknown;
      }>("react/index.js"),
      importAppDependency<{ renderToStaticMarkup(element: unknown): string }>(
        "react-dom/server.node.js",
      ),
    ]);

    expect(ledger.default).toBeTypeOf("function");
    expect(ledger.resolveCosmeticListboxCommand).toBeTypeOf("function");
    expect(client.createArenaClientSnapshot).toBeTypeOf("function");
    if (
      !ledger.default ||
      !ledger.resolveCosmeticListboxCommand ||
      !client.createArenaClientSnapshot
    ) {
      return;
    }

    const markup = renderToStaticMarkup(
      createElement(ledger.default, {
        view: client.createArenaClientSnapshot(FULL_CAPS, AUTO_CONFIG).view,
        catalog: CATALOG,
        eventBus: { emit: vi.fn() },
      }),
    );

    expect(markup).toContain('role="listbox"');
    expect(markup.match(/role="option"/g)).toHaveLength(9);
    expect(markup).toContain("soft tan felt explorer&#x27;s cap");
    expect(markup).toContain("Earn goal: Reach Bright Ember");
    expect(markup).toContain('aria-disabled="true"');
    expect(markup).not.toMatch(/purchase|price|currency|buy|roll|loot/i);

    expect(ledger.resolveCosmeticListboxCommand(0, "ArrowDown", 9)).toEqual({
      nextIndex: 1,
      equip: false,
    });
    expect(ledger.resolveCosmeticListboxCommand(8, "ArrowDown", 9)).toEqual({
      nextIndex: 8,
      equip: false,
    });
    expect(ledger.resolveCosmeticListboxCommand(4, "Home", 9)).toEqual({
      nextIndex: 0,
      equip: false,
    });
    expect(ledger.resolveCosmeticListboxCommand(4, "End", 9)).toEqual({
      nextIndex: 8,
      equip: false,
    });
    expect(ledger.resolveCosmeticListboxCommand(4, "Enter", 9)).toEqual({
      nextIndex: 4,
      equip: true,
    });
    expect(ledger.resolveCosmeticListboxCommand(4, "Escape", 9)).toBeNull();
  });

  it("keeps equipped state in the shared view and applies the exact world-theme lighting", async () => {
    const client = await importAppModule<ArenaClientModule>("app/ArenaClient.tsx");

    expect(client.createArenaClientSnapshot).toBeTypeOf("function");
    if (!client.createArenaClientSnapshot) return;

    const avatar = {
      learnerRef: "learner-synthetic-001",
      equipped: ["avatar-hat-explorer", "avatar-badge-firstlight", "world-theme-dawn"],
    };
    const snapshot = client.createArenaClientSnapshot(FULL_CAPS, AUTO_CONFIG, undefined, avatar);

    expect(snapshot.view.avatar).toEqual(avatar);
    expect(snapshot.view.presentation.lighting.key).toMatchObject({
      colorHex: "#FFCDB0",
      intensity: 2.2,
    });
    expect(snapshot.view.presentation.lighting.hemi.skyHex).toBe("#FBD9C0");

    const source = readAppFile("app/ArenaClient.tsx");
    expect(source).toContain('eventBus.subscribe("equip-cosmetic"');
    expect(source).toContain("equipCosmetic");
    expect(source).toContain("<Hud");
  });

  it("maps equipped avatar items to child meshes with tokenized reduced-motion-safe swaps", async () => {
    const [avatar, client] = await Promise.all([
      importAppModule<AvatarModule>("app/scene/Avatar.tsx"),
      importAppModule<ArenaClientModule>("app/ArenaClient.tsx"),
    ]);

    expect(avatar.buildAvatarCosmeticPlan).toBeTypeOf("function");
    expect(client.createArenaClientSnapshot).toBeTypeOf("function");
    if (!avatar.buildAvatarCosmeticPlan || !client.createArenaClientSnapshot) return;

    const equipped = {
      learnerRef: "learner-synthetic-001",
      equipped: ["avatar-hat-explorer", "avatar-badge-firstlight"],
    };
    const animated = client.createArenaClientSnapshot(
      FULL_CAPS,
      AUTO_CONFIG,
      undefined,
      equipped,
    ).view;
    const reduced = client.createArenaClientSnapshot(
      { ...FULL_CAPS, prefersReducedMotion: true },
      AUTO_CONFIG,
      undefined,
      equipped,
    ).view;

    expect(avatar.buildAvatarCosmeticPlan(animated)).toEqual([
      { id: "avatar-hat-explorer", slot: "hat", durationMs: 200, mode: "animated" },
      { id: "avatar-badge-firstlight", slot: "badge", durationMs: 200, mode: "animated" },
    ]);
    expect(avatar.buildAvatarCosmeticPlan(reduced)).toEqual([
      { id: "avatar-hat-explorer", slot: "hat", durationMs: 0, mode: "reduced" },
      { id: "avatar-badge-firstlight", slot: "badge", durationMs: 0, mode: "reduced" },
    ]);

    const source = readAppFile("app/scene/Avatar.tsx");
    expect(source).toContain('resolveMotion("equip"');
    expect(source).toContain('name="cosmetic-hat"');
    expect(source).toContain('name="cosmetic-cape"');
    expect(source).toContain('name="cosmetic-badge"');
    expect(source).not.toMatch(/scale\s*=\s*\{?0\}?/);
  });
});
