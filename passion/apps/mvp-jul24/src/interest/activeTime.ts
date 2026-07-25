export const IDLE_MS = 30_000;

export interface TrackerState {
  focusedGadgetId: string | null;
  lastTickAt: number;
  lastInputAt: number;
  pageVisible: boolean;
  windowFocused: boolean;
}

export function isActive(s: TrackerState, now: number): boolean {
  return (
    s.focusedGadgetId !== null && s.pageVisible && s.windowFocused && now - s.lastInputAt < IDLE_MS
  );
}

export function tickDelta(s: TrackerState, now: number): number {
  return isActive(s, now) ? Math.max(0, now - s.lastTickAt) : 0;
}
