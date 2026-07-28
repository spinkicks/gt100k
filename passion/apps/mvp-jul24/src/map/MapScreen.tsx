import { motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { useGame } from "../game/store";
import { sessionLog } from "../signals/session";
import { CABINS } from "./cabins.data";
import "./MapScreen.css";

/**
 * Painterly world map: a background illustration framed like a page in a
 * storybook, with absolutely-positioned cabin node signposts layered on top.
 * The image itself is decorative — if the plate 404s, the container's
 * fallback background keeps the scene looking intentional and never blocks the
 * node layer.
 *
 * WHICH PLATE, AND WHY BOTH ARE STILL ON DISK. `map-v2.png` paints THREE equally-lit near cabins;
 * `map.png` paints two, with `music` small and mist-washed on the horizon. The swap happened when
 * `music` became playable, because promoting a cabin while leaving it distant and unlit would bias
 * topic choice by paint — the Javora confound, and topic choice is this app's primary signal (see
 * cabins.data.ts, which carries the argument and the re-measured node coordinates).
 *
 * `map.png` is deliberately NOT overwritten or deleted. #215 committed the candidate to its own file
 * precisely because generated art can come back worse, and the older plate is the more atmospheric
 * painting — so this is one `src` and five coordinate pairs to revert, not an archaeology exercise.
 * If the v2 composition is rejected, change this line back and restore the coordinates from
 * cabins.data.ts's own record of what they were.
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
  // `position` is reading order among the cabins that were actually on offer: top to bottom, then
  // left to right. It is recorded and nothing reads it yet, which is the point — the size of a
  // position effect can only be measured in this surface with these children, and a position not
  // captured at surfacing time cannot be recovered afterwards.
  //
  // Read it as a convention rather than as a measured order of attention. On a painted landscape the
  // thing that actually pulls a young child's eye is salience, and memo 07 §2.3 puts motion at the
  // top of that list: the two enterable cabins glow and breathe while the rest sit mist-washed on
  // the horizon, so their pull has more to do with that than with where they sit in a scan. What
  // this number can honestly support is a left-versus-right comparison between the two, which is a
  // real bias and a cheap one to check for.
  useEffect(() => {
    const offered = CABINS.filter((c) => c.active)
      .slice()
      .sort((a, b) => (a.yPct !== b.yPct ? a.yPct - b.yPct : a.xPct - b.xPct));
    offered.forEach((cabin, position) => sessionLog.recordSurfaced(cabin.id, position));
  }, []);

  return (
    <div className="map-screen">
      <img className="map-screen-bg" src="/art/map-v2.png" alt="" aria-hidden="true" />
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
