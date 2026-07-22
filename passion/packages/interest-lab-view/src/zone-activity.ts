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
