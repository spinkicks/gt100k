// test/parse.test.ts: HERMETIC. Canned TFY JSON bodies coerced into a `MasteryMap`. The network is
// never exercised here and `../src/index.js` (the fetch-backed generator) is never imported. Only
// the pure `parse` module and canned fixtures are. No `TFY_API_KEY`, no clock, no sockets. Mirrors
// planner-live / concierge-live / tagger-tfy.
//
// The verification half is testable precisely because `downgradeUnverifiedCitations` takes the set
// of verified urls as an ARGUMENT. The HEAD checks that build that set live in `index.ts`; what a
// test needs to pin down is what the map does with the answer, and that is pure.
import { describe, expect, it } from "vitest";
import type { MapContext } from "@gt100k/mastery-map";
import type { CuratedResource } from "@gt100k/concierge";
import {
  checkableUrls,
  coerceMapOrStub,
  downgradeUnverifiedCitations,
  isCheckableSource,
  parseMilestones,
  type LiveInputs,
} from "../src/parse.js";
import {
  ABRSM_PERFORMANCE,
  ABRSM_PRACTICAL,
  MALFORMED_SOURCE,
  MAP_BAD_BASIS,
  MAP_BAD_STAGE_FLOOR,
  MAP_CONSUMABLE_MILESTONE,
  MAP_DANGLING_REQUIRE,
  MAP_MALFORMED_SOURCE,
  MAP_MISSING_FIELD,
  MAP_NO_MILESTONES,
  MAP_UNRESOLVABLE_CITATION,
  MAP_VALID,
  UNRESOLVABLE_SOURCE,
} from "../src/__fixtures__/tfy-responses.js";

const ABRSM_PAGE: CuratedResource = {
  id: "cr-abrsm-piano",
  title: "ABRSM: piano exam requirements and syllabus downloads",
  url: "https://www.abrsm.org/en-gb/instruments/piano",
  domainPath: ["music-sound", "instruments"],
  affordedModes: ["perform"],
  reputation: 0.95,
  ageTiers: ["9-11", "12-14"],
  provenance: "curated-library:human-vetted",
};

/** Pitched at ages this map does not claim, so validator rule 5 would reject it if attached. */
const TOO_YOUNG: CuratedResource = { ...ABRSM_PAGE, id: "cr-too-young", ageTiers: ["6-8"] };

const ctx: MapContext = {
  domainPath: ["music-sound", "instruments"],
  modes: ["perform", "compose"],
  ageBands: ["9-11", "12-14"],
  resources: [ABRSM_PAGE],
};

const ALL_VERIFIED: ReadonlySet<string> = new Set([ABRSM_PRACTICAL.url, ABRSM_PERFORMANCE.url]);
const NOTHING_VERIFIED: ReadonlySet<string> = new Set<string>();

const inputs = (verifiedUrls: ReadonlySet<string>): LiveInputs => ({
  model: "gpt-5.4-mini",
  promptVersion: "map-live-v1",
  generatedAt: "2026-07-26T12:00:00.000Z",
  verifiedUrls,
});

const json = (v: unknown): string => JSON.stringify(v);

const basisOf = (map: { milestones: readonly { id: string; ordering: { basis: string } }[] }) =>
  Object.fromEntries(map.milestones.map((m) => [m.id, m.ordering.basis]));

