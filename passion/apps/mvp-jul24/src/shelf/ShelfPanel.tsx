/**
 * The shelf panel: the deck of explainer cards, open.
 *
 * WHAT IT IS AND IS NOT
 * It is a small in-world panel of pages, all of them available the moment it opens. It is not a
 * progress screen, a reward, or a reading list with anything crossed off — it holds no per-child state
 * at all, which is why this component takes a deck and a close handler and nothing else. Give it the
 * same deck twice and you get the same panel, whether the child has solved everything in the room or
 * walked in ten seconds ago.
 *
 * WHY EVERY CARD'S TITLE IS VISIBLE AT ONCE
 * "All of its contents available, no partial reveal" (PROJECT.md) is about the *offer*, not just the
 * access: a child cannot choose to go deeper into something they cannot see the shape of. So the
 * whole deck is listed, the invitation card is marked for what it is, and the selection only decides
 * which page is open.
 *
 * KEYBOARD
 * Escape closes, from anywhere in the panel. The panel itself takes focus when it opens so a keyboard
 * or screen-reader user lands inside it rather than continuing through the room behind it, and the
 * caller puts focus back on the shelf when it closes (see `CabinShelf`). The card list is ordinary
 * buttons rather than an ARIA tablist: a tablist promises arrow-key navigation and a specific focus
 * model, and buttons that keep their own focus are both simpler and honest about what they do.
 */

import { type JSX, useEffect, useRef, useState } from "react";
import type { TopicId } from "../game/types";
import { sessionLog } from "../signals/session";
import { ShelfDiagram } from "./diagrams";
import type { ShelfCard, ShelfDeck } from "./types";
import "./shelf.css";

