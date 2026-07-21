import type {
  AudienceCondition,
  DifficultyBand,
  HypothesisState,
  Provenance,
  SignalFamily,
  SocialMode,
  Uncertainty,
  WorkMode,
} from "@gt100k/interest-lab";

export type AgeBand = "6-8" | "9-11" | "12-14";

export interface DeviceCaps {
  webglAvailable: boolean;
  deviceMemoryGB?: number;
  hardwareConcurrency?: number;
  coarsePointer?: boolean;
  saveData?: boolean;
}

export type RenderTier = "quest-world-3d" | "quest-world-3d-lite" | "board-2d";

export interface QualityTier {
  dprCap: number;
  shadows: boolean;
  bloom: boolean;
  motes: number;
  islandDetail: "high" | "low" | "none";
  postprocessing: boolean;
}

export interface ChildStaging {
  band: AgeBand;
  showRawNumbers: boolean;
  comparisonDefault: "off" | "opt-in";
  labelStyle: "story" | "growth" | "full";
  cardScale: number;
  touchTargetPx: number;
  celebrationCeiling: "low" | "medium" | "high";
  maxVisibleQuests: number | "all";
  showProvenanceDetail: boolean;
  showExplorationMap: boolean;
  worldCameraMode: "auto-tour" | "focus+orbit";
}

export interface MotionToken {
  kind: string;
  mode: "animated" | "reduced";
  durationMs: number;
  easing: string;
}

export type QuestReturnState = "new" | "explored" | "voluntary-return" | "prompted-return";

export type QuestTone = "neutral" | "spark" | "prompted";

export interface ProbeCardView {
  probeId: string;
  familyId: string;
  domain: string;
  domainHue: string;
  workMode: WorkMode;
  workModeGlyph: string;
  difficulty: DifficultyBand;
  social: SocialMode;
  audience: AudienceCondition;
  provenance: Provenance;
  whyCopy: string;
  returnState: QuestReturnState;
  tone: QuestTone;
  motion: MotionToken;
  title: string;
  helpAffordance: true;
}

export interface ProbePickerView {
  band: AgeBand;
  staging: ChildStaging;
  quests: ProbeCardView[];
  visibleQuests: ProbeCardView[];
  choicePointsMinEligible: number;
  workModeGlyphs: Record<WorkMode, string>;
  exploration: {
    domainsExplored: number;
    workModesExplored: number;
  };
}

export type Vector3 = [number, number, number];

export interface QuestMarkerView {
  probeId: string;
  familyId: string;
  workModeGlyph: string;
  position: Vector3;
  returnState: QuestReturnState;
  tone: QuestTone;
  motionKind: string;
  provenance: Provenance;
  whyCopy: string;
  helpAffordance: true;
}

export interface IslandView {
  domain: string;
  hue: string;
  center: Vector3;
  baseRadius: number;
  markers: QuestMarkerView[];
}

export interface CameraView {
  pos: Vector3;
  target: Vector3;
  mode: "drift-in" | "ease" | "cut";
}

export interface Scene3DView {
  bgHex: string;
  fogHex: string;
  fogNear: number;
  fogFar: number;
  ambientHex: string;
  ambientIntensity: number;
  hemiSkyHex: string;
  hemiGroundHex: string;
  hemiIntensity: number;
  keyHex: string;
  keyIntensity: number;
  keyPos: Vector3;
  toneMapping: "ACESFilmic";
  exposure: number;
  markerEmissiveHex: string;
  markerEmissiveRest: number;
  markerEmissivePulse: number;
  bloomPeak: number;
}

export interface Camera3DView {
  fov: number;
  near: number;
  far: number;
  home: {
    pos: Vector3;
    target: Vector3;
  };
  establishStart: {
    pos: Vector3;
  };
  focusLerp: number;
  focusFillDistance: number;
  orbit: {
    enablePan: false;
    enableZoom: false;
    minPolarDeg: number;
    maxPolarDeg: number;
    azimuthClampDeg: number;
    dampingFactor: number;
  };
}

export interface SceneView {
  islands: IslandView[];
  camera: CameraView;
  renderTier: RenderTier;
  quality: QualityTier;
  motes: number;
  scene3d: Scene3DView;
}

