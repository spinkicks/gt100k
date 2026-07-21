import type { BasePlacement } from "./model";

type BaseLayoutSlot = Omit<BasePlacement, "feature" | "by">;

export const BASE_LAYOUT = {
  campfire: { zone: "hearth", x: 1024, y: 1024 },
  banner: { zone: "gateway", x: 1024, y: 928 },
  garden: { zone: "grove", x: 944, y: 1088 },
  dock: { zone: "harbor", x: 1104, y: 1120 },
  workshop: { zone: "yard", x: 944, y: 960 },
  lookout: { zone: "ridge", x: 1104, y: 944 },
} satisfies Record<string, BaseLayoutSlot>;
