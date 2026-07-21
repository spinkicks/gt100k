import { readFileSync, readdirSync } from "node:fs";

import { describe, expect, expectTypeOf, it } from "vitest";

import type { ArenaRoomView, CohortArenaView, StandingsView } from "../src/index.js";

type DeepKeys<T> = T extends readonly (infer Item)[]
  ? DeepKeys<Item>
  : T extends object
    ? { [Key in keyof T]: Key | DeepKeys<T[Key]> }[keyof T]
    : never;

type ForbiddenKeys<T, Keys extends PropertyKey> = Extract<DeepKeys<T>, Keys>;

interface SourceFile {
  readonly name: string;
  readonly source: string;
}

function readTypeScriptSources(directory: URL, prefix = ""): SourceFile[] {
  return readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const name = prefix ? `${prefix}/${entry.name}` : entry.name;
      const target = new URL(entry.isDirectory() ? `${entry.name}/` : entry.name, directory);

      if (entry.isDirectory()) return readTypeScriptSources(target, name);
      if (!entry.isFile() || !entry.name.endsWith(".ts")) return [];
      return [{ name, source: readFileSync(target, "utf8") }];
    });
}

const sourceFiles = readTypeScriptSources(new URL("../src/", import.meta.url));

const DARK_PATTERN_RULES = [
  ["loss or streak framing", /\b(?:loss(?:[-_\s]?(?:framed|streak))?|streak)\b/i],
  ["decay or absence meter", /\b(?:decay|absence)(?:[-_\s]?meter)?\b/i],
  ["manufactured scarcity or FOMO", /\b(?:manufactured[-_\s]?)?scarcity\b|\bfomo\b/i],
  ["gacha or loot randomness", /\b(?:gacha|loot)(?:[-_\s]?(?:randomness|reveal|box))?\b/i],
  ["purchase or currency path", /\b(?:purchase|currency)(?:[-_\s]?path)?\b/i],
  ["engagement timer", /\bengagement(?:[-_\s]?(?:timer|timed))\b/i],
] as const;

function sourceViolations(rules: readonly (readonly [string, RegExp])[]): string[] {
  return sourceFiles.flatMap(({ name, source }) =>
    rules.flatMap(([description, pattern]) =>
      pattern.test(source) ? [`${name}: ${description}`] : [],
    ),
  );
}

function fieldViolations(fileName: string, fields: readonly string[]): string[] {
  const source = sourceFiles.find(({ name }) => name === fileName)?.source ?? "";
  return fields.filter((field) => new RegExp(`\\b${field}\\??\\s*:`).test(source));
}

describe("Cohort Arena view guardrails", () => {
  it("uses no randomness or dark-pattern construct in the pure view source", () => {
    expect(sourceViolations([["Math.random", /\bMath\.random\s*\(/]])).toEqual([]);
    expect(sourceViolations(DARK_PATTERN_RULES)).toEqual([]);
  });

  it("declares no commerce field anywhere in the public view source", () => {
    expect(sourceViolations([["price or currency field", /\b(?:price|currency)\??\s*:/i]])).toEqual(
      [],
    );
    expectTypeOf<ForbiddenKeys<CohortArenaView, "price" | "currency">>().toEqualTypeOf<never>();
  });

  it("makes caste and bottom-rank standings fields structurally impossible", () => {
    expect(fieldViolations("standings.ts", ["rank", "position", "percentile", "outOf"])).toEqual(
      [],
    );
    expectTypeOf<
      ForbiddenKeys<StandingsView, "rank" | "position" | "percentile" | "outOf">
    >().toEqualTypeOf<never>();
  });

  it("makes RivalryMix trait and motivation labels structurally impossible", () => {
    expect(
      fieldViolations("rivalry.ts", ["honesty", "emotion", "personality", "motivation"]),
    ).toEqual([]);
    expectTypeOf<
      ForbiddenKeys<ArenaRoomView, "honesty" | "emotion" | "personality" | "motivation">
    >().toEqualTypeOf<never>();
  });
});
