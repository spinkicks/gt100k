import { readFileSync } from "node:fs";
import { ASSET_KEYS, type AssetFallbackDescriptor, type AssetKeyGroup } from "@gt100k/arena-world";
import * as arenaWorld from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";

type AssetResolver = (key: string) => AssetFallbackDescriptor;

const resolveAssetFallback = (
  arenaWorld as typeof arenaWorld & { resolveAssetFallback?: AssetResolver }
).resolveAssetFallback;

const GOLDEN_ASSET_KEYS = {
  avatar: ["av-body", "av-lantern", "av-hat", "av-cape", "av-badge"],
  nodes: ["node-locked", "node-available", "node-unlocked", "node-beacon"],
  regions: [
    "isle-numbers-coast",
    "isle-tinker-bluffs",
    "isle-story-vale",
    "isle-wordwind-reach",
    "water",
    "bridge",
  ],
  base: [
    "prop-campfire",
    "prop-banner",
    "prop-garden",
    "prop-dock",
    "prop-workshop",
    "prop-lookout",
  ],
  fx: ["fx-mote", "fx-petal", "fx-ribbon", "fx-star"],
  ui: ["ui-lock", "ui-star", "ui-home", "ui-audio", "ui-help"],
} as const;

const GROUPS = Object.keys(GOLDEN_ASSET_KEYS) as AssetKeyGroup[];

describe("arena asset fallback descriptors", () => {
  it("keeps the exact grouped asset keys in declaration order", () => {
    expect(ASSET_KEYS).toEqual(GOLDEN_ASSET_KEYS);
    expect(Object.keys(ASSET_KEYS)).toEqual(GROUPS);
  });

  it("resolves every key to a stable seeded procedural fallback", () => {
    expect(resolveAssetFallback).toBeTypeOf("function");
    if (!resolveAssetFallback) return;

    const first = GROUPS.flatMap((group) =>
      GOLDEN_ASSET_KEYS[group].map((key) => resolveAssetFallback(key)),
    );
    const second = GROUPS.flatMap((group) =>
      GOLDEN_ASSET_KEYS[group].map((key) => resolveAssetFallback(key)),
    );

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(new Set(first.map(({ procedural }) => procedural.seed))).toHaveLength(first.length);

    for (const descriptor of first) {
      expect(descriptor.procedural.kind).toBe("mesh-material");
      expect(Number.isSafeInteger(descriptor.procedural.seed)).toBe(true);
      expect(descriptor.procedural.seed).toBeGreaterThanOrEqual(0);
    }

    expectTypeOf(first).toEqualTypeOf<AssetFallbackDescriptor[]>();
  });

  it("tries a committed local source before the procedural fallback", () => {
    expect(resolveAssetFallback).toBeTypeOf("function");
    if (!resolveAssetFallback) return;

    for (const group of GROUPS) {
      for (const key of GOLDEN_ASSET_KEYS[group]) {
        expect(resolveAssetFallback(key)).toMatchObject({
          key,
          group,
          loadOrder:
            group === "ui"
              ? ["committed-svg", "procedural"]
              : ["committed-model-or-atlas", "procedural"],
        });
      }
    }

    expect(() => resolveAssetFallback("unknown-asset")).toThrow(/Unknown arena asset key/);
  });

  it("contains no random or external-fetch escape hatch", () => {
    const source = readFileSync(new URL("../src/assets.ts", import.meta.url), "utf8");

    expect(source).not.toMatch(/Math\.random|\bfetch\s*\(|https?:\/\//);
  });
});
