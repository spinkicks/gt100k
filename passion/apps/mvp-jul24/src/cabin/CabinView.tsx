import { useEffect } from "react";
import { gadgetsForTopic } from "../gadgets/registry";
import { useGame } from "../game/store";
import { sessionLog } from "../signals/session";
import Cabin3D from "./Cabin3D";
import CabinStatic from "./CabinStatic";
import CabinBackdrop from "./backdrop/CabinBackdrop";
import { backdropRoomFor } from "./backdrop/quads.data";
import "./CabinView.css";

/**
 * Picks the cabin backend for the currently open cabin. Renders nothing when no cabin is open.
 *
 * `backdrop` — the still generated painting — is what a player sees by default; `?cabin=3d` and
 * `?cabin=static` select the others (see game/store.ts's `initialBackend` for why). The on-screen
 * "Mode: 3d" A/B toggle that used to live here is gone — it read as a debug badge in the corner of an
 * otherwise finished room. `setBackend` is still on the store for tests and any future non-debug
 * switch.
 *
 * ONE FALLBACK, AND WHY IT EXISTS. `backdrop` can only render props for a topic whose prop quads
 * have been traced onto its painting, and only `logic-games` has been authored so far. Without this
 * fallback, making `backdrop` the default silently stranded the `math` cabin: the room came up, the
 * plate looked right, and all five of its activities were simply unreachable — a failure that looks
 * exactly like a finished room. So a topic with no authored backdrop room falls back to `static`,
 * which positions unknown gadgets from `cabin/hotspots.ts` and therefore always leaves them
 * clickable. Authoring `math`'s quads removes the fallback for it; until then, reachable beats
 * pretty.
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

  // See the fallback note above: backdrop without authored quads would render an unreachable room.
  const effective =
    cabinBackend === "backdrop" && backdropRoomFor(cabinId) === undefined ? "static" : cabinBackend;

  return (
    <div className="cabin-view" data-backend={effective}>
      {effective === "3d" ? <Cabin3D topic={cabinId} /> : null}
      {effective === "static" ? <CabinStatic topic={cabinId} /> : null}
      {effective === "backdrop" ? <CabinBackdrop topic={cabinId} /> : null}
    </div>
  );
};

export default CabinView;
