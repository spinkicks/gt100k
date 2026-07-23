/**
 * The app↔harness contract. Mirrors tools/types.d.ts (the harness side reads these off
 * `window.__cabin`). Kept as a plain module so any renderer (R3F / three / Babylon) imports it.
 */

export interface CabinStats {
  fps: number;
  drawCalls: number;
  triangles: number;
  memMB: number;
  /** Semantic scene facts the pixel gates can't reliably infer. */
  fireLit: boolean;
  catVisible: boolean;
}

export interface CabinHook {
  ready: boolean;
  error: string | null;
  progress: number;
  progressMsg: string;
  stats: CabinStats;
}

declare global {
  interface Window {
    __cabin?: CabinHook;
  }
}