export interface ConstellationStar {
  family: SignalFamily;
  position: Vector3;
  brightness: number;
  pull: "supporting" | "disconfirming" | "neutral";
}

export interface EvidenceConstellationView {
  stars: ConstellationStar[];
  supportingAnchor: Vector3;
  disconfirmingAnchor: Vector3;
  domEquivalent: true;
}

export interface CellView {
  domain: string;
  workMode: WorkMode;
  status: "voluntary" | "prompted" | "offered" | "empty";
  probeId?: string;
  provenance?: Provenance;
  whyCopy?: string;
}

export type CoverageDimension =
  | "probeCount"
  | "domains"
  | "workModes"
  | "social"
  | "difficulty"
  | "audience";

export interface DimensionRailItem {
  dimension: CoverageDimension;
  met: boolean;
  title: string;
  detail: string;
  gapCopy?: string;
}

export interface CoverageMatrixView {
  rows: { domain: string; hue: string }[];
  cols: { workMode: WorkMode; glyph: string }[];
  cells: CellView[];
  rail: DimensionRailItem[];
  complete: boolean;
  gaps: string[];
}

export interface ExplanationCard {
  claim: string;
  evidenceRefs: string[];
  strength: "thin" | "moderate" | "strong";
  tone: string;
}

export interface ExplanationsView {
  supporting: ExplanationCard;
  disconfirming: ExplanationCard | null;
  others: ExplanationCard[];
  uncertainty: Uncertainty;
}

export type TimelineMarkerKind =
  | "voluntary"
  | "prompted"
  | "revision"
  | "challenge"
  | "recovery"
  | "scope"
  | "artifact"
  | "support";

export type TimelineTone =
  | "tide"
  | "spark"
  | "prompted"
  | "beacon"
  | "sprout"
  | "support"
  | "neutral";

export interface MarkerView {
  eventId: string;
  dayOffset: number;
  kind: TimelineMarkerKind;
  horizon?: 7 | 30;
  tone: TimelineTone;
  interventionContext?: string;
  provenanceRecedes: boolean;
  lowersSignal: false;
}

export interface ReturnTimelineView {
  axisDays: { min: 0; max: number };
  markers: MarkerView[];
  legend: { kind: string; tone: string; note: string }[];
  motion: { line: MotionToken; marker: MotionToken };
}

export interface GateChecklist {
  eligible: boolean;
  missing: string[];
  families: { family: SignalFamily; present: boolean }[];
}

export interface LifecycleStateView {
  states: { id: HypothesisState; track: "main" | "branch"; tone: string }[];
  current: HypothesisState;
  legalTransitions: { from: HypothesisState; to: HypothesisState }[];
  gate: GateChecklist;
  proposal: {
    proposedBy: Provenance;
    toState: HypothesisState;
    operative: false;
    note: string;
  } | null;
  authoring: { canAuthor: true; note: string };
}

export interface RevisionHistoryView {
  versions: {
    version: number;
    state: HypothesisState;
    operative: boolean;
    validFromDayOffset: number;
    recordedAtDayOffset: number;
    authored: boolean;
  }[];
  currentVersion: number;
}

export type PaletteView = Readonly<Record<string, string>>;

export interface TypographyView {
  fontDisplay: string;
  fontReading: string;
  fontBody: string;
  scale: Readonly<
    Record<
      string,
      {
        rem: number;
        lh: number;
        ls: number;
        weight?: number;
      }
    >
  >;
  numeric: string;
}

export interface InterestLabView {
  surface: "child" | "guide";
  probePicker: ProbePickerView;
  scene: SceneView;
  guide: {
    coverage: CoverageMatrixView;
    explanations: ExplanationsView;
    timeline: ReturnTimelineView;
    lifecycle: LifecycleStateView;
    revisionHistory: RevisionHistoryView;
    constellation: EvidenceConstellationView;
  };
  flags: {
    reducedMotion: boolean;
    plainMode: boolean;
    ageBand: AgeBand;
    surface: "child" | "guide";
    deviceCaps: DeviceCaps;
  };
  presentation: {
    palette: PaletteView;
    typography: TypographyView;
    scene3d: Scene3DView;
    camera3d: Camera3DView;
    renderTier: RenderTier;
    quality: QualityTier;
    motionOf: (kind: string) => MotionToken;
  };
}
