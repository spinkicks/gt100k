import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, test } from "vitest";
import { backdropRoomFor } from "../cabin/backdrop/quads.data";
import { GADGETS, gadgetById } from "../gadgets/registry";
import { SHELF_DECKS, shelfDeckFor } from "./cards.data";
import { DIAGRAMS } from "./diagrams";

const ALL_CARDS = SHELF_DECKS.flatMap((deck) =>
  deck.cards.map((card) => ({ deck, card, name: `${deck.topic}/${card.id}` })),
);

describe("every shelf has contents, and the contents fit the room", () => {
  it("writes a deck for every painted shelf", () => {
    // The other direction of the pairing `CabinShelf` enforces at runtime by rendering nothing: a
    // shelf someone can see and click must have something in it.
    for (const topic of ["logic-games", "math"] as const) {
      expect(backdropRoomFor(topic)?.shelf, topic).toBeDefined();
      expect(shelfDeckFor(topic), topic).toBeDefined();
    }
  });

  it("returns undefined for cabins with no interior rather than throwing", () => {
    // `music` left this list on 2026-07-27 when its room and bookcase were painted.
    for (const topic of ["art", "science", "words"] as const) {
      expect(shelfDeckFor(topic)).toBeUndefined();
    }
  });

  it("holds 3 to 6 cards per cabin", () => {
    for (const deck of SHELF_DECKS) {
      expect(deck.cards.length, deck.topic).toBeGreaterThanOrEqual(3);
      expect(deck.cards.length, deck.topic).toBeLessThanOrEqual(6);
    }
  });

  it("has exactly one invitation card per cabin", () => {
    // Not "at least one". Two invitations would be two answers to "what is this whole field", and
    // none would leave the shelf explaining only the puzzles — which is the case PROJECT.md's
    // built-not-found grounding says matters most (see cards.data.ts).
    for (const deck of SHELF_DECKS) {
      const invitations = deck.cards.filter((card) => card.kind === "invitation");
      expect(invitations, deck.topic).toHaveLength(1);
      // The invitation is about the field, so it must not be pinned to one activity.
      expect(invitations[0]!.gadgetId, deck.topic).toBeUndefined();
    }
  });

  it("covers every activity in the room with a card that names it", () => {
    for (const deck of SHELF_DECKS) {
      const gadgets = GADGETS.filter((g) => g.topic === deck.topic)
        .map((g) => g.id)
        .sort();
      const covered = deck.cards
        .filter((card) => card.kind === "activity")
        .map((card) => card.gadgetId)
        .sort();
      expect(covered, deck.topic).toEqual(gadgets);
    }
  });

  it("points every activity card at a gadget that exists", () => {
    for (const { card, name } of ALL_CARDS) {
      if (card.kind !== "activity") continue;
      expect(gadgetById(card.gadgetId ?? ""), name).toBeDefined();
    }
  });

  it("gives every card a unique id within its deck", () => {
    for (const deck of SHELF_DECKS) {
      expect(new Set(deck.cards.map((c) => c.id)).size, deck.topic).toBe(deck.cards.length);
    }
  });
});

describe("one honest page per card", () => {
  it("titles every card, and every title is a sentence rather than a label", () => {
    for (const { card, name } of ALL_CARDS) {
      expect(card.title.trim().length, name).toBeGreaterThan(12);
    }
  });

  it("writes exactly two paragraphs, each long enough to say something", () => {
    for (const { card, name } of ALL_CARDS) {
      expect(card.body, name).toHaveLength(2);
      for (const [i, para] of card.body.entries()) {
        // ~40 words at the low end: enough for a real explanation, and the upper bound keeps a card a
        // page rather than an essay a 9-year-old will not start.
        expect(para.trim().length, `${name} para ${i}`).toBeGreaterThan(220);
        expect(para.trim().length, `${name} para ${i}`).toBeLessThan(1000);
      }
    }
  });

  it("cites a named source on every card", () => {
    for (const { card, name } of ALL_CARDS) {
      expect(card.source.label.trim().length, name).toBeGreaterThan(10);
    }
  });

  it("uses only well-formed absolute https links, and never a link as the citation", () => {
    for (const { card, name } of ALL_CARDS) {
      const { url, label } = card.source;
      if (url === undefined) continue;
      const parsed = new URL(url);
      expect(parsed.protocol, name).toBe("https:");
      expect(parsed.hostname, name).toMatch(/\./);
      // The label has to name the source in words, so a card still cites something when the link is
      // dead, the page has moved, or the child is offline.
      expect(label.includes("http"), name).toBe(false);
    }
  });

  it("only asks for diagrams that exist", () => {
    for (const { card, name } of ALL_CARDS) {
      if (!card.diagram) continue;
      expect(DIAGRAMS[card.diagram], name).toBeDefined();
    }
  });

  it("describes every diagram in words", () => {
    // The diagrams are explanatory, not decorative, so the description is the diagram for anyone who
    // cannot see it — a stub like "diagram" would fail the child it exists for.
    for (const [id, diagram] of Object.entries(DIAGRAMS)) {
      expect(diagram.description.trim().length, id).toBeGreaterThan(60);
      expect(diagram.viewBox, id).toMatch(/^0 0 \d+ \d+$/);
    }
  });

  it("uses every diagram it defines", () => {
    const used = new Set(ALL_CARDS.map(({ card }) => card.diagram).filter(Boolean));
    for (const id of Object.keys(DIAGRAMS)) expect(used.has(id as never), id).toBe(true);
  });
});

