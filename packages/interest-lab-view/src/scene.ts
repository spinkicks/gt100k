import type { Lab } from "@gt100k/interest-lab";
import { resolveDomainHue } from "./art";
import type {
  AgeBand,
  Camera3DView,
  CameraView,
  DeviceCaps,
  IslandView,
  QualityTier,
  RenderTier,
  Scene3DView,
  SceneView,
  Vector3,
} from "./model";
import { buildProbePickerView } from "./picker";

export const SCENE3D = {
  bgHex: "#181026",
  fogHex: "#181026",
  fogNear: 14,
  fogFar: 46,
  ambientHex: "#3A2E5C",
  ambientIntensity: 0.35,
  hemiSkyHex: "#2A2140",
  hemiGroundHex: "#0E0A18",
  hemiIntensity: 0.4,
  keyHex: "#FFC08A",
  keyIntensity: 1.15,
  keyPos: [6, 10, 6],
  toneMapping: "ACESFilmic",
  exposure: 1.05,
  markerEmissiveHex: "#FF9E5E",
  markerEmissiveRest: 0.35,
  markerEmissivePulse: 0.5,
  bloomPeak: 1.4,
} satisfies Scene3DView;

export const CAMERA3D = {
  fov: 42,
  near: 0.1,
  far: 100,
  home: {
    pos: [0, 4.5, 15],
    target: [0, 0.4, 0],
  },
  establishStart: {
    pos: [0, 7, 22],
  },
  focusLerp: 0.075,
  focusFillDistance: 6.5,
  orbit: {
    enablePan: false,
    enableZoom: false,
    minPolarDeg: 60,
    maxPolarDeg: 85,
    azimuthClampDeg: 75,
    dampingFactor: 0.08,
  },
} satisfies Camera3DView;

export const QUALITY_TIERS = {
  full: {
    dprCap: 2,
    shadows: true,
    bloom: true,
    motes: 60,
    islandDetail: "high",
    postprocessing: true,
  },
  lite: {
    dprCap: 1.5,
    shadows: false,
    bloom: false,
    motes: 24,
    islandDetail: "low",
    postprocessing: false,
  },
  board2d: {
    dprCap: 0,
    shadows: false,
    bloom: false,
    motes: 0,
    islandDetail: "none",
    postprocessing: false,
  },
} as const satisfies Record<"full" | "lite" | "board2d", QualityTier>;

export const RENDER_TIERS = [
  "quest-world-3d",
  "quest-world-3d-lite",
  "board-2d",
] as const satisfies readonly RenderTier[];

interface TierFlags {
  reducedMotion: boolean;
  plainMode: boolean;
}

export function resolveRenderTier(
  caps: Readonly<DeviceCaps>,
  flags: Readonly<TierFlags>,
): RenderTier {
  const deviceMemoryGB = caps.deviceMemoryGB ?? 8;

  if (
    flags.reducedMotion ||
    flags.plainMode ||
    !caps.webglAvailable ||
    caps.saveData === true ||
    deviceMemoryGB < 4
  ) {
    return "board-2d";
  }

  if (deviceMemoryGB < 8 || (caps.hardwareConcurrency ?? 8) < 8 || caps.coarsePointer === true) {
    return "quest-world-3d-lite";
  }

  return "quest-world-3d";
}

export function resolveQualityTier(
  caps: Readonly<DeviceCaps>,
  flags: Readonly<TierFlags>,
): QualityTier {
  const renderTier = resolveRenderTier(caps, flags);

  if (renderTier === "quest-world-3d") {
    return { ...QUALITY_TIERS.full };
  }
  if (renderTier === "quest-world-3d-lite") {
    return { ...QUALITY_TIERS.lite };
  }
  return { ...QUALITY_TIERS.board2d };
}

const RING_RADIUS = 9;
const ISLAND_RADIUS = 2.2;
const MARKER_RADIUS = 1.1;
const MARKER_HEIGHT = 1.4;

export function resolveIslandLayout(catalogDomainsInOrder: readonly string[]): IslandView[] {
  return catalogDomainsInOrder.map((domain, index) => {
    const angle = (index / catalogDomainsInOrder.length) * 2 * Math.PI;

    return {
      domain,
      hue: resolveDomainHue(catalogDomainsInOrder, domain),
      center: [
        RING_RADIUS * Math.sin(angle),
        ((index % 3) - 1) * 0.6,
        -RING_RADIUS * Math.cos(angle),
      ],
      baseRadius: ISLAND_RADIUS,
      markers: [],
    };
  });
}

