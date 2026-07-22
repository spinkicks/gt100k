import type { ActivityKind, Domain, Probe, WorkMode } from "@gt100k/interest-lab";
import type { ZoneId } from "./curiosity-map";

export interface ZoneActionModel {
  actionId: string;
  probeId: string;
  domain: Domain;
  workMode: WorkMode;
  kind: ActivityKind;
  label: string;
  primary: boolean;
}

export interface ZoneActivityModel {
  zoneId: ZoneId;
  domain: Domain;
  actions: ZoneActionModel[];
}

export interface ZoneActivityManifest {
  id: ZoneId;
  domain: Domain;
  probes: readonly Probe[];
  actions?: readonly ZoneActionModel[];
}

const compareActionIds = (a: ZoneActionModel, b: ZoneActionModel): number => {
  if (a.actionId < b.actionId) {
    return -1;
  }
  if (a.actionId > b.actionId) {
    return 1;
  }
  return 0;
};

const labelFor = (workMode: WorkMode): string =>
  workMode.charAt(0).toUpperCase() + workMode.slice(1);

const copyActions = (actions: readonly ZoneActionModel[]): ZoneActionModel[] =>
  actions.map((action) => ({ ...action })).sort(compareActionIds);

export function buildZoneActivityModel(manifest: ZoneActivityManifest): ZoneActivityModel {
  const actions =
    manifest.actions === undefined
      ? manifest.probes
          .map((probe) => ({
            actionId: probe.id,
            probeId: probe.id,
            domain: manifest.domain,
            workMode: probe.workMode,
            kind: "artifact" as const,
            label: labelFor(probe.workMode),
            primary: false,
          }))
          .sort(compareActionIds)
          .map((action, index) => ({ ...action, primary: index === 0 }))
      : copyActions(manifest.actions);

  return {
    zoneId: manifest.id,
    domain: manifest.domain,
    actions,
  };
}

export function plainZoneEquals(a: ZoneActivityModel, b: ZoneActivityModel): boolean {
  if (a.zoneId !== b.zoneId || a.domain !== b.domain || a.actions.length !== b.actions.length) {
    return false;
  }

  const aActions = copyActions(a.actions);
  const bActions = copyActions(b.actions);
  return aActions.every((action, index) => {
    const other = bActions[index];
    return (
      other !== undefined &&
      action.actionId === other.actionId &&
      action.probeId === other.probeId &&
      action.domain === other.domain &&
      action.workMode === other.workMode &&
      action.kind === other.kind &&
      action.label === other.label &&
      action.primary === other.primary
    );
  });
}
