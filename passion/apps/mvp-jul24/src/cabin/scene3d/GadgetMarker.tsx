import { Html } from "@react-three/drei";
import { useGame } from "../../game/store";
import type { GadgetAnchor } from "./anchors";
import "./GadgetMarker.css";

/** A glowing "+" hotspot rendered in-scene via drei's <Html>, anchored at a gadget's 3D position. */
export function GadgetMarker({ anchor }: { anchor: GadgetAnchor }): JSX.Element {
  const isComingSoon = anchor.status === "coming-soon";

  return (
    <Html
      position={anchor.position}
      center
      distanceFactor={6}
      zIndexRange={[10, 0]}
      occlude={false}
    >
      <button
        type="button"
        className={`cabin3d-marker${isComingSoon ? " coming-soon" : ""}`}
        data-gadget={anchor.id}
        aria-label={anchor.label}
        disabled={isComingSoon}
        onClick={() => {
          if (!isComingSoon) useGame.getState().focusGadget(anchor.id);
        }}
      >
        <span className="cabin3d-marker-plus" aria-hidden="true">
          +
        </span>
        <span className="cabin3d-marker-label">{anchor.label}</span>
      </button>
    </Html>
  );
}
