import { gadgetsForTopic } from "../gadgets/registry";
import { useGame } from "../game/store";
import type { TopicId } from "../game/types";
import GadgetObject from "./GadgetObject";
import { staticHotspotStyle } from "./hotspots";
import "./CabinStatic.css";

/**
 * Static-image cabin backend: a background cabin illustration with little
 * illustrated puzzle-objects layered on top at each gadget's position. Each
 * object *is* the button — click the chess set to open chess, the grid board
 * to open the nonogram, etc. The label appears as a tooltip on hover/focus.
 * The image is decorative — if `/art/cabin-${topic}.png` 404s, the container's
 * fallback background keeps the scene intentional and never blocks the objects.
 *
 * A topic with no gadgets is a supported, non-degenerate state, not an error: `math` currently has
 * zero (see src/gadgets/registry.ts) because its games land in a later PR. The map deliberately lets
 * a player walk into it, and what they get is the painted room with nothing to click — so this
 * component must never assume the list is non-empty. It doesn't: `gadgets.map` over `[]` just leaves
 * the backdrop and hearthlight standing.
 */
export const CabinStatic: React.FC<{ topic: TopicId }> = ({ topic }) => {
  const gadgets = gadgetsForTopic(topic);

  return (
    <div className="cabin-static">
      <img className="cabin-static-bg" src={`/art/cabin-${topic}.png`} alt="" aria-hidden="true" />
      <div className="cabin-static-hearthlight" aria-hidden="true" />
      {gadgets.map((gadget) => {
        const isComingSoon = gadget.status === "coming-soon";
        return (
          <button
            key={gadget.id}
            type="button"
            className={`cabin-static-hotspot${isComingSoon ? " coming-soon" : ""}`}
            style={staticHotspotStyle(gadget)}
            data-gadget={gadget.id}
            onClick={() => useGame.getState().focusGadget(gadget.id)}
          >
            <span className="cabin-static-hotspot-object">
              <GadgetObject id={gadget.id} />
              {isComingSoon ? (
                <span className="cabin-static-hotspot-lock" aria-hidden="true">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                      d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h1Zm2 0h6V8a3 3 0 0 0-6 0v2Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
              ) : null}
            </span>
            <span className="cabin-static-hotspot-label">{gadget.hotspot.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CabinStatic;
