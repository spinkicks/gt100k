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

function buildTierDView(): InitialArenaView {
  return buildArenaView({
    world: FIXTURE,
    signals: createSyntheticMasteryFeed(),
    tierTable: TIERS,
    catalog: CATALOG,
    avatar: { learnerRef: "learner-synthetic-001", equipped: [] },
    base: createSyntheticCohortBase(),
    nearPeers: [],
    caps: {
      webgl2: false,
      webgl1: false,
      prefersReducedMotion: false,
    },
    options: {
      ageBand: "9-11",
      reducedMotion: false,
      plainMode: false,
      standingsOptedIn: false,
    },
  });
}

interface Fallback2DPlan {
  bounds: { x: number; y: number; width: number; height: number };
  regions: Array<{ region: string; assetHref: string }>;
  nodes: Array<{
    nodeId: string;
    region: string;
    landmark: string;
    state: "locked" | "available" | "unlocked";
    x: number;
    y: number;
    assetHref: string;
  }>;
  paths: Array<{ from: string; to: string }>;
}

interface Fallback2DModule {
  default: (props: { view: InitialArenaView }) => unknown;
  buildFallback2DPlan(view: InitialArenaView): Fallback2DPlan;
}

describe("arena P1 Tier-D static fallback", () => {
  it("plans the identical regions, layout positions, landmarks, and node states", async () => {
    const module = await importAppModule<Fallback2DModule>("app/scene/Fallback2D.tsx");

    expect(module.default).toBeTypeOf("function");
    expect(module.buildFallback2DPlan).toBeTypeOf("function");
    if (!module.buildFallback2DPlan) return;

    const plan = module.buildFallback2DPlan(buildTierDView());

    expect(plan.bounds).toEqual({ x: 0, y: 0, width: 2048, height: 2048 });
    expect(plan.regions).toEqual([
      { region: "numbers-coast", assetHref: "/seed/isle-numbers-coast.svg" },
      { region: "tinker-bluffs", assetHref: "/seed/isle-tinker-bluffs.svg" },
      { region: "story-vale", assetHref: "/seed/isle-story-vale.svg" },
      { region: "wordwind-reach", assetHref: "/seed/isle-wordwind-reach.svg" },
    ]);
    expect(
      plan.nodes.map(({ nodeId, region, landmark, state, x, y, assetHref }) => ({
        nodeId,
        region,
        landmark,
        state,
        x,
        y,
        assetHref,
      })),
    ).toEqual([
      {
        nodeId: "count-cove",
        region: "numbers-coast",
        landmark: "Counting Lighthouse",
        state: "unlocked",
        x: 96,
        y: 96,
        assetHref: "/seed/node-unlocked.svg",
      },
      {
        nodeId: "add-atoll",
        region: "numbers-coast",
        landmark: "Abacus Jetty",
        state: "unlocked",
        x: 288,
        y: 96,
        assetHref: "/seed/node-unlocked.svg",
      },
      {
        nodeId: "place-value-point",
        region: "numbers-coast",
        landmark: "Tide-Pool Terraces",
        state: "available",
        x: 480,
        y: 96,
        assetHref: "/seed/node-available.svg",
      },
      {
        nodeId: "observe-overlook",
        region: "tinker-bluffs",
        landmark: "Gear Overlook",
        state: "unlocked",
        x: 1120,
        y: 96,
        assetHref: "/seed/node-unlocked.svg",
      },
      {
        nodeId: "measure-mesa",
        region: "tinker-bluffs",
        landmark: "Gadget Workshop",
        state: "unlocked",
        x: 1312,
        y: 96,
        assetHref: "/seed/node-unlocked.svg",
      },
      {
        nodeId: "phoneme-falls",
        region: "story-vale",
        landmark: "Whispering Falls",
        state: "available",
        x: 96,
        y: 1120,
        assetHref: "/seed/node-available.svg",
      },
      {
        nodeId: "blend-bay",
        region: "story-vale",
        landmark: "Book-Root Forest",
        state: "locked",
        x: 288,
        y: 1120,
        assetHref: "/seed/node-locked.svg",
      },
      {
        nodeId: "letter-landing",
        region: "wordwind-reach",
        landmark: "Letter Landing Field",
        state: "available",
        x: 1120,
        y: 1120,
        assetHref: "/seed/node-available.svg",
      },
      {
        nodeId: "sentence-summit",
        region: "wordwind-reach",
        landmark: "The Spelling Spires",
        state: "locked",
        x: 1312,
        y: 1120,
        assetHref: "/seed/node-locked.svg",
      },
    ]);
    expect(plan.paths).toEqual(buildTierDView().world.edges);
  });

  it("renders a visual-only static SVG without a canvas or duplicate semantic tree", async () => {
    const module = await importAppModule<Fallback2DModule>("app/scene/Fallback2D.tsx");
    expect(module.default).toBeTypeOf("function");
    if (!module.default) return;

    const [{ createElement }, { renderToStaticMarkup }] = await Promise.all([
      importAppDependency<{
        createElement(
          type: Fallback2DModule["default"],
          props: Parameters<Fallback2DModule["default"]>[0],
        ): unknown;
      }>("react/index.js"),
      importAppDependency<{ renderToStaticMarkup(element: unknown): string }>(
        "react-dom/server.node.js",
      ),
    ]);

    const markup = renderToStaticMarkup(createElement(module.default, { view: buildTierDView() }));

    expect(markup).toContain('data-renderer="tier-d"');
    expect(markup).toContain('data-quality-tier="D"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain("<svg");
    expect(markup).toContain('viewBox="0 0 2048 2048"');
    expect(markup.match(/data-region=/g)).toHaveLength(4);
    expect(markup.match(/data-node-id=/g)).toHaveLength(9);
    expect(markup.match(/data-state="unlocked"/g)).toHaveLength(4);
    expect(markup.match(/data-state="available"/g)).toHaveLength(3);
    expect(markup.match(/data-state="locked"/g)).toHaveLength(2);
    expect(markup).toContain("Counting Lighthouse");
    expect(markup).toContain("The Spelling Spires");
    expect(markup).not.toContain("<canvas");
    expect(markup).not.toContain('role="tree"');
  });

  it("commits every region and state SVG used by the fallback with no external source", () => {
    const assets = [
      "isle-numbers-coast",
      "isle-tinker-bluffs",
      "isle-story-vale",
      "isle-wordwind-reach",
      "node-locked",
      "node-available",
      "node-unlocked",
    ];

    for (const asset of assets) {
      const source = readAppFile(`public/seed/${asset}.svg`);
      expect(source, asset).toContain("<svg");
      expect(source, asset).toMatch(/viewBox="0 0 \d+ \d+"/);
      expect(source, asset).not.toMatch(/(?:href|src)="https?:\/\//);
    }
  });

  it("keeps the fallback renderer static and free of WebGL dependencies", () => {
    const source = readAppFile("app/scene/Fallback2D.tsx");

    expect(source).not.toContain('"use client"');
    expect(source).not.toMatch(/@react-three|from "three"|<Canvas|<canvas|useEffect|useFrame/);
    expect(source).toContain('aria-hidden="true"');
  });
});
