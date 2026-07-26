/**
 * The shape of a cabin bookshelf's contents. Types only — the writing lives in `cards.data.ts`, the
 * shelf's polygon lives in `cabin/backdrop/quads.data.ts` with every other coordinate in this app,
 * and the diagrams live in `diagrams.tsx`.
 *
 * NOTHING HERE HAS A LOCK, A PREREQUISITE, OR A COMPLETION FIELD, AND THAT IS THE DESIGN
 * PROJECT.md, "Depth and unlocking: nothing is gated": the shelf is openable from the moment a child
 * walks in, with all of its contents available. The reasoning is not squeamishness about difficulty.
 * Gating depth on completion would make "went deeper" a deterministic function of "solved it", and
 * `solves` indexes *prior ability* (r = .37-.44 against pre-test, null against learning gain), so a
 * gate would launder an ability measure into a depth measure and the two would be the same variable
 * in the data. Leaving the door always open is what makes *who walks through it* real information.
 *
 * So there is deliberately no `unlockedBy`, no `requiresSolve`, no `revealed` — a future edit that
 * wants gating has to add a field here and will have to argue with this comment first.
 */

import type { TopicId } from "../game/types";
import type { DiagramId } from "./diagrams";

/**
 * What a card is for.
 *
 * `activity` — about one thing in this room (or one cluster of them): the mathematics or the physics
 * the child has just had their hands on.
 *
 * `invitation` — "here is what this whole field actually is". Exactly one per shelf, and it is the
 * card doing the load-bearing work: PROJECT.md's grounding is that passions are *built* rather than
 * found, so the card that pushes past the puzzle toward the domain is the one that can start one.
 */
export type ShelfCardKind = "activity" | "invitation";

/**
 * A real, checkable source. `url` is OPTIONAL ON PURPOSE: a source we cannot confidently link is
 * named and left unlinked, because a card citing a URL that does not exist is worse than a card with
 * no link at all. Nothing in the panel depends on the link resolving — see `ShelfCard.body`.
 */
export interface ShelfSource {
  /** The source in words, specific enough to find offline: publication, work, author. */
  label: string;
  /** Absolute `https://` URL, or absent. Never a fetch — see the offline note on `ShelfDeck`. */
  url?: string;
}

export interface ShelfCard {
  /** Stable id, unique within its deck. Used as a React key and as the panel's selection value. */
  id: string;
  kind: ShelfCardKind;
  /**
   * The gadget this card is about, for `activity` cards. Not a foreign key that gates anything: it
   * exists so tests can assert every activity in the room has a card, and so a future edit that
   * wants to order the cards to match the room can do it without re-parsing titles.
   */
  gadgetId?: string;
  title: string;
  /**
   * Exactly two paragraphs, pitched at ages 9-12 and not written down to them. The tuple is a
   * fixed-length tuple rather than a string array so "one honest page" is a type, not a convention.
   */
  body: readonly [string, string];
  /** A diagram from the local registry, where one earns its space. Absent where it would not. */
  diagram?: DiagramId;
  source: ShelfSource;
}

/**
 * One room's shelf.
 *
 * OFFLINE IS A HARD REQUIREMENT. Every card renders from this data and from `diagrams.tsx`, both
 * bundled; the diagrams are inline SVG rather than image files; and the source link is an ordinary
 * anchor the child may never click. There is no `fetch`, no image URL, and nothing that degrades
 * when the network is gone — the plane, the school bus and the bad hotel wifi all get the same shelf.
 */
export interface ShelfDeck {
  topic: TopicId;
  /** The panel's heading. Names the shelf in the room, not the feature. */
  title: string;
  /** One line under the heading, saying what these are. */
  intro: string;
  /** 3-6 cards, exactly one of which is the `invitation` (asserted in `cards.data.test.ts`). */
  cards: readonly ShelfCard[];
}
