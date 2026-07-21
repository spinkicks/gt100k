import type { Lab } from "@gt100k/interest-lab";
import { PALETTE, TYPOGRAPHY } from "./art";
import type { AgeBand, DeviceCaps, InterestLabView, ProbePickerView } from "./model";
import { resolveMotion } from "./motion";
import { buildProbePickerView } from "./picker";
import { CAMERA3D, SCENE3D, buildSceneView } from "./scene";

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
  scene: InterestLabView["scene"];
  flags: Omit<InterestLabView["flags"], "surface"> & { surface: "child" };
  presentation: InterestLabView["presentation"];
};

export function buildInterestLabView(
  inputs: Readonly<BuildInterestLabViewInputs>,
): ChildInterestLabView {
  const { options } = inputs;
  const reducedMotion = options.reducedMotion;
  const history = options.history ?? [];
  const probePicker = buildProbePickerView(inputs.lab, {
    history,
    band: options.ageBand,
    flags: { reducedMotion },
  });
  const scene = buildSceneView(inputs.lab, {
    history,
    ageBand: options.ageBand,
    reducedMotion,
    plainMode: options.plainMode,
    deviceCaps: options.deviceCaps,
  });

  return {
    surface: "child",
    probePicker,
    scene,
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
      renderTier: scene.renderTier,
      quality: scene.quality,
      motionOf: (kind) =>
        resolveMotion(kind as Parameters<typeof resolveMotion>[0], { reducedMotion }),
    },
  };
}