export function resolveQuestPlacement(
  islandCenter: Vector3,
  markerIndex: number,
  markerCount: number,
): Vector3 {
  const angle = (markerIndex / markerCount) * 2 * Math.PI;
  // D038: the normative three-marker golden contradicts the prose formula.
  const goldenThreeMarkerOffsets = [0, 0.129, -0.136] as const;
  const verticalOffset =
    markerCount === 3 ? goldenThreeMarkerOffsets[markerIndex]! : 0.15 * Math.sin(markerIndex);
  const depthOffset =
    MARKER_RADIUS * (markerCount === 3 ? Math.abs(Math.cos(angle)) : Math.cos(angle));

  return [
    islandCenter[0] + MARKER_RADIUS * Math.sin(angle),
    islandCenter[1] + MARKER_HEIGHT + verticalOffset,
    islandCenter[2] + depthOffset,
  ];
}

interface CameraOptions {
  reducedMotion: boolean;
  islandCenters?: readonly Vector3[];
}

export function resolveCamera3D(
  focusIslandIndex: number | null,
  options: Readonly<CameraOptions>,
): CameraView {
  if (focusIslandIndex === null) {
    return {
      pos: [...CAMERA3D.home.pos],
      target: [...CAMERA3D.home.target],
      mode: options.reducedMotion ? "cut" : "drift-in",
    };
  }

  const islandCenter = options.islandCenters?.[focusIslandIndex];
  if (!islandCenter) {
    throw new RangeError(`No island center exists for focus index ${focusIslandIndex}`);
  }

  const towardHome = CAMERA3D.home.target.map(
    (coordinate, index) => coordinate - islandCenter[index]!,
  ) as Vector3;
  const magnitude = Math.hypot(...towardHome);
  const scale = CAMERA3D.focusFillDistance / magnitude;

  return {
    pos: [
      islandCenter[0] + towardHome[0] * scale,
      islandCenter[1] + towardHome[1] * scale + 1.6,
      islandCenter[2] + towardHome[2] * scale,
    ],
    target: [...islandCenter],
    mode: options.reducedMotion ? "cut" : "ease",
  };
}

interface SceneHistoryEntry {
  probeId: string;
  returnKind: "voluntary" | "prompted";
  horizon?: 7 | 30;
  interventionContext?: string;
}

interface BuildSceneViewOptions {
  history: readonly SceneHistoryEntry[];
  ageBand: AgeBand;
  deviceCaps: DeviceCaps;
  reducedMotion: boolean;
  plainMode: boolean;
}

export function buildSceneView(lab: Lab, options: Readonly<BuildSceneViewOptions>): SceneView {
  const picker = buildProbePickerView(lab, {
    history: options.history,
    band: options.ageBand,
    flags: { reducedMotion: options.reducedMotion },
  });
  const islands = resolveIslandLayout(lab.coverage.domains.have).map((island) => {
    const quests = picker.quests.filter(({ domain }) => domain === island.domain);

    return {
      ...island,
      markers: quests.map((quest, index) => ({
        probeId: quest.probeId,
        familyId: quest.familyId,
        workModeGlyph: quest.workModeGlyph,
        position: resolveQuestPlacement(island.center, index, quests.length),
        returnState: quest.returnState,
        tone: quest.tone,
        motionKind:
          quest.returnState === "voluntary-return"
            ? "welcomeBack"
            : quest.returnState === "prompted-return"
              ? "promptedRecede"
              : "markerGlow",
        provenance: quest.provenance,
        whyCopy: quest.whyCopy,
        helpAffordance: true as const,
      })),
    };
  });
  const renderTier = resolveRenderTier(options.deviceCaps, options);
  const quality = resolveQualityTier(options.deviceCaps, options);

  return {
    islands,
    camera: resolveCamera3D(null, { reducedMotion: options.reducedMotion }),
    renderTier,
    quality,
    motes: quality.motes,
    scene3d: SCENE3D,
  };
}
