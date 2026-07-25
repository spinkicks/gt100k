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
          disabled={!cabin.active}
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
            <span className="map-screen-node-badge">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h1Zm2 0h6V8a3 3 0 0 0-6 0v2Z"
                  fill="currentColor"
                />
              </svg>
              soon
            </span>
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default MapScreen;
