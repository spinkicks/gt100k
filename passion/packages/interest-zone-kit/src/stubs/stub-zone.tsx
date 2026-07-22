import type { ActivityEvent, Probe } from "@gt100k/interest-lab";
import type { MapBuildingView, ZoneActionModel, ZoneId } from "@gt100k/interest-lab-view";
import type {} from "@react-three/fiber";
import type { RoomProps, ZonePlugin } from "../contracts";

const eventFor = (action: ZoneActionModel, zoneId: ZoneId, dayOffset: number): ActivityEvent => ({
  zoneId,
  probeId: action.probeId,
  domain: action.domain,
  workMode: action.workMode,
  action: action.actionId,
  kind: action.kind,
  dayOffset,
});

function createRoom3D(zoneId: ZoneId) {
  return function StubRoom3D({ actions, dayOffset, emit }: RoomProps) {
    return (
      <group name={`${zoneId}-stub-room`}>
        {actions.map((action, index) => (
          // biome-ignore lint/a11y/useKeyWithClickEvents: The WebGL mesh mirrors an operable DOM button.
          <mesh
            key={action.actionId}
            name={action.label}
            position={[index * 1.5 - 1.5, 0, 0]}
            userData={{ action }}
            onClick={() => emit(eventFor(action, zoneId, dayOffset))}
          >
            <boxGeometry args={[1, 1, 0.2]} />
            <meshBasicMaterial />
          </mesh>
        ))}
      </group>
    );
  };
}

function createActivityDOM(zoneId: ZoneId) {
  return function StubActivityDOM({ actions, dayOffset, emit }: RoomProps) {
    return (
      <fieldset aria-label={`${zoneId} activities`}>
        {actions.map((action) => (
          <button
            key={action.actionId}
            type="button"
            data-action-id={action.actionId}
            data-domain={action.domain}
            data-kind={action.kind}
            data-primary={action.primary}
            data-probe-id={action.probeId}
            data-work-mode={action.workMode}
            onClick={() => emit(eventFor(action, zoneId, dayOffset))}
          >
            {action.label}
          </button>
        ))}
      </fieldset>
    );
  };
}

export function createStubZone(input: {
  id: ZoneId;
  domain: string;
  mapBuilding: MapBuildingView;
  probes: readonly Probe[];
}): ZonePlugin {
  return {
    ...input,
    Room3D: createRoom3D(input.id),
    ActivityDOM: createActivityDOM(input.id),
  };
}
