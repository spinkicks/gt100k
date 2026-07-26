/**
 * The bookshelf in a cabin: one clickable polygon over the painted shelf, and the panel it opens.
 *
 * OPEN FROM THE MOMENT THE CHILD WALKS IN
 * There is no precondition anywhere in this file. Nothing here reads `useInterest`, `solves`,
 * `focusedGadgetId` or any other record of what has been done — the shelf is a piece of furniture in
 * a room, and it behaves like one. `CabinShelf.test.tsx` asserts that structurally, by reading this
 * directory's own source, because "we did not gate it" is much easier to state in a comment than to
 * keep true through six months of edits (PROJECT.md, "Depth and unlocking: nothing is gated" — the
 * argument is about not laundering an ability measure into a depth measure, so it is worth a test).
 *
 * WHY THIS RENDERS ITS OWN SVG LAYER INSTEAD OF ADDING A PROP TO THE HOTSPOT OVERLAY
 * Two reasons, one structural and one about interaction. Structurally the shelf is not gadget-backed
 * (see `ShelfProp` in cabin/backdrop/types.ts), and `PropHotspot` exists to call `focusGadget` with a
 * `gadgetId`; opening a reading panel is a different action, so it gets a different control rather
 * than a flag threaded through the shared one. Interactively, this layer has to sit ABOVE the hotspot
 * overlay so the open panel is not underneath the room's other hit polygons, which document order
 * gives for free.
 *
 * IT MUST BE MOUNTED INSIDE `.cabin-backdrop-parallax`, and that is not a preference either: the
 * viewBox trick that keeps the polygon on the painted shelf at every window size (see fit.ts) is only
 * half the job — the other half is that the painting itself is moved a few pixels by the cursor
 * parallax, and anything that does not ride the same transform drifts off the object it points at as
 * soon as the cursor moves. Mounted anywhere else, this polygon would be right until touched.
 */

import { type JSX, type KeyboardEvent, useRef, useState } from "react";
import { svgPreserveAspectRatio } from "../cabin/backdrop/fit";
import type { FitMode } from "../cabin/backdrop/fit";
import { toSvgPoints } from "../cabin/backdrop/geometry";
import type { ShelfProp } from "../cabin/backdrop/types";
import type { TopicId } from "../game/types";
import { shelfDeckFor } from "./cards.data";
import ShelfPanel from "./ShelfPanel";
import "./shelf.css";

export function CabinShelf({
  topic,
  shelf,
  artWidth,
  artHeight,
  fitMode,
}: {
  topic: TopicId;
  shelf: ShelfProp;
  artWidth: number;
  artHeight: number;
  /** The backdrop's fit rule. Passed in so this layer and the painting can never disagree. */
  fitMode: FitMode;
}): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const hitRef = useRef<SVGPolygonElement>(null);
  const deck = shelfDeckFor(topic);

  // A painted shelf with nothing written for it renders no hotspot at all. An empty panel would be
  // worse than no shelf: it teaches that the door leads nowhere, which is the opposite of the point.
  if (!deck || deck.cards.length === 0) return null;

  const points = toSvgPoints(shelf.outline);
  const activate = () => setOpen(true);
  const onKeyDown = (event: KeyboardEvent<SVGPolygonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    activate();
  };

  return (
    <>
      <svg
        className="shelf-hotspot-layer"
        viewBox={`0 0 ${artWidth} ${artHeight}`}
        preserveAspectRatio={svgPreserveAspectRatio(fitMode)}
      >
        <title>The bookshelf in this room</title>
        <g className="shelf-hotspot">
          <polygon
            className="shelf-hit"
            points={points}
            ref={hitRef}
            // biome-ignore lint/a11y/useSemanticElements: same reason as `PropHotspot` — the control
            // has to BE the polygon, because a <button> cannot be a perspective silhouette, and a
            // rectangle over this shelf would cover the fireplace stone beside it. The ARIA contract
            // is supplied by hand: role, tabindex, name, popup hint and Enter/Space activation.
            role="button"
            tabIndex={0}
            aria-label={shelf.label}
            aria-haspopup="dialog"
            aria-expanded={open}
            data-shelf={topic}
            onClick={activate}
            onKeyDown={onKeyDown}
          >
            {/* Native tooltip, identical to the accessible name — `aria-label` wins for the name, so
                the two can never announce different things. */}
            <title>{shelf.label}</title>
          </polygon>
          <polygon className="shelf-halo" points={points} />
          <polygon className="shelf-trace" points={points} />
        </g>
      </svg>

      {open ? (
        <ShelfPanel
          deck={deck}
          onClose={() => {
            setOpen(false);
            // Focus goes back where it came from. Without this, closing with Escape or the Close
            // button drops a keyboard user at the top of the document and they have to tab through
            // the whole room to find the shelf again. `preventScroll` for the same reason as in
            // `ShelfPanel` — the frame clips a scaled art layer, so it has scrollable overflow that a
            // focus-driven scroll-into-view will happily expose, sliding the whole room.
            hitRef.current?.focus({ preventScroll: true });
          }}
        />
      ) : null}
    </>
  );
}

export default CabinShelf;
