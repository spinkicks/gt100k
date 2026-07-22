import type { ActivityEvent } from "@gt100k/interest-lab";
import { type ZoneId, buildZoneActivityModel } from "@gt100k/interest-lab-view";
import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { RoomProps } from "./contracts";
import type { ZoneRegistry } from "./registry";

export type ZonePresentationTier = RoomProps["tier"] | "board-2d";

export interface ZoneRoomProps {
  activeZoneId: ZoneId | null;
  registry: ZoneRegistry;
  emit: (event: ActivityEvent) => void;
  dayOffset: number;
  tier: ZonePresentationTier;
  reducedMotion: boolean;
}

export interface CanvasHostProps extends ZoneRoomProps {
  onPerformanceDecline?: () => void;
}

const roomProps = (props: ZoneRoomProps, tier: RoomProps["tier"]): RoomProps => {
  const plugin = props.registry.byId(props.activeZoneId!);
  return {
    emit: props.emit,
    probes: plugin.probes,
    actions: buildZoneActivityModel(plugin).actions,
    dayOffset: props.dayOffset,
    tier,
    reducedMotion: props.reducedMotion,
  };
};

export function ZoneRoom(props: ZoneRoomProps) {
  if (props.activeZoneId === null || props.tier === "board-2d") {
    return null;
  }

  const Room3D = props.registry.byId(props.activeZoneId).Room3D;
  return <Room3D {...roomProps(props, props.tier)} />;
}

export function CanvasHost(props: CanvasHostProps) {
  const activePlugin = props.activeZoneId === null ? null : props.registry.byId(props.activeZoneId);
  const ActivityDOM = activePlugin?.ActivityDOM;

  return (
    <div data-canvas-host="true">
      <Canvas aria-hidden="true" camera={{ position: [0, 0, 5], fov: 50 }} frameloop="demand">
        <AdaptiveDpr />
        <PerformanceMonitor onDecline={props.onPerformanceDecline} />
        <ZoneRoom {...props} />
      </Canvas>
      {props.tier === "board-2d" && ActivityDOM !== undefined ? (
        <ActivityDOM {...roomProps(props, "room-3d-lite")} />
      ) : null}
    </div>
  );
}
