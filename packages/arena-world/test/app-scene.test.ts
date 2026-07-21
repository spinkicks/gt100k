import { existsSync, readFileSync } from "node:fs";
import { ASSET_KEYS } from "@gt100k/arena-world";
import { afterEach, describe, expect, it, vi } from "vitest";

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

interface TestEventMap {
  "focus-node": { nodeId: string };
  "tier-degraded": { from: string; to: string; reason: string };
}

interface TestEventBus {
  emit<K extends keyof TestEventMap>(name: K, payload: TestEventMap[K]): void;
  subscribe<K extends keyof TestEventMap>(
    name: K,
    listener: (payload: TestEventMap[K]) => void,
  ): () => void;
  clear(): void;
}

interface EventBusModule {
  ARENA_EVENT_NAMES: readonly string[];
  createArenaEventBus(): TestEventBus;
}

interface ContextLifecycleModule {
  CONTEXT_RECOVERY_GRACE_MS: number;
  bindWebGlContextLifecycle(
    target: EventTarget,
    controls: {
      pause(): void;
      resume(): void;
      fallback(reason: "context-loss" | "context-creation-error"): void;
    },
    recoveryGraceMs?: number,
  ): () => void;
}

interface GeometryLike {
  type: string;
  name: string;
  parameters?: Record<string, unknown>;
  getAttribute(name: string): { count: number } | undefined;
  dispose(): void;
}

interface MaterialLike {
  type: string;
  name: string;
  color: { getHexString(): string };
  emissive: { getHexString(): string };
  roughness: number;
  metalness: number;
  flatShading: boolean;
  dispose(): void;
}

interface MeshLike {
  name: string;
  geometry: GeometryLike;
  material: MaterialLike;
  userData: Record<string, unknown>;
}

interface GeometryModule {
  createLowPolyGeometry(key: string): GeometryLike;
  createLowPolyMaterial(key: string): MaterialLike;
  createProceduralMesh(key: string): MeshLike;
  disposeProceduralMesh(mesh: MeshLike): void;
}

const EVENT_NAMES = [
  "set-band",
  "toggle-plain",
  "toggle-audio",
  "toggle-standings",
  "equip-cosmetic",
  "advance-feed",
  "learning-moment",
  "focus-node",
  "focus-home",
  "focus-base-feature",
  "node-focused",
  "unlock-celebrated",
  "tier-degraded",
] as const;