export function ShelfPanel({
  deck,
  onClose,
}: {
  deck: ShelfDeck;
  onClose: () => void;
}): JSX.Element {
  // The first card, always — not "the last one read" and not "the one matching the last gadget
  // opened". Both would make the panel's contents a function of what the child has already done,
  // which is the thing this shelf exists to avoid being.
  const [openId, setOpenId] = useState(deck.cards[0]?.id ?? "");
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * Keep the page still when a control inside the panel is clicked.
   *
   * A mouse click focuses the button natively, and native focus carries an implicit scroll-into-view
   * that walks every scrollable ancestor. The cabin frame is no longer one of them (it was, and the
   * result was the whole painted room sliding 68px — see the `overflow: clip` note in
   * CabinBackdrop.css), but `.app-body` still scrolls, and in a short window this panel is the tallest
   * focusable thing in the app: without this, clicking a card title can scroll the entire app under
   * the child's cursor.
   *
   * `preventDefault` on mousedown suppresses only the implicit focus; focus is then set explicitly, so
   * the button still ends up focused — a click and a Tab leave the same element active — and only the
   * scroll is dropped. Bound on the scrim in the capture phase so one handler covers every control the
   * panel has now or grows later, and scoped to real controls so selecting the card's text still works.
   */
  const focusWithoutMovingThePage = (event: React.MouseEvent) => {
    const control = (event.target as HTMLElement | null)?.closest?.("button, a[href]");
    if (!(control instanceof HTMLElement)) return;
    event.preventDefault();
    control.focus({ preventScroll: true });
  };

  useEffect(() => {
    // `preventScroll` for the same reason as `focusWithoutMovingThePage` above: a bare `focus()` asks the
    // browser to scroll every scrollable ancestor until this panel is fully in view, and `.app-body` is
    // one. In a short window the panel is taller than the space it has, so that scroll is guaranteed —
    // the app would jump the moment the shelf opened. jsdom cannot see any of this: it has no layout, so
    // every assertion about this panel passed while the real thing lurched. It took a browser.
    panelRef.current?.focus({ preventScroll: true });
  }, []);

  // On the document rather than the panel, so Escape works even if focus has wandered out of it (a
  // click on the scrim, say). Removed on unmount, so no listener outlives the open panel.
  //
  // Tab is handled here too, and it is what makes `aria-modal="true"` below true rather than a claim:
  // that attribute tells assistive technology the rest of the page is inert, so tabbing out of the
  // panel into the room's prop hotspots would be a lie about the state of the app. Cycling within the
  // panel is the smallest honest way to keep the promise — a child who tabs past the last card comes
  // back to the heading rather than landing on a chess set they cannot see.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const stops = [...panel.querySelectorAll<HTMLElement>("button, [href], [tabindex='0']")];
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      // The panel itself holds focus on open (tabindex -1, so it is not one of the stops); from there
      // a forward Tab should reach the first control and a backward Tab the last.
      if (!event.shiftKey && (active === last || active === panel)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const open = deck.cards.find((card) => card.id === openId) ?? deck.cards[0];

  return (
    <div
      className="shelf-scrim"
      data-topic={deck.topic}
      onMouseDownCapture={focusWithoutMovingThePage}
    >
      {/* Click-anywhere-outside, which is what a child with a mouse expects, expressed as the control
          it actually is rather than as a click handler on a div. Out of the tab order because Escape
          and the visible Close button are the announced routes and a full-frame button at the top of
          the tab order would be a trap; named anyway, so it is not a mystery to anything that does
          reach it. */}
      <button
        type="button"
        className="shelf-scrim-close"
        tabIndex={-1}
        aria-label="Close the bookshelf"
        onClick={onClose}
      />
      <div
        className="shelf-panel"
        // biome-ignore lint/a11y/useSemanticElements: the rule wants <dialog>, and <dialog> cannot be
        // an in-world panel. `showModal()` promotes the element to the browser's top layer, which
        // renders relative to the viewport and therefore escapes both the cabin's stacking context and
        // the parallax transform the painting rides — the panel would detach from the room it is
        // supposed to be standing in. `<dialog open>` (non-modal) stays in flow but then the modal
        // semantics would have to be faked anyway. So the ARIA contract is supplied by hand instead:
        // role, aria-modal, a heading that names it, focus on open, Escape to close, and the Tab cycle
        // above that makes aria-modal true.
        role="dialog"
        aria-modal="true"
        aria-labelledby="shelf-panel-title"
        tabIndex={-1}
        ref={panelRef}
      >
        <header className="shelf-panel-head">
          <div>
            <h2 className="shelf-panel-title" id="shelf-panel-title">
              {deck.title}
            </h2>
            <p className="shelf-panel-intro">{deck.intro}</p>
          </div>
          <button type="button" className="shelf-panel-close" onClick={onClose}>
            Close
          </button>
        </header>

        {/* Titles down the side and the open page beside them — a column of spines, and it is also
            what makes a card fit: the panel lives inside the cabin frame, which is wide and not very
            tall, so stacking the list above the page spent vertical space the page needed and put
            every paragraph on ~72 characters instead of ~90. Collapses to one column when the frame
            is genuinely narrow. */}
        <div className="shelf-panel-body">
          <nav className="shelf-panel-list" aria-label="Pages on this shelf">
            {deck.cards.map((card) => (
              <button
                key={card.id}
                type="button"
                className="shelf-panel-tab"
                data-open={card.id === open?.id}
                data-kind={card.kind}
                aria-current={card.id === open?.id}
                onClick={() => setOpenId(card.id)}
              >
                <span className="shelf-panel-tab-title">{card.title}</span>
                {card.kind === "invitation" ? (
                  <span className="shelf-panel-tab-tag">the whole field</span>
                ) : null}
              </button>
            ))}
          </nav>

          {open ? <ShelfCardPage card={open} topic={deck.topic} /> : null}
        </div>
      </div>
    </div>
  );
}

function ShelfCardPage({ card, topic }: { card: ShelfCard; topic: TopicId }): JSX.Element {
  return (
    <article className="shelf-card" data-card={card.id} data-kind={card.kind}>
      <h3 className="shelf-card-title">{card.title}</h3>
      <p className="shelf-card-para">{card.body[0]}</p>
      {card.diagram ? <ShelfDiagram id={card.diagram} /> : null}
      <p className="shelf-card-para">{card.body[1]}</p>
      <footer className="shelf-card-source">
        {/* The source is named whether or not it is linked, and the name comes first: a card has to
            still cite something when the link is absent or the network is. `rel` is set because the
            link leaves the app, and it opens in a new tab so a child is never navigated out of the
            cabin they are standing in. */}
        {card.source.url ? (
          <a
            href={card.source.url}
            target="_blank"
            rel="noreferrer noopener"
            // The child is leaving to learn, which is the one act on this shelf worth recording.
            // Attributed to the card's subject, never the shelf: an activity card is about its
            // gadget, the invitation is about the whole cabin, and that difference is the point.
            onClick={() => sessionLog.recordSourceFollow(card.gadgetId ?? topic)}
          >
            {card.source.label}
          </a>
        ) : (
          <span>{card.source.label}</span>
        )}
      </footer>
    </article>
  );
}

export default ShelfPanel;
