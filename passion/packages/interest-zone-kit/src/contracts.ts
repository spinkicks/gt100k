import type { ActivityEvent, Domain, Probe } from "@gt100k/interest-lab";
import type { MapBuildingView, ZoneActionModel, ZoneId } from "@gt100k/interest-lab-view";
import type { FC } from "react";

export type ActivityEmit = (event: ActivityEvent) => void;

export interface RoomProps {
  emit: ActivityEmit;
  probes: readonly Probe[];
  actions: readonly ZoneActionModel[];
  dayOffset: number;
  tier: "room-3d" | "room-3d-lite";
  reducedMotion: boolean;
}

/** The complete, self-contained definition of one discovery zone. */
export interface ZonePlugin {
  id: ZoneId;
  domain: Domain;
  mapBuilding: MapBuildingView;
  Room3D: FC<RoomProps>;
  ActivityDOM: FC<RoomProps>;
  probes: readonly Probe[];
}
