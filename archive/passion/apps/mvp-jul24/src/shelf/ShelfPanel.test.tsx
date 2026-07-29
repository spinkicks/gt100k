import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SHELF_DECKS, shelfDeckFor } from "./cards.data";
import { DIAGRAMS } from "./diagrams";
import ShelfPanel from "./ShelfPanel";

const noop = () => {};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("every card renders, as one honest page", () => {
  it.each(SHELF_DECKS.flatMap((deck) => deck.cards.map((card) => [deck.topic, card.id] as const)))(
    "renders %s / %s in full",
    (topic, cardId) => {
      const deck = shelfDeckFor(topic)!;
      const card = deck.cards.find((c) => c.id === cardId)!;
      const { container } = render(<ShelfPanel deck={deck} onClose={noop} />);

      // Open it by its title, exactly as a child would.
      fireEvent.click(screen.getByRole("button", { name: new RegExp(escapeRe(card.title)) }));

      const page = container.querySelector(`[data-card="${card.id}"]`)!;
      expect(page).not.toBeNull();
      expect(page.querySelector("h3")!.textContent).toBe(card.title);
      const paragraphs = [...page.querySelectorAll(".shelf-card-para")].map((p) => p.textContent);
      expect(paragraphs).toEqual([card.body[0], card.body[1]]);

      // The source is present as text whether or not it is a link, so the citation survives being
      // offline; when it is a link it leaves the app safely and does not navigate the cabin away.
      const footer = page.querySelector(".shelf-card-source")!;
      expect(footer.textContent).toBe(card.source.label);
      const anchor = footer.querySelector("a");
      if (card.source.url) {
        expect(anchor!.getAttribute("href")).toBe(card.source.url);
        expect(anchor!.getAttribute("target")).toBe("_blank");
        expect(anchor!.getAttribute("rel")).toContain("noreferrer");
        expect(anchor!.getAttribute("rel")).toContain("noopener");
      } else {
        expect(anchor).toBeNull();
      }

      if (card.diagram) {
        const svg = page.querySelector(`svg[data-diagram="${card.diagram}"]`)!;
        expect(svg).not.toBeNull();
        // Explanatory, so it is labelled rather than hidden.
        expect(svg.getAttribute("role")).toBe("img");
        expect(svg.getAttribute("aria-label")).toBe(DIAGRAMS[card.diagram].description);
        expect(svg.getAttribute("aria-hidden")).toBeNull();
      }
    },
  );

  it("marks the invitation card for what it is, without ranking the others", () => {
    const deck = shelfDeckFor("math")!;
    render(<ShelfPanel deck={deck} onClose={noop} />);
    const tags = screen.getAllByText("the whole field");
    expect(tags).toHaveLength(1);
    const invitation = deck.cards.find((card) => card.kind === "invitation")!;
    expect(tags[0]!.closest("button")!.textContent).toContain(invitation.title);
  });

  it("opens on the first card and switches on click, with the selection announced", () => {
    const deck = shelfDeckFor("logic-games")!;
    const { container } = render(<ShelfPanel deck={deck} onClose={noop} />);
    expect(container.querySelector(".shelf-card")!.getAttribute("data-card")).toBe(
      deck.cards[0]!.id,
    );

    const third = deck.cards[2]!;
    const tab = screen.getByRole("button", { name: new RegExp(escapeRe(third.title)) });
    fireEvent.click(tab);
    expect(container.querySelector(".shelf-card")!.getAttribute("data-card")).toBe(third.id);
    expect(tab.getAttribute("aria-current")).toBe("true");
    expect(container.querySelectorAll('[aria-current="true"]')).toHaveLength(1);
  });

  it("is a dialog named by its own heading", () => {
    const deck = shelfDeckFor("logic-games")!;
    render(<ShelfPanel deck={deck} onClose={noop} />);
    const dialog = screen.getByRole("dialog", { name: deck.title });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText(deck.intro)).toBeVisible();
  });
});

describe("offline is a requirement, not a hope", () => {
  it("fetches nothing and loads no external asset while rendering every card", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const xhr = vi.spyOn(XMLHttpRequest.prototype, "open");

    for (const deck of SHELF_DECKS) {
      const { container, unmount } = render(<ShelfPanel deck={deck} onClose={noop} />);
      for (const card of deck.cards) {
        fireEvent.click(screen.getByRole("button", { name: new RegExp(escapeRe(card.title)) }));
        // Diagrams are inline SVG: no <img>, no CSS `url()`, nothing with a src to fail to load.
        expect(container.querySelectorAll("img, image, iframe, object, embed")).toHaveLength(0);
      }
      unmount();
    }

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhr).not.toHaveBeenCalled();
  });

  it("keeps the outbound link as a link and never as a requirement", () => {
    // The anchor is inert until a child chooses to click it: no preloading, no prefetch hints, and
    // the card is complete without it.
    for (const deck of SHELF_DECKS) {
      const { container, unmount } = render(<ShelfPanel deck={deck} onClose={noop} />);
      for (const anchor of container.querySelectorAll("a")) {
        expect(anchor.getAttribute("rel")).not.toContain("prefetch");
        expect(anchor.textContent?.trim().length).toBeGreaterThan(10);
      }
      unmount();
    }
  });
});

describe("closing", () => {
  it("calls back on the Close button, on Escape, and on the scrim", () => {
    const deck = shelfDeckFor("math")!;
    const onClose = vi.fn();
    render(<ShelfPanel deck={deck} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Close the bookshelf" }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("ignores other keys", () => {
    const onClose = vi.fn();
    render(<ShelfPanel deck={shelfDeckFor("math")!} onClose={onClose} />);
    for (const key of ["Enter", " ", "a", "Backspace"]) fireEvent.keyDown(document, { key });
    expect(onClose).not.toHaveBeenCalled();
  });
});

function escapeRe(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
