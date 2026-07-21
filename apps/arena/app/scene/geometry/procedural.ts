import { ASSET_KEYS, type AssetKeyGroup, PALETTE, resolveAssetFallback } from "@gt100k/arena-world";
import {
  BoxGeometry,
  type BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  TetrahedronGeometry,
} from "three";

export type ProceduralArenaMesh = Mesh<BufferGeometry, MeshStandardMaterial>;

const GROUP_COLORS = {
  avatar: PALETTE.sunHi,
  nodes: PALETTE.gold,
  regions: PALETTE.seaMid,
  base: PALETTE.ember,
  fx: PALETTE.skyDawn,
  ui: PALETTE.inkHi,
} satisfies Record<AssetKeyGroup, string>;

function seededUnit(seed: number, salt: number): number {
  let value = seed ^ Math.imul(salt + 1, 0x9e_37_79_b1);
  value = Math.imul(value ^ (value >>> 16), 0x21_f0_aa_ad);
  value = Math.imul(value ^ (value >>> 15), 0x73_5a_2d_97);
  return ((value ^ (value >>> 15)) >>> 0) / 0xff_ff_ff_ff;
}

function createGeometryForGroup(group: AssetKeyGroup, key: string, seed: number): BufferGeometry {
  const width = 0.8 + seededUnit(seed, 1) * 0.4;
  const height = 0.8 + seededUnit(seed, 2) * 0.5;

  switch (group) {
    case "avatar":
      return new IcosahedronGeometry(width * 0.55, 1);
    case "nodes":
      return new CylinderGeometry(width * 0.34, width * 0.48, height, 6, 1, false);
    case "regions": {
      if (key === ASSET_KEYS.regions[4]) {
        const water = new PlaneGeometry(64, 64, 1, 1);
        water.rotateX(-Math.PI / 2);
        return water;
      }
      if (key === ASSET_KEYS.regions[5]) return new BoxGeometry(2.4, 0.18, 0.7, 1, 1, 1);
      return new CylinderGeometry(width * 2.2, width * 2.8, height, 7, 1, false);
    }
    case "base":
      return key === ASSET_KEYS.base[0]
        ? new ConeGeometry(width * 0.45, height, 6, 1, false)
        : new BoxGeometry(width, height, width * 0.7, 1, 1, 1);
    case "fx":
      return key === ASSET_KEYS.fx[3]
        ? new IcosahedronGeometry(width * 0.24, 0)
        : new TetrahedronGeometry(width * 0.22, 0);
    case "ui":
      return new PlaneGeometry(width, width, 1, 1);
  }
}

export function createLowPolyGeometry(key: string): BufferGeometry {
  const fallback = resolveAssetFallback(key);
  const geometry = createGeometryForGroup(fallback.group, key, fallback.procedural.seed);
  geometry.name = `arena:${key}:geometry`;
  return geometry;
}

export function createLowPolyMaterial(key: string): MeshStandardMaterial {
  const fallback = resolveAssetFallback(key);
  const seed = fallback.procedural.seed;
  const color = new Color(GROUP_COLORS[fallback.group]);
  color.offsetHSL(
    (seededUnit(seed, 3) - 0.5) * 0.08,
    (seededUnit(seed, 4) - 0.5) * 0.06,
    (seededUnit(seed, 5) - 0.5) * 0.12,
  );

  const glows = key.includes("lantern") || key.includes("beacon") || fallback.group === "fx";
  const material = new MeshStandardMaterial({
    color,
    emissive: glows ? color : new Color(0x00_00_00),
    emissiveIntensity: glows ? 0.35 : 0,
    flatShading: true,
    metalness: 0.02 + seededUnit(seed, 6) * 0.08,
    roughness: 0.72 + seededUnit(seed, 7) * 0.2,
  });
  material.name = `arena:${key}:material`;
  return material;
}

export function createProceduralMesh(key: string): ProceduralArenaMesh {
  const fallback = resolveAssetFallback(key);
  const mesh = new Mesh(createLowPolyGeometry(key), createLowPolyMaterial(key));
  mesh.name = `arena:${key}`;
  mesh.castShadow = fallback.group !== "fx" && fallback.group !== "ui";
  mesh.receiveShadow = fallback.group === "regions" || fallback.group === "base";
  mesh.userData = {
    assetKey: key,
    assetGroup: fallback.group,
    assetSeed: fallback.procedural.seed,
  };
  return mesh;
}

export function disposeProceduralMesh(mesh: ProceduralArenaMesh): void {
  mesh.geometry.dispose();
  mesh.material.dispose();
}
