/**
 * window.__cabin — the harness's only handle into the running app (LAAS `__world` pattern).
 * shoot.ts waits for `ready || error`, then reads `stats`. Stack-agnostic: works the same whether
 * the renderer is R3F, vanilla three, or Babylon.
 */
import type { CabinHook, CabinStats } from "./contract";

const hook: CabinHook = {
  ready: false,
  error: null,
  progress: 0,
  progressMsg: "booting",
  stats: { fps: 0, drawCalls: 0, triangles: 0, memMB: 0, fireLit: false, catVisible: false },
};

export function installHook(): CabinHook {
  window.__cabin = hook;
  return hook;
}

export function setProgress(p: number, msg: string): void {
  hook.progress = Math.max(0, Math.min(1, p));
  hook.progressMsg = msg;
  console.log(`[cabin] ${(hook.progress * 100) | 0}% ${msg}`);
}

export function setReady(): void {
  hook.ready = true;
  setProgress(1, "ready");
}

export function setError(err: unknown): void {
  const msg = err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
  hook.error = msg;
  console.error("[cabin] ERROR", msg);
  const el = document.getElementById("err");
  if (el) {
    el.style.display = "grid";
    el.textContent = `cabin failed to boot:\n\n${msg}`;
  }
}

export function updateStats(s: Partial<CabinStats>): void {
  Object.assign(hook.stats, s);
}
