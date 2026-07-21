import type {
  HypothesisState,
  Provenance,
  SignalFamily,
  Uncertainty,
  WorkMode,
} from "@gt100k/interest-lab-domain";
import { describe, expectTypeOf, test } from "vitest";
import type {
  AgeBand,
  Camera3DView,
  CameraView,
  CellView,
  ChildStaging,
  ConstellationStar,
  CoverageMatrixView,
  DeviceCaps,
  DimensionRailItem,
  EvidenceConstellationView,
  ExplanationCard,
  ExplanationsView,
  GateChecklist,
  InterestLabView,
  IslandView,
  LifecycleStateView,
  MarkerView,
  MotionToken,
  PaletteView,
  ProbeCardView,
  ProbePickerView,
  QualityTier,
  QuestMarkerView,
  RenderTier,
  ReturnTimelineView,
  RevisionHistoryView,
  Scene3DView,
  SceneView,
  TypographyView,
  Vector3,
} from "../src/model";

type ForbiddenViewKey =
  | "score"
  | "confidence"
  | "passionScore"
  | "verdict"
  | "label"
  | "rank"
  | "percentile"
  | "outOf"
  | "price";

type ForbiddenKeys<T> = T extends (...args: never[]) => unknown
  ? never
  : T extends readonly (infer Item)[]
    ? ForbiddenKeys<Item>
    : T extends object
      ? Extract<keyof T, ForbiddenViewKey> | { [Key in keyof T]-?: ForbiddenKeys<T[Key]> }[keyof T]
      : never;

type AllViewModels =
  | ChildStaging
  | MotionToken
  | ProbeCardView
  | ProbePickerView
  | QuestMarkerView
  | IslandView
  | CameraView
  | SceneView
  | ConstellationStar
  | EvidenceConstellationView
  | CellView
  | DimensionRailItem
  | CoverageMatrixView
  | ExplanationCard
  | ExplanationsView
  | MarkerView
  | ReturnTimelineView
  | GateChecklist
  | LifecycleStateView
  | RevisionHistoryView
  | InterestLabView;

