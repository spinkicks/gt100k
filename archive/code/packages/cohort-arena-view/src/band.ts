import type { ViewBand, VisualBand } from "./model.js";

const BANDS = {
  "6-8": {
    band: "6-8",
    labelStyle: "story",
    markerScale: 1.25,
    celebrationCeiling: "gentle",
  },
  "9-11": {
    band: "9-11",
    labelStyle: "growth",
    markerScale: 1.1,
    celebrationCeiling: "standard",
  },
  "12-14": {
    band: "12-14",
    labelStyle: "numeric",
    markerScale: 1,
    celebrationCeiling: "standard",
  },
} as const satisfies Record<ViewBand, VisualBand>;

export function resolveVisualBand(band: ViewBand): VisualBand {
  return { ...BANDS[band] };
}
