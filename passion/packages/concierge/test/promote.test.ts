import { describe, expect, it, vi } from "vitest";
import {
  enqueue,
  promote,
  runConcierge,
  stubDistress,
  stubFaithfulness,
  stubGenerator,
  stubHasher,
  stubModerator,
  stubReadability,
  stubRetriever,
  toCacheEntry,
  type ConciergeDeps,
  type ConciergeRequest,
  type CuratedLibrary,
  type CuratedResource,
  type Generator,
  type RetrievedDoc,
  type Retriever,
  type StubCorpus,
} from "../src/index.js";

// SYNTHETIC data only — deterministic, offline stubs (no network, no model). Task 6 proves the
// async cache → vet-queue → promote loop: a served open-web result is cached + queued, a human
// vet folds it into the curated library with stable provenance, and the SAME need then resolves
// CURATED (retriever never called) — the compounding lever that shrinks live retrieval ([D7], SC-8).

// Curated library seeds ONLY chess → astronomy is a genuine gap that triggers retrieval.
const CHESS: CuratedResource = {
  id: "res-chess-openings",
  title: "Chess Openings for Beginners",
  url: "https://www.khanacademy.org/chess-openings",
  domainPath: ["games-strategy", "chess"],
  affordedModes: ["perform", "explain"],
  reputation: 0.95,
  ageTiers: ["6-8", "9-11", "12-14"],
  provenance: "curated:seed",
};
const LIB: CuratedLibrary = [CHESS];

// A clean, allowlisted, groundable doc for the astronomy gap. Its message infers a taxonomy path
// ("astronomy") so a promoted resource is topic-resolvable on the re-run.
const STAR: RetrievedDoc = {
  url: "https://en.wikipedia.org/wiki/Star_formation",
  title: "Star formation",
  text: "Stars form when clouds of gas and dust collapse under gravity.",
  reputation: 0.9,
};
const CORPUS: StubCorpus = new Map([["how do stars form in astronomy", [STAR]]]);

// Golden provenance = stubHasher.hash(`${url}\n${text}`) (FNV-1a, url + "\n" + text).
const STAR_PROVENANCE = "c6bdbaa7";

function req(message: string, ageTier: ConciergeRequest["ageTier"] = "9-11"): ConciergeRequest {
  return { kidId: "kid-synthetic-002", ageTier, message, sessionId: "sess-002" };
}

function makeDeps(library: CuratedLibrary) {
  const search = vi.fn<Retriever["search"]>(stubRetriever(CORPUS).search);
  const generate = vi.fn<Generator["generate"]>(stubGenerator.generate);
  const deps: ConciergeDeps = {
    library,
    moderator: stubModerator,
    distress: stubDistress,
    retriever: { search },
    generator: { generate },
    faithfulness: stubFaithfulness,
    readability: stubReadability,
    hasher: stubHasher,
  };
  return { deps, search, generate };
}

describe("cache → vet-queue (enqueue + provenance)", () => {
  it("stamps a stable provenance hash and enqueues immutably", () => {
    const entry = toCacheEntry(
      { doc: STAR, query: "how do stars form in astronomy", at: 0 },
      "9-11",
      stubHasher,
    );
    expect(entry.provenance).toBe(STAR_PROVENANCE);
    expect(entry.ageTier).toBe("9-11");

    const q0: readonly never[] = [];
    const q1 = enqueue(q0, entry);
    expect(q1).toHaveLength(1);
    expect(q1[0]).toBe(entry);
    expect(q0).toHaveLength(0); // original untouched (immutable append)
  });
});

describe("promote (SC-8) — a served result compounds into the curated library", () => {
  it("serves a gap, caches + queues it, promotes it, and the same need then resolves CURATED", async () => {
    // 1. Genuine gap → retrieve → grounded answer; the served doc is handed out for caching.
    const first = makeDeps(LIB);
    const question = req("how do stars form in astronomy?");
    const served = await runConcierge(question, first.deps, 0);
    expect(served.response.kind).toBe("answer");
    expect(first.search).toHaveBeenCalledTimes(1);
    expect(served.cache?.map((e) => e.doc.url)).toEqual([STAR.url]);

    // 2. Cache → vet-queue, stamping provenance.
    const draft = served.cache?.[0];
    expect(draft).toBeDefined();
    if (!draft) throw new Error("no cache draft");
    const entry = toCacheEntry(draft, question.ageTier, stubHasher);
    expect(entry.provenance).toBe(STAR_PROVENANCE);
    const queue = enqueue([], entry);

    // 3. Human vet APPROVES → fold into the library with provenance; the entry leaves the queue.
    const { library: lib2, queue: queue2 } = promote(LIB, queue, entry, "approve");
    expect(queue2).toHaveLength(0);
    const promoted = lib2.find((r) => r.provenance === STAR_PROVENANCE);
    expect(promoted).toBeDefined();
    expect(promoted?.url).toBe(STAR.url);
    expect(promoted?.title).toBe(STAR.title);
    expect(promoted?.domainPath).toEqual(["science-nature", "astronomy"]);
    expect(promoted?.ageTiers).toEqual(["9-11"]); // promoted only for the tier it was served/vetted at
    expect(promoted?.reputation).toBeGreaterThanOrEqual(0.5);
    expect(LIB).toHaveLength(1); // the original library value is unchanged (immutable)

    // 4. Re-run the SAME need against the grown library → resolves CURATED; retriever NOT called.
    const second = makeDeps(lib2);
    const again = await runConcierge(question, second.deps, 0);
    expect(again.response.kind).toBe("answer");
    expect(second.search).not.toHaveBeenCalled(); // the compounding lever: no live retrieval
    expect(second.generate).not.toHaveBeenCalled();
    expect(again.response.resources?.some((r) => r.provenance === STAR_PROVENANCE)).toBe(true);
    expect(again.response.citations?.some((c) => c.url === STAR.url)).toBe(true);
  });

  it("a REJECTED entry is dequeued and never folded into the library", () => {
    const entry = toCacheEntry(
      { doc: STAR, query: "how do stars form in astronomy", at: 0 },
      "9-11",
      stubHasher,
    );
    const { library, queue } = promote(LIB, enqueue([], entry), entry, "reject");
    expect(library).toBe(LIB); // unchanged reference
    expect(queue).toHaveLength(0);
  });

  it("an APPROVED but un-classifiable entry is dequeued without polluting the library", () => {
    const doc: RetrievedDoc = {
      url: "https://en.wikipedia.org/wiki/Xyzzy",
      title: "Xyzzy",
      text: "Xyzzy is a magic word.",
      reputation: 0.9,
    };
    const entry = toCacheEntry({ doc, query: "what is the xyzzy magic word", at: 0 }, "9-11", stubHasher);
    const { library, queue } = promote(LIB, enqueue([], entry), entry, "approve");
    expect(library).toBe(LIB); // no inferable domain path → cannot curate → library untouched
    expect(queue).toHaveLength(0);
  });
});
