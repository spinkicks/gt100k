import type { Gadget } from '../game/types'

/** Inline positioning style for a gadget's hotspot, anchored by its percentage coords. */
export function hotspotStyle(gadget: Gadget): { left: string; top: string } {
  return { left: `${gadget.hotspot.xPct}%`, top: `${gadget.hotspot.yPct}%` }
}
