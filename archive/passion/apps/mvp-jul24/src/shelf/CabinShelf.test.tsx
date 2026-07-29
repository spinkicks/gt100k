import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CabinBackdrop from "../cabin/backdrop/CabinBackdrop";
import { backdropRoomFor } from "../cabin/backdrop/quads.data";
import { useGame } from "../game/store";
import { useInterest } from "../interest/store";
import { shelfDeckFor } from "./cards.data";

const ROOMS = ["logic-games", "math"] as const;

beforeEach(() => {
  useGame.getState().goToMap();
  useInterest.getState().reset();
});

const shelfIn = (topic: (typeof ROOMS)[number]) =>
  screen.getByRole("button", { name: backdropRoomFor(topic)!.shelf!.label });

describe("the shelf is open from the moment the child walks in", () => {
  it.each(ROOMS)("opens in %s with nothing solved and nothing else touched", (topic) => {
    // The state the assertion depends on: a fresh interest store, no solves, no gadget ever focused.
    // This is the whole constraint (PROJECT.md, "Depth and unlocking: nothing is gated") — gating
    // depth on completion would make "went deeper" a deterministic function of "solved it", and
    // `solves` indexes prior ability rather than learning.
    expect(useInterest.getState().byGadget).toEqual({});
    render(<CabinBackdrop topic={topic} />);

    fireEvent.click(shelfIn(topic));

    const deck = shelfDeckFor(topic)!;
    expect(screen.getByRole("dialog", { name: deck.title })).toBeInTheDocument();
    // Every card's title is offered, not just the open one: no partial reveal.
    for (const card of deck.cards) {
      expect(screen.getByRole("button", { name: new RegExp(escapeRe(card.title)) })).toBeVisible();
    }
  });

  it.each(ROOMS)("shows the same cards in %s after solving everything in the room", (topic) => {
    // The other half of "not gated": nothing appears either. A shelf that grew after completion would
    // be a completion-triggered offer, which is separately refused for now.
    render(<CabinBackdrop topic={topic} />);
    fireEvent.click(shelfIn(topic));
    const before = openCardTitles();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    for (const card of shelfDeckFor(topic)!.cards) {
      if (card.gadgetId) useInterest.getState().recordSolve(card.gadgetId);
    }
    fireEvent.click(shelfIn(topic));
    expect(openCardTitles()).toEqual(before);
  });

  it("is reachable by keyboard and activates on Enter and on Space", () => {
    for (const key of ["Enter", " "]) {
      const view = render(<CabinBackdrop topic="logic-games" />);
      const shelf = shelfIn("logic-games");
      expect(shelf.getAttribute("tabindex")).toBe("0");
      (shelf as unknown as HTMLElement).focus();
      expect(document.activeElement).toBe(shelf);

      const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
      fireEvent(shelf, event);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      // Space must not also scroll the page out from under the panel it just opened.
      expect(event.defaultPrevented).toBe(true);
      view.unmount();
    }
  });

  it("ignores keys that are not activation keys", () => {
    render(<CabinBackdrop topic="logic-games" />);
    for (const key of ["a", "Tab", "ArrowRight", "Escape"]) {
      fireEvent.keyDown(shelfIn("logic-games"), { key });
    }
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("announces itself as something that opens a panel, and says whether it is open", () => {
    render(<CabinBackdrop topic="logic-games" />);
    const shelf = shelfIn("logic-games");
    expect(shelf.getAttribute("aria-haspopup")).toBe("dialog");
    expect(shelf.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(shelf);
    expect(shelfIn("logic-games").getAttribute("aria-expanded")).toBe("true");
  });

  it("is named for what it is in the painting, not for what it does", () => {
    render(<CabinBackdrop topic="math" />);
    expect(screen.getByRole("button", { name: "Tall bookshelf on the left wall" })).toBeVisible();
    expect(screen.queryByRole("button", { name: /open the/i })).toBeNull();
  });
});

describe("closing", () => {
  it.each([
    ["the Close button", () => fireEvent.click(screen.getByRole("button", { name: "Close" }))],
    ["Escape", () => fireEvent.keyDown(document, { key: "Escape" })],
    [
      "a click outside the panel",
      () => fireEvent.click(screen.getByRole("button", { name: "Close the bookshelf" })),
    ],
  ])("closes on %s", (_name, close) => {
    render(<CabinBackdrop topic="logic-games" />);
    fireEvent.click(shelfIn("logic-games"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    close();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("puts focus back on the shelf, so a keyboard user is not dropped at the top of the room", () => {
    render(<CabinBackdrop topic="logic-games" />);
    fireEvent.click(shelfIn("logic-games"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(shelfIn("logic-games"));
  });

  it("takes focus into the panel when it opens", () => {
    render(<CabinBackdrop topic="logic-games" />);
    fireEvent.click(shelfIn("logic-games"));
    expect(document.activeElement).toBe(screen.getByRole("dialog"));
  });

  it("stops listening for Escape once closed", () => {
    const remove = vi.spyOn(document, "removeEventListener");
    render(<CabinBackdrop topic="logic-games" />);
    fireEvent.click(shelfIn("logic-games"));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(remove).toHaveBeenCalledWith("keydown", expect.any(Function));
    remove.mockRestore();
  });
});

describe("the shelf does not disturb the room it is in", () => {
  it("opens no gadget when clicked", () => {
    // A bookshelf is not an activity: it must not enter the interest pipeline, must not focus a
    // gadget, and must not record a solve. That is also why it is not in `gadgets/registry.ts`.
    render(<CabinBackdrop topic="logic-games" />);
    fireEvent.click(shelfIn("logic-games"));
    expect(useGame.getState().focusedGadgetId).toBeNull();
    expect(useInterest.getState().byGadget).toEqual({});
  });

  it("leaves every prop hotspot clickable while the shelf is closed", () => {
    render(<CabinBackdrop topic="logic-games" />);
    fireEvent.click(screen.getByRole("button", { name: "Chess set on the table" }));
    expect(useGame.getState().focusedGadgetId).toBe("chess");
  });

  it("carries the authored art-pixel coordinates verbatim, in the art's own viewBox", () => {
    // Same contract as the prop hotspots: no percentage conversion between quads.data.ts and the DOM,
    // and the same `preserveAspectRatio` as the image's `object-fit: cover`, so polygon and painting
    // are locked together by the browser at every window size.
    const room = backdropRoomFor("math")!;
    const { container } = render(<CabinBackdrop topic="math" />);
    const svg = container.querySelector(".shelf-hotspot-layer")!;
    expect(svg.getAttribute("viewBox")).toBe(`0 0 ${room.artWidth} ${room.artHeight}`);
    expect(svg.getAttribute("preserveAspectRatio")).toBe("xMidYMid slice");
    expect(container.querySelector('polygon[data-shelf="math"]')!.getAttribute("points")).toBe(
      room.shelf!.outline.map(([x, y]) => `${x},${y}`).join(" "),
    );
  });

  it("rides the same transform as the painting", () => {
    // A hotspot outside `.cabin-backdrop-parallax` is correct until the cursor moves and then drifts
    // off the object it points at — an intermittent bug, which is worse than no parallax.
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    const parallax = container.querySelector(".cabin-backdrop-parallax")!;
    const layer = container.querySelector(".shelf-hotspot-layer")!;
    expect(layer.closest(".cabin-backdrop-parallax")).toBe(parallax);
    // And after the prop hotspots in document order, so the open panel is above them.
    const hotspots = container.querySelector(".cabin-backdrop-hotspots")!;
    expect(hotspots.compareDocumentPosition(layer) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("traces the shelf's silhouette for hover and focus instead of drawing a box", () => {
    const { container } = render(<CabinBackdrop topic="logic-games" />);
    const polygons = [...container.querySelectorAll(".shelf-hotspot polygon")];
    expect(polygons).toHaveLength(3);
    expect(polygons[1]!.getAttribute("points")).toBe(polygons[0]!.getAttribute("points"));
    expect(polygons[2]!.getAttribute("points")).toBe(polygons[0]!.getAttribute("points"));
  });

  it("renders no shelf at all for a topic with no authored room", () => {
    // `music` has a painted bookcase now, so only code/art are shelf-less.
    for (const topic of ["art"] as const) {
      const { container, unmount } = render(<CabinBackdrop topic={topic} />);
      expect(container.querySelector(".shelf-hotspot-layer")).toBeNull();
      unmount();
    }
  });
});

function openCardTitles(): string[] {
  return screen
    .getAllByRole("button")
    .map((button) => button.textContent ?? "")
    .filter((text) => text.length > 0);
}

function escapeRe(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
