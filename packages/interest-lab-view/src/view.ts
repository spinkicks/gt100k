import type { Lab } from "@gt100k/interest-lab";
import { PALETTE, TYPOGRAPHY } from "./art";
import type { AgeBand, DeviceCaps, InterestLabView, ProbePickerView } from "./model";
import { resolveMotion } from "./motion";
import { buildProbePickerView } from "./picker";
import { CAMERA3D, QUALITY_TIERS, SCENE3D } from "./scene";

export interface BuildInterestLabViewOptions {
  surface: "child";
  ageBand: AgeBand;
  reducedMotion: boolean;
  plainMode: boolean;
  deviceCaps: DeviceCaps;
  history?: readonly {
    probeId: string;
    returnKind: "voluntary" | "prompted";
    horizon?: 7 | 30;
    interventionContext?: string;
  }[];
}

export interface BuildInterestLabViewInputs {
  lab: Lab;
  options: BuildInterestLabViewOptions;
}

export type ChildInterestLabView = {
  surface: "child";
  probePicker: ProbePickerView;
  flags: Omit<InterestLabView["flags"], "surface"> & { surface: "child" };
  presentation: InterestLabView["presentation"];
};

export function buildInterestLabView(
  inputs: Readonly<BuildInterestLabViewInputs>,
): ChildInterestLabView {
  const { options } = inputs;
  const reducedMotion = options.reducedMotion;

  return {
    surface: "child",
    probePicker: buildProbePickerView(inputs.lab, {
      history: options.history ?? [],
      band: options.ageBand,
      flags: { reducedMotion },
    }),
    flags: {
      reducedMotion,
      plainMode: options.plainMode,
      ageBand: options.ageBand,
      surface: "child",
      deviceCaps: { ...options.deviceCaps },
    },
    presentation: {
      palette: PALETTE,
      typography: TYPOGRAPHY,
      scene3d: SCENE3D,
      camera3d: CAMERA3D,
      renderTier: "board-2d",
      quality: QUALITY_TIERS.board2d,
      motionOf: (kind) =>
        resolveMotion(kind as Parameters<typeof resolveMotion>[0], { reducedMotion }),
    },
  };
}
