import { describe, it, expect } from "vitest";
import {
  stubCatalog,
  makeCatalog,
  SEED_CATALOG,
  CELL_AUDIO,
  CELL_GAMEDEV,
  CELL_CHESS,
} from "../src/catalog.js";
import { MENTOR_SOURCE_LAYERS, AUDIENCE_CHANNELS } from "../src/model.js";

describe("OpportunityCatalog port + stubCatalog (spec §4.4/§4.5)", () => {
  it("filters by cellKey + kind only (no gates applied here)", () => {
    const mentors = stubCatalog.search({ cellKey: CELL_AUDIO, kind: "mentor" });
    // includes the pending/rejected/stage-gated entries — the catalog does NOT gate.
    expect(mentors.map((o) => o.id)).toEqual([
      "mn-ai-warm",
      "mn-fam-warm",
      "mn-peer-tech",
      "mn-pending-tech",
      "mn-thin-expert",
      "mn-master",
    ]);
    for (const o of mentors) {
      expect(o.cellKey).toBe(CELL_AUDIO);
      expect(o.kind).toBe("mentor");
    }
  });

  it("returns audience opportunities for a cell, in seed order", () => {
    const aud = stubCatalog.search({ cellKey: CELL_AUDIO, kind: "audience" });
    expect(aud.map((o) => o.id)).toEqual([
      "au-peers-community",
      "au-community-showcase",
      "au-competition",
      "au-community-early",
      "au-rejected-community",
      "au-publishing-field",
      "au-marketplace-field",
    ]);
  });

  it("returns [] for an unknown cell", () => {
    expect(stubCatalog.search({ cellKey: "does-not/exist|build", kind: "mentor" })).toEqual([]);
  });

  it("is deterministic — identical queries return identical results", () => {
    const a = stubCatalog.search({ cellKey: CELL_CHESS, kind: "audience" });
    const b = stubCatalog.search({ cellKey: CELL_CHESS, kind: "audience" });
    expect(a).toEqual(b);
  });

  it("covers every mentor source layer + every audience channel in the seed (§4.5)", () => {
    const layers = new Set(SEED_CATALOG.map((o) => o.sourceLayer).filter(Boolean));
    for (const l of MENTOR_SOURCE_LAYERS) expect(layers.has(l)).toBe(true);
    const channels = new Set(SEED_CATALOG.map((o) => o.channel).filter(Boolean));
    for (const c of AUDIENCE_CHANNELS) expect(channels.has(c)).toBe(true);
  });

  it("includes a pending + a rejected entry + an S4-only MASTER (gate fodder)", () => {
    expect(SEED_CATALOG.some((o) => o.vetting === "pending")).toBe(true);
    expect(SEED_CATALOG.some((o) => o.vetting === "rejected")).toBe(true);
    expect(
      SEED_CATALOG.some((o) => o.fillsRole === "MASTER" && o.minStage === "S4_SIGNATURE"),
    ).toBe(true);
  });

  it("makeCatalog builds an independent catalog over any list", () => {
    const gd = makeCatalog(SEED_CATALOG).search({ cellKey: CELL_GAMEDEV, kind: "mentor" });
    expect(gd.map((o) => o.id)).toContain("gd-master");
  });
});