describe("the constraints that are decisions, not preferences", () => {
  const PROSE = ALL_CARDS.flatMap(({ deck, card, name }) => [
    { name: `${name} title`, text: card.title },
    { name: `${name} para 0`, text: card.body[0] },
    { name: `${name} para 1`, text: card.body[1] },
    { name: `${name} source`, text: card.source.label },
    { name: `${deck.topic} intro`, text: deck.intro },
  ]).concat(
    Object.entries(DIAGRAMS).map(([id, d]) => ({ name: `diagram ${id}`, text: d.description })),
  );

  it("contains no score, points, streak, star, badge or timer language", () => {
    // PRD §11 / PROJECT.md D7: no score, points, streaks, stars or timers anywhere, and a card is
    // "anywhere". Plural `points` only — "beside the point" is English, not gamification.
    const BANNED =
      /\b(scores?|scoring|points|streaks?|badges?|troph(y|ies)|stars?|timers?|countdowns?|xp|rewards?|prizes?|leaderboards?|levels? up)\b/i;
    for (const { name, text } of PROSE) {
      expect(BANNED.test(text), `${name}: ${text.match(BANNED)?.[0] ?? ""}`).toBe(false);
    }
  });

  it("never tells a child to solve something first", () => {
    // The shelf is not a reward and must not talk like one — no "unlock", no "once you have solved
    // this", no "come back when". See types.ts for why gating is a measurement error and not just
    // unkind.
    const GATING =
      /\b(unlock\w*|locked|come back (when|after)|first solve|once you(’|')?ve solved)\b/i;
    for (const { name, text } of PROSE) {
      expect(GATING.test(text), `${name}: ${text.match(GATING)?.[0] ?? ""}`).toBe(false);
    }
  });

  it("holds no per-child state and no way to fetch anything", () => {
    // Structural, because a comment cannot keep this true. Two properties at once: the shelf cannot
    // become gated (nothing here can read what the child has done), and it cannot become
    // network-dependent (a card that fetches is a card that is blank on a plane).
    const dir = resolve(__dirname);
    const files = ["cards.data.ts", "types.ts", "diagrams.tsx", "ShelfPanel.tsx", "CabinShelf.tsx"];
    for (const file of files) {
      const source = readFileSync(resolve(dir, file), "utf8");
      // Strip comments: this file's own prose discusses gating at length, and so does that of the
      // modules it is checking.
      const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      // Code-shaped tokens only. "solves" would be a nice thing to ban and cannot be: one of the
      // cards contains the English sentence "a method that solves every nonogram".
      const banned = [
        "useInterest",
        "interest/store",
        "recordSolve",
        "focusedGadgetId",
        "useGame",
        "fetch(",
        "XMLHttpRequest",
        "localStorage",
        "sessionStorage",
      ];
      for (const token of banned) {
        expect(code.includes(token), `${file} references ${token}`).toBe(false);
      }
    }
  });
});

const cardFor = (topic: string, gadgetId: string) =>
  SHELF_DECKS.find((d) => d.topic === topic)?.cards.find((c) => c.gadgetId === gadgetId);

// The twin pair is the same shell with only the content binding varied, and it is how "loves
// deduction" is told apart from "loves mathematics" by observation. A player could not tell.
test("each twin's card names the other", () => {
  const mirror = cardFor("logic-games", "mirror");
  const laser = cardFor("math", "fraction-laser");
  expect(mirror?.body.join(" ")).toMatch(/fraction laser/i);
  expect(laser?.body.join(" ")).toMatch(/mirror maze/i);
});

// Inert, not a nudge. Nothing may read as "you played X, so try Y" — a system-surfaced prompt is
// the prompted-vs-voluntary distinction the engine turns on, and priming the pair destroys the
// comparison it exists to enable.
test("neither cross-reference is phrased as a recommendation", () => {
  for (const card of [cardFor("logic-games", "mirror"), cardFor("math", "fraction-laser")]) {
    const text = card?.body.join(" ") ?? "";
    expect(text).not.toMatch(
      /you (should|might|liked|enjoyed)|try (it|this|that)|recommend|next up|head over to|give it a shot|worth playing/i,
    );
  }
});

// The type says two paragraphs and the prose has to live inside them.
test("both cards still have exactly two paragraphs", () => {
  expect(cardFor("logic-games", "mirror")?.body).toHaveLength(2);
  expect(cardFor("math", "fraction-laser")?.body).toHaveLength(2);
});
