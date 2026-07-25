import { useEffect } from "react";
import { gadgetsForTopic } from "../gadgets/registry";
import { useGame } from "../game/store";
import { sessionLog } from "../signals/session";
import Cabin3D from "./Cabin3D";
import CabinStatic from "./CabinStatic";
import "./CabinView.css";

/**
 * Picks the cabin backend (3D scene vs. static illustration) for the currently
 * open cabin, and exposes a small A/B toggle so either backend can be spot-checked
 * without leaving the screen. Renders nothing when no cabin is open.
 */
export const CabinView: React.FC = () => {
  const cabinId = useGame((s) => s.cabinId);
  const cabinBackend = useGame((s) => s.cabinBackend);

  // Every gadget on the wall was on offer, so each one the child walked past is
  // a decline against a visible alternative. Recorded once per session — the
  // backend A/B toggle re-renders this view and must not inflate availability.
  useEffect(() => {
    if (!cabinId) return;
    for (const gadget of gadgetsForTopic(cabinId)) {
      sessionLog.recordSurfaced(gadget.id);
    }
  }, [cabinId]);

  if (!cabinId) return null;

  const otherBackend = cabinBackend === "3d" ? "static" : "3d";

  return (
    <div className="cabin-view">
      <button
        type="button"
        className="cabin-view-ab-toggle"
        onClick={() => useGame.getState().setBackend(otherBackend)}
      >
        Mode: {cabinBackend}
      </button>
      {cabinBackend === "3d" ? <Cabin3D topic={cabinId} /> : <CabinStatic topic={cabinId} />}
    </div>
  );
};

export default CabinView;
