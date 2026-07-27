import { useEffect } from "react";
import { gadgetsForTopic } from "../gadgets/registry";
import { useGame } from "../game/store";
import { sessionLog } from "../signals/session";
import CabinBackdrop from "./backdrop/CabinBackdrop";
import "./CabinView.css";

/**
 * Renders the open cabin, or nothing when none is open.
 *
 * ONE BACKEND, DECIDED 2026-07-26. `backdrop` — the generated still plate with clickable
 * perspective prop polygons — is the only path. `3d` (Cabin3D + scene3d/) and `static`
 * (CabinStatic + hotspots.ts) are PARKED on the LITS/Minesweeper precedent: still in the tree,
 * still compiled, still covered by their own tests, simply not rendered. Nothing was deleted.
 *
 * The old authored-quads fallback to `static` is gone with them, and it is not missed:
 * `quads.data.test.ts` already requires a topic's backdrop room to cover every gadget in that topic
 * exactly once, so the build is the reachability guard. The fallback was insuring against a failure
 * the test already prevents.
 *
 * TO REVERSE: re-import Cabin3D or CabinStatic here and branch on a backend again. Both components
 * and all their placements (`scene3d/anchors.ts`, `cabin/hotspots.ts`) were left in place on
 * purpose. Note that `backdrop` needs no WebGL — it is an <img> plus SVG polygons — so restoring
 * `static` as a "no-WebGL fallback" would be restoring it for a reason that no longer exists.
 */
export const CabinView: React.FC = () => {
  const cabinId = useGame((s) => s.cabinId);

  // Every gadget on the wall was on offer, so each one the child walked past is a decline against a
  // visible alternative. Recorded once per session — a re-render must not inflate availability.
  useEffect(() => {
    if (!cabinId) return;
    for (const gadget of gadgetsForTopic(cabinId)) {
      sessionLog.recordSurfaced(gadget.id);
    }
  }, [cabinId]);

  if (!cabinId) return null;

  return (
    <div className="cabin-view" data-backend="backdrop">
      <CabinBackdrop topic={cabinId} />
    </div>
  );
};

export default CabinView;