describe("interest-lab view model contracts", () => {
  test("defines device, staging, and motion presentation types", () => {
    expectTypeOf<AgeBand>().toEqualTypeOf<"6-8" | "9-11" | "12-14">();
    expectTypeOf<DeviceCaps>().toEqualTypeOf<{
      webglAvailable: boolean;
      deviceMemoryGB?: number;
      hardwareConcurrency?: number;
      coarsePointer?: boolean;
      saveData?: boolean;
    }>();
    expectTypeOf<RenderTier>().toEqualTypeOf<
      "quest-world-3d" | "quest-world-3d-lite" | "board-2d"
    >();
    expectTypeOf<QualityTier>().toEqualTypeOf<{
      dprCap: number;
      shadows: boolean;
      bloom: boolean;
      motes: number;
      islandDetail: "high" | "low" | "none";
      postprocessing: boolean;
    }>();
    expectTypeOf<ChildStaging>().toEqualTypeOf<{
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
    }>();
    expectTypeOf<MotionToken>().toEqualTypeOf<{
      kind: string;
      mode: "animated" | "reduced";
      durationMs: number;
      easing: string;
    }>();
  });

  test("defines the child card and deterministic scene types", () => {
    expectTypeOf<Vector3>().toEqualTypeOf<[number, number, number]>();
    expectTypeOf<ProbeCardView>().toEqualTypeOf<{
      probeId: string;
      familyId: string;
      domain: string;
      domainHue: string;
      workMode: WorkMode;
      workModeGlyph: string;
      difficulty: "foundational" | "stretch";
      social: "solo" | "group";
      audience: "audience" | "no_audience";
      provenance: Provenance;
      whyCopy: string;
      returnState: "new" | "explored" | "voluntary-return" | "prompted-return";
      tone: "neutral" | "spark" | "prompted";
      motion: MotionToken;
      title: string;
      helpAffordance: true;
    }>();
    expectTypeOf<ProbePickerView>().toEqualTypeOf<{
      band: AgeBand;
      staging: ChildStaging;
      quests: ProbeCardView[];
      visibleQuests: ProbeCardView[];
      choicePointsMinEligible: number;
      workModeGlyphs: Record<WorkMode, string>;
      exploration: { domainsExplored: number; workModesExplored: number };
    }>();
    expectTypeOf<QuestMarkerView>().toEqualTypeOf<{
      probeId: string;
      familyId: string;
      workModeGlyph: string;
      position: Vector3;
      returnState: "new" | "explored" | "voluntary-return" | "prompted-return";
      tone: "neutral" | "spark" | "prompted";
      motionKind: string;
      provenance: Provenance;
      whyCopy: string;
      helpAffordance: true;
    }>();
    expectTypeOf<IslandView>().toEqualTypeOf<{
      domain: string;
      hue: string;
      center: Vector3;
      baseRadius: number;
      markers: QuestMarkerView[];
    }>();
    expectTypeOf<CameraView>().toEqualTypeOf<{
      pos: Vector3;
      target: Vector3;
      mode: "drift-in" | "ease" | "cut";
    }>();
    expectTypeOf<SceneView>().toEqualTypeOf<{
      islands: IslandView[];
      camera: CameraView;
      renderTier: RenderTier;
      quality: QualityTier;
      motes: number;
      scene3d: Scene3DView;
    }>();
  });

  test("defines coverage, explanation, timeline, and lifecycle types", () => {
    expectTypeOf<ConstellationStar>().toEqualTypeOf<{
      family: SignalFamily;
      position: Vector3;
      brightness: number;
      pull: "supporting" | "disconfirming" | "neutral";
    }>();
    expectTypeOf<EvidenceConstellationView>().toEqualTypeOf<{
      stars: ConstellationStar[];
      supportingAnchor: Vector3;
      disconfirmingAnchor: Vector3;
      domEquivalent: true;
    }>();
    expectTypeOf<CellView>().toEqualTypeOf<{
      domain: string;
      workMode: WorkMode;
      status: "voluntary" | "prompted" | "offered" | "empty";
      probeId?: string;
      provenance?: Provenance;
      whyCopy?: string;
    }>();
    expectTypeOf<DimensionRailItem>().toEqualTypeOf<{
      dimension: "probeCount" | "domains" | "workModes" | "social" | "difficulty" | "audience";
      met: boolean;
      title: string;
      detail: string;
      gapCopy?: string;
    }>();
    expectTypeOf<CoverageMatrixView>().toEqualTypeOf<{
      rows: { domain: string; hue: string }[];
      cols: { workMode: WorkMode; glyph: string }[];
      cells: CellView[];
      rail: DimensionRailItem[];
      complete: boolean;
      gaps: string[];
    }>();
    expectTypeOf<ExplanationCard>().toEqualTypeOf<{
      claim: string;
      evidenceRefs: string[];
      strength: "thin" | "moderate" | "strong";
      tone: string;
    }>();
    expectTypeOf<ExplanationsView>().toEqualTypeOf<{
      supporting: ExplanationCard;
      disconfirming: ExplanationCard | null;
      others: ExplanationCard[];
      uncertainty: Uncertainty;
    }>();
    expectTypeOf<MarkerView>().toEqualTypeOf<{
      eventId: string;
      dayOffset: number;
      kind:
        | "voluntary"
        | "prompted"
        | "revision"
        | "challenge"
        | "recovery"
        | "scope"
        | "artifact"
        | "support";
      horizon?: 7 | 30;
      tone: "tide" | "spark" | "prompted" | "beacon" | "sprout" | "support" | "neutral";
      interventionContext?: string;
      provenanceRecedes: boolean;
      lowersSignal: false;
    }>();
    expectTypeOf<ReturnTimelineView>().toEqualTypeOf<{
      axisDays: { min: 0; max: number };
      markers: MarkerView[];
      legend: { kind: string; tone: string; note: string }[];
      motion: { line: MotionToken; marker: MotionToken };
    }>();
    expectTypeOf<GateChecklist>().toEqualTypeOf<{
      eligible: boolean;
      missing: string[];
      families: { family: SignalFamily; present: boolean }[];
    }>();
    expectTypeOf<LifecycleStateView>().toEqualTypeOf<{
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
    }>();
    expectTypeOf<RevisionHistoryView>().toEqualTypeOf<{
      versions: {
        version: number;
        state: HypothesisState;
        operative: boolean;
        validFromDayOffset: number;
        recordedAtDayOffset: number;
        authored: boolean;
      }[];
      currentVersion: number;
    }>();
  });

  test("composes both surfaces without forbidden decision or commerce fields", () => {
    expectTypeOf<PaletteView>().toEqualTypeOf<Readonly<Record<string, string>>>();
    expectTypeOf<TypographyView>().toEqualTypeOf<{
      fontDisplay: string;
      fontReading: string;
      fontBody: string;
      scale: Readonly<Record<string, { rem: number; lh: number; ls: number; weight?: number }>>;
      numeric: string;
    }>();
    expectTypeOf<InterestLabView>().toEqualTypeOf<{
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
    }>();
    expectTypeOf<ForbiddenKeys<AllViewModels>>().toEqualTypeOf<never>();
  });
});
