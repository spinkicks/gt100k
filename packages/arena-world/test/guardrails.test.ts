import { readFileSync, readdirSync } from "node:fs";
import {
  type Cosmetic,
  type NearPeerStanding,
  SOUND_CUES,
  type SoundCue,
} from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";

const SOURCE_DIRECTORY = new URL("../src/", import.meta.url);
const SOURCE_FILES = readdirSync(SOURCE_DIRECTORY, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
  .map((entry) => ({
    name: entry.name,
    source: readFileSync(new URL(entry.name, SOURCE_DIRECTORY), "utf8"),
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

const MODULE_IMPORT = /(?:from\s+|import\s*(?:\(\s*)?|require\s*\(\s*)["']([^"']+)["']/g;

describe("arena-world child-safety guardrails", () => {
  it("keeps the entire domain deterministic and renderer-independent", () => {
    const nondeterministicSources = SOURCE_FILES.filter(({ source }) =>
      source.includes("Math.random"),
    ).map(({ name }) => name);
    const forbiddenExternalImports = SOURCE_FILES.flatMap(({ name, source }) =>
      Array.from(source.matchAll(MODULE_IMPORT), (match) => match[1])
        .filter((moduleName) =>
          moduleName === undefined
            ? true
            : !moduleName.startsWith(".") && moduleName !== "@gt100k/learning-loop",
        )
        .map((moduleName) => ({ file: name, moduleName })),
    );

    expect(nondeterministicSources).toEqual([]);
    expect(forbiddenExternalImports).toEqual([]);
  });

  it("makes cosmetic commerce fields unrepresentable", () => {
    expectTypeOf<
      Extract<keyof Cosmetic, "price" | "currency" | "dropRate" | "rarity">
    >().toEqualTypeOf<never>();
    expectTypeOf<keyof Cosmetic>().toEqualTypeOf<
      "id" | "kind" | "eligibility" | "look" | "equipEffect"
    >();
  });

  it("makes caste-ranking fields unrepresentable", () => {
    expectTypeOf<
      Extract<keyof NearPeerStanding, "rank" | "position" | "percentile" | "outOf">
    >().toEqualTypeOf<never>();
    expectTypeOf<keyof NearPeerStanding>().toEqualTypeOf<
      "band" | "anonymizedPeers" | "selfGain" | "gainToBandTop"
    >();
  });

  it("keeps every sound cue muted, non-looping, and neutral by construction", () => {
    expectTypeOf<Extract<keyof SoundCue, "negative" | "alarm" | "loop">>().toEqualTypeOf<never>();
    expectTypeOf<SoundCue["mutedByDefault"]>().toEqualTypeOf<true>();

    for (const cue of Object.values(SOUND_CUES)) {
      expect(Object.keys(cue).sort()).toEqual(["caption", "cueId", "mutedByDefault"]);
      expect(cue.mutedByDefault).toBe(true);
    }
    expect(SOUND_CUES.notYet).toEqual({
      cueId: "soft-tap",
      caption: "[soft tap]",
      mutedByDefault: true,
    });
  });
});