describe("parseMilestones: the model authors the DAG, the adapter owns everything else", () => {
  it("coerces a well-formed response into milestones", () => {
    const milestones = parseMilestones(json(MAP_VALID), ctx);
    expect(milestones?.map((m) => m.id)).toEqual([
      "pf-one-whole-piece",
      "pf-steady-pulse",
      "pf-sight-read",
      "pf-perform-a-set",
    ]);
    expect(milestones?.[3]?.modes).toEqual(["perform"]);
    expect(milestones?.[1]?.ordering.limit).toBe(
      "The syllabus orders the components; it does not claim this is how anyone learns.",
    );
  });

  it("stamps authorship itself rather than letting the model claim a human wrote it", () => {
    const milestones = parseMilestones(json(MAP_VALID), ctx);
    expect(milestones?.every((m) => m.authorship === "model")).toBe(true);
  });

  it("attaches curated resources from the context and ignores any the model invented", () => {
    const invented = {
      milestones: MAP_VALID.milestones.map((m) => ({
        ...m,
        resources: [{ ...ABRSM_PAGE, id: "cr-invented", url: "https://example.invalid/made-up" }],
      })),
    };
    const milestones = parseMilestones(json(invented), ctx);
    expect(milestones?.flatMap((m) => m.resources.map((r) => r.id))).toEqual(["cr-abrsm-piano"]);
  });

  it("drops a curated resource that covers no age band this map claims", () => {
    const milestones = parseMilestones(json(MAP_VALID), { ...ctx, resources: [TOO_YOUNG] });
    expect(milestones?.flatMap((m) => m.resources)).toEqual([]);
  });

  it("returns null on malformed JSON", () => {
    expect(parseMilestones("not json", ctx)).toBeNull();
  });

  it("returns null when a milestone field is missing", () => {
    expect(parseMilestones(json(MAP_MISSING_FIELD), ctx)).toBeNull();
  });

  it("returns null on a stage floor that is not one of ours", () => {
    expect(parseMilestones(json(MAP_BAD_STAGE_FLOOR), ctx)).toBeNull();
  });

  it("returns null on an ordering basis outside the four", () => {
    expect(parseMilestones(json(MAP_BAD_BASIS), ctx)).toBeNull();
  });

  it("returns null when the model returned no milestones at all", () => {
    expect(parseMilestones(json(MAP_NO_MILESTONES), ctx)).toBeNull();
  });
});

describe("isCheckableSource: what is worth spending a request on", () => {
  it("accepts a real citation with authors, a four-digit year and an https url", () => {
    expect(isCheckableSource(ABRSM_PRACTICAL)).toBe(true);
  });

  it("accepts the canonical doi form", () => {
    expect(isCheckableSource({ ...ABRSM_PRACTICAL, url: "doi:10.1037/0033-295X.100.3.363" })).toBe(
      true,
    );
  });

  it("rejects a source with no authors, no plausible year, or an unfetchable url", () => {
    expect(isCheckableSource(MALFORMED_SOURCE)).toBe(false);
    expect(isCheckableSource({ ...ABRSM_PRACTICAL, authors: "  " })).toBe(false);
    expect(isCheckableSource({ ...ABRSM_PRACTICAL, year: 12 })).toBe(false);
    expect(isCheckableSource({ ...ABRSM_PRACTICAL, url: "ask any teacher" })).toBe(false);
  });

  it("passes a citation-shaped url that is knowably not there, because only fetching settles it", () => {
    expect(isCheckableSource(UNRESOLVABLE_SOURCE)).toBe(true);
  });
});

describe("checkableUrls: the work list handed to the impure half", () => {
  it("lists every structurally sound source url once", () => {
    expect(checkableUrls(json(MAP_VALID))).toEqual([ABRSM_PRACTICAL.url, ABRSM_PERFORMANCE.url]);
  });

  it("omits a source no request could settle, and keeps the sound ones beside it", () => {
    const urls = checkableUrls(json(MAP_MALFORMED_SOURCE));
    expect(urls).not.toContain(MALFORMED_SOURCE.url);
    expect(urls).toEqual([ABRSM_PRACTICAL.url, ABRSM_PERFORMANCE.url]);
  });

  it("is empty on a response it cannot read", () => {
    expect(checkableUrls("not json")).toEqual([]);
  });
});