const ASSET_KEY_LIST = Object.values(ASSET_KEYS).flat();

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("arena scene bootstrap", () => {
  it("provides the exact typed DOM-to-scene and scene-to-DOM event bridge", async () => {
    const module = await importAppModule<EventBusModule>("app/scene/eventBus.ts");

    expect(module.ARENA_EVENT_NAMES).toEqual(EVENT_NAMES);
    expect(module.createArenaEventBus).toBeTypeOf("function");
    if (!module.createArenaEventBus) return;

    const first = module.createArenaEventBus();
    const second = module.createArenaEventBus();
    const firstListener = vi.fn();
    const secondListener = vi.fn();
    const unsubscribe = first.subscribe("focus-node", firstListener);
    second.subscribe("focus-node", secondListener);

    first.emit("focus-node", { nodeId: "count-cove" });
    expect(firstListener).toHaveBeenCalledTimes(1);
    expect(firstListener).toHaveBeenCalledWith({ nodeId: "count-cove" });
    expect(secondListener).not.toHaveBeenCalled();

    unsubscribe();
    first.emit("focus-node", { nodeId: "add-atoll" });
    expect(firstListener).toHaveBeenCalledTimes(1);

    second.clear();
    second.emit("focus-node", { nodeId: "measure-mesa" });
    expect(secondListener).not.toHaveBeenCalled();
  });

  it("pauses, resumes, degrades unrecoverable WebGL loss, and removes handlers", async () => {
    vi.useFakeTimers();
    const module = await importAppModule<ContextLifecycleModule>("app/scene/ArenaCanvas.tsx");

    expect(module.CONTEXT_RECOVERY_GRACE_MS).toBe(2_000);
    expect(module.bindWebGlContextLifecycle).toBeTypeOf("function");
    if (!module.bindWebGlContextLifecycle) return;

    const target = new EventTarget();
    const pause = vi.fn();
    const resume = vi.fn();
    const fallback = vi.fn();
    const cleanup = module.bindWebGlContextLifecycle(target, { pause, resume, fallback }, 250);

    const recoverableLoss = new Event("webglcontextlost", { cancelable: true });
    target.dispatchEvent(recoverableLoss);
    expect(recoverableLoss.defaultPrevented).toBe(true);
    expect(pause).toHaveBeenCalledTimes(1);
    expect(fallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(249);
    target.dispatchEvent(new Event("webglcontextrestored"));
    expect(resume).toHaveBeenCalledTimes(1);
    vi.runOnlyPendingTimers();
    expect(fallback).not.toHaveBeenCalled();

    target.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    vi.advanceTimersByTime(250);
    expect(fallback).toHaveBeenCalledTimes(1);
    expect(fallback).toHaveBeenCalledWith("context-loss");

    const creationError = new Event("webglcontextcreationerror", { cancelable: true });
    target.dispatchEvent(creationError);
    expect(creationError.defaultPrevented).toBe(true);
    expect(fallback).toHaveBeenLastCalledWith("context-creation-error");

    cleanup();
    target.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    vi.runOnlyPendingTimers();
    expect(pause).toHaveBeenCalledTimes(3);
    expect(fallback).toHaveBeenCalledTimes(2);
  });

  it("configures a client-only accessible r3f Canvas from the quality budget", () => {
    const source = readAppFile("app/scene/ArenaCanvas.tsx");

    expect(source).toContain('"use client"');
    expect(source).toContain("<Canvas");
    expect(source).toContain('aria-hidden="true"');
    expect(source).toContain("dpr={[1, dprMax]}");
    expect(source).toContain("frameloop={frameLoop}");
    expect(source).toContain("ACESFilmicToneMapping");
    expect(source).toContain("SRGBColorSpace");
    expect(source).toContain("ColorManagement.enabled = true");
    expect(source).toContain("bindWebGlContextLifecycle");
    expect(source).toContain('setFrameloop("never")');
    expect(source).toContain("setFrameloop(frameLoop)");
    expect(source).toContain('emit("tier-degraded"');
  });

  it("generates deterministic disposable low-poly resources for every asset key", async () => {
    const module = await importAppModule<GeometryModule>("app/scene/geometry/procedural.ts");

    expect(module.createLowPolyGeometry).toBeTypeOf("function");
    expect(module.createLowPolyMaterial).toBeTypeOf("function");
    expect(module.createProceduralMesh).toBeTypeOf("function");
    expect(module.disposeProceduralMesh).toBeTypeOf("function");
    if (
      !module.createLowPolyGeometry ||
      !module.createLowPolyMaterial ||
      !module.createProceduralMesh ||
      !module.disposeProceduralMesh
    ) {
      return;
    }

    const fingerprints = ASSET_KEY_LIST.map((key) => {
      const geometry = module.createLowPolyGeometry?.(key);
      const material = module.createLowPolyMaterial?.(key);
      expect(geometry?.getAttribute("position")?.count).toBeGreaterThan(0);
      expect(material?.type).toBe("MeshStandardMaterial");
      expect(material?.flatShading).toBe(true);

      return {
        key,
        geometryType: geometry?.type,
        geometryName: geometry?.name,
        parameters: geometry?.parameters,
        materialName: material?.name,
        color: material?.color.getHexString(),
        emissive: material?.emissive.getHexString(),
        roughness: material?.roughness,
        metalness: material?.metalness,
      };
    });
    const replay = ASSET_KEY_LIST.map((key) => {
      const geometry = module.createLowPolyGeometry?.(key);
      const material = module.createLowPolyMaterial?.(key);
      return {
        key,
        geometryType: geometry?.type,
        geometryName: geometry?.name,
        parameters: geometry?.parameters,
        materialName: material?.name,
        color: material?.color.getHexString(),
        emissive: material?.emissive.getHexString(),
        roughness: material?.roughness,
        metalness: material?.metalness,
      };
    });

    expect(fingerprints).toEqual(replay);
    expect(new Set(fingerprints.map(({ color }) => color)).size).toBeGreaterThan(5);

    const mesh = module.createProceduralMesh("node-beacon");
    expect(mesh.name).toBe("arena:node-beacon");
    expect(mesh.userData).toMatchObject({ assetKey: "node-beacon" });
    const disposeGeometry = vi.spyOn(mesh.geometry, "dispose");
    const disposeMaterial = vi.spyOn(mesh.material, "dispose");
    module.disposeProceduralMesh(mesh);
    expect(disposeGeometry).toHaveBeenCalledOnce();
    expect(disposeMaterial).toHaveBeenCalledOnce();

    expect(() => module.createLowPolyGeometry?.("unknown-asset")).toThrow(
      /Unknown arena asset key/,
    );
  });

  it("keeps procedural assets local, seeded, and free of ambient randomness", () => {
    const source = readAppFile("app/scene/geometry/procedural.ts");

    expect(source).toContain("resolveAssetFallback");
    expect(source).not.toMatch(/Math\.random|\bfetch\s*\(|https?:\/\//);
  });
});
