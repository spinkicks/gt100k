import { existsSync, readFileSync, readdirSync } from "node:fs";
import { ASSET_KEYS, resolveAssetFallback } from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

const APP_ROOT = new URL("../../../apps/arena/", import.meta.url);
const ASSET_GROUPS = Object.keys(ASSET_KEYS) as Array<keyof typeof ASSET_KEYS>;
const ALL_ASSET_KEYS = ASSET_GROUPS.flatMap((group) => ASSET_KEYS[group]);
const COMMITTED_SVG_KEYS = [
  ...ASSET_KEYS.nodes,
  ...ASSET_KEYS.regions,
  ...ASSET_KEYS.base,
  ...ASSET_KEYS.ui,
];

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

interface ProceduralMesh {
  geometry: {
    getAttribute(name: string): { count: number } | undefined;
  };
  material: {
    type: string;
  };
  userData: Record<string, unknown>;
}

interface ProceduralGeometryModule {
  createProceduralMesh(key: string): ProceduralMesh;
  disposeProceduralMesh(mesh: ProceduralMesh): void;
}

describe("arena committed seed asset kit", () => {
  it("provides App Router icon metadata so the live root mount has no missing favicon", () => {
    const source = readAppFile("app/icon.svg");

    expect(source).toContain("<svg");
    expect(source).toContain('viewBox="0 0 32 32"');
    expect(source).toMatch(/<title>[^<]+<\/title>/);
    expect(source).not.toMatch(
      /<script|<foreignObject|(?:href|src)="https?:\/\/|url\(["']?https?:\/\//,
    );
  });

  it("commits accessible local SVG art for every Tier-D and UI registry key", () => {
    expect(COMMITTED_SVG_KEYS).toHaveLength(21);

    for (const key of COMMITTED_SVG_KEYS) {
      const source = readAppFile(`public/seed/${key}.svg`);

      expect(source, key).toContain("<svg");
      expect(source, key).toMatch(/viewBox="0 0 \d+ \d+"/);
      expect(source, key).toMatch(/<title>[^<]+<\/title>/);
      expect(source, key).not.toMatch(
        /<script|<foreignObject|(?:href|src)="https?:\/\/|url\(["']?https?:\/\//,
      );
    }
  });

  it("uses compact standard viewboxes for the five HUD and Ledger icons", () => {
    for (const key of ASSET_KEYS.ui) {
      expect(readAppFile(`public/seed/${key}.svg`), key).toContain('viewBox="0 0 24 24"');
    }
  });

  it("renders every registry key procedurally when optional committed models are absent", async () => {
    for (const directory of ["public/models", "public/atlas", "public/fonts"]) {
      const directoryUrl = appFile(directory);
      if (existsSync(directoryUrl)) expect(readdirSync(directoryUrl), directory).toEqual([]);
    }

    const module = await importAppModule<ProceduralGeometryModule>(
      "app/scene/geometry/procedural.ts",
    );
    expect(module.createProceduralMesh).toBeTypeOf("function");
    expect(module.disposeProceduralMesh).toBeTypeOf("function");
    if (!module.createProceduralMesh || !module.disposeProceduralMesh) return;

    for (const key of ALL_ASSET_KEYS) {
      const descriptor = resolveAssetFallback(key);
      expect(descriptor.loadOrder.at(-1)).toBe("procedural");

      const mesh = module.createProceduralMesh(key);
      expect(mesh.geometry.getAttribute("position")?.count, key).toBeGreaterThan(0);
      expect(mesh.material.type, key).toBe("MeshStandardMaterial");
      expect(mesh.userData).toMatchObject({ assetKey: key, assetSeed: descriptor.procedural.seed });
      module.disposeProceduralMesh(mesh);
    }
  });

  it("documents the optional no-fetch model, atlas, and font upgrade paths", () => {
    const readme = readAppFile("public/seed/README.md");

    expect(readme).toMatch(/public\/models\//);
    expect(readme).toMatch(/public\/atlas\//);
    expect(readme).toMatch(/public\/fonts\//);
    expect(readme).toMatch(/optional/i);
    expect(readme).toMatch(/procedural/i);
    expect(readme).toMatch(/system-rounded/i);
    expect(readme).toMatch(/no external (?:fetch|request)/i);
  });
});
