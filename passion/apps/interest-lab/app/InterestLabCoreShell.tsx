"use client";

import {
  type ActivityEvent,
  buildLab,
  buildReturnGrid,
  buildRevisableHypothesis,
} from "@gt100k/interest-lab";
import {
  INITIAL_ZONE_HOST_STATE,
  type RenderTier,
  type ZoneId,
  buildCuriosityMapView,
  buildQaSnapshot,
  buildZoneActivityModel,
  zoneHostReducer,
} from "@gt100k/interest-lab-view";
import {
  CanvasHost,
  CuriosityMap,
  V1_DOMAIN_ORDER,
  ZONE_LAB_CONFIG_V1,
  type ZonePresentationTier,
} from "@gt100k/interest-zone-kit";
import { useCallback, useMemo, useReducer, useState } from "react";
import { InterestLabQaBridge } from "./InterestLabQaBridge";
import { ZONE_REGISTRY } from "./zones";

const CORE_LAB = buildLab(
  "synthetic-interest-lab-core",
  ZONE_REGISTRY.catalog(),
  { metPrereqs: [], engagedDomains: [] },
  ZONE_LAB_CONFIG_V1,
);

const OFFERED_CELLS = CORE_LAB.offers.map(({ domain, workMode }) => ({ domain, workMode }));

const roomTierFor = (tier: RenderTier): ZonePresentationTier => {
  if (tier === "quest-world-3d") {
    return "room-3d";
  }
  if (tier === "quest-world-3d-lite") {
    return "room-3d-lite";
  }
  return "board-2d";
};

export interface InterestLabCoreShellProps {
  renderTier: RenderTier;
  reducedMotion: boolean;
  onPerformanceDecline?: () => void;
}

export function InterestLabCoreShell({
  renderTier,
  reducedMotion,
  onPerformanceDecline,
}: InterestLabCoreShellProps) {
  const [host, dispatch] = useReducer(zoneHostReducer, INITIAL_ZONE_HOST_STATE);
  const [activityLog, setActivityLog] = useState<readonly ActivityEvent[]>([]);
  const derived = useMemo(() => {
    const grid = buildReturnGrid(activityLog, { domainOrder: V1_DOMAIN_ORDER });
    return {
      grid,
      map: buildCuriosityMapView(ZONE_REGISTRY.manifests, activityLog, {
        domainOrder: V1_DOMAIN_ORDER,
      }),
      hypothesis: buildRevisableHypothesis(grid, CORE_LAB.coverage, OFFERED_CELLS),
    };
  }, [activityLog]);
  const activeActions =
    host.activeZoneId === null
      ? []
      : buildZoneActivityModel(ZONE_REGISTRY.byId(host.activeZoneId)).actions;
  const interactives = [
    ...derived.map.buildings.map(({ zoneId, label, domain }) => ({
      id: `map:${zoneId}`,
      kind: "map-building" as const,
      label,
      domain,
    })),
    {
      id: "control:time-lapse",
      kind: "map-control" as const,
      label: "Time-lapse",
    },
    ...activeActions.map(({ actionId, label, domain, workMode }) => ({
      id: `action:${actionId}`,
      kind: "activity-action" as const,
      label,
      domain,
      workMode,
    })),
  ];
  const qa = buildQaSnapshot({ ready: true, host, ...derived, interactives });
  const enterZone = useCallback((zoneId: ZoneId) => dispatch({ type: "enter", zoneId }), []);
  const setDayOffset = useCallback(
    (dayOffset: number) => dispatch({ type: "set-day", dayOffset }),
    [],
  );
  const exitZone = useCallback(() => dispatch({ type: "exit" }), []);
  const appendActivity = useCallback(
    (event: ActivityEvent) => setActivityLog((current) => [...current, event]),
    [],
  );

  return (
    <section aria-label="Interest Lab shared core" data-interest-lab-core="true">
      <InterestLabQaBridge qa={qa} />
      <CuriosityMap
        view={derived.map}
        activeZoneId={host.activeZoneId}
        dayOffset={host.dayOffset}
        onEnterZone={enterZone}
        onSetDayOffset={setDayOffset}
      />
      {host.activeZoneId === null ? null : (
        <button type="button" onClick={exitZone}>
          Return to the map
        </button>
      )}
      <CanvasHost
        activeZoneId={host.activeZoneId}
        registry={ZONE_REGISTRY}
        emit={appendActivity}
        dayOffset={host.dayOffset}
        tier={roomTierFor(renderTier)}
        reducedMotion={reducedMotion}
        onPerformanceDecline={onPerformanceDecline}
      />
    </section>
  );
}
