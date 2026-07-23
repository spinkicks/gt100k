/**
 * Ambient types shared by the harness tools and the app.
 * `window.__cabin` is the harness's only handle into the running app (LAAS `__world` pattern):
 * shoot.ts waits for `ready || error`, then reads `stats`.
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
