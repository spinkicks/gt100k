import { useEffect } from "react";
import { gadgetsForTopic } from "../gadgets/registry";
import { useGame } from "../game/store";
import { sessionLog } from "../signals/session";
import Cabin3D from "./Cabin3D";
import CabinStatic from "./CabinStatic";
import CabinBackdrop from "./backdrop/CabinBackdrop";
import "./CabinView.css";

/**
 * Picks the cabin backend for the currently open cabin. Renders nothing when no cabin is open.
 *
 * 3D is the only backend a player sees; `static` is a no-WebGL / headless-screenshot fallback and
 * `backdrop` is the still-painting direction under review, both selected by `?cabin=<name>` at load
 * (see game/store.ts's `initialBackend`). The on-screen "Mode: 3d" A/B toggle that used to live here
 * is gone — it read as a debug badge in the corner of an otherwise finished room. `setBackend` is
 * still on the store for tests and for any future non-debug switch.
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

  return (
    <div className="cabin-view">
      {cabinBackend === "3d" ? <Cabin3D topic={cabinId} /> : null}
      {cabinBackend === "static" ? <CabinStatic topic={cabinId} /> : null}
      {cabinBackend === "backdrop" ? <CabinBackdrop topic={cabinId} /> : null}
    </div>
  );
};

export default CabinView;
