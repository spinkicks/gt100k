import { readFileSync, readdirSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import {
  ACTIVITY_GOLDEN_V1,
  buildCoverageMatrix,
  buildReturnGrid,
  buildRevisableHypothesis,
} from "../src/index";

const FORBIDDEN_OUTPUT_FIELDS = new Set([
  "price",
  "currency",
  "score",
  "confidence",
  "passionScore",
  "rank",
  "percentile",
  "verdict",
  "outOf",
]);
const FIXED_LABEL = /you are (a|an|the) /i;

const sourceFiles = readdirSync(new URL("../src/", import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
  .map((entry) => ({
    name: entry.name,
    source: readFileSync(new URL(`../src/${entry.name}`, import.meta.url), "utf8"),
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

const parsedSources = sourceFiles.map(({ name, source }) => ({
  name,
  tree: ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS),
}));

function visit(tree: ts.SourceFile, inspect: (node: ts.Node) => void): void {
  const walk = (node: ts.Node): void => {
    inspect(node);
    ts.forEachChild(node, walk);
  };

  walk(tree);
}

function deepKeys(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(deepKeys);
  }
  if (value === null || typeof value !== "object") {
    return [];
  }

  return Object.entries(value).flatMap(([key, child]) => [key, ...deepKeys(child)]);
}

describe("Interest Lab core output guardrails", () => {
  it("emits no forbidden field at any depth of the return grid or revisable hypothesis", () => {
    const grid = buildReturnGrid(ACTIVITY_GOLDEN_V1, {
      domainOrder: ["sound_music", "symbols_math", "visual_design"],
    });
    const coverage = buildCoverageMatrix([], {
      probeCountRange: { min: 9, max: 9 },
      minDomains: 3,
      minWorkModes: 6,
    });
    const hypothesis = buildRevisableHypothesis(grid, coverage, []);
    const violations = deepKeys({ grid, hypothesis }).filter((key) =>
      FORBIDDEN_OUTPUT_FIELDS.has(key),
    );

    expect(violations).toEqual([]);
  });

  it("authors no fixed-label copy literal", () => {
    const violations: string[] = [];

    for (const { name, tree } of parsedSources) {
      visit(tree, (node) => {
        if (
          (ts.isStringLiteral(node) ||
            ts.isNoSubstitutionTemplateLiteral(node) ||
            ts.isTemplateHead(node) ||
            ts.isTemplateMiddle(node) ||
            ts.isTemplateTail(node)) &&
          FIXED_LABEL.test(node.text)
        ) {
          const { line } = tree.getLineAndCharacterOfPosition(node.getStart(tree));
          violations.push(`${name}:${line + 1}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });
});
