import { existsSync, readFileSync } from "node:fs";
import type { QualityTier } from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

const APP_ROOT = new URL("../../../apps/arena/", import.meta.url);

async function importAppModule<T>(relativePath: string): Promise<Partial<T>> {
  const fileUrl = new URL(relativePath, APP_ROOT);
  if (!existsSync(fileUrl)) return {};
  return import(/* @vite-ignore */ fileUrl.href) as Promise<T>;
}

function readAppFile(relativePath: string): string {
  const fileUrl = new URL(relativePath, APP_ROOT);
  return existsSync(fileUrl) ? readFileSync(fileUrl, "utf8") : "";
}

interface FrameBudgetMonitor {
  sample(frameTimeMs: number): QualityTier | null;
  reset(tier: QualityTier): void;
}

interface FrameBudgetModule {
  FRAME_BUDGET_THRESHOLD_MS: number;
  FRAME_BUDGET_WINDOW_SIZE: number;
  createFrameBudgetMonitor(tier: QualityTier): FrameBudgetMonitor;
}

describe("arena P6 rolling frame monitor", () => {
  it("waits for 90 samples and degrades exactly one tier above the 18ms average", async () => {
    const module = await importAppModule<FrameBudgetModule>("app/scene/ArenaCanvas.tsx");

    expect(module.FRAME_BUDGET_THRESHOLD_MS).toBe(18);
    expect(module.FRAME_BUDGET_WINDOW_SIZE).toBe(90);
    expect(module.createFrameBudgetMonitor).toBeTypeOf("function");
    if (!module.createFrameBudgetMonitor) return;

    const monitor = module.createFrameBudgetMonitor("A");
    for (let sample = 0; sample < 89; sample += 1) {
      expect(monitor.sample(20)).toBeNull();
    }
    expect(monitor.sample(20)).toBe("B");

    for (let sample = 0; sample < 180; sample += 1) {
      expect(monitor.sample(40)).toBeNull();
    }
  });

  it("uses a strict rolling average and resets only when the rendered tier changes", async () => {
    const module = await importAppModule<FrameBudgetModule>("app/scene/ArenaCanvas.tsx");
    expect(module.createFrameBudgetMonitor).toBeTypeOf("function");
    if (!module.createFrameBudgetMonitor) return;

    const monitor = module.createFrameBudgetMonitor("A");
    for (let sample = 0; sample < 90; sample += 1) {
      expect(monitor.sample(18)).toBeNull();
    }
    expect(monitor.sample(19)).toBe("B");

    monitor.reset("B");
    for (let sample = 0; sample < 89; sample += 1) {
      expect(monitor.sample(19)).toBeNull();
    }
    expect(monitor.sample(19)).toBe("C");

    monitor.reset("D");
    for (let sample = 0; sample < 90; sample += 1) monitor.sample(40);
    expect(monitor.sample(40)).toBeNull();
  });

  it("walks sustained overload through A to B to C to D and stays at D", async () => {
    const module = await importAppModule<FrameBudgetModule>("app/scene/ArenaCanvas.tsx");
    expect(module.createFrameBudgetMonitor).toBeTypeOf("function");
    if (!module.createFrameBudgetMonitor) return;

    const monitor = module.createFrameBudgetMonitor("A");
    const sampleOverBudgetWindow = (): QualityTier | null => {
      let result: QualityTier | null = null;
      for (let sample = 0; sample < 90; sample += 1) {
        result = monitor.sample(18.01);
      }
      return result;
    };

    expect(sampleOverBudgetWindow()).toBe("B");
    monitor.reset("B");
    expect(sampleOverBudgetWindow()).toBe("C");
    monitor.reset("C");
    expect(sampleOverBudgetWindow()).toBe("D");
    monitor.reset("D");
    expect(sampleOverBudgetWindow()).toBeNull();
  });

  it("samples inside the existing canvas and emits the typed frame-budget event", () => {
    const canvas = readAppFile("app/scene/ArenaCanvas.tsx");
    const client = readAppFile("app/ArenaClient.tsx");

    expect(canvas).toContain("useFrame");
    expect(canvas).toContain("<FrameBudgetMonitor");
    expect(canvas).toMatch(
      /emit\("tier-degraded",\s*\{[\s\S]*?from:\s*qualityTier,[\s\S]*?to,[\s\S]*?reason:\s*"frame-budget"/,
    );
    expect(client).toContain('eventBus.subscribe("tier-degraded", ({ to }) => setRuntimeTier(to))');
    expect(client).not.toMatch(/key=\{view\.presentation\.qualityTier\}/);
  });
});
