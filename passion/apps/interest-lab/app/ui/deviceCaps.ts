import type { DeviceCaps } from "@gt100k/interest-lab-view";

interface CanvasLike {
  getContext: (kind: "webgl2" | "webgl") => unknown;
}

interface NavigatorCapabilities {
  deviceMemory?: number;
  hardwareConcurrency?: number;
  connection?: {
    saveData?: boolean;
  };
}

export interface DeviceCapsSource {
  createCanvas?: () => CanvasLike;
  navigator?: NavigatorCapabilities;
  matchMedia?: (query: string) => { matches: boolean };
}

const readBrowserSource = (): DeviceCapsSource => {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return {};
  }

  const browserNavigator = window.navigator as Navigator & NavigatorCapabilities;

  return {
    createCanvas: () => {
      const canvas = document.createElement("canvas");
      return {
        getContext: (kind) => canvas.getContext(kind),
      };
    },
    navigator: browserNavigator,
    matchMedia: window.matchMedia.bind(window),
  };
};

const isPositiveFinite = (value: number | undefined): value is number =>
  value !== undefined && Number.isFinite(value) && value > 0;

const detectWebGl = (createCanvas: DeviceCapsSource["createCanvas"]): boolean => {
  if (!createCanvas) {
    return false;
  }

  try {
    const canvas = createCanvas();
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
};

export function detectDeviceCaps(source: DeviceCapsSource = readBrowserSource()): DeviceCaps {
  const deviceMemory = source.navigator?.deviceMemory;
  const hardwareConcurrency = source.navigator?.hardwareConcurrency;

  return {
    webglAvailable: detectWebGl(source.createCanvas),
    ...(isPositiveFinite(deviceMemory) ? { deviceMemoryGB: deviceMemory } : {}),
    ...(isPositiveFinite(hardwareConcurrency) ? { hardwareConcurrency } : {}),
    coarsePointer: source.matchMedia?.("(pointer: coarse)").matches ?? false,
    saveData: source.navigator?.connection?.saveData ?? false,
  };
}
