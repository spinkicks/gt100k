/**
 * A room that exists and offers nowhere to go.
 *
 * The "where to go next" links come from the curated library, keyed by the card's subject: an
 * activity card by its gadget's path, an invitation by its topic's cabin. Both lookups can return
 * nothing, and when they do the section renders as absent rather than empty, which is the right
 * behaviour and also completely silent. So a new room ships, looks finished, and quietly hands its
 * children a dead end.
 *
 * That is not hypothetical. The music room arrived in #222 with a registry, a shelf and a crosswalk
 * and no topic row, so its invitation card would have narrowed to `music-sound/music-theory` and
 * offered a child who liked the room only theory links. This is the test that would have caught it,
 * and it is here rather than in the package because only the app knows which rooms it has built.
 */
import { curatedForCell, SEED_LIBRARY } from "@gt100k/concierge";
import { artifactFor, pathForTopic } from "@gt100k/discovery-catalog";
import { describe, expect, it } from "vitest";

import { MAX_SHELF_LINKS, SHELF_AGE_TIERS } from "./age-band";
import { SHELF_DECKS } from "./cards.data";

const links = (path: readonly string[] | undefined): number =>
  path === undefined
    ? 0
    : curatedForCell(SEED_LIBRARY, path as never, SHELF_AGE_TIERS, MAX_SHELF_LINKS).length;

describe("every shelf leads somewhere", () => {
  it("gives each room's invitation a cabin to draw links from", () => {
    for (const deck of SHELF_DECKS) {
      expect(pathForTopic(deck.topic), `${deck.topic} has no topic row`).toBeDefined();
      expect(
        links(pathForTopic(deck.topic)),
        `${deck.topic} invitation has no links`,
      ).toBeGreaterThan(0);
    }
  });

  it("gives each activity card links for its own gadget, not just its cabin", () => {
    // Cards inherit their gadget's subtopic, so a cabin with resources can still have a subtopic
    // with none. That is the case a cabin-level check would pass and a child would notice.
    for (const deck of SHELF_DECKS) {
      for (const card of deck.cards) {
        if (!card.gadgetId) continue;
        const art = artifactFor(card.gadgetId);
        expect(art, `${card.gadgetId} is not in the crosswalk`).toBeDefined();
        expect(links(art?.domainPath), `${card.gadgetId} has no links`).toBeGreaterThan(0);
      }
    }
  });
});
