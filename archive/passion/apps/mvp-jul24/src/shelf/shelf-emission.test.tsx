/**
 * The shelf was the last surface emitting nothing, and it is the one that can answer the open
 * question.
 *
 * `session.ts` gates all emission off, and its stated precondition is "wire the backdrop's prop
 * polygons and the shelf into recordOpen/recordSurfaced FIRST". The props turned out to be wired
 * already — clicking one calls `focusGadget`, which mounts `GadgetOverlay`, which records the open —
 * so the shelf was all that remained.
 *
 * WHAT IS WORTH RECORDING HERE, and why it is not "everything". The surface owner's ruling
 * (`docs/decisions/2026-07-27-discovery-surface.md` §-1) deliberately leaves open whether the child
 * leaves the product to learn or stays and does the activity. That question is answerable with data
 * rather than argument, and this is the only place the data exists: **following a card's outbound
 * link is the child choosing to leave.** Recording it does not presume either answer; it is what
 * makes either answer evidenced.
 *
 * The invitation card is the interesting one. Every shelf has exactly one, and PROJECT.md calls it
 * "the card doing the load-bearing work: the card that pushes past the puzzle toward the domain".
 * A child who follows THAT link has done the thing the whole product is trying to detect — moved
 * from the wrapper to the field — which is the same focused-versus-broad distinction E10's delayed
 * report codes for, arriving here as behaviour instead of an adult's recollection.
 *
 * Opening the shelf is NOT recorded as engagement. It is presence, the same category as `open`, and
 * the pipeline drops presence with `no-work-mode` rather than letting it read as a rejection of
 * whatever else was on offer.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { useGame } from "../game/store";
import { useInterest } from "../interest/store";
import { sessionLog } from "../signals/session";
import { shelfDeckFor } from "./cards.data";
import ShelfPanel from "./ShelfPanel";

vi.mock("../signals/session", async () => {
  const { createSignalLog } = await import("../signals/log");
  return {
    SESSION_ID: "shelf-test",
    EMISSION_ENABLED: true,
    sessionLog: createSignalLog({ sessionId: "shelf-test", now: () => Date.now() }),
  };
});

const DECK = shelfDeckFor("logic-games")!;

beforeEach(() => {
  localStorage.clear();
  useGame.getState().goToMap();
  useInterest.getState().reset();
});

const kinds = (): readonly string[] => sessionLog.interactions().map((i) => i.actionType);

test("following a card's source link is recorded", () => {
  render(<ShelfPanel deck={DECK} onClose={() => {}} />);

  const link = document.querySelector<HTMLAnchorElement>('a[href^="https://"]');
  expect(link, "the deck should have at least one linked source").not.toBeNull();
  fireEvent.click(link!);

  expect(kinds()).toContain("follow-source");
});

test("it is attributed to the card's own subject, not to the shelf", () => {
  // An activity card is about one gadget; the invitation is about the whole cabin. Recording both
  // against "the shelf" would collapse the distinction the invitation card exists to create.
  render(<ShelfPanel deck={DECK} onClose={() => {}} />);

  const link = document.querySelector<HTMLAnchorElement>('a[href^="https://"]');
  fireEvent.click(link!);

  const rec = sessionLog.interactions().find((i) => i.actionType === "follow-source");
  const first = DECK.cards[0]!;
  expect(rec?.artifactId).toBe(first.kind === "invitation" ? DECK.topic : first.gadgetId);
});

test("opening the shelf on its own records no engagement", () => {
  // Presence, not work. The pipeline has a category for this and it is not "engaged".
  render(<ShelfPanel deck={DECK} onClose={() => {}} />);

  expect(kinds().filter((k) => k === "follow-source")).toEqual([]);
});

test("an unlinkable source records nothing, because there is nothing to click", () => {
  const unlinked = {
    ...DECK,
    cards: DECK.cards.map((c) => ({ ...c, source: { label: c.source.label } })),
  };
  render(<ShelfPanel deck={unlinked} onClose={() => {}} />);

  // Scoped to the footer. The card may still offer curated links under "where to go next", and it
  // should: a source we cannot link is a citation problem, not a reason to strand the child. What
  // this test is about is the footer not inventing an anchor when it has no URL.
  expect(document.querySelector(".shelf-card-source a")).toBeNull();
  expect(kinds()).toEqual([]);
});

test("the curated links are a real offer, not decoration", () => {
  // The 157-resource library existed for weeks and was read by nothing. This is the assertion that
  // it is now actually on a shelf a child can reach, and that following one is observed the same
  // way following a citation is.
  render(<ShelfPanel deck={DECK} onClose={() => {}} />);

  const deeper = document.querySelectorAll<HTMLAnchorElement>(".shelf-card-deeper-list a");
  expect(deeper.length).toBeGreaterThan(0);
  for (const a of deeper) expect(a.href).toMatch(/^https:\/\//);

  fireEvent.click(deeper[0]!);
  expect(kinds().filter((k) => k === "follow-source")).toHaveLength(1);
});

test("each follow is its own observation", () => {
  render(<ShelfPanel deck={DECK} onClose={() => {}} />);
  const link = document.querySelector<HTMLAnchorElement>('a[href^="https://"]')!;

  fireEvent.click(link);
  fireEvent.click(link);

  expect(kinds().filter((k) => k === "follow-source")).toHaveLength(2);
});
