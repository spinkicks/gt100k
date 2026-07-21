import {
  type CoverageMatrix,
  type EngagementEvent,
  type HypothesisRevision,
  type InterestHypothesis,
  type Lab,
  currentFor,
} from "@gt100k/interest-lab-domain";
import { PALETTE, TYPOGRAPHY } from "./art";
import { buildEvidenceConstellationView } from "./constellation";
import { buildCoverageMatrixView } from "./coverage-view";
import { buildExplanationsView } from "./explanations";
import {
  type LifecycleGateInput,
  buildLifecycleStateView,
  buildRevisionHistoryView,
} from "./lifecycle-view";
import type { AgeBand, DeviceCaps, InterestLabView } from "./model";
import { resolveMotion } from "./motion";
import { buildProbePickerView } from "./picker";
import { CAMERA3D, SCENE3D, buildSceneView } from "./scene";
import { buildReturnTimelineView } from "./timeline";

interface ViewHistoryEntry {
  probeId: string;
  returnKind: "voluntary" | "prompted";
  horizon?: 7 | 30;
  interventionContext?: string;
}

export interface BuildInterestLabViewOptions {
  surface: "child" | "guide";
  ageBand: AgeBand;
  reducedMotion: boolean;
  plainMode: boolean;
  deviceCaps: DeviceCaps;
  history?: readonly ViewHistoryEntry[];
}

export interface BuildInterestLabViewInputs {
  lab: Lab;
  coverage: CoverageMatrix;
  hypothesis: InterestHypothesis;
  events: readonly EngagementEvent[];
  gate: LifecycleGateInput;
  proposal?: HypothesisRevision;
  options: BuildInterestLabViewOptions;
}

type BuildChildInterestLabViewInputs = Omit<BuildInterestLabViewInputs, "options"> & {
  options: BuildInterestLabViewOptions & { surface: "child" };
};

export type ChildInterestLabView = Omit<InterestLabView, "surface" | "flags"> & {
  surface: "child";
  flags: Omit<InterestLabView["flags"], "surface"> & { surface: "child" };
};

export function buildInterestLabView(
  inputs: Readonly<BuildChildInterestLabViewInputs>,
): ChildInterestLabView;
export function buildInterestLabView(inputs: Readonly<BuildInterestLabViewInputs>): InterestLabView;
export function buildInterestLabView(
  inputs: Readonly<BuildInterestLabViewInputs>,
): InterestLabView {
  const { options } = inputs;
  const reducedMotion = options.reducedMotion;
  const history = options.history ?? [];
  const revision = currentFor(inputs.hypothesis);

  if (!revision) {
    throw new Error("An operative hypothesis revision is required to build the Interest Lab view");
  }

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
  const timelineBase = buildReturnTimelineView(inputs.events);
  const timeline = {
    ...timelineBase,
    motion: {
      line: resolveMotion("timelineDraw", { reducedMotion }),
      marker: resolveMotion("markerPop", { reducedMotion }),
    },
  };

  return {
    surface: options.surface,
    probePicker,
    scene,
    guide: {
      coverage: buildCoverageMatrixView(inputs.coverage, inputs.lab.offers),
      explanations: buildExplanationsView(revision),
      timeline,
      lifecycle: buildLifecycleStateView(revision.state, inputs.gate, inputs.proposal),
      revisionHistory: buildRevisionHistoryView(inputs.hypothesis),
      constellation: buildEvidenceConstellationView(revision, timeline),
    },
    flags: {
      reducedMotion,
      plainMode: options.plainMode,
      ageBand: options.ageBand,
      surface: options.surface,
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

const questState = (view: InterestLabView, includeAgeSpecificCopy: boolean) => ({
  quests: view.probePicker.quests.map(
    ({
      probeId,
      familyId,
      domain,
      workMode,
      workModeGlyph,
      difficulty,
      social,
      audience,
      provenance,
      whyCopy,
      returnState,
      tone,
      helpAffordance,
    }) => ({
      probeId,
      familyId,
      domain,
      workMode,
      workModeGlyph,
      difficulty,
      social,
      audience,
      provenance,
      ...(includeAgeSpecificCopy ? { whyCopy } : {}),
      returnState,
      tone,
      helpAffordance,
    }),
  ),
  choicePointsMinEligible: view.probePicker.choicePointsMinEligible,
  exploration: view.probePicker.exploration,
});

const markerState = (view: InterestLabView, includeAgeSpecificCopy: boolean) =>
  view.scene.islands
    .flatMap((island) =>
      island.markers.map(
        ({
          probeId,
          familyId,
          workModeGlyph,
          returnState,
          tone,
          provenance,
          whyCopy,
          helpAffordance,
        }) => ({
          probeId,
          familyId,
          domain: island.domain,
          workModeGlyph,
          returnState,
          tone,
          provenance,
          ...(includeAgeSpecificCopy ? { whyCopy } : {}),
          helpAffordance,
        }),
      ),
    )
    .sort((left, right) => left.probeId.localeCompare(right.probeId));

const domainState = (view: InterestLabView, includeAgeSpecificCopy: boolean) => ({
  probePicker: questState(view, includeAgeSpecificCopy),
  sceneMarkers: markerState(view, includeAgeSpecificCopy),
  coverage: view.guide.coverage,
  explanations: view.guide.explanations,
  timelineMarkers: view.guide.timeline.markers,
  lifecycle: view.guide.lifecycle,
  revisionHistory: view.guide.revisionHistory,
  constellationStars: view.guide.constellation.stars,
});

const structurallyEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) {
    return true;
  }
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") {
    return false;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => structurallyEqual(value, right[index]))
    );
  }

  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();

  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key, index) =>
        key === rightKeys[index] && structurallyEqual(leftRecord[key], rightRecord[key]),
    )
  );
};

export function plainViewEquals(left: InterestLabView, right: InterestLabView): boolean {
  const includeAgeSpecificCopy = left.flags.ageBand === right.flags.ageBand;

  return structurallyEqual(
    domainState(left, includeAgeSpecificCopy),
    domainState(right, includeAgeSpecificCopy),
  );
}
