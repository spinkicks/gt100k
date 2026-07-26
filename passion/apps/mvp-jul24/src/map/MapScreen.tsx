import { motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { useGame } from "../game/store";
import { sessionLog } from "../signals/session";
import { CABINS } from "./cabins.data";
import "./MapScreen.css";

/**
 * Painterly world map: a background illustration framed like a page in a
 * storybook, with absolutely-positioned cabin node signposts layered on top.
 * The image itself is decorative — if `/art/map.png` 404s, the container's
 * fallback background keeps the scene looking intentional and never blocks the
 * node layer.
 *
 * Not-yet-built cabins stay on the map as legible "coming soon" signposts (see cabins.data.ts).
 * They use `aria-disabled` rather than the `disabled` attribute so they remain tabbable and
 * discoverable — a real `disabled` button is skipped by keyboard navigation and often skimmed over
 * by screen readers, which would hide the very thing the node exists to announce. The trade-off is
 * that `aria-disabled` doesn't block activation, so the click handler has to guard on `active`
 * itself (it already did) and the browser default of firing on Enter/Space is harmless because that
 * handler is a no-op.
 */
export const MapScreen: React.FC = () => {
  const reduce = useReducedMotion();

  // Availability is what makes a decline readable: a cabin the child could have
  // entered and didn't is evidence; a locked one is not. So only enterable
  // cabins are surfaced.
  useEffect(() => {
    for (const cabin of CABINS) {
      if (cabin.active) sessionLog.recordSurfaced(cabin.id);
    }
  }, []);

  return (
    <div className="map-screen">
      <img className="map-screen-bg" src="/art/map.png" alt="" aria-hidden="true" />
      <div className="map-screen-vignette" aria-hidden="true" />
      {CABINS.map((cabin, i) => (
        <motion.button
          key={cabin.id}
          type="button"
          className={`map-screen-node${cabin.active ? "" : " inactive"}`}
          style={{ left: `${cabin.xPct}%`, top: `${cabin.yPct}%` }}
          data-cabin={cabin.id}
          aria-disabled={cabin.active ? undefined : true}
          aria-label={cabin.active ? undefined : `${cabin.label} — coming soon`}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: "-50%", y: "-30%" }}
          animate={{ opacity: 1, x: "-50%", y: "-50%" }}
          transition={{ delay: 0.12 + i * 0.08, duration: 0.45, ease: [0.22, 0.7, 0.3, 1] }}
          whileHover={cabin.active ? { scale: 1.06, y: "-54%" } : undefined}
          whileTap={cabin.active ? { scale: 0.98, y: "-50%" } : undefined}
          onClick={() => {
            if (cabin.active) useGame.getState().openCabin(cabin.id);
          }}
        >
          <span className="map-screen-node-label">{cabin.label}</span>
          {cabin.active ? (
            <span className="map-screen-node-spark" aria-hidden="true" />
          ) : (
            /* Plain wording, no padlock: these cabins aren't locked behind anything a player could
               do, they just don't exist yet. The button's aria-label already carries the same words,
               so this badge is redundant to a screen reader and stays out of the accessible name. */
            <span className="map-screen-node-badge">Coming soon</span>
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default MapScreen;