describe("downgradeUnverifiedCitations: a map never claims support it cannot back", () => {
  const built = (raw: string, verified: ReadonlySet<string>) =>
    coerceMapOrStub(raw, ctx, inputs(verified));

  it("leaves a milestone alone when every source behind it was verified", () => {
    const map = built(json(MAP_VALID), ALL_VERIFIED);
    expect(basisOf(map)).toEqual({
      "pf-one-whole-piece": "syllabus",
      "pf-steady-pulse": "syllabus",
      "pf-sight-read": "model",
      "pf-perform-a-set": "syllabus",
    });
    expect(map.milestones[0]?.ordering.sources).toEqual([ABRSM_PRACTICAL]);
  });

  it("downgrades a citation that is not there to the model's own reasoning, and drops it", () => {
    const map = built(json(MAP_UNRESOLVABLE_CITATION), ALL_VERIFIED);
    const downgraded = map.milestones[0];
    expect(downgraded?.ordering.basis).toBe("model");
    expect(downgraded?.ordering.sources).toEqual([]);
    expect(downgraded?.ordering.reason).toBe(
      MAP_UNRESOLVABLE_CITATION.milestones[0]?.ordering.reason,
    );
    expect(basisOf(map)["pf-steady-pulse"]).toBe("syllabus");
  });

  it("downgrades a source nothing could have checked, whatever the caller claims to have verified", () => {
    const map = built(json(MAP_MALFORMED_SOURCE), new Set([MALFORMED_SOURCE.url]));
    expect(map.milestones[0]?.ordering.basis).toBe("model");
    expect(map.milestones[0]?.ordering.sources).toEqual([]);
  });

  it("downgrades a basis that names no source at all", () => {
    const bare = {
      milestones: MAP_VALID.milestones.map((m, i) =>
        i === 0 ? { ...m, ordering: { ...m.ordering, sources: [] } } : m,
      ),
    };
    expect(basisOf(built(json(bare), ALL_VERIFIED))["pf-one-whole-piece"]).toBe("model");
  });

  it("keeps the map valid, because a model basis carrying no sources is what rule E4 wants", () => {
    const map = built(json(MAP_UNRESOLVABLE_CITATION), ALL_VERIFIED);
    expect(map.validation.errors).toEqual([]);
  });

  it("re-validates, so the downgrade shows up in the warnings a guide reads", () => {
    const map = built(json(MAP_VALID), NOTHING_VERIFIED);
    expect(map.milestones.every((m) => m.ordering.basis === "model")).toBe(true);
    expect(map.validation.warnings.map((w) => w.code).sort()).toEqual([
      "W1_MODEL_HEAVY",
      "W2_NO_SYLLABUS",
    ]);
  });

  it("is a no-op on a map that cites nothing", () => {
    const map = built(json(MAP_VALID), ALL_VERIFIED);
    expect(downgradeUnverifiedCitations(map, ALL_VERIFIED)).toEqual(map);
  });
});

describe("coerceMapOrStub: a valid map or the stub, never anything in between", () => {
  it("builds a live map from a well-formed, fully verified response", () => {
    const map = coerceMapOrStub(json(MAP_VALID), ctx, inputs(ALL_VERIFIED));
    expect(map.provenance.model).toBe("gpt-5.4-mini");
    expect(map.provenance.promptVersion).toBe("map-live-v1");
    expect(map.provenance.generatedAt).toBe("2026-07-26T12:00:00.000Z");
    expect(map.provenance.edits).toEqual([]);
    expect(map.validation.errors).toEqual([]);
    expect(map.validation.warnings).toEqual([]);
  });

  it("generates a draft at the domain's stable id, with no human review claimed", () => {
    const map = coerceMapOrStub(json(MAP_VALID), ctx, inputs(ALL_VERIFIED));
    expect(map.id).toBe("map:music-sound/instruments");
    expect(map.version).toBe(1);
    expect(map.status).toBe("draft");
    expect(map.vettedBy).toBeNull();
    expect(map.vettedAt).toBeNull();
    expect(map.revalidatedAt).toBe("2026-07-26T12:00:00.000Z");
  });

  it("falls back to the deterministic stub on a malformed payload", () => {
    const map = coerceMapOrStub("not json", ctx, inputs(ALL_VERIFIED));
    expect(map.provenance.model).toBe("stub");
    expect(map.milestones.length).toBeGreaterThan(0);
    expect(map.validation.errors).toEqual([]);
  });

  it("falls back to the stub rather than return a map with a dangling requires edge", () => {
    const map = coerceMapOrStub(json(MAP_DANGLING_REQUIRE), ctx, inputs(ALL_VERIFIED));
    expect(map.provenance.model).toBe("stub");
  });

  it("falls back to the stub rather than return a milestone you could finish by consuming", () => {
    const map = coerceMapOrStub(json(MAP_CONSUMABLE_MILESTONE), ctx, inputs(ALL_VERIFIED));
    expect(map.provenance.model).toBe("stub");
  });

  it("never returns a map carrying a validation error, whatever the model sent", () => {
    const responses = [
      json(MAP_VALID),
      json(MAP_UNRESOLVABLE_CITATION),
      json(MAP_MALFORMED_SOURCE),
      json(MAP_DANGLING_REQUIRE),
      json(MAP_CONSUMABLE_MILESTONE),
      json(MAP_MISSING_FIELD),
      json(MAP_BAD_STAGE_FLOOR),
      json(MAP_BAD_BASIS),
      json(MAP_NO_MILESTONES),
      "not json",
      "",
    ];
    for (const raw of responses) {
      for (const verified of [ALL_VERIFIED, NOTHING_VERIFIED]) {
        expect(coerceMapOrStub(raw, ctx, inputs(verified)).validation.errors).toEqual([]);
      }
    }
  });
});
